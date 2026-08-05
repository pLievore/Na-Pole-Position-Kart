"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { autenticarECriarSessaoPiloto } from "@/server/auth/sessao";
import {
  consumirLimite,
  limparLimite,
  origemDaRequisicao,
} from "@/server/seguranca/limite-taxa";

export interface EstadoLogin {
  erro?: string;
}

export async function entrarAction(_estado: EstadoLogin, dados: FormData): Promise<EstadoLogin> {
  const email = String(dados.get("email") ?? "");
  const senha = String(dados.get("senha") ?? "");

  if (!email || !senha) return { erro: "Preencha e-mail e senha." };

  /**
   * Dois limites com alvos diferentes: por origem, contra quem varre muitas
   * contas de um lugar so; por e-mail, contra quem martela a senha de uma conta
   * especifica a partir de varios lugares.
   */
  const origem = await origemDaRequisicao();

  const limitePorOrigem = await consumirLimite("LOGIN_POR_IP", origem);
  if (!limitePorOrigem.permitido) return { erro: limitePorOrigem.mensagem };

  const limitePorConta = await consumirLimite("LOGIN_POR_IDENTIFICADOR", email);
  if (!limitePorConta.permitido) return { erro: limitePorConta.mensagem };

  const cabecalhos = await headers();
  const resultado = await autenticarECriarSessaoPiloto(email, senha, {
    userAgent: cabecalhos.get("user-agent"),
    ip: cabecalhos.get("x-forwarded-for"),
  });
  if (!resultado.ok) return { erro: resultado.erro };

  // Acertou a senha: nao e um atacante, e a cota nao pode atrapalhar o proximo
  // acesso legitimo de casa.
  await limparLimite("LOGIN_POR_IDENTIFICADOR", email);

  redirect("/perfil");
}
