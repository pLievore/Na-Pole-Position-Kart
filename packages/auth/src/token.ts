import { createHash, randomBytes } from "node:crypto";

/**
 * Tokens de sessao e de recuperacao de senha.
 *
 * O banco guarda apenas o SHA-256 do token. Se a base vazar, os tokens
 * armazenados nao servem para entrar em conta nenhuma.
 */
export interface TokenGerado {
  /** Vai para o cookie / link de e-mail. Nunca e persistido. */
  token: string;
  /** Vai para a coluna `tokenHash`. */
  hash: string;
}

export function gerarToken(bytes = 32): TokenGerado {
  const token = randomBytes(bytes).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const DURACAO_SESSAO_DIAS = 30;
export const DURACAO_TOKEN_SENHA_MINUTOS = 30;

export function expiracaoSessao(agora: Date = new Date()): Date {
  return new Date(agora.getTime() + DURACAO_SESSAO_DIAS * 24 * 60 * 60 * 1000);
}

export function expiracaoTokenSenha(agora: Date = new Date()): Date {
  return new Date(agora.getTime() + DURACAO_TOKEN_SENHA_MINUTOS * 60 * 1000);
}
