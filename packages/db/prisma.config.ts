import path from "node:path";
import { defineConfig, env } from "prisma/config";

/**
 * Configuracao do Prisma CLI.
 *
 * O monorepo mantem um unico .env, na raiz — entao ele e carregado aqui, ja que
 * o CLI roda com o diretorio de trabalho em packages/db.
 */
const envDaRaiz = path.resolve(import.meta.dirname, "../../.env");
try {
  process.loadEnvFile(envDaRaiz);
} catch {
  // Sem .env: vale o que ja estiver no ambiente (CI, Vercel, shell).
}

// No Prisma 7 o CLI usa apenas datasource.url. A aplicacao continua na URL
// pooled, enquanto migrations precisam evitar o transaction pooler.
const urlDoCli = process.env.DIRECT_URL ? env("DIRECT_URL") : env("DATABASE_URL");

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: urlDoCli,
  },
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
});
