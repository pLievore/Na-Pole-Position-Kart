import "server-only";

import { gerarHashSenha, validarForcaSenha } from "@napole/auth";
import { prisma } from "@napole/db";
import { z } from "zod";
import { registrarAuditoria } from "@/server/auditoria/registrar";
import { travarPilotoPorId } from "@/server/pilotos/trava";

export const resetSenhaSchema = z
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

export type DadosResetSenha = z.infer<typeof resetSenhaSchema>;

export type ResultadoResetSenha = { ok: true } | { ok: false; erro: string };

/**
 * Redefine a senha do piloto e encerra qualquer acesso concedido anteriormente.
 *
 * O hash e calculado antes da transacao para que o custo do scrypt nao mantenha
 * uma conexao e locks do banco ocupados. Nem a senha nem o hash entram na trilha
 * de auditoria.
 */
export async function resetarSenhaPiloto(
  pilotoId: string,
  dados: DadosResetSenha,
  administradorId: string,
): Promise<ResultadoResetSenha> {
  const senhaHash = await gerarHashSenha(dados.novaSenha);
  const agora = new Date();

  const pilotoEncontrado = await prisma.$transaction(async (tx) => {
    if (!(await travarPilotoPorId(tx, pilotoId))) return false;

    const piloto = await tx.piloto.findUnique({
      where: { id: pilotoId },
      select: { id: true },
    });

    if (!piloto) return false;

    await tx.piloto.update({
      where: { id: piloto.id },
      data: { senhaHash },
    });

    const sessoes = await tx.sessaoPiloto.deleteMany({
      where: { pilotoId: piloto.id },
    });

    const tokens = await tx.tokenSenha.updateMany({
      where: { pilotoId: piloto.id, usadoEm: null },
      data: { usadoEm: agora },
    });

    await registrarAuditoria(tx, {
      usuarioId: administradorId,
      entidade: "Piloto",
      entidadeId: piloto.id,
      acao: "RESETAR_SENHA",
      depois: {
        senhaRedefinida: true,
        sessoesRevogadas: sessoes.count,
        tokensRevogados: tokens.count,
      },
    });

    return true;
  });

  if (!pilotoEncontrado) {
    return { ok: false, erro: "Piloto nao encontrado." };
  }

  return { ok: true };
}
