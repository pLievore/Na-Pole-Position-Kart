import "server-only";

import { Prisma, type NivelAcesso, type OrigemEventoAgendamento } from "@napole/db";
import {
  DataHoraOperacionalInvalidaError,
  DataOperacionalInvalidaError,
  HoraOperacionalInvalidaError,
  RegraAgendamentoError,
} from "@napole/core";
import {
  registrarAuditoria as registrarAuditoriaBase,
  type AcaoAuditoria,
  type ClientePrisma,
} from "@/server/auditoria/registrar";
import type {
  ErroServicoAgendamento,
  ResultadoServicoAgendamento,
} from "@/server/agendamentos/tipos";

export class ErroPersistenciaAgendamento extends Error {
  constructor(
    public readonly codigo: string,
    mensagem: string,
    public readonly campo?: string,
  ) {
    super(mensagem);
    this.name = "ErroPersistenciaAgendamento";
  }
}

export async function comoResultado<T>(
  operacao: () => Promise<T>,
): Promise<ResultadoServicoAgendamento<T>> {
  try {
    return { ok: true, valor: await operacao() };
  } catch (erro) {
    if (erro instanceof RegraAgendamentoError || erro instanceof ErroPersistenciaAgendamento) {
      const falha: ErroServicoAgendamento = {
        codigo: erro.codigo,
        mensagem: erro.message,
        ...(erro.campo ? { campo: erro.campo } : {}),
      };
      return { ok: false, erro: falha };
    }
    if (
      erro instanceof DataOperacionalInvalidaError ||
      erro instanceof DataHoraOperacionalInvalidaError ||
      erro instanceof HoraOperacionalInvalidaError
    ) {
      return {
        ok: false,
        erro: { codigo: "DATA_HORA_INVALIDA", mensagem: erro.message },
      };
    }
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
      return {
        ok: false,
        erro: {
          codigo: "CONFLITO",
          mensagem: "Os dados conflitam com um registro que ja existe.",
        },
      };
    }
    throw erro;
  }
}

export async function exigirOperadorAtivo(
  cliente: ClientePrisma,
  usuarioAdminId: string,
): Promise<{ id: string; nivel: NivelAcesso }> {
  const usuario = await cliente.usuarioAdmin.findUnique({
    where: { id: usuarioAdminId },
    select: { id: true, nivel: true, status: true },
  });
  if (!usuario || usuario.status !== "ATIVO") {
    throw new ErroPersistenciaAgendamento(
      "SEM_PERMISSAO",
      "A sessao administrativa nao esta ativa.",
    );
  }
  return { id: usuario.id, nivel: usuario.nivel };
}

export async function exigirAdministradorAtivo(
  cliente: ClientePrisma,
  usuarioAdminId: string,
): Promise<{ id: string; nivel: "ADMINISTRADOR" }> {
  const usuario = await exigirOperadorAtivo(cliente, usuarioAdminId);
  if (usuario.nivel !== "ADMINISTRADOR") {
    throw new ErroPersistenciaAgendamento(
      "SEM_PERMISSAO",
      "Esta operacao exige nivel ADMINISTRADOR.",
    );
  }
  return { id: usuario.id, nivel: "ADMINISTRADOR" };
}

export function origemDoUsuario(nivel: NivelAcesso): OrigemEventoAgendamento {
  return nivel === "ADMINISTRADOR" ? "ADMINISTRADOR" : "OPERADOR";
}

export async function travarHorario(
  tx: Prisma.TransactionClient,
  horarioId: string,
): Promise<boolean> {
  const linhas = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "horarios_agendamento" WHERE "id" = ${horarioId} FOR UPDATE
  `;
  return linhas.length === 1;
}

export async function travarAgendamento(
  tx: Prisma.TransactionClient,
  agendamentoId: string,
): Promise<boolean> {
  const linhas = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "agendamentos" WHERE "id" = ${agendamentoId} FOR UPDATE
  `;
  return linhas.length === 1;
}

export async function travarParticipante(
  tx: Prisma.TransactionClient,
  participanteId: string,
): Promise<boolean> {
  const linhas = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "participantes_agendamento" WHERE "id" = ${participanteId} FOR UPDATE
  `;
  return linhas.length === 1;
}

/** Serializa criacao/edicao de intervalos, inclusive quando a linha ainda nao existe. */
export async function travarGradeDeHorarios(tx: Prisma.TransactionClient): Promise<void> {
  // A função do Postgres retorna `void`, tipo que o Prisma não desserializa.
  // A comparação mantém o efeito do lock e devolve apenas um booleano suportado.
  await tx.$queryRaw<Array<{ adquirida: boolean }>>`
    SELECT pg_advisory_xact_lock(742001) IS NULL AS adquirida
  `;
}

interface DadosEventoAgendamento {
    horarioId: string;
    agendamentoId?: string;
    participanteId?: string;
    tipo:
      | "HORARIO_CRIADO"
      | "HORARIO_ALTERADO"
      | "HORARIO_CANCELADO"
      | "AGENDAMENTO_CRIADO"
      | "AGENDAMENTO_EDITADO"
      | "AGENDAMENTO_CONFIRMADO"
      | "AGENDAMENTO_CHECK_IN"
      | "AGENDAMENTO_EXPIRADO"
      | "AGENDAMENTO_CANCELADO"
      | "AGENDAMENTO_CONCLUIDO"
      | "CHECK_IN_REALIZADO"
      | "PILOTO_VINCULADO"
      | "NAO_COMPARECEU_REGISTRADO";
    origem: OrigemEventoAgendamento;
    usuarioAdminId?: string;
    antes?: unknown;
    depois?: unknown;
}

export async function registrarEventoAgendamento(
  tx: Prisma.TransactionClient,
  entrada: DadosEventoAgendamento | readonly DadosEventoAgendamento[],
): Promise<void> {
  const eventos = Array.isArray(entrada) ? entrada : [entrada];
  const dados = eventos.map((evento) => ({
    horarioId: evento.horarioId,
    agendamentoId: evento.agendamentoId,
    participanteId: evento.participanteId,
    tipo: evento.tipo,
    origem: evento.origem,
    usuarioAdminId: evento.usuarioAdminId,
    antes: normalizarJson(evento.antes) as Prisma.InputJsonValue | undefined,
    depois: normalizarJson(evento.depois) as Prisma.InputJsonValue | undefined,
  }));

  if (dados.length === 0) return;
  if (dados.length === 1) {
    await tx.eventoAgendamento.create({ data: dados[0]! });
    return;
  }
  await tx.eventoAgendamento.createMany({ data: dados });
}

function normalizarJson(valor: unknown): unknown {
  if (valor === undefined) return undefined;
  return JSON.parse(JSON.stringify(valor));
}

/** Mantem datas e outros valores de dominio validos para colunas JSONB. */
interface DadosAuditoriaAgendamento {
    usuarioId: string | null;
    entidade: string;
    entidadeId: string;
    acao: AcaoAuditoria;
    antes?: unknown;
    depois?: unknown;
}

export async function registrarAuditoriaAgendamento(
  tx: Prisma.TransactionClient,
  entrada: DadosAuditoriaAgendamento | readonly DadosAuditoriaAgendamento[],
): Promise<void> {
  const registros = Array.isArray(entrada) ? entrada : [entrada];
  await registrarAuditoriaBase(
    tx,
    registros.map((dados) => ({
      ...dados,
      antes: normalizarJson(dados.antes),
      depois: normalizarJson(dados.depois),
    })),
  );
}

export function textoOpcional(valor: string | null | undefined, maximo: number): string | null {
  const texto = valor?.trim() || null;
  if (texto !== null && texto.length > maximo) {
    throw new ErroPersistenciaAgendamento(
      "TEXTO_MUITO_LONGO",
      `O texto deve ter no maximo ${maximo} caracteres.`,
    );
  }
  return texto;
}
