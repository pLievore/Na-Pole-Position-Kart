import "server-only";

import { z } from "zod";
import { prisma, type Prisma } from "@napole/db";
import {
  TempoInvalidoError,
  avisoEntrouTop10,
  avisoMelhorouTempo,
  avisoSaiuTop10,
  avisoTempoEmpatado,
  avisoTempoSuperado,
  calcularPontosCorrida,
  calcularRanking,
  compararRankings,
  melhorouTempo,
  parseTempo,
  periodoRankingGeral,
  pilotosSuperadosPor,
  totalDescontado,
  type Categoria,
  type PenalidadeAplicada,
  type TempoPiloto,
} from "@napole/core";
import { registrarAuditoria } from "@/server/auditoria/registrar";
import { travarPilotoPorNumero } from "@/server/pilotos/trava";

/**
 * Lancamento de corrida — a operacao central do sistema (secao 12 do escopo).
 *
 * A secao 12.2 lista nove efeitos que devem acontecer ao salvar. Se metade
 * gravar e metade falhar, o ranking passa a mentir: um tempo entra no historico
 * mas nao atualiza a melhor volta, ou os pontos somam sem a penalidade
 * descontar. Por isso tudo roda dentro de uma unica transacao interativa —
 * inclusive as leituras de ranking, que precisam enxergar um estado consistente.
 */

const OPCOES_PENALIDADE = [
  "SEM_PENALIDADE",
  "ADVERTENCIA",
  "PUNICAO",
  "PUNICAO_GRAVE",
  "DESCLASSIFICACAO",
] as const;

export const lancamentoSchema = z
  .object({
    numeroPiloto: z.coerce
      .number({ message: "Informe o numero do piloto" })
      .int()
      .positive("Numero de piloto invalido")
      .max(2_147_483_647, "Numero de piloto invalido"),
    data: z.coerce.date({ message: "Informe a data da corrida" }),
    melhorVolta: z.string().trim().min(1, "Informe a melhor volta"),
    kartId: z.string().min(1, "Selecione o kart utilizado"),
    // Obrigatorio mesmo quando nao houve penalidade (secao 12.1): forcar a
    // escolha evita que o operador simplesmente esqueca de registrar uma.
    penalidade: z.enum(OPCOES_PENALIDADE, { message: "Informe a penalidade" }),
    motivoPenalidade: z
      .enum([
        "BATIDA",
        "ULTRAPASSAGEM_FORCADA",
        "DESRESPEITO_BANDEIRAS",
        "BLOQUEIO_PISTA",
        "NAO_CEDER_PASSAGEM",
        "DIRECAO_PERIGOSA",
        "REINCIDENCIA",
        "OUTRO",
      ])
      .optional(),
    motivoDetalhe: z.string().trim().max(300).optional(),
    pontosDesclassificacao: z.coerce.number().int().min(0).max(100).optional(),
    observacao: z.string().trim().max(500).optional(),
  })
  .refine((d) => d.penalidade === "SEM_PENALIDADE" || d.motivoPenalidade !== undefined, {
    path: ["motivoPenalidade"],
    message: "Informe o motivo da penalidade",
  })
  .refine((d) => d.penalidade !== "DESCLASSIFICACAO" || d.pontosDesclassificacao !== undefined, {
    path: ["pontosDesclassificacao"],
    message: "Informe quantos pontos descontar",
  })
  // Data futura so pode ser erro de digitacao.
  .refine((d) => d.data.getTime() <= Date.now() + 24 * 60 * 60 * 1000, {
    path: ["data"],
    message: "A data da corrida nao pode estar no futuro",
  });

export type DadosLancamento = z.infer<typeof lancamentoSchema>;

export interface ResultadoLancamento {
  corridaId: string;
  numeroPiloto: number;
  nomeExibicao: string;
  melhorVoltaMs: number;
  recordePessoal: boolean;
  posicaoNaCategoria: number;
  pontosTotal: number;
  notificacoesGeradas: number;
}

export type RetornoLancamento =
  { ok: true; resultado: ResultadoLancamento } | { ok: false; erros: Record<string, string> };

function inicioDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function fimDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate() + 1);
}

/** Corridas da categoria dentro da janela do ranking, no formato que o core espera. */
async function temposDaCategoria(
  tx: Prisma.TransactionClient,
  categoria: Categoria,
  referencia: Date,
): Promise<TempoPiloto[]> {
  const janela = periodoRankingGeral(referencia);

  const corridas = await tx.corrida.findMany({
    where: {
      valida: true,
      categoriaNaCorrida: categoria,
      data: { gte: janela.inicio, lt: janela.fim },
      piloto: { status: "ATIVO" },
    },
    select: {
      pilotoId: true,
      numeroPiloto: true,
      data: true,
      melhorVoltaMs: true,
      categoriaNaCorrida: true,
      piloto: { select: { nomeExibicao: true } },
    },
  });

  return corridas.map((corrida) => ({
    pilotoId: corrida.pilotoId,
    numeroPiloto: corrida.numeroPiloto,
    nomeExibicao: corrida.piloto.nomeExibicao,
    categoria: corrida.categoriaNaCorrida,
    melhorVoltaMs: corrida.melhorVoltaMs,
    dataDoTempo: corrida.data,
  }));
}

export async function lancarCorrida(
  dados: DadosLancamento,
  operadorId: string,
): Promise<RetornoLancamento> {
  let melhorVoltaMs: number;
  try {
    melhorVoltaMs = parseTempo(dados.melhorVolta);
  } catch (erro) {
    if (erro instanceof TempoInvalidoError) {
      return { ok: false, erros: { melhorVolta: erro.message } };
    }
    throw erro;
  }

  const kart = await prisma.kart.findUnique({
    where: { id: dados.kartId },
    select: { id: true },
  });
  if (!kart) return { ok: false, erros: { kartId: "Kart nao encontrado." } };

  const penalidades: PenalidadeAplicada[] =
    dados.penalidade === "SEM_PENALIDADE"
      ? []
      : [
          {
            tipo: dados.penalidade,
            pontosManuais: dados.pontosDesclassificacao ?? null,
          },
        ];

  const resultado = await prisma.$transaction(async (tx): Promise<RetornoLancamento> => {
    // O lock ordena lancamento e gestao do cadastro. Status e categoria abaixo
    // pertencem ao mesmo estado que sera congelado na corrida.
    const pilotoId = await travarPilotoPorNumero(tx, dados.numeroPiloto);
    if (!pilotoId) {
      return { ok: false, erros: { numeroPiloto: "Nenhum piloto com este numero." } };
    }

    const piloto = await tx.piloto.findUnique({
      where: { id: pilotoId },
      select: {
        id: true,
        numero: true,
        nomeExibicao: true,
        categoria: true,
        status: true,
        melhorVoltaMs: true,
        pontosTotal: true,
        totalCorridas: true,
        ultimaCorridaEm: true,
      },
    });

    if (!piloto) {
      return { ok: false, erros: { numeroPiloto: "Nenhum piloto com este numero." } };
    }
    if (piloto.status !== "ATIVO") {
      return {
        ok: false,
        erros: {
          numeroPiloto: `Cadastro ${piloto.status.toLowerCase()}. Regularize antes de lancar.`,
        },
      };
    }

    // --- 2. Fotografar o "antes" -------------------------------------------
    const temposAntes = await temposDaCategoria(tx, piloto.categoria, dados.data);
    const rankingAntes = calcularRanking(temposAntes);

    // --- 3. Gravar a corrida -----------------------------------------------
    const corrida = await tx.corrida.create({
      data: {
        pilotoId: piloto.id,
        numeroPiloto: piloto.numero,
        data: dados.data,
        melhorVoltaMs,
        kartId: dados.kartId,
        categoriaNaCorrida: piloto.categoria,
        valida: true,
        operadorId,
        observacao: dados.observacao ?? null,
      },
      select: { id: true },
    });

    if (dados.penalidade !== "SEM_PENALIDADE") {
      await tx.penalidade.create({
        data: {
          pilotoId: piloto.id,
          corridaId: corrida.id,
          tipo: dados.penalidade,
          motivo: dados.motivoPenalidade!,
          motivoDetalhe: dados.motivoDetalhe ?? null,
          pontosDescontados: totalDescontado(penalidades),
          operadorId,
          data: dados.data,
        },
      });
    }

    // --- 4. Calcular pontos -------------------------------------------------
    const [corridasNoDia, melhorDoDia] = await Promise.all([
      tx.corrida.count({
        where: {
          pilotoId: piloto.id,
          id: { not: corrida.id },
          data: { gte: inicioDoDia(dados.data), lt: fimDoDia(dados.data) },
        },
      }),
      tx.corrida.findFirst({
        where: {
          categoriaNaCorrida: piloto.categoria,
          valida: true,
          id: { not: corrida.id },
          data: { gte: inicioDoDia(dados.data), lt: fimDoDia(dados.data) },
        },
        orderBy: { melhorVoltaMs: "asc" },
        select: { melhorVoltaMs: true },
      }),
    ]);

    const recordePessoal = melhorouTempo(melhorVoltaMs, piloto.melhorVoltaMs);

    const novoTempo: TempoPiloto = {
      pilotoId: piloto.id,
      numeroPiloto: piloto.numero,
      nomeExibicao: piloto.nomeExibicao,
      categoria: piloto.categoria,
      melhorVoltaMs,
      dataDoTempo: dados.data,
    };

    // --- 6. Fotografar o "depois" ------------------------------------------
    // Calculado em memoria a partir do "antes" + o tempo novo: e o mesmo
    // resultado de reconsultar o banco, sem a ida extra.
    const rankingDepois = calcularRanking([...temposAntes, novoTempo]);
    const posicaoDepois = rankingDepois.find((linha) => linha.pilotoId === piloto.id)?.posicao ?? 0;

    // --- 7. O que mudou ------------------------------------------------------
    const mudancas = compararRankings(rankingAntes, rankingDepois);
    const minhaMudanca = mudancas.find((m) => m.pilotoId === piloto.id);
    const superados = pilotosSuperadosPor(rankingAntes, rankingDepois, piloto.id);

    const pontos = calcularPontosCorrida({
      corridaValida: true,
      primeiraCorridaDoDia: corridasNoDia === 0,
      melhorouProprioTempo: recordePessoal,
      // Sem mudanca de posicao, o piloto ja estava onde esta: nao "entrou" no
      // Top 10 e nao ganha o bonus de novo a cada corrida.
      entrouNoTop10Categoria: minhaMudanca?.entrouNoTop10 ?? false,
      melhorTempoDoDiaNaCategoria:
        melhorDoDia === null || melhorVoltaMs < melhorDoDia.melhorVoltaMs,
      penalidades,
    });

    await tx.corrida.update({
      where: { id: corrida.id },
      data: {
        pontosGanhos: pontos.pontosGanhos,
        pontosDescontados: pontos.pontosDescontados,
        pontosTotal: pontos.total,
      },
    });

    // --- 5. Atualizar os campos derivados do piloto -------------------------
    // `ultimaCorridaEm` so avanca: lancar hoje o resultado de uma corrida da
    // semana passada nao pode "envelhecer" a data da ultima corrida e disparar
    // o aviso de inatividade em quem esteve na pista ontem.
    const avancaUltimaCorrida =
      piloto.ultimaCorridaEm === null || dados.data > piloto.ultimaCorridaEm;

    const pilotoAtualizado = await tx.piloto.update({
      where: { id: piloto.id },
      data: {
        ...(recordePessoal ? { melhorVoltaMs, melhorVoltaEm: dados.data } : {}),
        pontosTotal: { increment: pontos.total },
        totalCorridas: { increment: 1 },
        ...(avancaUltimaCorrida ? { ultimaCorridaEm: dados.data } : {}),
      },
      select: { pontosTotal: true },
    });

    // --- 8. Gerar notificacoes ----------------------------------------------
    const avisos: Prisma.NotificacaoCreateManyInput[] = [];

    if (recordePessoal && piloto.melhorVoltaMs !== null) {
      const aviso = avisoMelhorouTempo(melhorVoltaMs, piloto.melhorVoltaMs);
      avisos.push({
        pilotoId: piloto.id,
        tipo: aviso.tipo,
        origem: "AUTOMATICA",
        titulo: aviso.titulo,
        mensagem: aviso.mensagem,
        contexto: { corridaId: corrida.id, anterior: piloto.melhorVoltaMs, novo: melhorVoltaMs },
      });
    }

    if (minhaMudanca?.entrouNoTop10) {
      const aviso = avisoEntrouTop10(piloto.categoria, posicaoDepois);
      avisos.push({
        pilotoId: piloto.id,
        tipo: aviso.tipo,
        origem: "AUTOMATICA",
        titulo: aviso.titulo,
        mensagem: aviso.mensagem,
        contexto: { corridaId: corrida.id, posicao: posicaoDepois },
      });
    }

    for (const superadoId of superados) {
      const aviso = avisoTempoSuperado(piloto.categoria);
      avisos.push({
        pilotoId: superadoId,
        tipo: aviso.tipo,
        origem: "AUTOMATICA",
        titulo: aviso.titulo,
        mensagem: aviso.mensagem,
        contexto: { corridaId: corrida.id, categoria: piloto.categoria },
      });
    }

    for (const mudanca of mudancas) {
      if (mudanca.pilotoId === piloto.id || !mudanca.saiuDoTop10) continue;
      const aviso = avisoSaiuTop10(piloto.categoria, mudanca.posicaoAtual);
      avisos.push({
        pilotoId: mudanca.pilotoId,
        tipo: aviso.tipo,
        origem: "AUTOMATICA",
        titulo: aviso.titulo,
        mensagem: aviso.mensagem,
        contexto: { corridaId: corrida.id, posicao: mudanca.posicaoAtual },
      });
    }

    // Empate: quem cravou o tempo antes mantem a posicao, mas merece saber.
    for (const anterior of temposAntes) {
      if (anterior.pilotoId === piloto.id || anterior.melhorVoltaMs !== melhorVoltaMs) continue;
      const aviso = avisoTempoEmpatado(melhorVoltaMs, piloto.categoria);
      avisos.push({
        pilotoId: anterior.pilotoId,
        tipo: aviso.tipo,
        origem: "AUTOMATICA",
        titulo: aviso.titulo,
        mensagem: aviso.mensagem,
        contexto: { corridaId: corrida.id, tempo: melhorVoltaMs },
      });
    }

    if (avisos.length > 0) {
      await tx.notificacao.createMany({ data: avisos });
    }

    // --- 9. Auditoria --------------------------------------------------------
    await registrarAuditoria(tx, {
      usuarioId: operadorId,
      entidade: "Corrida",
      entidadeId: corrida.id,
      acao: "CRIAR",
      depois: {
        numeroPiloto: piloto.numero,
        data: dados.data.toISOString(),
        melhorVoltaMs,
        kartId: dados.kartId,
        penalidade: dados.penalidade,
        pontos: pontos.total,
      },
    });

    return {
      ok: true,
      resultado: {
        corridaId: corrida.id,
        numeroPiloto: piloto.numero,
        nomeExibicao: piloto.nomeExibicao,
        melhorVoltaMs,
        recordePessoal,
        posicaoNaCategoria: posicaoDepois,
        pontosTotal: pilotoAtualizado.pontosTotal,
        notificacoesGeradas: avisos.length,
      } satisfies ResultadoLancamento,
    };
  });

  return resultado;
}
