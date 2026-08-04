import "server-only";

import { randomUUID } from "node:crypto";
import { prisma, type StatusHorarioAgendamento } from "@napole/db";
import {
  avaliarAlteracaoCapacidadeHorario,
  dataHoraOperacionalISO,
  exigirTransicaoHorario,
  gerarHorariosPadraoParaData,
  parseDataCivil,
  parseDataHoraOperacional,
  validarCapacidadeHorario,
  validarIntervaloHorario,
  type ConfiguracaoPadroesAgendamento,
} from "@napole/core";
import {
  obterConfiguracaoPadroesAgendamento,
  obterConfiguracaoPadroesTx,
} from "@/server/agendamentos/configuracao";
import {
  ErroPersistenciaAgendamento,
  comoResultado,
  exigirAdministradorAtivo,
  registrarAuditoriaAgendamento as registrarAuditoria,
  registrarEventoAgendamento,
  textoOpcional,
  travarGradeDeHorarios,
  travarHorario,
} from "@/server/agendamentos/interno";
import type {
  ResultadoLoteHorarios,
  ResultadoServicoAgendamento,
} from "@/server/agendamentos/tipos";

export interface EntradaHorarioAgendamento {
  inicioLocal: string;
  fimLocal: string;
  capacidade: number;
  observacoesInternas?: string | null;
}

export interface EntradaCriacaoHorariosEmLote {
  horarios: readonly EntradaHorarioAgendamento[];
  publicar?: boolean;
  /** Um retry identico devolve o horario existente; qualquer outra sobreposicao falha. */
  ignorarDuplicadosExatos?: boolean;
  /** Evita publicar uma grade calculada com defaults alterados concorrentemente. */
  configuracaoEsperada?: ConfiguracaoPadroesAgendamento;
}

export interface EntradaCriacaoPadroesEmLote {
  dataInicial: string;
  dataFinal: string;
  publicar?: boolean;
  ignorarDuplicadosExatos?: boolean;
}

export interface EntradaAlteracaoHorario {
  inicioLocal?: string;
  fimLocal?: string;
  capacidade?: number;
  observacoesInternas?: string | null;
  /** Override explicito, exclusivo de ADMINISTRADOR e preservado na auditoria. */
  permitirCapacidadeExcedida?: boolean;
}

interface HorarioValidado {
  inicioEm: Date;
  fimEm: Date;
  capacidade: number;
  observacoesInternas: string | null;
}

function validarEntradaHorario(entrada: EntradaHorarioAgendamento): HorarioValidado {
  const inicioEm = parseDataHoraOperacional(entrada.inicioLocal);
  const fimEm = parseDataHoraOperacional(entrada.fimLocal);
  validarIntervaloHorario(inicioEm, fimEm);
  return {
    inicioEm,
    fimEm,
    capacidade: validarCapacidadeHorario(entrada.capacidade),
    observacoesInternas: textoOpcional(entrada.observacoesInternas, 5_000),
  };
}

function mesmaData(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}

function dataCivilISO(data: Date): string {
  return `${String(data.getUTCFullYear()).padStart(4, "0")}-${String(data.getUTCMonth() + 1).padStart(2, "0")}-${String(data.getUTCDate()).padStart(2, "0")}`;
}

export async function criarHorariosEmLote(
  administradorId: string,
  entrada: EntradaCriacaoHorariosEmLote,
): Promise<ResultadoServicoAgendamento<ResultadoLoteHorarios>> {
  return comoResultado(async () => {
    if (entrada.horarios.length === 0 || entrada.horarios.length > 500) {
      throw new ErroPersistenciaAgendamento(
        "QUANTIDADE_HORARIOS_INVALIDA",
        "O lote precisa ter de 1 a 500 horarios.",
        "horarios",
      );
    }
    const horarios = entrada.horarios.map(validarEntradaHorario).sort(
      (a, b) => a.inicioEm.getTime() - b.inicioEm.getTime(),
    );
    for (let indice = 1; indice < horarios.length; indice += 1) {
      const anterior = horarios[indice - 1]!;
      const atual = horarios[indice]!;
      if (anterior.fimEm > atual.inicioEm) {
        throw new ErroPersistenciaAgendamento(
          "HORARIOS_SOBREPOSTOS",
          `O lote contem sobreposicao entre ${dataHoraOperacionalISO(anterior.inicioEm)} e ${dataHoraOperacionalISO(atual.inicioEm)}.`,
          "horarios",
        );
      }
    }

    return prisma.$transaction(
      async (tx): Promise<ResultadoLoteHorarios> => {
        await exigirAdministradorAtivo(tx, administradorId);
        await travarGradeDeHorarios(tx);
        if (entrada.configuracaoEsperada) {
          const configuracaoAtual = await obterConfiguracaoPadroesTx(tx);
          if (JSON.stringify(configuracaoAtual) !== JSON.stringify(entrada.configuracaoEsperada)) {
            throw new ErroPersistenciaAgendamento(
              "CONFIGURACAO_ALTERADA",
              "Os padroes da agenda mudaram durante a geracao. Gere a grade novamente.",
            );
          }
        }
        const loteId = randomUUID();
        const status: StatusHorarioAgendamento = entrada.publicar ? "ABERTO" : "RASCUNHO";
        const ignorados: ResultadoLoteHorarios["ignorados"] = [];

        // Uma unica leitura evita centenas de round-trips ao Supabase no lote.
        const existentes = await tx.horarioAgendamento.findMany({
          where: {
            status: { in: ["RASCUNHO", "ABERTO", "BLOQUEADO"] },
            inicioEm: { lt: horarios[horarios.length - 1]!.fimEm },
            fimEm: { gt: horarios[0]!.inicioEm },
          },
          select: {
            id: true,
            inicioEm: true,
            fimEm: true,
            capacidade: true,
            status: true,
            observacoesInternas: true,
          },
        });

        const novos: Array<HorarioValidado & { id: string }> = [];
        for (const horario of horarios) {
          const conflitos = existentes.filter(
            (existente) =>
              existente.inicioEm < horario.fimEm && existente.fimEm > horario.inicioEm,
          );
          const duplicado = conflitos.find(
            (existente) =>
              mesmaData(existente.inicioEm, horario.inicioEm) &&
              mesmaData(existente.fimEm, horario.fimEm) &&
              existente.capacidade === horario.capacidade &&
              existente.status === status &&
              existente.observacoesInternas === horario.observacoesInternas,
          );
          if (duplicado && entrada.ignorarDuplicadosExatos !== false && conflitos.length === 1) {
            ignorados.push(duplicado);
            continue;
          }
          if (conflitos.length > 0) {
            throw new ErroPersistenciaAgendamento(
              "HORARIO_SOBREPOSTO",
              `Ja existe um horario que cruza ${dataHoraOperacionalISO(horario.inicioEm)}.`,
              "horarios",
            );
          }
          novos.push({ ...horario, id: randomUUID() });
        }

        if (novos.length > 0) {
          await tx.horarioAgendamento.createMany({
            data: novos.map((horario) => ({
              ...horario,
              status,
              criadoPorId: administradorId,
            })),
          });
        }

        const criados = novos.map(({ id, inicioEm, fimEm }) => ({ id, inicioEm, fimEm }));
        const alteracoes = novos.map((horario) => ({
          horario,
          depois: {
            id: horario.id,
            inicioEm: horario.inicioEm,
            fimEm: horario.fimEm,
            capacidade: horario.capacidade,
            status,
            loteId,
          },
        }));
        await registrarEventoAgendamento(
          tx,
          alteracoes.map(({ horario, depois }) => ({
            horarioId: horario.id,
            tipo: "HORARIO_CRIADO" as const,
            origem: "ADMINISTRADOR" as const,
            usuarioAdminId: administradorId,
            depois,
          })),
        );
        await registrarAuditoria(
          tx,
          alteracoes.map(({ horario, depois }) => ({
            usuarioId: administradorId,
            entidade: "HorarioAgendamento",
            entidadeId: horario.id,
            acao: "CRIAR" as const,
            depois,
          })),
        );
        return { loteId, criados, ignorados };
      },
      { maxWait: 10_000, timeout: 60_000 },
    );
  });
}

export async function criarHorariosPadraoEmLote(
  administradorId: string,
  entrada: EntradaCriacaoPadroesEmLote,
): Promise<ResultadoServicoAgendamento<ResultadoLoteHorarios>> {
  return comoResultado(async () => {
    const inicio = parseDataCivil(entrada.dataInicial);
    const fim = parseDataCivil(entrada.dataFinal);
    const dias = Math.floor((fim.getTime() - inicio.getTime()) / 86_400_000) + 1;
    if (dias < 1 || dias > 366) {
      throw new ErroPersistenciaAgendamento(
        "PERIODO_INVALIDO",
        "O periodo precisa ter de 1 a 366 dias.",
        "dataFinal",
      );
    }

    const configuracao = await obterConfiguracaoPadroesAgendamento();
    const horarios: EntradaHorarioAgendamento[] = [];
    for (let deslocamento = 0; deslocamento < dias; deslocamento += 1) {
      const data = new Date(inicio.getTime() + deslocamento * 86_400_000);
      for (const horario of gerarHorariosPadraoParaData(dataCivilISO(data), configuracao)) {
        horarios.push({
          inicioLocal: dataHoraOperacionalISO(horario.inicioEm),
          fimLocal: dataHoraOperacionalISO(horario.fimEm),
          capacidade: horario.capacidade,
        });
      }
    }
    if (horarios.length === 0) {
      throw new ErroPersistenciaAgendamento(
        "SEM_HORARIOS_PADRAO",
        "A configuracao nao gera horarios neste periodo.",
      );
    }
    const resultado = await criarHorariosEmLote(administradorId, {
      horarios,
      publicar: entrada.publicar,
      ignorarDuplicadosExatos: entrada.ignorarDuplicadosExatos,
      configuracaoEsperada: configuracao,
    });
    if (!resultado.ok) {
      throw new ErroPersistenciaAgendamento(
        resultado.erro.codigo,
        resultado.erro.mensagem,
        resultado.erro.campo,
      );
    }
    return resultado.valor;
  });
}

export async function alterarHorarioAgendamento(
  administradorId: string,
  horarioId: string,
  entrada: EntradaAlteracaoHorario,
): Promise<ResultadoServicoAgendamento<{ id: string }>> {
  return comoResultado(() =>
    prisma.$transaction(async (tx) => {
      await exigirAdministradorAtivo(tx, administradorId);
      await travarGradeDeHorarios(tx);
      if (!(await travarHorario(tx, horarioId))) {
        throw new ErroPersistenciaAgendamento("HORARIO_NAO_ENCONTRADO", "Horario nao encontrado.");
      }
      const atual = await tx.horarioAgendamento.findUniqueOrThrow({ where: { id: horarioId } });
      if (atual.status === "CANCELADO" || atual.status === "ENCERRADO") {
        throw new ErroPersistenciaAgendamento(
          "HORARIO_IMUTAVEL",
          "Horario cancelado ou encerrado nao pode ser editado.",
        );
      }
      const inicioEm = entrada.inicioLocal
        ? parseDataHoraOperacional(entrada.inicioLocal)
        : atual.inicioEm;
      const fimEm = entrada.fimLocal ? parseDataHoraOperacional(entrada.fimLocal) : atual.fimEm;
      const capacidade =
        entrada.capacidade === undefined
          ? atual.capacidade
          : validarCapacidadeHorario(entrada.capacidade);
      validarIntervaloHorario(inicioEm, fimEm);

      const agora = new Date();
      if (!mesmaData(inicioEm, atual.inicioEm)) {
        const configuracao = await obterConfiguracaoPadroesTx(tx);
        const novoLimite = new Date(
          inicioEm.getTime() - configuracao.antecedenciaMinimaMinutos * 60_000,
        );
        const pendenciasAfetadas = await tx.agendamento.findMany({
          where: { horarioId, status: "PENDENTE", expiraEm: { gt: novoLimite } },
          select: { id: true, expiraEm: true },
        });
        for (const pendencia of pendenciasAfetadas) {
          if (novoLimite <= agora) {
            await tx.agendamento.update({
              where: { id: pendencia.id },
              data: { status: "EXPIRADO", expiradoEm: agora },
            });
            await tx.participanteAgendamento.updateMany({
              where: { agendamentoId: pendencia.id, status: "AGENDADO" },
              data: { status: "CANCELADO" },
            });
            await registrarEventoAgendamento(tx, {
              horarioId,
              agendamentoId: pendencia.id,
              tipo: "AGENDAMENTO_EXPIRADO",
              origem: "ADMINISTRADOR",
              usuarioAdminId: administradorId,
              antes: { status: "PENDENTE", expiraEm: pendencia.expiraEm },
              depois: { status: "EXPIRADO", expiradoEm: agora, motivo: "HORARIO_ANTECIPADO" },
            });
            await registrarAuditoria(tx, {
              usuarioId: administradorId,
              entidade: "Agendamento",
              entidadeId: pendencia.id,
              acao: "EXPIRAR",
              antes: { status: "PENDENTE", expiraEm: pendencia.expiraEm },
              depois: { status: "EXPIRADO", expiradoEm: agora, motivo: "HORARIO_ANTECIPADO" },
            });
          } else {
            await tx.agendamento.update({
              where: { id: pendencia.id },
              data: { expiraEm: novoLimite },
            });
            await registrarEventoAgendamento(tx, {
              horarioId,
              agendamentoId: pendencia.id,
              tipo: "AGENDAMENTO_EDITADO",
              origem: "ADMINISTRADOR",
              usuarioAdminId: administradorId,
              antes: { expiraEm: pendencia.expiraEm },
              depois: { expiraEm: novoLimite, motivo: "HORARIO_ANTECIPADO" },
            });
            await registrarAuditoria(tx, {
              usuarioId: administradorId,
              entidade: "Agendamento",
              entidadeId: pendencia.id,
              acao: "EDITAR",
              antes: { expiraEm: pendencia.expiraEm },
              depois: { expiraEm: novoLimite, motivo: "HORARIO_ANTECIPADO" },
            });
          }
        }
      }
      const soma = await tx.agendamento.aggregate({
        where: {
          horarioId,
          OR: [
            { status: { in: ["CONFIRMADO", "CHECK_IN"] } },
            { status: "PENDENTE", expiraEm: { gt: agora } },
          ],
        },
        _sum: { quantidadeParticipantes: true },
      });
      const ocupadas = soma._sum.quantidadeParticipantes ?? 0;
      avaliarAlteracaoCapacidadeHorario(
        capacidade,
        ocupadas,
        entrada.permitirCapacidadeExcedida === true,
      );

      const conflito = await tx.horarioAgendamento.findFirst({
        where: {
          id: { not: horarioId },
          status: { in: ["RASCUNHO", "ABERTO", "BLOQUEADO"] },
          inicioEm: { lt: fimEm },
          fimEm: { gt: inicioEm },
        },
        select: { id: true },
      });
      if (conflito) {
        throw new ErroPersistenciaAgendamento(
          "HORARIO_SOBREPOSTO",
          "O intervalo cruza outro horario existente.",
        );
      }

      const observacoesInternas =
        entrada.observacoesInternas === undefined
          ? atual.observacoesInternas
          : textoOpcional(entrada.observacoesInternas, 5_000);
      await tx.horarioAgendamento.update({
        where: { id: horarioId },
        data: { inicioEm, fimEm, capacidade, observacoesInternas },
      });
      const antes = {
        inicioEm: atual.inicioEm,
        fimEm: atual.fimEm,
        capacidade: atual.capacidade,
        observacoesInternas: atual.observacoesInternas,
      };
      const depois = {
        inicioEm,
        fimEm,
        capacidade,
        observacoesInternas,
        capacidadeExcedidaAutorizada: ocupadas > capacidade,
      };
      await registrarEventoAgendamento(tx, {
        horarioId,
        tipo: "HORARIO_ALTERADO",
        origem: "ADMINISTRADOR",
        usuarioAdminId: administradorId,
        antes,
        depois,
      });
      await registrarAuditoria(tx, {
        usuarioId: administradorId,
        entidade: "HorarioAgendamento",
        entidadeId: horarioId,
        acao: "EDITAR",
        antes,
        depois,
      });
      return { id: horarioId };
    }),
  );
}

export async function transicionarHorarioAgendamento(
  administradorId: string,
  horarioId: string,
  proximoStatus: Exclude<StatusHorarioAgendamento, "CANCELADO">,
): Promise<ResultadoServicoAgendamento<{ id: string; status: StatusHorarioAgendamento }>> {
  return comoResultado(() =>
    prisma.$transaction(async (tx) => {
      await exigirAdministradorAtivo(tx, administradorId);
      if (!(await travarHorario(tx, horarioId))) {
        throw new ErroPersistenciaAgendamento("HORARIO_NAO_ENCONTRADO", "Horario nao encontrado.");
      }
      const atual = await tx.horarioAgendamento.findUniqueOrThrow({
        where: { id: horarioId },
        select: { status: true },
      });
      exigirTransicaoHorario(atual.status, proximoStatus);
      await tx.horarioAgendamento.update({
        where: { id: horarioId },
        data: { status: proximoStatus },
      });
      const acao =
        proximoStatus === "ABERTO"
          ? "PUBLICAR"
          : proximoStatus === "ENCERRADO"
            ? "FECHAR"
            : "EDITAR";
      await registrarEventoAgendamento(tx, {
        horarioId,
        tipo: "HORARIO_ALTERADO",
        origem: "ADMINISTRADOR",
        usuarioAdminId: administradorId,
        antes: { status: atual.status },
        depois: { status: proximoStatus },
      });
      await registrarAuditoria(tx, {
        usuarioId: administradorId,
        entidade: "HorarioAgendamento",
        entidadeId: horarioId,
        acao,
        antes: { status: atual.status },
        depois: { status: proximoStatus },
      });
      return { id: horarioId, status: proximoStatus };
    }),
  );
}

export async function cancelarHorarioAgendamento(
  administradorId: string,
  horarioId: string,
  entrada: { motivo: string; forcarComCheckIn?: boolean },
): Promise<ResultadoServicoAgendamento<{ id: string; agendamentosCancelados: number }>> {
  return comoResultado(() =>
    prisma.$transaction(async (tx) => {
      await exigirAdministradorAtivo(tx, administradorId);
      if (!(await travarHorario(tx, horarioId))) {
        throw new ErroPersistenciaAgendamento("HORARIO_NAO_ENCONTRADO", "Horario nao encontrado.");
      }
      const horario = await tx.horarioAgendamento.findUniqueOrThrow({
        where: { id: horarioId },
        select: { status: true },
      });
      exigirTransicaoHorario(horario.status, "CANCELADO");
      const motivo = textoOpcional(entrada.motivo, 2_000);
      if (!motivo) {
        throw new ErroPersistenciaAgendamento("MOTIVO_OBRIGATORIO", "Informe o motivo do cancelamento.");
      }
      const ativos = await tx.agendamento.findMany({
        where: { horarioId, status: { in: ["PENDENTE", "CONFIRMADO", "CHECK_IN"] } },
        include: { participantes: { select: { status: true } } },
      });
      if (
        !entrada.forcarComCheckIn &&
        ativos.some(
          (agendamento) =>
            agendamento.status === "CHECK_IN" ||
            agendamento.participantes.some((participante) => participante.status === "PRESENTE"),
        )
      ) {
        throw new ErroPersistenciaAgendamento(
          "CHECK_IN_EXISTENTE",
          "Ha participante com check-in; confirme o override para cancelar.",
        );
      }

      const agora = new Date();
      for (const agendamento of ativos) {
        await tx.agendamento.update({
          where: { id: agendamento.id },
          data: { status: "CANCELADO", canceladoEm: agora, motivoCancelamento: motivo },
        });
        await tx.participanteAgendamento.updateMany({
          where: { agendamentoId: agendamento.id },
          data: { status: "CANCELADO" },
        });
        await registrarEventoAgendamento(tx, {
          horarioId,
          agendamentoId: agendamento.id,
          tipo: "AGENDAMENTO_CANCELADO",
          origem: "ADMINISTRADOR",
          usuarioAdminId: administradorId,
          antes: { status: agendamento.status },
          depois: { status: "CANCELADO", motivo, cancelamentoDoHorario: true },
        });
        await registrarAuditoria(tx, {
          usuarioId: administradorId,
          entidade: "Agendamento",
          entidadeId: agendamento.id,
          acao: "CANCELAR",
          antes: { status: agendamento.status },
          depois: { status: "CANCELADO", motivo, cancelamentoDoHorario: true },
        });
      }
      await tx.horarioAgendamento.update({
        where: { id: horarioId },
        data: { status: "CANCELADO", canceladoEm: agora },
      });
      await registrarEventoAgendamento(tx, {
        horarioId,
        tipo: "HORARIO_CANCELADO",
        origem: "ADMINISTRADOR",
        usuarioAdminId: administradorId,
        antes: { status: horario.status },
        depois: { status: "CANCELADO", motivo, agendamentosCancelados: ativos.length },
      });
      await registrarAuditoria(tx, {
        usuarioId: administradorId,
        entidade: "HorarioAgendamento",
        entidadeId: horarioId,
        acao: "CANCELAR",
        antes: { status: horario.status },
        depois: { status: "CANCELADO", motivo, agendamentosCancelados: ativos.length },
      });
      return { id: horarioId, agendamentosCancelados: ativos.length };
    }),
  );
}
