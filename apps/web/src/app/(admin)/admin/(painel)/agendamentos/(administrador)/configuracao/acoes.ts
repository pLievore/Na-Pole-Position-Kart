"use server";

import { revalidatePath } from "next/cache";
import {
  FUSO_HORARIO_OPERACIONAL,
  type ConfiguracaoPadroesAgendamento,
  type DiaSemanaAgendamento,
} from "@napole/core";
import { atualizarConfiguracaoPadroesAgendamento } from "@/server/agendamentos";
import { exigirAdministrador } from "@/server/auth/guardas";

const DIAS: readonly DiaSemanaAgendamento[] = [1, 2, 3, 4, 5, 6, 0];

export interface EstadoConfiguracaoAgenda {
  mensagem?: string;
  erro?: string;
}

export async function salvarConfiguracaoAgendaAction(
  _estado: EstadoConfiguracaoAgenda,
  dados: FormData,
): Promise<EstadoConfiguracaoAgenda> {
  const administrador = await exigirAdministrador();
  const faixas = DIAS.filter((dia) => dados.get(`ativo_${dia}`) === "on").map((dia) => ({
    diasSemana: [dia],
    horaInicio: texto(dados, `inicio_${dia}`),
    horaFim: texto(dados, `fim_${dia}`),
  }));

  const configuracao: ConfiguracaoPadroesAgendamento = {
    fusoHorario: FUSO_HORARIO_OPERACIONAL,
    faixas,
    intervaloEntreIniciosMinutos: inteiro(dados, "intervaloEntreIniciosMinutos"),
    duracaoMinutos: inteiro(dados, "duracaoMinutos"),
    capacidade: inteiro(dados, "capacidade"),
    antecedenciaMinimaMinutos: inteiro(dados, "antecedenciaMinimaMinutos"),
    chegadaAntecedenciaMinutos: inteiro(dados, "chegadaAntecedenciaMinutos"),
    pendenciaHoras: inteiro(dados, "pendenciaHoras"),
  };

  const resultado = await atualizarConfiguracaoPadroesAgendamento(
    administrador.id,
    configuracao,
  );
  if (!resultado.ok) return { erro: resultado.erro.mensagem };

  revalidatePath("/");
  revalidatePath("/agendar");
  revalidatePath("/admin");
  revalidatePath("/admin/agendamentos");
  revalidatePath("/admin/agendamentos/configuracao");
  return { mensagem: "Padrões da agenda atualizados. Horários já criados não foram alterados." };
}

function texto(dados: FormData, campo: string): string {
  const valor = dados.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

function inteiro(dados: FormData, campo: string): number {
  const valor = Number(texto(dados, campo));
  return Number.isSafeInteger(valor) ? valor : Number.NaN;
}
