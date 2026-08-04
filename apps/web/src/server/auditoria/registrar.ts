import "server-only";

import type { Prisma, PrismaClient } from "@napole/db";

/**
 * Trilha de auditoria das acoes administrativas.
 *
 * Recebe o client como parametro para poder gravar DENTRO da transacao que fez
 * a alteracao: se a operacao for desfeita, o registro de auditoria some junto e
 * a trilha nao acusa uma mudanca que nunca aconteceu.
 */
export type ClientePrisma = PrismaClient | Prisma.TransactionClient;

export type AcaoAuditoria =
  | "CRIAR"
  | "EDITAR"
  | "INVALIDAR"
  | "INATIVAR"
  | "REATIVAR"
  | "BLOQUEAR"
  | "DESBLOQUEAR"
  | "RESETAR_SENHA"
  | "CONFERIR_PESO"
  | "ALTERAR_CATEGORIA"
  | "PUBLICAR"
  | "FECHAR"
  | "CANCELAR"
  | "CONFIRMAR"
  | "CHECK_IN"
  | "CONCLUIR"
  | "NAO_COMPARECER"
  | "VINCULAR_PILOTO"
  | "EXPIRAR";

export interface EntradaRegistroAuditoria {
  usuarioId: string | null;
  entidade: string;
  entidadeId: string;
  acao: AcaoAuditoria;
  antes?: unknown;
  depois?: unknown;
}

export async function registrarAuditoria(
  cliente: ClientePrisma,
  entrada: EntradaRegistroAuditoria | readonly EntradaRegistroAuditoria[],
) {
  const registros = Array.isArray(entrada) ? entrada : [entrada];
  const dados = registros.map((registro) => ({
      usuarioId: registro.usuarioId,
      entidade: registro.entidade,
      entidadeId: registro.entidadeId,
      acao: registro.acao,
      antes: (registro.antes ?? undefined) as Prisma.InputJsonValue | undefined,
      depois: (registro.depois ?? undefined) as Prisma.InputJsonValue | undefined,
  }));

  if (dados.length === 0) return;
  if (dados.length === 1) {
    await cliente.registroAuditoria.create({ data: dados[0]! });
    return;
  }
  await cliente.registroAuditoria.createMany({ data: dados });
}
