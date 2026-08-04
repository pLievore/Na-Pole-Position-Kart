import { z } from "zod";

/**
 * Validacao das variaveis de ambiente na inicializacao.
 *
 * Errar o nome de uma variavel derruba o build com mensagem clara, em vez de
 * quebrar em producao com "undefined" no meio de uma query.
 */
const schema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL precisa ser uma URL de conexao valida"),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(10).default(5),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET precisa ter pelo menos 32 caracteres"),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_WHATSAPP: z
    .string()
    .regex(/^\d{10,15}$/, "Use o formato E.164 sem o +")
    .optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const resultado = schema.safeParse(process.env);

if (!resultado.success) {
  const detalhes = resultado.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Variaveis de ambiente invalidas:\n${detalhes}\n\nVeja .env.example na raiz.`);
}

export const env = resultado.data;
