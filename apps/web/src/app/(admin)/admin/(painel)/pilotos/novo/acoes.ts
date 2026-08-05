"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/server/auth/guardas";
import {
  cadastrarPilotoNoBalcao,
  cadastroBalcaoSchema,
  type PilotoCriadoNoBalcao,
} from "@/server/pilotos/balcao";
import { vincularPilotoAoParticipante } from "@/server/agendamentos";
import { env } from "@/env";

export interface EstadoCadastroBalcao {
  erros?: Record<string, string>;
  valores?: Record<string, string>;
  sucesso?: PilotoCriadoNoBalcao & { vinculadoAoParticipante: boolean };
}

function texto(dados: FormData, campo: string): string | undefined {
  const valor = dados.get(campo);
  if (typeof valor !== "string") return undefined;
  const limpo = valor.trim();
  return limpo === "" ? undefined : limpo;
}

export async function cadastrarNoBalcaoAction(
  _estado: EstadoCadastroBalcao,
  dados: FormData,
): Promise<EstadoCadastroBalcao> {
  const operador = await exigirAdmin();

  const entrada = {
    nomeCompleto: texto(dados, "nomeCompleto") ?? "",
    nomeExibicao: texto(dados, "nomeExibicao"),
    telefone: texto(dados, "telefone") ?? "",
    email: texto(dados, "email"),
    dataNascimento: texto(dados, "dataNascimento"),
    sexo: texto(dados, "sexo"),
    categoriaBase: texto(dados, "categoriaBase"),
    pesoAferidoKg: texto(dados, "pesoAferidoKg") ?? "",
    alturaMetros: texto(dados, "alturaMetros"),
    responsavelNome: texto(dados, "responsavelNome"),
    responsavelTelefone: texto(dados, "responsavelTelefone"),
    responsavelEmail: texto(dados, "responsavelEmail"),
    observacoesInternas: texto(dados, "observacoesInternas"),
    aceiteTermos: dados.get("aceiteTermos") === "on",
  };

  const valores: Record<string, string> = {};
  for (const [chave, valor] of Object.entries(entrada)) {
    if (typeof valor === "string") valores[chave] = valor;
  }

  const validacao = cadastroBalcaoSchema.safeParse(entrada);
  if (!validacao.success) {
    const erros: Record<string, string> = {};
    for (const issue of validacao.error.issues) {
      const campo = String(issue.path[0] ?? "form");
      erros[campo] ??= issue.message;
    }
    return { erros, valores };
  }

  const resultado = await cadastrarPilotoNoBalcao(
    operador.id,
    validacao.data,
    env.NEXT_PUBLIC_SITE_URL,
  );
  if (!resultado.ok) return { erros: resultado.erros, valores };

  // Quando o cadastro nasceu de um check-in, ja devolve o piloto vinculado ao
  // participante — evita o operador ter que procurar o numero que acabou de criar.
  const participanteId = texto(dados, "participanteId");
  let vinculadoAoParticipante = false;
  if (participanteId) {
    const vinculo = await vincularPilotoAoParticipante(
      operador.id,
      participanteId,
      resultado.piloto.pilotoId,
    );
    vinculadoAoParticipante = vinculo.ok;
    revalidatePath("/admin/agendamentos");
  }

  revalidatePath("/admin/pilotos");

  return { sucesso: { ...resultado.piloto, vinculadoAoParticipante } };
}
