"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { criarSessaoPiloto } from "@/server/auth/sessao";
import { definirSenhaComConvite, definirSenhaSchema } from "@/server/pilotos/primeiro-acesso";
import { consumirLimite, origemDaRequisicao } from "@/server/seguranca/limite-taxa";

export interface EstadoDefinirSenha {
  erro?: string;
  erros?: Record<string, string>;
}

export async function definirSenhaAction(
  _estado: EstadoDefinirSenha,
  dados: FormData,
): Promise<EstadoDefinirSenha> {
  const token = String(dados.get("token") ?? "");
  if (!token) return { erro: "Link inválido." };

  // O token e forte, mas a rota e publica: sem limite ela vira um alvo barato.
  const limite = await consumirLimite("LOGIN_POR_IP", await origemDaRequisicao());
  if (!limite.permitido) return { erro: limite.mensagem };

  const validacao = definirSenhaSchema.safeParse({
    novaSenha: String(dados.get("novaSenha") ?? ""),
    confirmacaoSenha: String(dados.get("confirmacaoSenha") ?? ""),
  });

  if (!validacao.success) {
    const erros: Record<string, string> = {};
    for (const issue of validacao.error.issues) {
      const campo = String(issue.path[0] ?? "form");
      erros[campo] ??= issue.message;
    }
    return { erros };
  }

  const resultado = await definirSenhaComConvite(token, validacao.data);
  if (!resultado.ok) return { erro: resultado.erro };

  // Ja entra logado: a pessoa acabou de provar que controla o link e escolheu a
  // senha; pedir para digitar tudo de novo seria atrito sem ganho.
  const cabecalhos = await headers();
  await criarSessaoPiloto(resultado.pilotoId, {
    userAgent: cabecalhos.get("user-agent"),
    ip: cabecalhos.get("x-forwarded-for"),
  });

  redirect("/perfil");
}
