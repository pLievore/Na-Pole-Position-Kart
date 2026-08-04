import "server-only";

import { prisma, type Prisma } from "@napole/db";
import {
  calcularOcupacaoAgendamentos,
  type StatusHorarioAgendamento,
} from "@napole/core";
import { obterConfiguracaoPadroesAgendamento } from "@/server/agendamentos/configuracao";
import {
  ErroPersistenciaAgendamento,
  comoResultado,
  exigirOperadorAtivo,
} from "@/server/agendamentos/interno";
import { materializarPendenciasExpiradas } from "@/server/agendamentos/reservas";
import type {
  AgendamentoAdministrativo,
  HorarioAgendamentoAdministrativo,
  HorarioAgendamentoPublico,
  ProtocoloAgendamentoPublico,
  ResultadoServicoAgendamento,
} from "@/server/agendamentos/tipos";

const selecaoParticipante = {
  id: true,
  nomeCompleto: true,
  status: true,
  checkInEm: true,
  ausenciaRegistradaEm: true,
  piloto: { select: { id: true, numero: true, nomeExibicao: true } },
} as const;

const selecaoAgendamento = {
  id: true,
  codigoPublico: true,
  status: true,
  origem: true,
  quantidadeParticipantes: true,
  responsavelNome: true,
  responsavelTelefone: true,
  responsavelEmail: true,
  temParticipanteMenor: true,
  observacoesCliente: true,
  observacoesInternas: true,
  aceiteTermosEm: true,
  versaoTermos: true,
  expiraEm: true,
  confirmadoEm: true,
  canceladoEm: true,
  motivoCancelamento: true,
  concluidoEm: true,
  naoCompareceuEm: true,
  criadoEm: true,
  atualizadoEm: true,
  participantes: { select: selecaoParticipante, orderBy: { criadoEm: "asc" as const } },
} as const;

type AgendamentoSelecionado = Prisma.AgendamentoGetPayload<{ select: typeof selecaoAgendamento }>;

function paraAgendamentoAdministrativo(
  agendamento: AgendamentoSelecionado,
): AgendamentoAdministrativo {
  return agendamento;
}

export async function listarHorariosPublicos(entrada?: {
  de?: Date;
  ate?: Date;
}): Promise<ResultadoServicoAgendamento<HorarioAgendamentoPublico[]>> {
  return comoResultado(async () => {
    const agora = new Date();
    const configuracao = await obterConfiguracaoPadroesAgendamento();
    const corte = new Date(agora.getTime() + configuracao.antecedenciaMinimaMinutos * 60_000);
    const de = entrada?.de && entrada.de > corte ? entrada.de : corte;
    const ate = entrada?.ate ?? new Date(de.getTime() + 31 * 86_400_000);
    if (!Number.isFinite(de.getTime()) || !Number.isFinite(ate.getTime()) || ate <= de) {
      throw new ErroPersistenciaAgendamento("PERIODO_INVALIDO", "Periodo de consulta invalido.");
    }
    await materializarPendenciasExpiradas({ referencia: agora, limite: 500 });
    const horarios = await prisma.horarioAgendamento.findMany({
      where: { status: "ABERTO", inicioEm: { gte: de, lt: ate } },
      orderBy: { inicioEm: "asc" },
      select: {
        id: true,
        inicioEm: true,
        fimEm: true,
        capacidade: true,
        agendamentos: {
          where: {
            OR: [
              { status: { in: ["CONFIRMADO", "CHECK_IN"] } },
              { status: "PENDENTE", expiraEm: { gt: agora } },
            ],
          },
          select: { status: true, quantidadeParticipantes: true, expiraEm: true },
        },
      },
    });
    return horarios.map((horario) => {
      const ocupadas = calcularOcupacaoAgendamentos(horario.agendamentos, agora);
      return {
        id: horario.id,
        inicioEm: horario.inicioEm,
        fimEm: horario.fimEm,
        capacidade: horario.capacidade,
        vagasDisponiveis: Math.max(0, horario.capacidade - ocupadas),
      };
    });
  });
}

/** Consulta publica por protocolo; deliberadamente nao retorna nenhum contato. */
export async function consultarProtocoloAgendamento(
  codigoPublico: string,
): Promise<ResultadoServicoAgendamento<Omit<ProtocoloAgendamentoPublico, "status"> & {
  status:
    | "PENDENTE"
    | "CONFIRMADO"
    | "CHECK_IN"
    | "EXPIRADO"
    | "CANCELADO"
    | "CONCLUIDO"
    | "NAO_COMPARECEU";
}>> {
  return comoResultado(async () => {
    const referencia = await prisma.agendamento.findUnique({
      where: { codigoPublico: codigoPublico.trim().toUpperCase() },
      select: { horarioId: true },
    });
    if (!referencia) {
      throw new ErroPersistenciaAgendamento(
        "PROTOCOLO_NAO_ENCONTRADO",
        "Protocolo nao encontrado.",
      );
    }
    await materializarPendenciasExpiradas({ horarioId: referencia.horarioId, limite: 500 });
    const [agendamento, configuracao] = await Promise.all([
      prisma.agendamento.findUnique({
        where: { codigoPublico: codigoPublico.trim().toUpperCase() },
        select: {
          codigoPublico: true,
          status: true,
          expiraEm: true,
          horario: { select: { inicioEm: true, fimEm: true } },
        },
      }),
      obterConfiguracaoPadroesAgendamento(),
    ]);
    if (!agendamento) {
      throw new ErroPersistenciaAgendamento(
        "PROTOCOLO_NAO_ENCONTRADO",
        "Protocolo nao encontrado.",
      );
    }
    return {
      codigoPublico: agendamento.codigoPublico,
      status: agendamento.status,
      horario: agendamento.horario,
      expiraEm: agendamento.expiraEm,
      instrucoes: {
        confirmacaoManual: true,
        chegadaAntecedenciaMinutos: configuracao.chegadaAntecedenciaMinutos,
      },
    };
  });
}

export async function obterHorarioAdministrativo(
  usuarioAdminId: string,
  horarioId: string,
): Promise<ResultadoServicoAgendamento<HorarioAgendamentoAdministrativo>> {
  return comoResultado(async () => {
    await exigirOperadorAtivo(prisma, usuarioAdminId);
    const agora = new Date();
    await materializarPendenciasExpiradas({
      horarioId,
      referencia: agora,
      limite: 500,
    });
    const horario = await prisma.horarioAgendamento.findUnique({
      where: { id: horarioId },
      select: {
        id: true,
        inicioEm: true,
        fimEm: true,
        capacidade: true,
        status: true,
        observacoesInternas: true,
        agendamentos: {
          select: selecaoAgendamento,
          orderBy: { criadoEm: "asc" },
        },
      },
    });
    if (!horario) {
      throw new ErroPersistenciaAgendamento("HORARIO_NAO_ENCONTRADO", "Horario nao encontrado.");
    }
    const ocupadas = calcularOcupacaoAgendamentos(
      horario.agendamentos.map((agendamento) => ({
        status: agendamento.status,
        quantidadeParticipantes: agendamento.quantidadeParticipantes,
        expiraEm: agendamento.expiraEm,
      })),
      agora,
    );
    return {
      ...horario,
      ocupadas,
      vagasDisponiveis: Math.max(0, horario.capacidade - ocupadas),
      agendamentos: horario.agendamentos.map(paraAgendamentoAdministrativo),
    };
  });
}

export async function listarHorariosAdministrativos(
  usuarioAdminId: string,
  entrada?: {
    de?: Date;
    ate?: Date;
    status?: readonly StatusHorarioAgendamento[];
    busca?: string;
  },
): Promise<ResultadoServicoAgendamento<HorarioAgendamentoAdministrativo[]>> {
  return comoResultado(async () => {
    await exigirOperadorAtivo(prisma, usuarioAdminId);
    await materializarPendenciasExpiradas({ limite: 500 });
    const agora = new Date();
    const busca = entrada?.busca?.trim();
    const agendamentoWhere: Prisma.AgendamentoWhereInput | undefined = busca
      ? {
          codigoPublico: { contains: busca, mode: "insensitive" },
        }
      : undefined;
    const horarios = await prisma.horarioAgendamento.findMany({
      where: {
        ...(entrada?.de || entrada?.ate
          ? { inicioEm: { ...(entrada.de ? { gte: entrada.de } : {}), ...(entrada.ate ? { lt: entrada.ate } : {}) } }
          : {}),
        ...(entrada?.status ? { status: { in: [...entrada.status] } } : {}),
        ...(agendamentoWhere ? { agendamentos: { some: agendamentoWhere } } : {}),
      },
      orderBy: { inicioEm: "asc" },
      select: {
        id: true,
        inicioEm: true,
        fimEm: true,
        capacidade: true,
        status: true,
        observacoesInternas: true,
        agendamentos: {
          select: selecaoAgendamento,
          orderBy: { criadoEm: "asc" },
        },
      },
    });
    return horarios.map((horario) => {
      const ocupadas = calcularOcupacaoAgendamentos(
        horario.agendamentos.map((agendamento) => ({
          status: agendamento.status,
          quantidadeParticipantes: agendamento.quantidadeParticipantes,
          expiraEm: agendamento.expiraEm,
        })),
        agora,
      );
      return {
        ...horario,
        ocupadas,
        vagasDisponiveis: Math.max(0, horario.capacidade - ocupadas),
        agendamentos: horario.agendamentos.map(paraAgendamentoAdministrativo),
      };
    });
  });
}

export async function obterAgendamentoAdministrativo(
  usuarioAdminId: string,
  agendamentoId: string,
): Promise<ResultadoServicoAgendamento<AgendamentoAdministrativo & {
  horario: { id: string; inicioEm: Date; fimEm: Date; status: StatusHorarioAgendamento };
}>> {
  return comoResultado(async () => {
    await exigirOperadorAtivo(prisma, usuarioAdminId);
    const agendamento = await prisma.agendamento.findUnique({
      where: { id: agendamentoId },
      select: {
        ...selecaoAgendamento,
        horario: { select: { id: true, inicioEm: true, fimEm: true, status: true } },
      },
    });
    if (!agendamento) {
      throw new ErroPersistenciaAgendamento("AGENDAMENTO_NAO_ENCONTRADO", "Agendamento nao encontrado.");
    }
    return agendamento;
  });
}

export async function listarEventosDoAgendamento(
  usuarioAdminId: string,
  agendamentoId: string,
) {
  await exigirOperadorAtivo(prisma, usuarioAdminId);
  return prisma.eventoAgendamento.findMany({
    where: { agendamentoId },
    orderBy: { criadoEm: "asc" },
    select: {
      id: true,
      tipo: true,
      origem: true,
      antes: true,
      depois: true,
      criadoEm: true,
      usuarioAdmin: { select: { id: true, nome: true } },
    },
  });
}
