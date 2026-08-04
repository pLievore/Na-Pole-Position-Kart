/**
 * DTO exclusivo da página de agendamento.
 *
 * O backend pode trocar a origem dos dados sem expor modelos do banco para a UI.
 */
export type StatusHorarioAgendamento = "DISPONIVEL" | "ULTIMAS_VAGAS" | "LOTADO";

export type HorarioAgendamentoDto = {
  id: string;
  inicioEm: string;
  fimEm: string;
  vagasDisponiveis: number;
  capacidade: number;
  status: StatusHorarioAgendamento;
};

export type ResultadoConsultaHorarios =
  | { ok: true; horarios: HorarioAgendamentoDto[] }
  | { ok: false; horarios: []; mensagem: string };

export type EstadoSolicitacaoAgendamento = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  protocolo?: string;
  erros?: Record<string, string>;
};

export const ESTADO_INICIAL_SOLICITACAO: EstadoSolicitacaoAgendamento = {
  status: "inicial",
};
