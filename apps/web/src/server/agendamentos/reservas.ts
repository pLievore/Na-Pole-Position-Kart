import "server-only";

import { randomUUID } from "node:crypto";
import { prisma, type Prisma, type NivelAcesso } from "@napole/db";
import {
  avaliarCapacidadeAgendamento,
  calcularExpiracaoPendencia,
  exigirTransicaoAgendamento,
  resolverStatusAgendamentoPorParticipantes,
  validarDadosAgendamentoPublico,
  VERSAO_TERMOS_VIGENTES,
  type DadosAgendamentoPublico,
  type StatusAgendamento,
} from "@napole/core";
import { obterConfiguracaoPadroesTx } from "@/server/agendamentos/configuracao";
import {
  ErroPersistenciaAgendamento,
  comoResultado,
  exigirOperadorAtivo,
  origemDoUsuario,
  registrarAuditoriaAgendamento as registrarAuditoria,
  registrarEventoAgendamento,
  textoOpcional,
  travarAgendamento,
  travarHorario,
  travarParticipante,
} from "@/server/agendamentos/interno";
import type {
  ProtocoloAgendamentoPublico,
  ResultadoServicoAgendamento,
} from "@/server/agendamentos/tipos";

export type EntradaSolicitacaoAgendamento = Omit<
  DadosAgendamentoPublico,
  "versaoTermos"
> & { horarioId: string };

interface AtorExpiracao {
  usuarioAdminId: string | null;
  nivel: NivelAcesso | null;
}

async function expirarPendenciasDoHorarioTx(
  tx: Prisma.TransactionClient,
  horarioId: string,
  referencia: Date,
  ator: AtorExpiracao,
): Promise<number> {
  const pendencias = await tx.agendamento.findMany({
    where: { horarioId, status: "PENDENTE", expiraEm: { lte: referencia } },
    select: { id: true, status: true, expiraEm: true },
  });
  let expirados = 0;
  for (const pendencia of pendencias) {
    const alteracao = await tx.agendamento.updateMany({
      where: { id: pendencia.id, status: "PENDENTE", expiraEm: { lte: referencia } },
      data: { status: "EXPIRADO", expiradoEm: referencia },
    });
    if (alteracao.count !== 1) continue;
    await tx.participanteAgendamento.updateMany({
      where: { agendamentoId: pendencia.id, status: "AGENDADO" },
      data: { status: "CANCELADO" },
    });
    const origem = ator.nivel === null ? "SISTEMA" : origemDoUsuario(ator.nivel);
    const depois = { status: "EXPIRADO", expiradoEm: referencia, expiraEm: pendencia.expiraEm };
    await registrarEventoAgendamento(tx, {
      horarioId,
      agendamentoId: pendencia.id,
      tipo: "AGENDAMENTO_EXPIRADO",
      origem,
      usuarioAdminId: ator.usuarioAdminId ?? undefined,
      antes: { status: pendencia.status },
      depois,
    });
    await registrarAuditoria(tx, {
      usuarioId: ator.usuarioAdminId,
      entidade: "Agendamento",
      entidadeId: pendencia.id,
      acao: "EXPIRAR",
      antes: { status: pendencia.status },
      depois,
    });
    expirados += 1;
  }
  return expirados;
}

/** Idempotente e segura para leitura, operacao manual ou job futuro. */
export async function materializarPendenciasExpiradas(entrada?: {
  referencia?: Date;
  limite?: number;
  usuarioAdminId?: string;
  horarioId?: string;
}): Promise<ResultadoServicoAgendamento<{ expirados: number }>> {
  return comoResultado(async () => {
    const referencia = entrada?.referencia ?? new Date();
    const limite = entrada?.limite ?? 200;
    if (!Number.isSafeInteger(limite) || limite < 1 || limite > 1_000) {
      throw new ErroPersistenciaAgendamento("LIMITE_INVALIDO", "O limite precisa estar entre 1 e 1000.");
    }
    if (entrada?.usuarioAdminId) {
      await exigirOperadorAtivo(prisma, entrada.usuarioAdminId);
    }
    const candidatos = await prisma.agendamento.findMany({
      where: {
        status: "PENDENTE",
        expiraEm: { lte: referencia },
        ...(entrada?.horarioId ? { horarioId: entrada.horarioId } : {}),
      },
      select: { horarioId: true },
      distinct: ["horarioId"],
      take: limite,
    });
    let expirados = 0;
    for (const candidato of candidatos) {
      expirados += await prisma.$transaction(async (tx) => {
        let ator: AtorExpiracao = { usuarioAdminId: null, nivel: null };
        if (entrada?.usuarioAdminId) {
          const usuario = await exigirOperadorAtivo(tx, entrada.usuarioAdminId);
          ator = { usuarioAdminId: usuario.id, nivel: usuario.nivel };
        }
        if (!(await travarHorario(tx, candidato.horarioId))) return 0;
        return expirarPendenciasDoHorarioTx(tx, candidato.horarioId, referencia, ator);
      });
    }
    return { expirados };
  });
}

export async function solicitarAgendamentoPublico(
  entrada: EntradaSolicitacaoAgendamento,
): Promise<ResultadoServicoAgendamento<ProtocoloAgendamentoPublico>> {
  return comoResultado(async () => {
    const dados = validarDadosAgendamentoPublico({
      ...entrada,
      versaoTermos: VERSAO_TERMOS_VIGENTES,
    });
    return prisma.$transaction(async (tx): Promise<ProtocoloAgendamentoPublico> => {
      if (!(await travarHorario(tx, entrada.horarioId))) {
        throw new ErroPersistenciaAgendamento("HORARIO_NAO_ENCONTRADO", "Horario nao encontrado.");
      }
      const agora = new Date();
      await expirarPendenciasDoHorarioTx(tx, entrada.horarioId, agora, {
        usuarioAdminId: null,
        nivel: null,
      });
      const [horario, configuracao] = await Promise.all([
        tx.horarioAgendamento.findUniqueOrThrow({ where: { id: entrada.horarioId } }),
        obterConfiguracaoPadroesTx(tx),
      ]);
      if (horario.status !== "ABERTO") {
        throw new ErroPersistenciaAgendamento(
          "HORARIO_INDISPONIVEL",
          "Este horario nao esta aberto para reservas.",
        );
      }
      const expiraEm = calcularExpiracaoPendencia(
        agora,
        horario.inicioEm,
        configuracao.pendenciaHoras,
        configuracao.antecedenciaMinimaMinutos,
      );

      const duplicado = await tx.agendamento.findFirst({
        where: {
          horarioId: horario.id,
          responsavelTelefone: dados.responsavelTelefone,
          OR: [
            { status: { in: ["CONFIRMADO", "CHECK_IN"] } },
            { status: "PENDENTE", expiraEm: { gt: agora } },
          ],
        },
        select: { id: true },
      });
      if (duplicado) {
        throw new ErroPersistenciaAgendamento(
          "AGENDAMENTO_DUPLICADO",
          "Ja existe uma reserva ativa para este telefone no mesmo horario.",
          "responsavelTelefone",
        );
      }

      const ocupacao = await tx.agendamento.aggregate({
        where: {
          horarioId: horario.id,
          OR: [
            { status: { in: ["CONFIRMADO", "CHECK_IN"] } },
            { status: "PENDENTE", expiraEm: { gt: agora } },
          ],
        },
        _sum: { quantidadeParticipantes: true },
      });
      avaliarCapacidadeAgendamento(
        horario.capacidade,
        ocupacao._sum.quantidadeParticipantes ?? 0,
        dados.participantes.length,
      );

      const agendamento = await tx.agendamento.create({
        data: {
          codigoPublico: randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase(),
          horarioId: horario.id,
          status: "PENDENTE",
          origem: "SITE",
          quantidadeParticipantes: dados.participantes.length,
          responsavelNome: dados.responsavelNome,
          responsavelTelefone: dados.responsavelTelefone,
          responsavelEmail: dados.responsavelEmail,
          temParticipanteMenor: dados.temParticipanteMenor,
          observacoesCliente: dados.observacoesCliente,
          aceiteTermosEm: agora,
          versaoTermos: dados.versaoTermos,
          expiraEm,
          participantes: { create: dados.participantes },
        },
        select: { id: true, codigoPublico: true },
      });
      await registrarEventoAgendamento(tx, {
        horarioId: horario.id,
        agendamentoId: agendamento.id,
        tipo: "AGENDAMENTO_CRIADO",
        origem: "PUBLICO",
        depois: {
          status: "PENDENTE",
          origem: "SITE",
          quantidadeParticipantes: dados.participantes.length,
          temParticipanteMenor: dados.temParticipanteMenor,
          expiraEm,
        },
      });

      // DTO publico deliberadamente nao inclui contato nem nomes dos participantes.
      return {
        codigoPublico: agendamento.codigoPublico,
        status: "PENDENTE",
        horario: { inicioEm: horario.inicioEm, fimEm: horario.fimEm },
        expiraEm,
        instrucoes: {
          confirmacaoManual: true,
          chegadaAntecedenciaMinutos: configuracao.chegadaAntecedenciaMinutos,
        },
      };
    });
  });
}

async function localizarHorarioDoAgendamento(agendamentoId: string): Promise<string> {
  const agendamento = await prisma.agendamento.findUnique({
    where: { id: agendamentoId },
    select: { horarioId: true },
  });
  if (!agendamento) {
    throw new ErroPersistenciaAgendamento("AGENDAMENTO_NAO_ENCONTRADO", "Agendamento nao encontrado.");
  }
  return agendamento.horarioId;
}

async function materializarPendenciaEspecifica(
  agendamentoId: string,
  usuarioAdminId: string,
): Promise<void> {
  // A acao exige sessao ativa, mas o vencimento decorre do relogio e nao do
  // operador que tentou agir depois do prazo.
  await exigirOperadorAtivo(prisma, usuarioAdminId);
  const horarioId = await localizarHorarioDoAgendamento(agendamentoId);
  await prisma.$transaction(async (tx) => {
    if (!(await travarHorario(tx, horarioId))) return;
    await expirarPendenciasDoHorarioTx(tx, horarioId, new Date(), {
      usuarioAdminId: null,
      nivel: null,
    });
  });
}

export async function confirmarAgendamento(
  operadorId: string,
  agendamentoId: string,
): Promise<ResultadoServicoAgendamento<{ id: string; status: "CONFIRMADO" }>> {
  return comoResultado(async () => {
    await materializarPendenciaEspecifica(agendamentoId, operadorId);
    const horarioId = await localizarHorarioDoAgendamento(agendamentoId);
    return prisma.$transaction(async (tx) => {
      const operador = await exigirOperadorAtivo(tx, operadorId);
      await travarHorario(tx, horarioId);
      if (!(await travarAgendamento(tx, agendamentoId))) {
        throw new ErroPersistenciaAgendamento("AGENDAMENTO_NAO_ENCONTRADO", "Agendamento nao encontrado.");
      }
      const atual = await tx.agendamento.findUniqueOrThrow({ where: { id: agendamentoId } });
      if (atual.status === "PENDENTE" && atual.expiraEm <= new Date()) {
        throw new ErroPersistenciaAgendamento(
          "AGENDAMENTO_EXPIRADO",
          "A pendencia venceu antes da confirmacao.",
        );
      }
      exigirTransicaoAgendamento(atual.status, "CONFIRMADO");
      const confirmadoEm = new Date();
      await tx.agendamento.update({
        where: { id: agendamentoId },
        data: { status: "CONFIRMADO", confirmadoEm },
      });
      const depois = { status: "CONFIRMADO", confirmadoEm };
      await registrarEventoAgendamento(tx, {
        horarioId,
        agendamentoId,
        tipo: "AGENDAMENTO_CONFIRMADO",
        origem: origemDoUsuario(operador.nivel),
        usuarioAdminId: operador.id,
        antes: { status: atual.status },
        depois,
      });
      await registrarAuditoria(tx, {
        usuarioId: operador.id,
        entidade: "Agendamento",
        entidadeId: agendamentoId,
        acao: "CONFIRMAR",
        antes: { status: atual.status },
        depois,
      });
      return { id: agendamentoId, status: "CONFIRMADO" as const };
    });
  });
}

export async function cancelarAgendamento(
  operadorId: string,
  agendamentoId: string,
  entrada: { motivo: string; forcarComCheckIn?: boolean },
): Promise<ResultadoServicoAgendamento<{ id: string; status: "CANCELADO" }>> {
  return comoResultado(async () => {
    await materializarPendenciaEspecifica(agendamentoId, operadorId);
    const horarioId = await localizarHorarioDoAgendamento(agendamentoId);
    return prisma.$transaction(async (tx) => {
      const operador = await exigirOperadorAtivo(tx, operadorId);
      await travarHorario(tx, horarioId);
      await travarAgendamento(tx, agendamentoId);
      const atual = await tx.agendamento.findUniqueOrThrow({
        where: { id: agendamentoId },
        include: { participantes: { select: { status: true } } },
      });
      if (atual.status === "PENDENTE" && atual.expiraEm <= new Date()) {
        throw new ErroPersistenciaAgendamento(
          "AGENDAMENTO_EXPIRADO",
          "A pendencia venceu antes do cancelamento.",
        );
      }
      const overrideCheckIn =
        atual.status === "CHECK_IN" &&
        operador.nivel === "ADMINISTRADOR" &&
        entrada.forcarComCheckIn === true;
      if (!overrideCheckIn) exigirTransicaoAgendamento(atual.status, "CANCELADO");
      if (
        atual.participantes.some((participante) => participante.status === "PRESENTE") &&
        !overrideCheckIn
      ) {
        throw new ErroPersistenciaAgendamento(
          "CHECK_IN_EXISTENTE",
          "A reserva ja possui participante com check-in.",
        );
      }
      const motivo = textoOpcional(entrada.motivo, 2_000);
      if (!motivo) {
        throw new ErroPersistenciaAgendamento("MOTIVO_OBRIGATORIO", "Informe o motivo do cancelamento.");
      }
      const canceladoEm = new Date();
      await tx.agendamento.update({
        where: { id: agendamentoId },
        data: { status: "CANCELADO", canceladoEm, motivoCancelamento: motivo },
      });
      await tx.participanteAgendamento.updateMany({
        where: overrideCheckIn ? { agendamentoId } : { agendamentoId, status: "AGENDADO" },
        data: { status: "CANCELADO" },
      });
      const depois = {
        status: "CANCELADO",
        canceladoEm,
        motivo,
        overrideCheckIn,
      };
      await registrarEventoAgendamento(tx, {
        horarioId,
        agendamentoId,
        tipo: "AGENDAMENTO_CANCELADO",
        origem: origemDoUsuario(operador.nivel),
        usuarioAdminId: operador.id,
        antes: { status: atual.status },
        depois,
      });
      await registrarAuditoria(tx, {
        usuarioId: operador.id,
        entidade: "Agendamento",
        entidadeId: agendamentoId,
        acao: "CANCELAR",
        antes: { status: atual.status },
        depois,
      });
      return { id: agendamentoId, status: "CANCELADO" as const };
    });
  });
}

async function localizarParticipante(participanteId: string): Promise<{
  agendamentoId: string;
  horarioId: string;
}> {
  const participante = await prisma.participanteAgendamento.findUnique({
    where: { id: participanteId },
    select: { agendamentoId: true, agendamento: { select: { horarioId: true } } },
  });
  if (!participante) {
    throw new ErroPersistenciaAgendamento("PARTICIPANTE_NAO_ENCONTRADO", "Participante nao encontrado.");
  }
  return { agendamentoId: participante.agendamentoId, horarioId: participante.agendamento.horarioId };
}

async function atualizarEstadoDaPresenca(
  tx: Prisma.TransactionClient,
  dados: {
    agendamentoId: string;
    horarioId: string;
    operadorId: string;
    nivel: NivelAcesso;
  },
): Promise<StatusAgendamento> {
  const agendamento = await tx.agendamento.findUniqueOrThrow({
    where: { id: dados.agendamentoId },
    select: { status: true, participantes: { select: { status: true } } },
  });
  const novoStatus = resolverStatusAgendamentoPorParticipantes(
    agendamento.status,
    agendamento.participantes.map((participante) => participante.status),
  );
  if (novoStatus === agendamento.status) return novoStatus;

  const agora = new Date();
  await tx.agendamento.update({
    where: { id: dados.agendamentoId },
    data:
      novoStatus === "NAO_COMPARECEU"
        ? { status: novoStatus, naoCompareceuEm: agora }
        : { status: novoStatus },
  });
  const depois = { status: novoStatus, em: agora };
  await registrarEventoAgendamento(tx, {
    horarioId: dados.horarioId,
    agendamentoId: dados.agendamentoId,
    tipo:
      novoStatus === "CHECK_IN" ? "AGENDAMENTO_CHECK_IN" : "NAO_COMPARECEU_REGISTRADO",
    origem: origemDoUsuario(dados.nivel),
    usuarioAdminId: dados.operadorId,
    antes: { status: agendamento.status },
    depois,
  });
  await registrarAuditoria(tx, {
    usuarioId: dados.operadorId,
    entidade: "Agendamento",
    entidadeId: dados.agendamentoId,
    acao: novoStatus === "CHECK_IN" ? "CHECK_IN" : "NAO_COMPARECER",
    antes: { status: agendamento.status },
    depois,
  });
  return novoStatus;
}

export async function realizarCheckInParticipante(
  operadorId: string,
  participanteId: string,
  entrada?: { pilotoId?: string },
): Promise<ResultadoServicoAgendamento<{ participanteId: string; statusAgendamento: StatusAgendamento }>> {
  return comoResultado(async () => {
    const local = await localizarParticipante(participanteId);
    return prisma.$transaction(async (tx) => {
      const operador = await exigirOperadorAtivo(tx, operadorId);
      await travarHorario(tx, local.horarioId);
      await travarAgendamento(tx, local.agendamentoId);
      await travarParticipante(tx, participanteId);
      const participante = await tx.participanteAgendamento.findUniqueOrThrow({
        where: { id: participanteId },
        include: { agendamento: { select: { status: true } } },
      });
      if (
        (participante.agendamento.status !== "CONFIRMADO" &&
          participante.agendamento.status !== "CHECK_IN") ||
        participante.status !== "AGENDADO"
      ) {
        throw new ErroPersistenciaAgendamento(
          "CHECK_IN_INVALIDO",
          "O check-in exige reserva confirmada e participante ainda agendado.",
        );
      }
      if (entrada?.pilotoId) {
        const piloto = await tx.piloto.findUnique({
          where: { id: entrada.pilotoId },
          select: { id: true, status: true },
        });
        if (!piloto || piloto.status !== "ATIVO") {
          throw new ErroPersistenciaAgendamento(
            "PILOTO_INDISPONIVEL",
            "O piloto precisa existir e estar ativo.",
          );
        }
      }
      const checkInEm = new Date();
      const pilotoIdVinculado = entrada?.pilotoId ?? participante.pilotoId;
      await tx.participanteAgendamento.update({
        where: { id: participanteId },
        data: {
          status: "PRESENTE",
          checkInEm,
          ...(entrada?.pilotoId ? { pilotoId: entrada.pilotoId } : {}),
        },
      });
      const depois = { status: "PRESENTE", checkInEm, pilotoId: pilotoIdVinculado };
      await registrarEventoAgendamento(tx, {
        horarioId: local.horarioId,
        agendamentoId: local.agendamentoId,
        participanteId,
        tipo: "CHECK_IN_REALIZADO",
        origem: origemDoUsuario(operador.nivel),
        usuarioAdminId: operador.id,
        antes: { status: participante.status, pilotoId: participante.pilotoId },
        depois,
      });
      await registrarAuditoria(tx, {
        usuarioId: operador.id,
        entidade: "ParticipanteAgendamento",
        entidadeId: participanteId,
        acao: "CHECK_IN",
        antes: { status: participante.status, pilotoId: participante.pilotoId },
        depois,
      });
      if (entrada?.pilotoId) {
        await registrarEventoAgendamento(tx, {
          horarioId: local.horarioId,
          agendamentoId: local.agendamentoId,
          participanteId,
          tipo: "PILOTO_VINCULADO",
          origem: origemDoUsuario(operador.nivel),
          usuarioAdminId: operador.id,
          antes: { pilotoId: participante.pilotoId },
          depois: { pilotoId: entrada.pilotoId },
        });
        await registrarAuditoria(tx, {
          usuarioId: operador.id,
          entidade: "ParticipanteAgendamento",
          entidadeId: participanteId,
          acao: "VINCULAR_PILOTO",
          antes: { pilotoId: participante.pilotoId },
          depois: { pilotoId: entrada.pilotoId },
        });
      }
      const statusAgendamento = await atualizarEstadoDaPresenca(tx, {
        agendamentoId: local.agendamentoId,
        horarioId: local.horarioId,
        operadorId: operador.id,
        nivel: operador.nivel,
      });
      return { participanteId, statusAgendamento };
    });
  });
}

export async function vincularPilotoAoParticipante(
  operadorId: string,
  participanteId: string,
  pilotoId: string,
): Promise<ResultadoServicoAgendamento<{ participanteId: string; pilotoId: string }>> {
  return comoResultado(async () => {
    const local = await localizarParticipante(participanteId);
    return prisma.$transaction(async (tx) => {
      const operador = await exigirOperadorAtivo(tx, operadorId);
      await travarHorario(tx, local.horarioId);
      await travarAgendamento(tx, local.agendamentoId);
      await travarParticipante(tx, participanteId);
      const [participante, piloto] = await Promise.all([
        tx.participanteAgendamento.findUniqueOrThrow({ where: { id: participanteId } }),
        tx.piloto.findUnique({ where: { id: pilotoId }, select: { id: true, status: true } }),
      ]);
      if (participante.status !== "AGENDADO" && participante.status !== "PRESENTE") {
        throw new ErroPersistenciaAgendamento(
          "VINCULO_INVALIDO",
          "Participante cancelado ou ausente nao pode receber vinculo.",
        );
      }
      if (!piloto || piloto.status !== "ATIVO") {
        throw new ErroPersistenciaAgendamento("PILOTO_INDISPONIVEL", "O piloto precisa estar ativo.");
      }
      if (participante.pilotoId === pilotoId) return { participanteId, pilotoId };
      await tx.participanteAgendamento.update({
        where: { id: participanteId },
        data: { pilotoId },
      });
      await registrarEventoAgendamento(tx, {
        horarioId: local.horarioId,
        agendamentoId: local.agendamentoId,
        participanteId,
        tipo: "PILOTO_VINCULADO",
        origem: origemDoUsuario(operador.nivel),
        usuarioAdminId: operador.id,
        antes: { pilotoId: participante.pilotoId },
        depois: { pilotoId },
      });
      await registrarAuditoria(tx, {
        usuarioId: operador.id,
        entidade: "ParticipanteAgendamento",
        entidadeId: participanteId,
        acao: "VINCULAR_PILOTO",
        antes: { pilotoId: participante.pilotoId },
        depois: { pilotoId },
      });
      return { participanteId, pilotoId };
    });
  });
}

export async function registrarAusenciaParticipante(
  operadorId: string,
  participanteId: string,
): Promise<ResultadoServicoAgendamento<{ participanteId: string; statusAgendamento: StatusAgendamento }>> {
  return comoResultado(async () => {
    const local = await localizarParticipante(participanteId);
    return prisma.$transaction(async (tx) => {
      const operador = await exigirOperadorAtivo(tx, operadorId);
      await travarHorario(tx, local.horarioId);
      await travarAgendamento(tx, local.agendamentoId);
      await travarParticipante(tx, participanteId);
      const participante = await tx.participanteAgendamento.findUniqueOrThrow({
        where: { id: participanteId },
        include: { agendamento: { select: { status: true } } },
      });
      if (
        (participante.agendamento.status !== "CONFIRMADO" &&
          participante.agendamento.status !== "CHECK_IN") ||
        participante.status !== "AGENDADO"
      ) {
        throw new ErroPersistenciaAgendamento(
          "AUSENCIA_INVALIDA",
          "A ausencia exige reserva confirmada e participante ainda agendado.",
        );
      }
      const ausenciaRegistradaEm = new Date();
      await tx.participanteAgendamento.update({
        where: { id: participanteId },
        data: { status: "AUSENTE", ausenciaRegistradaEm },
      });
      const depois = { status: "AUSENTE", ausenciaRegistradaEm };
      await registrarEventoAgendamento(tx, {
        horarioId: local.horarioId,
        agendamentoId: local.agendamentoId,
        participanteId,
        tipo: "NAO_COMPARECEU_REGISTRADO",
        origem: origemDoUsuario(operador.nivel),
        usuarioAdminId: operador.id,
        antes: { status: participante.status },
        depois,
      });
      await registrarAuditoria(tx, {
        usuarioId: operador.id,
        entidade: "ParticipanteAgendamento",
        entidadeId: participanteId,
        acao: "NAO_COMPARECER",
        antes: { status: participante.status },
        depois,
      });
      const statusAgendamento = await atualizarEstadoDaPresenca(tx, {
        agendamentoId: local.agendamentoId,
        horarioId: local.horarioId,
        operadorId: operador.id,
        nivel: operador.nivel,
      });
      return { participanteId, statusAgendamento };
    });
  });
}

export async function registrarNaoComparecimentoAgendamento(
  operadorId: string,
  agendamentoId: string,
): Promise<ResultadoServicoAgendamento<{ id: string; status: "NAO_COMPARECEU" }>> {
  return comoResultado(async () => {
    const horarioId = await localizarHorarioDoAgendamento(agendamentoId);
    return prisma.$transaction(async (tx) => {
      const operador = await exigirOperadorAtivo(tx, operadorId);
      await travarHorario(tx, horarioId);
      await travarAgendamento(tx, agendamentoId);
      const atual = await tx.agendamento.findUniqueOrThrow({
        where: { id: agendamentoId },
        include: { participantes: { select: { status: true } } },
      });
      exigirTransicaoAgendamento(atual.status, "NAO_COMPARECEU");
      if (atual.participantes.some((participante) => participante.status === "PRESENTE")) {
        throw new ErroPersistenciaAgendamento(
          "CHECK_IN_EXISTENTE",
          "Use a ausencia individual: ja existe participante presente.",
        );
      }
      const naoCompareceuEm = new Date();
      await tx.participanteAgendamento.updateMany({
        where: { agendamentoId, status: "AGENDADO" },
        data: { status: "AUSENTE", ausenciaRegistradaEm: naoCompareceuEm },
      });
      await tx.agendamento.update({
        where: { id: agendamentoId },
        data: { status: "NAO_COMPARECEU", naoCompareceuEm },
      });
      const depois = { status: "NAO_COMPARECEU", naoCompareceuEm };
      await registrarEventoAgendamento(tx, {
        horarioId,
        agendamentoId,
        tipo: "NAO_COMPARECEU_REGISTRADO",
        origem: origemDoUsuario(operador.nivel),
        usuarioAdminId: operador.id,
        antes: { status: atual.status },
        depois,
      });
      await registrarAuditoria(tx, {
        usuarioId: operador.id,
        entidade: "Agendamento",
        entidadeId: agendamentoId,
        acao: "NAO_COMPARECER",
        antes: { status: atual.status },
        depois,
      });
      return { id: agendamentoId, status: "NAO_COMPARECEU" as const };
    });
  });
}

/** Conclui a reserva somente depois da bateria; check-in nunca antecipa este estado. */
export async function concluirAgendamento(
  operadorId: string,
  agendamentoId: string,
): Promise<ResultadoServicoAgendamento<{ id: string; status: "CONCLUIDO" }>> {
  return comoResultado(async () => {
    const horarioId = await localizarHorarioDoAgendamento(agendamentoId);
    return prisma.$transaction(async (tx) => {
      const operador = await exigirOperadorAtivo(tx, operadorId);
      await travarHorario(tx, horarioId);
      await travarAgendamento(tx, agendamentoId);
      const atual = await tx.agendamento.findUniqueOrThrow({
        where: { id: agendamentoId },
        include: { participantes: { select: { status: true } } },
      });
      exigirTransicaoAgendamento(atual.status, "CONCLUIDO");
      if (!atual.participantes.some((participante) => participante.status === "PRESENTE")) {
        throw new ErroPersistenciaAgendamento(
          "PRESENCA_OBRIGATORIA",
          "A conclusao exige ao menos um participante presente.",
        );
      }
      if (atual.participantes.some((participante) => participante.status === "AGENDADO")) {
        throw new ErroPersistenciaAgendamento(
          "PARTICIPANTES_PENDENTES",
          "Registre presenca ou ausencia de todos os participantes antes de concluir.",
        );
      }
      const concluidoEm = new Date();
      await tx.agendamento.update({
        where: { id: agendamentoId },
        data: { status: "CONCLUIDO", concluidoEm },
      });
      const depois = { status: "CONCLUIDO", concluidoEm };
      await registrarEventoAgendamento(tx, {
        horarioId,
        agendamentoId,
        tipo: "AGENDAMENTO_CONCLUIDO",
        origem: origemDoUsuario(operador.nivel),
        usuarioAdminId: operador.id,
        antes: { status: atual.status },
        depois,
      });
      await registrarAuditoria(tx, {
        usuarioId: operador.id,
        entidade: "Agendamento",
        entidadeId: agendamentoId,
        acao: "CONCLUIR",
        antes: { status: atual.status },
        depois,
      });
      return { id: agendamentoId, status: "CONCLUIDO" as const };
    });
  });
}

export async function atualizarObservacoesInternasAgendamento(
  operadorId: string,
  agendamentoId: string,
  observacoesInternas: string | null,
): Promise<ResultadoServicoAgendamento<{ id: string }>> {
  return comoResultado(async () => {
    const horarioId = await localizarHorarioDoAgendamento(agendamentoId);
    return prisma.$transaction(async (tx) => {
      const operador = await exigirOperadorAtivo(tx, operadorId);
      await travarHorario(tx, horarioId);
      await travarAgendamento(tx, agendamentoId);
      const atual = await tx.agendamento.findUniqueOrThrow({
        where: { id: agendamentoId },
        select: { observacoesInternas: true },
      });
      const texto = textoOpcional(observacoesInternas, 5_000);
      await tx.agendamento.update({ where: { id: agendamentoId }, data: { observacoesInternas: texto } });
      await registrarEventoAgendamento(tx, {
        horarioId,
        agendamentoId,
        tipo: "AGENDAMENTO_EDITADO",
        origem: origemDoUsuario(operador.nivel),
        usuarioAdminId: operador.id,
        antes: { observacoesInternas: atual.observacoesInternas },
        depois: { observacoesInternas: texto },
      });
      await registrarAuditoria(tx, {
        usuarioId: operador.id,
        entidade: "Agendamento",
        entidadeId: agendamentoId,
        acao: "EDITAR",
        antes: { observacoesInternas: atual.observacoesInternas },
        depois: { observacoesInternas: texto },
      });
      return { id: agendamentoId };
    });
  });
}
