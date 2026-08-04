import path from "node:path";
import { defineConfig } from "prisma/config";

/**
 * Configuracao do Prisma CLI.
 *
 * O monorepo mantem um unico .env, na raiz — entao ele e carregado aqui, ja que
 * o CLI roda com o diretorio de trabalho em packages/db.
 */
const envDaRaiz = path.resolve(import.meta.dirname, "../../.env");
try {
  process.loadEnvFile(envDaRaiz);
} catch (erro) {
  if ((erro as NodeJS.ErrnoException).code !== "ENOENT") throw erro;
  // Sem .env: vale o que ja estiver no ambiente (CI, Vercel, shell).
}

function prepararUrlDoCli(connectionString: string): string {
  const url = new URL(connectionString);
  if (!url.hostname.endsWith(".supabase.com")) return connectionString;

  for (const parametro of [
    "ssl",
    "sslmode",
    "sslaccept",
    "sslcert",
    "sslidentity",
    "sslkey",
    "sslpassword",
    "sslrootcert",
  ]) {
    url.searchParams.delete(parametro);
  }

  // Migrations tambem validam CA e hostname. O caminho absoluto evita depender
  // do diretorio de onde o comando Prisma foi chamado.
  const certificado = path
    .resolve(import.meta.dirname, "prisma/supabase-root-2021-ca.crt")
    .replaceAll("\\", "/");
  url.searchParams.set("sslmode", "verify-full");
  url.searchParams.set("sslrootcert", certificado);
  return url.toString();
}

// Gerar o client nao exige banco, entao o datasource e omitido em clones sem
// .env. Comandos de migration continuam exigindo DIRECT_URL/DATABASE_URL.
const urlOriginal = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  ...(urlOriginal ? { datasource: { url: prepararUrlDoCli(urlOriginal) } } : {}),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
});
