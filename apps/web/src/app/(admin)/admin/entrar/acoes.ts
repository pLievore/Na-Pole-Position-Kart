"use server";

import { redirect } from "next/navigation";
import { autenticarAdmin, criarSessaoAdmin } from "@/server/auth/sessao";

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

  const resultado = await autenticarAdmin(email, senha);
  if (!resultado.ok) return { erro: resultado.erro };

  await criarSessaoAdmin(resultado.usuarioId);
  redirect("/admin");
}
