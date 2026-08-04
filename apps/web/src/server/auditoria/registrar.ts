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
  | "ALTERAR_CATEGORIA";

export async function registrarAuditoria(
  cliente: ClientePrisma,
  registro: {
    usuarioId: string | null;
    entidade: string;
    entidadeId: string;
    acao: AcaoAuditoria;
    antes?: unknown;
    depois?: unknown;
  },
) {
  await cliente.registroAuditoria.create({
    data: {
      usuarioId: registro.usuarioId,
      entidade: registro.entidade,
      entidadeId: registro.entidadeId,
      acao: registro.acao,
      antes: (registro.antes ?? undefined) as Prisma.InputJsonValue | undefined,
      depois: (registro.depois ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}
