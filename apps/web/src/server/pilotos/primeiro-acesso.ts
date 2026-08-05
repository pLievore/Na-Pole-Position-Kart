import "server-only";

import { z } from "zod";
import { gerarHashSenha, hashToken, validarForcaSenha } from "@napole/auth";
import { prisma } from "@napole/db";
import { registrarAuditoria } from "@/server/auditoria/registrar";
import { travarPilotoPorId } from "@/server/pilotos/trava";

/**
 * Definicao de senha por convite (primeiro acesso ou recuperacao).
 *
 * O token chega pela URL e so existe em claro nas maos do piloto: o banco
 * guarda apenas o SHA-256. Consumir o convite marca `usadoEm`, entao um link
 * vazado depois de usado nao serve para nada.
 */

export const definirSenhaSchema = z
  .object({
    novaSenha: z.string().superRefine((senha, ctx) => {
      const resultado = validarForcaSenha(senha);
      if (!resultado.valida) {
        ctx.addIssue({ code: "custom", message: resultado.motivo ?? "Senha invalida" });
      }
    }),
    confirmacaoSenha: z.string(),
  })
  .refine((dados) => dados.novaSenha === dados.confirmacaoSenha, {
    path: ["confirmacaoSenha"],
    message: "As senhas nao conferem.",
  });

export type DadosDefinirSenha = z.infer<typeof definirSenhaSchema>;

export interface ConviteValido {
  pilotoId: string;
  nomeExibicao: string;
  numero: number;
  primeiroAcesso: boolean;
}

/**
 * Confere o convite sem consumi-lo, para a pagina decidir o que mostrar.
 * Retorna `null` para token inexistente, expirado ou ja usado — a tela nao
 * distingue os casos, para nao virar um oraculo sobre tokens alheios.
 */
export async function conferirConvite(token: string): Promise<ConviteValido | null> {
  const registro = await prisma.tokenSenha.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      expiraEm: true,
      usadoEm: true,
      finalidade: true,
      piloto: { select: { id: true, nomeExibicao: true, numero: true, status: true } },
    },
  });

  if (!registro || registro.usadoEm || registro.expiraEm < new Date()) return null;
  if (registro.piloto.status !== "ATIVO") return null;

  return {
    pilotoId: registro.piloto.id,
    nomeExibicao: registro.piloto.nomeExibicao,
    numero: registro.piloto.numero,
    primeiroAcesso: registro.finalidade === "PRIMEIRO_ACESSO",
  };
}

export type ResultadoDefinirSenha =
  | { ok: true; pilotoId: string }
  | { ok: false; erro: string };

/**
 * Consome o convite e grava a senha.
 *
 * A validade e reconferida DENTRO da transacao, com a linha travada: sem isso,
 * dois envios simultaneos do mesmo link poderiam usar o convite duas vezes.
 */
export async function definirSenhaComConvite(
  token: string,
  dados: DadosDefinirSenha,
): Promise<ResultadoDefinirSenha> {
  // scrypt e caro; calcular fora da transacao evita segurar lock durante o hash.
  const senhaHash = await gerarHashSenha(dados.novaSenha);
  const agora = new Date();
  const tokenHash = hashToken(token);

  return prisma.$transaction(async (tx) => {
    const registro = await tx.tokenSenha.findUnique({
      where: { tokenHash },
      select: { id: true, pilotoId: true, expiraEm: true, usadoEm: true, finalidade: true },
    });

    const invalido = {
      ok: false as const,
      erro: "Este link não é mais válido. Peça um novo à equipe da Na Pole Position.",
    };

    if (!registro || registro.usadoEm || registro.expiraEm < agora) return invalido;
    if (!(await travarPilotoPorId(tx, registro.pilotoId))) return invalido;

    const piloto = await tx.piloto.findUnique({
      where: { id: registro.pilotoId },
      select: { id: true, status: true },
    });
    if (!piloto || piloto.status !== "ATIVO") return invalido;

    // Releitura sob trava: se outra requisicao consumiu o convite no meio, para aqui.
    const aindaValido = await tx.tokenSenha.findUnique({
      where: { id: registro.id },
      select: { usadoEm: true },
    });
    if (aindaValido?.usadoEm) return invalido;

    await tx.tokenSenha.update({ where: { id: registro.id }, data: { usadoEm: agora } });
    await tx.piloto.update({ where: { id: piloto.id }, data: { senhaHash } });

    // Convites pendentes perdem a validade, e sessoes antigas caem: quem define
    // uma senha nova espera que acessos anteriores deixem de valer.
    await tx.tokenSenha.updateMany({
      where: { pilotoId: piloto.id, usadoEm: null },
      data: { usadoEm: agora },
    });
    await tx.sessaoPiloto.deleteMany({ where: { pilotoId: piloto.id } });

    await registrarAuditoria(tx, {
      usuarioId: null,
      entidade: "Piloto",
      entidadeId: piloto.id,
      acao: "EDITAR",
      depois: {
        senhaDefinidaPeloProprioPiloto: true,
        finalidade: registro.finalidade,
      },
    });

    return { ok: true as const, pilotoId: piloto.id };
  });
}
