import "server-only";

import { prisma } from "@napole/db";
import {
  calcularRanking,
  minhaPosicao,
  paraRankingPublico,
  periodoDoMes,
  periodoRankingGeral,
  top,
  type Categoria,
  type LinhaRanking,
  type LinhaRankingPublico,
  type MinhaPosicao,
  type Periodo,
  type TempoPiloto,
} from "@napole/core";

/**
 * Consultas de ranking.
 *
 * A ordenacao e a consolidacao ficam no core, nao em SQL. Para o volume de uma
 * pista unica (algumas dezenas de milhares de corridas por ano) trazer as
 * corridas do periodo e consolidar em memoria e rapido o bastante, e mantem
 * uma unica implementacao da regra de desempate — a mesma que os testes cobrem.
 *
 * Se um dia o volume justificar, o lugar de otimizar e aqui, com uma materialized
 * view; a regra continua no core.
 */

export type TipoRanking = "GERAL" | "MENSAL";

interface OpcoesRanking {
  tipo?: TipoRanking;
  categoria?: Categoria | null;
  referencia?: Date;
}

function periodoDe(tipo: TipoRanking, referencia: Date): Periodo {
  return tipo === "MENSAL" ? periodoDoMes(referencia) : periodoRankingGeral(referencia);
}

/** Ranking pronto, com posicoes e diferencas. Uso interno (area logada e ADM). */
export async function carregarRanking(opcoes: OpcoesRanking = {}): Promise<LinhaRanking[]> {
  const referencia = opcoes.referencia ?? new Date();
  const periodo = periodoDe(opcoes.tipo ?? "GERAL", referencia);

  const corridas = await prisma.corrida.findMany({
    where: {
      valida: true,
      data: { gte: periodo.inicio, lt: periodo.fim },
      piloto: { status: "ATIVO" },
      ...(opcoes.categoria ? { categoriaNaCorrida: opcoes.categoria } : {}),
    },
    select: {
      pilotoId: true,
      numeroPiloto: true,
      data: true,
      melhorVoltaMs: true,
      categoriaNaCorrida: true,
      piloto: { select: { nomeExibicao: true } },
      kart: { select: { numero: true } },
    },
    orderBy: { melhorVoltaMs: "asc" },
  });

  const tempos: TempoPiloto[] = corridas.map((corrida) => ({
    pilotoId: corrida.pilotoId,
    numeroPiloto: corrida.numeroPiloto,
    nomeExibicao: corrida.piloto.nomeExibicao,
    categoria: corrida.categoriaNaCorrida,
    melhorVoltaMs: corrida.melhorVoltaMs,
    dataDoTempo: corrida.data,
    kart: corrida.kart ? `Kart ${corrida.kart.numero}` : null,
  }));

  return calcularRanking(tempos);
}

/** Ranking ja convertido para exibicao publica — sem nenhum dado pessoal. */
export async function carregarRankingPublico(
  opcoes: OpcoesRanking & { limite?: number } = {},
): Promise<LinhaRankingPublico[]> {
  const ranking = await carregarRanking(opcoes);
  const recorte = opcoes.limite ? top(ranking, opcoes.limite) : ranking;
  return recorte.map(paraRankingPublico);
}

/** Bloco "minha posicao" da area do piloto (secao 5.1). */
export async function carregarMinhaPosicao(
  pilotoId: string,
  opcoes: OpcoesRanking = {},
): Promise<MinhaPosicao | null> {
  const ranking = await carregarRanking(opcoes);
  return minhaPosicao(ranking, pilotoId);
}

/** Categorias que tem pelo menos um tempo no periodo — evita publicar tabela vazia. */
export async function categoriasComTempos(
  tipo: TipoRanking = "GERAL",
  referencia: Date = new Date(),
): Promise<Categoria[]> {
  const periodo = periodoDe(tipo, referencia);

  const grupos = await prisma.corrida.groupBy({
    by: ["categoriaNaCorrida"],
    where: {
      valida: true,
      data: { gte: periodo.inicio, lt: periodo.fim },
      piloto: { status: "ATIVO" },
    },
  });

  return grupos.map((grupo) => grupo.categoriaNaCorrida);
}
