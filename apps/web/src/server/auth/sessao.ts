import "server-only";

import { cookies } from "next/headers";
import { expiracaoSessao, gerarToken, hashToken, verificarSenha } from "@napole/auth";
import { prisma } from "@napole/db";
import { travarPilotoPorId } from "@/server/pilotos/trava";

/**
 * Sessao por cookie httpOnly com token opaco guardado no banco como hash.
 *
 * Escolhemos sessao em banco em vez de JWT porque a operacao precisa poder
 * bloquear um piloto e derrubar o acesso na hora (secao 11). Com JWT, o token
 * continuaria valido ate expirar.
 */

const COOKIE_PILOTO = "napole_piloto";
const COOKIE_ADMIN = "napole_admin";

const OPCOES_COOKIE = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;

// ---------------------------------------------------------------------------
// Piloto
// ---------------------------------------------------------------------------

export interface PilotoLogado {
  id: string;
  numero: number;
  nomeExibicao: string;
  categoria: string;
}

interface ContextoSessaoPiloto {
  userAgent?: string | null;
  ip?: string | null;
}

async function definirCookiePiloto(token: string, expiraEm: Date) {
  const jar = await cookies();
  jar.set(COOKIE_PILOTO, token, { ...OPCOES_COOKIE, expires: expiraEm });
}

/** Piloto da sessao atual, ou null. Sessao expirada ou piloto bloqueado retorna null. */
export async function pilotoAtual(): Promise<PilotoLogado | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_PILOTO)?.value;
  if (!token) return null;

  const sessao = await prisma.sessaoPiloto.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      piloto: {
        select: { id: true, numero: true, nomeExibicao: true, categoria: true, status: true },
      },
    },
  });

  if (!sessao || sessao.expiraEm < new Date()) return null;
  if (sessao.piloto.status !== "ATIVO") return null;

  return {
    id: sessao.piloto.id,
    numero: sessao.piloto.numero,
    nomeExibicao: sessao.piloto.nomeExibicao,
    categoria: sessao.piloto.categoria,
  };
}

export async function encerrarSessaoPiloto() {
  const jar = await cookies();
  const token = jar.get(COOKIE_PILOTO)?.value;

  if (token) {
    await prisma.sessaoPiloto.delete({ where: { tokenHash: hashToken(token) } }).catch(() => {
      // Sessao ja removida; o cookie sai do mesmo jeito.
    });
  }

  jar.delete(COOKIE_PILOTO);
}

/** Hash usado para manter o custo da tentativa quando o e-mail nao existe. */
const HASH_FICTICIO = "scrypt$16384$8$1$00000000000000000000000000000000$" + "0".repeat(128);

export type ResultadoLoginPiloto = { ok: true; pilotoId: string } | { ok: false; erro: string };

/**
 * Autentica e cria a sessao como uma unica operacao logica.
 *
 * O scrypt roda antes da transacao. Depois dele, a linha do piloto e travada e
 * os dados usados na verificacao sao relidos: se senha, e-mail ou status
 * mudaram nesse intervalo, nenhuma sessao nasce com uma credencial antiga.
 */
export async function autenticarECriarSessaoPiloto(
  email: string,
  senha: string,
  contexto?: ContextoSessaoPiloto,
): Promise<ResultadoLoginPiloto> {
  const generico = { ok: false as const, erro: "E-mail ou senha incorretos." };
  const emailNormalizado = email.trim().toLowerCase();

  const piloto = await prisma.piloto.findUnique({
    where: { email: emailNormalizado },
    select: { id: true, email: true, senhaHash: true },
  });

  const confere = await verificarSenha(senha, piloto?.senhaHash ?? HASH_FICTICIO);
  if (!piloto || !confere) return generico;

  const { token, hash } = gerarToken();
  const expiraEm = expiracaoSessao();

  const resultado = await prisma.$transaction(async (tx): Promise<ResultadoLoginPiloto> => {
    if (!(await travarPilotoPorId(tx, piloto.id))) return generico;

    const atual = await tx.piloto.findUnique({
      where: { id: piloto.id },
      select: { id: true, email: true, senhaHash: true, status: true },
    });

    if (
      !atual ||
      atual.email !== emailNormalizado ||
      atual.email !== piloto.email ||
      atual.senhaHash !== piloto.senhaHash
    ) {
      return generico;
    }

    if (atual.status === "BLOQUEADO") {
      return { ok: false, erro: "Cadastro bloqueado. Fale com a equipe da Na Pole Position." };
    }
    if (atual.status !== "ATIVO") return generico;

    await tx.sessaoPiloto.create({
      data: {
        tokenHash: hash,
        pilotoId: atual.id,
        expiraEm,
        userAgent: contexto?.userAgent ?? null,
        ip: contexto?.ip ?? null,
      },
    });

    return { ok: true, pilotoId: atual.id };
  });

  if (!resultado.ok) return resultado;

  await definirCookiePiloto(token, expiraEm);
  return resultado;
}

/**
 * Abre sessao para um piloto ja identificado por outro meio.
 *
 * Usado depois que a pessoa define a senha por convite: naquele ponto ela ja
 * provou que controla o link e acabou de escolher a senha, entao pedir para
 * digitar e-mail e senha em seguida seria atrito sem ganho de seguranca.
 *
 * Nao autentica nada por conta propria — quem chama e responsavel por ter
 * verificado a identidade antes.
 */
export async function criarSessaoPiloto(
  pilotoId: string,
  contexto?: ContextoSessaoPiloto,
): Promise<boolean> {
  const piloto = await prisma.piloto.findUnique({
    where: { id: pilotoId },
    select: { id: true, status: true },
  });
  if (!piloto || piloto.status !== "ATIVO") return false;

  const { token, hash } = gerarToken();
  const expiraEm = expiracaoSessao();

  await prisma.sessaoPiloto.create({
    data: {
      tokenHash: hash,
      pilotoId: piloto.id,
      expiraEm,
      userAgent: contexto?.userAgent ?? null,
      ip: contexto?.ip ?? null,
    },
  });

  await definirCookiePiloto(token, expiraEm);
  return true;
}

// ---------------------------------------------------------------------------
// Administrativo
// ---------------------------------------------------------------------------

export interface AdminLogado {
  id: string;
  nome: string;
  nivel: "ADMINISTRADOR" | "OPERADOR";
}

export async function criarSessaoAdmin(usuarioId: string) {
  const { token, hash } = gerarToken();
  const expiraEm = expiracaoSessao();

  await prisma.sessaoAdmin.create({ data: { tokenHash: hash, usuarioId, expiraEm } });

  const jar = await cookies();
  jar.set(COOKIE_ADMIN, token, { ...OPCOES_COOKIE, expires: expiraEm });
}

export async function adminAtual(): Promise<AdminLogado | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_ADMIN)?.value;
  if (!token) return null;

  const sessao = await prisma.sessaoAdmin.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { usuario: { select: { id: true, nome: true, nivel: true, status: true } } },
  });

  if (!sessao || sessao.expiraEm < new Date()) return null;
  if (sessao.usuario.status !== "ATIVO") return null;

  return { id: sessao.usuario.id, nome: sessao.usuario.nome, nivel: sessao.usuario.nivel };
}

export async function encerrarSessaoAdmin() {
  const jar = await cookies();
  const token = jar.get(COOKIE_ADMIN)?.value;

  if (token) {
    await prisma.sessaoAdmin.delete({ where: { tokenHash: hashToken(token) } }).catch(() => {});
  }

  jar.delete(COOKIE_ADMIN);
}

export async function autenticarAdmin(
  email: string,
  senha: string,
): Promise<{ ok: true; usuarioId: string } | { ok: false; erro: string }> {
  const generico = { ok: false as const, erro: "E-mail ou senha incorretos." };

  const usuario = await prisma.usuarioAdmin.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, senhaHash: true, status: true },
  });

  const confere = await verificarSenha(senha, usuario?.senhaHash ?? HASH_FICTICIO);
  if (!usuario || !confere || usuario.status !== "ATIVO") return generico;

  await prisma.usuarioAdmin.update({
    where: { id: usuario.id },
    data: { ultimoLoginEm: new Date() },
  });

  return { ok: true, usuarioId: usuario.id };
}
