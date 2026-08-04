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

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: env("DATABASE_URL"),
    // Conexao direta, usada pelas migrations quando a principal e pooled.
    // Opcional: com Neon/Supabase sem pooler, DATABASE_URL ja serve.
    ...(process.env.DIRECT_URL ? { directUrl: env("DIRECT_URL") } : {}),
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
