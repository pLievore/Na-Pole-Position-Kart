import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client";

/**
 * Cliente Prisma compartilhado.
 *
 * A partir do Prisma 7 a conexao vem de um driver adapter, nao mais de uma URL
 * dentro do schema. O `PrismaPg` recebe a string de conexao direto do ambiente.
 *
 * O cache no globalThis existe porque o Next recarrega os modulos a cada
 * alteracao em desenvolvimento; sem ele, cada reload abriria uma nova pool e o
 * Postgres gerenciado (Neon/Supabase) derrubaria a aplicacao por limite de
 * conexoes.
 */
const globalParaPrisma = globalThis as unknown as { prisma?: PrismaClient };

function criarCliente(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL nao definida. Veja .env.example na raiz do repositorio.");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma: PrismaClient = globalParaPrisma.prisma ?? criarCliente();

if (process.env.NODE_ENV !== "production") {
  globalParaPrisma.prisma = prisma;
}

export * from "./generated/client";
