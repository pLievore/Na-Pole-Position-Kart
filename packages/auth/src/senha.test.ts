import { describe, expect, it } from "vitest";
import { gerarHashSenha, validarForcaSenha, verificarSenha } from "./senha";
import { gerarToken, hashToken } from "./token";

describe("hash de senha", () => {
  it("valida a senha correta", async () => {
    const hash = await gerarHashSenha("kart2026");
    expect(await verificarSenha("kart2026", hash)).toBe(true);
  });

  it("rejeita a senha errada", async () => {
    const hash = await gerarHashSenha("kart2026");
    expect(await verificarSenha("kart2027", hash)).toBe(false);
  });

  it("gera hashes diferentes para a mesma senha", async () => {
    expect(await gerarHashSenha("kart2026")).not.toBe(await gerarHashSenha("kart2026"));
  });

  it("nao quebra com hash malformado", async () => {
    expect(await verificarSenha("kart2026", "lixo")).toBe(false);
    expect(await verificarSenha("kart2026", "")).toBe(false);
  });
});

describe("validarForcaSenha", () => {
  it("exige tamanho minimo e letras com numeros", () => {
    expect(validarForcaSenha("abc1").valida).toBe(false);
    expect(validarForcaSenha("somenteletras").valida).toBe(false);
    expect(validarForcaSenha("12345678").valida).toBe(false);
    expect(validarForcaSenha("kart2026").valida).toBe(true);
  });

  it("limita a senha a 128 caracteres", () => {
    expect(validarForcaSenha(`${"a".repeat(127)}1`).valida).toBe(true);
    expect(validarForcaSenha(`${"a".repeat(128)}1`).valida).toBe(false);
  });
});

describe("tokens", () => {
  it("gera token e hash correspondentes", () => {
    const { token, hash } = gerarToken();
    expect(hashToken(token)).toBe(hash);
    expect(token).not.toBe(hash);
  });

  it("nao repete tokens", () => {
    expect(gerarToken().token).not.toBe(gerarToken().token);
  });
});
