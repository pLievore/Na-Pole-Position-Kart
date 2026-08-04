import "server-only";

import type { Prisma } from "@napole/db";

/**
 * Serializa operacoes que alteram credenciais ou acesso do mesmo piloto.
 *
 * A trava precisa acontecer dentro da transacao que faz a alteracao; ela e
 * liberada automaticamente no commit ou rollback.
 */
export async function travarPilotoPorId(
  tx: Prisma.TransactionClient,
  id: string,
): Promise<boolean> {
  const linhas = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "pilotos"
    WHERE "id" = ${id}
    FOR UPDATE
  `;

  return linhas.length === 1;
}

export async function travarPilotoPorNumero(
  tx: Prisma.TransactionClient,
  numero: number,
): Promise<string | null> {
  const linhas = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "pilotos"
    WHERE "numero" = ${numero}
    FOR UPDATE
  `;

  return linhas[0]?.id ?? null;
}
