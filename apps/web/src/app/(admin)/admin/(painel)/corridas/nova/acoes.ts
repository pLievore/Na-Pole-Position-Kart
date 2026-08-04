"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/server/auth/guardas";
import { buscarPorNumero, type PilotoEncontrado } from "@/server/pilotos/busca";
import {
  lancarCorrida,
  lancamentoSchema,
  type ResultadoLancamento,
} from "@/server/corridas/lancamento";

export interface EstadoLancamento {
  erros?: Record<string, string>;
  valores?: Record<string, string>;
  sucesso?: ResultadoLancamento;
  /** Preenchido pela busca do numero, para o operador conferir antes de salvar. */
  piloto?: PilotoEncontrado | null;
}

function texto(dados: FormData, campo: string): string | undefined {
  const valor = dados.get(campo);
  if (typeof valor !== "string") return undefined;
  const limpo = valor.trim();
  return limpo === "" ? undefined : limpo;
}

/**
 * Confere o piloto pelo numero antes de salvar.
 *
 * O lancamento e digitado no balcao, com fila esperando: mostrar nome e
 * categoria antes de confirmar evita lancar o tempo na conta de outra pessoa.
 */
export async function conferirPilotoAction(
  _estado: EstadoLancamento,
  dados: FormData,
): Promise<EstadoLancamento> {
  await exigirAdmin();

  const numero = Number(texto(dados, "numeroPiloto"));
  if (!Number.isInteger(numero) || numero <= 0) {
    return { erros: { numeroPiloto: "Informe o numero do piloto." } };
  }

  const piloto = await buscarPorNumero(numero);
  if (!piloto) return { erros: { numeroPiloto: "Nenhum piloto com este numero." } };

  return { piloto };
}

export async function lancarCorridaAction(
  _estado: EstadoLancamento,
  dados: FormData,
): Promise<EstadoLancamento> {
  const operador = await exigirAdmin();

  const entrada = {
    numeroPiloto: texto(dados, "numeroPiloto"),
    data: texto(dados, "data"),
    melhorVolta: texto(dados, "melhorVolta") ?? "",
    kartId: texto(dados, "kartId") ?? "",
    penalidade: texto(dados, "penalidade"),
    motivoPenalidade: texto(dados, "motivoPenalidade"),
    motivoDetalhe: texto(dados, "motivoDetalhe"),
    pontosDesclassificacao: texto(dados, "pontosDesclassificacao"),
    observacao: texto(dados, "observacao"),
  };

  const valores: Record<string, string> = {};
  for (const [chave, valor] of Object.entries(entrada)) {
    if (typeof valor === "string") valores[chave] = valor;
  }

  const validacao = lancamentoSchema.safeParse(entrada);
  if (!validacao.success) {
    const erros: Record<string, string> = {};
    for (const issue of validacao.error.issues) {
      const campo = String(issue.path[0] ?? "form");
      erros[campo] ??= issue.message;
    }
    return { erros, valores };
  }

  const resultado = await lancarCorrida(validacao.data, operador.id);
  if (!resultado.ok) return { erros: resultado.erros, valores };

  // O dashboard e a lista mostram o lancamento novo na proxima visita.
  revalidatePath("/admin");
  revalidatePath("/admin/corridas");

  return { sucesso: resultado.resultado };
}
