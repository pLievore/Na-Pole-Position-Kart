"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { autenticarECriarSessaoPiloto } from "@/server/auth/sessao";

export interface EstadoLogin {
  erro?: string;
}

export async function entrarAction(_estado: EstadoLogin, dados: FormData): Promise<EstadoLogin> {
  const email = String(dados.get("email") ?? "");
  const senha = String(dados.get("senha") ?? "");

  if (!email || !senha) return { erro: "Preencha e-mail e senha." };

  const cabecalhos = await headers();
  const resultado = await autenticarECriarSessaoPiloto(email, senha, {
    userAgent: cabecalhos.get("user-agent"),
    ip: cabecalhos.get("x-forwarded-for"),
  });
  if (!resultado.ok) return { erro: resultado.erro };

  redirect("/perfil");
}
