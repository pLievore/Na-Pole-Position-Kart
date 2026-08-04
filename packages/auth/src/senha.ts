import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";
import { promisify } from "node:util";

// `promisify` nao consegue escolher entre as sobrecargas de `scrypt`; o tipo
// abaixo fixa a versao que recebe options.
const scryptAsync = promisify(scrypt) as (
  senha: string,
  salt: Buffer,
  tamanhoChave: number,
  opcoes: ScryptOptions,
) => Promise<Buffer>;

/**
 * Hash de senha com scrypt (stdlib do Node, sem dependencia nativa).
 *
 * Formato guardado no banco: `scrypt$N$r$p$<salt-hex>$<hash-hex>`.
 * Os parametros ficam dentro do proprio hash para que senhas antigas
 * continuem validando depois de um aumento de custo.
 */
const PARAMETROS = { N: 16_384, r: 8, p: 1, tamanhoChave: 64, tamanhoSalt: 16 };

export async function gerarHashSenha(senha: string): Promise<string> {
  const salt = randomBytes(PARAMETROS.tamanhoSalt);
  const derivada = await scryptAsync(senha.normalize("NFKC"), salt, PARAMETROS.tamanhoChave, {
    N: PARAMETROS.N,
    r: PARAMETROS.r,
    p: PARAMETROS.p,
  });

  return [
    "scrypt",
    PARAMETROS.N,
    PARAMETROS.r,
    PARAMETROS.p,
    salt.toString("hex"),
    derivada.toString("hex"),
  ].join("$");
}

export async function verificarSenha(senha: string, hashGuardado: string): Promise<boolean> {
  const partes = hashGuardado.split("$");
  if (partes.length !== 6 || partes[0] !== "scrypt") return false;

  const [, n, r, p, saltHex, hashHex] = partes as [string, string, string, string, string, string];

  const esperado = Buffer.from(hashHex, "hex");
  const derivada = await scryptAsync(
    senha.normalize("NFKC"),
    Buffer.from(saltHex, "hex"),
    esperado.length,
    { N: Number(n), r: Number(r), p: Number(p) },
  );

  // Comparacao em tempo constante: evita descobrir a senha medindo o tempo de resposta.
  return derivada.length === esperado.length && timingSafeEqual(derivada, esperado);
}

/** Regras de senha compartilhadas pelo cadastro e pela redefinicao. */
export const SENHA_TAMANHO_MINIMO = 8;
export const SENHA_TAMANHO_MAXIMO = 128;

export function validarForcaSenha(senha: string): { valida: boolean; motivo?: string } {
  if (senha.length < SENHA_TAMANHO_MINIMO) {
    return {
      valida: false,
      motivo: `A senha precisa ter pelo menos ${SENHA_TAMANHO_MINIMO} caracteres.`,
    };
  }
  if (senha.length > SENHA_TAMANHO_MAXIMO) {
    return {
      valida: false,
      motivo: `A senha precisa ter no maximo ${SENHA_TAMANHO_MAXIMO} caracteres.`,
    };
  }
  if (!/[a-zA-Z]/.test(senha) || !/\d/.test(senha)) {
    return { valida: false, motivo: "A senha precisa ter letras e numeros." };
  }
  return { valida: true };
}
