"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/server/auth/guardas";
import {
  atualizarObservacoesInternasAgendamento,
  cancelarAgendamento,
  concluirAgendamento,
  confirmarAgendamento,
  obterAgendamentoAdministrativo,
  realizarCheckInParticipante,
  registrarAusenciaParticipante,
  registrarNaoComparecimentoAgendamento,
  vincularPilotoAoParticipante,
} from "@/server/agendamentos";
import { buscarPilotos, buscarPorNumero } from "@/server/pilotos/busca";

export interface EstadoOperacaoAgenda {
  ok?: boolean;
  mensagem?: string;
}

export interface EstadoBuscaPilotoAgenda {
  mensagem?: string;
  resultados?: Array<{
    numero: number;
    numeroFormatado: string;
    nomeCompleto: string;
    nomeExibicao: string;
    nomeDaCategoria: string;
    status: string;
  }>;
}

function texto(dados: FormData, campo: string): string {
  const valor = dados.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

function atualizarTelas(agendamentoId: string) {
  revalidatePath("/");
  revalidatePath("/agendar");
  revalidatePath("/admin");
  revalidatePath("/admin/agendamentos");
  revalidatePath(`/admin/agendamentos/${agendamentoId}`);
}

export async function operarAgendamentoAction(
  _estado: EstadoOperacaoAgenda,
  dados: FormData,
): Promise<EstadoOperacaoAgenda> {
  const admin = await exigirAdmin();
  const agendamentoId = texto(dados, "agendamentoId");
  const operacao = texto(dados, "operacao");

  const resultado =
    operacao === "CONFIRMAR"
      ? await confirmarAgendamento(admin.id, agendamentoId)
      : operacao === "CANCELAR"
        ? await cancelarAgendamento(admin.id, agendamentoId, {
            motivo: texto(dados, "motivo"),
            forcarComCheckIn:
              admin.nivel === "ADMINISTRADOR" && dados.get("forcarComCheckIn") === "on",
          })
        : operacao === "NAO_COMPARECEU"
          ? await registrarNaoComparecimentoAgendamento(admin.id, agendamentoId)
          : operacao === "CONCLUIR"
            ? await concluirAgendamento(admin.id, agendamentoId)
            : operacao === "SALVAR_OBSERVACOES"
              ? await atualizarObservacoesInternasAgendamento(
                  admin.id,
                  agendamentoId,
                  texto(dados, "observacoesInternas"),
                )
              : null;

  if (!resultado) return { ok: false, mensagem: "Operação inválida." };
  if (!resultado.ok) return { ok: false, mensagem: resultado.erro.mensagem };

  atualizarTelas(agendamentoId);
  const mensagens: Record<string, string> = {
    CONFIRMAR: "Reserva confirmada.",
    CANCELAR: "Reserva cancelada e mantida no histórico.",
    NAO_COMPARECEU: "Não comparecimento registrado.",
    CONCLUIR: "Bateria concluída para este agendamento.",
    SALVAR_OBSERVACOES: "Observações internas atualizadas.",
  };
  return { ok: true, mensagem: mensagens[operacao] ?? "Alteração salva." };
}

export async function operarParticipanteAction(
  _estado: EstadoOperacaoAgenda,
  dados: FormData,
): Promise<EstadoOperacaoAgenda> {
  const admin = await exigirAdmin();
  const agendamentoId = texto(dados, "agendamentoId");
  const participanteId = texto(dados, "participanteId");
  const operacao = texto(dados, "operacao");

  if (operacao === "AUSENTE") {
    const resultado = await registrarAusenciaParticipante(admin.id, participanteId);
    if (!resultado.ok) return { ok: false, mensagem: resultado.erro.mensagem };
    atualizarTelas(agendamentoId);
    return { ok: true, mensagem: "Ausência registrada." };
  }

  const detalhe = await obterAgendamentoAdministrativo(admin.id, agendamentoId);
  if (!detalhe.ok) return { ok: false, mensagem: detalhe.erro.mensagem };
  const participante = detalhe.valor.participantes.find((item) => item.id === participanteId);
  if (!participante) return { ok: false, mensagem: "Participante não encontrado." };

  let pilotoId = participante.piloto?.id ?? null;
  const numeroInformado = texto(dados, "numeroPiloto");
  if (numeroInformado) {
    const numero = Number(numeroInformado.replace(/\D/g, ""));
    const piloto = await buscarPorNumero(numero);
    if (!piloto || piloto.status !== "ATIVO") {
      return { ok: false, mensagem: "Informe o número de um piloto ativo." };
    }
    pilotoId = piloto.id;
  }

  if (!pilotoId) {
    return {
      ok: false,
      mensagem: "Cadastre o piloto no check-in ou informe um número já existente.",
    };
  }

  const resultado =
    operacao === "VINCULAR"
      ? await vincularPilotoAoParticipante(admin.id, participanteId, pilotoId)
      : operacao === "CHECK_IN"
        ? await realizarCheckInParticipante(admin.id, participanteId, { pilotoId })
        : null;

  if (!resultado) return { ok: false, mensagem: "Operação inválida." };
  if (!resultado.ok) return { ok: false, mensagem: resultado.erro.mensagem };

  atualizarTelas(agendamentoId);
  return {
    ok: true,
    mensagem: operacao === "CHECK_IN" ? "Check-in realizado." : "Piloto vinculado.",
  };
}

export async function buscarPilotoParaAgendaAction(
  _estado: EstadoBuscaPilotoAgenda,
  dados: FormData,
): Promise<EstadoBuscaPilotoAgenda> {
  await exigirAdmin();
  const termo = texto(dados, "termo");
  if (termo.length < 2) return { mensagem: "Digite ao menos 2 caracteres para buscar." };

  const resultados = await buscarPilotos(termo, 8);
  if (resultados.length === 0) return { mensagem: "Nenhum piloto encontrado." };
  return {
    resultados: resultados.map((piloto) => ({
      numero: piloto.numero,
      numeroFormatado: piloto.numeroFormatado,
      nomeCompleto: piloto.nomeCompleto,
      nomeExibicao: piloto.nomeExibicao,
      nomeDaCategoria: piloto.nomeDaCategoria,
      status: piloto.status,
    })),
  };
}
