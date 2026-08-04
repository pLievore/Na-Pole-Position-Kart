"use server";

import { revalidatePath } from "next/cache";
import { exigirAdministrador } from "@/server/auth/guardas";
import {
  criarHorariosEmLote,
  criarHorariosPadraoEmLote,
} from "@/server/agendamentos/horarios";

export interface EstadoCriacaoHorarios {
  mensagem?: string;
  erro?: string;
  valores?: Record<string, string>;
}

function texto(dados: FormData, campo: string): string {
  const valor = dados.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

function numeroInteiro(dados: FormData, campo: string): number {
  const valor = Number(texto(dados, campo));
  return Number.isSafeInteger(valor) ? valor : Number.NaN;
}

function atualizarAgenda() {
  revalidatePath("/");
  revalidatePath("/agendar");
  revalidatePath("/admin");
  revalidatePath("/admin/agendamentos");
}

export async function gerarHorariosPadraoAction(
  _estado: EstadoCriacaoHorarios,
  dados: FormData,
): Promise<EstadoCriacaoHorarios> {
  const admin = await exigirAdministrador();
  const dataInicial = texto(dados, "dataInicial");
  const dataFinal = texto(dados, "dataFinal");
  const publicar = dados.get("publicar") === "on";
  const valores = { dataInicial, dataFinal, publicar: String(publicar) };

  const resultado = await criarHorariosPadraoEmLote(admin.id, {
    dataInicial,
    dataFinal,
    publicar,
    ignorarDuplicadosExatos: true,
  });

  if (!resultado.ok) return { erro: resultado.erro.mensagem, valores };

  atualizarAgenda();
  const { criados, ignorados } = resultado.valor;
  return {
    mensagem: `${criados.length} horário(s) criado(s)${
      ignorados.length > 0 ? `; ${ignorados.length} já existia(m)` : ""
    }.`,
    valores,
  };
}

export async function criarHorarioManualAction(
  _estado: EstadoCriacaoHorarios,
  dados: FormData,
): Promise<EstadoCriacaoHorarios> {
  const admin = await exigirAdministrador();
  const inicioLocal = texto(dados, "inicioLocal");
  const fimLocal = texto(dados, "fimLocal");
  const capacidadeTexto = texto(dados, "capacidade");
  const observacoesInternas = texto(dados, "observacoesInternas");
  const publicar = dados.get("publicar") === "on";
  const valores = {
    inicioLocal,
    fimLocal,
    capacidade: capacidadeTexto,
    observacoesInternas,
    publicar: String(publicar),
  };

  const resultado = await criarHorariosEmLote(admin.id, {
    horarios: [
      {
        inicioLocal,
        fimLocal,
        capacidade: numeroInteiro(dados, "capacidade"),
        observacoesInternas,
      },
    ],
    publicar,
    ignorarDuplicadosExatos: false,
  });

  if (!resultado.ok) return { erro: resultado.erro.mensagem, valores };

  atualizarAgenda();
  return { mensagem: "Horário criado com sucesso.", valores };
}
