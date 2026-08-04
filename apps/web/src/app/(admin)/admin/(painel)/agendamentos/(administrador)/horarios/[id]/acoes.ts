"use server";

import { revalidatePath } from "next/cache";
import { exigirAdministrador } from "@/server/auth/guardas";
import {
  alterarHorarioAgendamento,
  cancelarHorarioAgendamento,
  transicionarHorarioAgendamento,
} from "@/server/agendamentos/horarios";

export interface EstadoGestaoHorario {
  ok?: boolean;
  mensagem?: string;
}

function texto(dados: FormData, campo: string): string {
  const valor = dados.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

function revalidar(horarioId: string) {
  revalidatePath("/");
  revalidatePath("/agendar");
  revalidatePath("/admin/agendamentos");
  revalidatePath(`/admin/agendamentos/horarios/${horarioId}`);
}

export async function gerirHorarioAction(
  _estado: EstadoGestaoHorario,
  dados: FormData,
): Promise<EstadoGestaoHorario> {
  const admin = await exigirAdministrador();
  const horarioId = texto(dados, "horarioId");
  const operacao = texto(dados, "operacao");

  const resultado =
    operacao === "EDITAR"
      ? await alterarHorarioAgendamento(admin.id, horarioId, {
          inicioLocal: texto(dados, "inicioLocal"),
          fimLocal: texto(dados, "fimLocal"),
          capacidade: Number(texto(dados, "capacidade")),
          observacoesInternas: texto(dados, "observacoesInternas"),
          permitirCapacidadeExcedida: dados.get("permitirCapacidadeExcedida") === "on",
        })
      : operacao === "PUBLICAR"
        ? await transicionarHorarioAgendamento(admin.id, horarioId, "ABERTO")
        : operacao === "BLOQUEAR"
          ? await transicionarHorarioAgendamento(admin.id, horarioId, "BLOQUEADO")
          : operacao === "ENCERRAR"
            ? await transicionarHorarioAgendamento(admin.id, horarioId, "ENCERRADO")
            : operacao === "CANCELAR"
              ? await cancelarHorarioAgendamento(admin.id, horarioId, {
                  motivo: texto(dados, "motivo"),
                  forcarComCheckIn: dados.get("forcarComCheckIn") === "on",
                })
              : null;

  if (!resultado) return { ok: false, mensagem: "Operação inválida." };
  if (!resultado.ok) return { ok: false, mensagem: resultado.erro.mensagem };
  revalidar(horarioId);

  const mensagens: Record<string, string> = {
    EDITAR: "Horário atualizado.",
    PUBLICAR: "Horário publicado e aberto para reservas.",
    BLOQUEAR: "Novas reservas foram fechadas para este horário.",
    ENCERRAR: "Horário encerrado.",
    CANCELAR: "Horário e reservas ativas foram cancelados, sem apagar o histórico.",
  };
  return { ok: true, mensagem: mensagens[operacao] ?? "Alteração salva." };
}
