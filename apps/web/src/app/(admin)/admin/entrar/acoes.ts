"use server";

import { redirect } from "next/navigation";
import { autenticarAdmin, criarSessaoAdmin } from "@/server/auth/sessao";
import {
  consumirLimite,
  limparLimite,
  origemDaRequisicao,
} from "@/server/seguranca/limite-taxa";

export interface EstadoLoginAdmin {
  erro?: string;
}

export async function entrarAdminAction(
  _estado: EstadoLoginAdmin,
  dados: FormData,
): Promise<EstadoLoginAdmin> {
  const email = String(dados.get("email") ?? "");
  const senha = String(dados.get("senha") ?? "");

  if (!email || !senha) return { erro: "Preencha e-mail e senha." };

  // O painel vale mais que a area do piloto: quem entra aqui edita tempo,
  // categoria e penalidade de qualquer pessoa. Mesmo limite, prioridade maior.
  const origem = await origemDaRequisicao();

  const limitePorOrigem = await consumirLimite("LOGIN_POR_IP", origem);
  if (!limitePorOrigem.permitido) return { erro: limitePorOrigem.mensagem };

  const limitePorConta = await consumirLimite("LOGIN_POR_IDENTIFICADOR", `admin:${email}`);
  if (!limitePorConta.permitido) return { erro: limitePorConta.mensagem };

  const resultado = await autenticarAdmin(email, senha);
  if (!resultado.ok) return { erro: resultado.erro };

  await limparLimite("LOGIN_POR_IDENTIFICADOR", `admin:${email}`);

  await criarSessaoAdmin(resultado.usuarioId);
  redirect("/admin");
}
