import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { configurarConexao } from "./conexao";
import { CERTIFICADO_CA_SUPABASE } from "./supabase-ca";

describe("configurarConexao", () => {
  it("mantem a CA do runtime igual a usada pelo Prisma CLI", () => {
    const certificadoDoCli = readFileSync(
      new URL("../prisma/supabase-root-2021-ca.crt", import.meta.url),
      "utf8",
    ).trim();

    assert.equal(CERTIFICADO_CA_SUPABASE.trim(), certificadoDoCli);
  });

  it("mantem conexoes fora do Supabase sem impor uma CA especifica", () => {
    const connectionString = "postgresql://usuario:senha@localhost:5432/banco";

    assert.deepEqual(configurarConexao(connectionString), { connectionString });
  });

  it("impoe CA e validacao de hostname no Supabase", () => {
    const configuracao = configurarConexao(
      "postgresql://usuario:senha@pooler.supabase.com:6543/postgres?pgbouncer=true",
    );

    assert.deepEqual(configuracao.ssl, {
      ca: CERTIFICADO_CA_SUPABASE,
      rejectUnauthorized: true,
    });
  });

  it("remove parametros capazes de rebaixar ou substituir a configuracao TLS", () => {
    const configuracao = configurarConexao(
      "postgresql://usuario:senha@pooler.supabase.com:6543/postgres" +
        "?ssl=0&sslmode=no-verify&sslaccept=accept_invalid_certs" +
        "&sslcert=cliente.crt&sslidentity=identidade.p12&sslkey=cliente.key" +
        "&sslpassword=segredo&sslrootcert=outra-ca.crt&pgbouncer=true",
    );
    const url = new URL(configuracao.connectionString);

    assert.deepEqual([...url.searchParams.keys()], ["pgbouncer"]);
    assert.equal(url.searchParams.get("pgbouncer"), "true");
    assert.equal(configuracao.ssl?.rejectUnauthorized, true);
  });

  it("nao confunde um dominio malicioso com o dominio do Supabase", () => {
    const connectionString =
      "postgresql://usuario:senha@pooler.supabase.com.exemplo.test:6543/postgres?ssl=0";

    assert.deepEqual(configurarConexao(connectionString), { connectionString });
  });

  it("rejeita URL malformada sem repetir credenciais na mensagem", () => {
    assert.throws(
      () => configurarConexao("nao e uma url"),
      new Error("DATABASE_URL precisa ser uma URL de conexao valida."),
    );
  });
});
