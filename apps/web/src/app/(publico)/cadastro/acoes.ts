"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { sugerirNomeExibicao } from "@napole/core";
import { autenticarECriarSessaoPiloto } from "@/server/auth/sessao";
import { cadastrarPiloto, cadastroSchema } from "@/server/pilotos/cadastro";

export interface EstadoCadastro {
  erros?: Record<string, string>;
  /** Devolvido para o formulario nao perder o que ja foi digitado. */
  valores?: Record<string, string>;
}

/** Campo vazio vira `undefined` para os `.optional()` do schema funcionarem. */
function texto(dados: FormData, campo: string): string | undefined {
  const valor = dados.get(campo);
  if (typeof valor !== "string") return undefined;
  const limpo = valor.trim();
  return limpo === "" ? undefined : limpo;
}

export async function cadastrarAction(
  _estado: EstadoCadastro,
  dados: FormData,
): Promise<EstadoCadastro> {
  const nomeCompleto = texto(dados, "nomeCompleto") ?? "";

  const entrada = {
    nomeCompleto,
    nomeExibicao: texto(dados, "nomeExibicao") ?? sugerirNomeExibicao(nomeCompleto),
    telefone: texto(dados, "telefone") ?? "",
    email: texto(dados, "email") ?? "",
    senha: dados.get("senha") ?? "",
    dataNascimento: texto(dados, "dataNascimento"),
    sexo: texto(dados, "sexo"),
    categoriaBase: texto(dados, "categoriaBase"),
    pesoDeclaradoKg: texto(dados, "pesoDeclaradoKg") ?? "",
    alturaMetros: texto(dados, "alturaMetros"),
    responsavelNome: texto(dados, "responsavelNome"),
    responsavelEmail: texto(dados, "responsavelEmail"),
    responsavelTelefone: texto(dados, "responsavelTelefone"),
    aceiteTermos: dados.get("aceiteTermos") === "on",
  };

  // A senha nunca volta para o formulario.
  const valores: Record<string, string> = {};
  for (const [chave, valor] of Object.entries(entrada)) {
    if (chave !== "senha" && typeof valor === "string") valores[chave] = valor;
  }

  const validacao = cadastroSchema.safeParse(entrada);
  if (!validacao.success) {
    const erros: Record<string, string> = {};
    for (const issue of validacao.error.issues) {
      const campo = String(issue.path[0] ?? "form");
      erros[campo] ??= issue.message;
    }
    return { erros, valores };
  }

  const resultado = await cadastrarPiloto(validacao.data);
  if (!resultado.ok) return { erros: resultado.erros, valores };

  const cabecalhos = await headers();
  const sessao = await autenticarECriarSessaoPiloto(validacao.data.email, validacao.data.senha, {
    userAgent: cabecalhos.get("user-agent"),
    ip: cabecalhos.get("x-forwarded-for"),
  });

  // Se a administracao bloqueou ou corrigiu a credencial no pequeno intervalo
  // depois do cadastro, nao criamos uma sessao com a senha anterior.
  if (!sessao.ok) redirect("/entrar");

  redirect(`/perfil?bemvindo=${resultado.numero}`);
}
