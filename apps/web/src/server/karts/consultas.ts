import "server-only";

import { prisma } from "@napole/db";

/**
 * Karts que podem receber lancamento de corrida.
 *
 * Kart DESATIVADO fica de fora: se ele nao roda mais, um tempo lancado nele hoje
 * e erro de digitacao. MANUTENCAO e PARADO continuam disponiveis porque o
 * operador pode estar lancando o resultado de um dia anterior.
 */
export async function listarKartsDisponiveis() {
  return prisma.kart.findMany({
    where: { status: { not: "DESATIVADO" } },
    select: { id: true, numero: true, status: true },
    orderBy: { numero: "asc" },
  });
}
