import { CERTIFICADO_CA_SUPABASE } from "./supabase-ca";

/** Configura o pool sem deixar a URL rebaixar a validacao TLS do Supabase. */
export function configurarConexao(connectionString: string) {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("DATABASE_URL precisa ser uma URL de conexao valida.");
  }

  if (!url.hostname.endsWith(".supabase.com")) {
    return { connectionString };
  }

  // O pg deixa parametros SSL da URL sobrescreverem o objeto abaixo. Remover
  // todos os equivalentes conhecidos impede downgrade da verificacao.
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

  return {
    connectionString: url.toString(),
    ssl: {
      ca: CERTIFICADO_CA_SUPABASE,
      rejectUnauthorized: true,
    },
  };
}
