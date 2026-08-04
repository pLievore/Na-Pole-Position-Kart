import type {
  OrigemAgendamento,
  StatusAgendamento,
  StatusHorarioAgendamento,
  StatusParticipanteAgendamento,
} from "@napole/core";

export interface ErroServicoAgendamento {
  codigo: string;
  mensagem: string;
  campo?: string;
}

export type ResultadoServicoAgendamento<T> =
  | { ok: true; valor: T }
  | { ok: false; erro: ErroServicoAgendamento };

export interface ProtocoloAgendamentoPublico {
  codigoPublico: string;
  status: "PENDENTE";
  horario: { inicioEm: Date; fimEm: Date };
  expiraEm: Date;
  instrucoes: {
    confirmacaoManual: true;
    chegadaAntecedenciaMinutos: number;
  };
}

export interface HorarioAgendamentoPublico {
  id: string;
  inicioEm: Date;
  fimEm: Date;
  capacidade: number;
  vagasDisponiveis: number;
}

export interface ParticipanteAgendamentoAdministrativo {
  id: string;
  nomeCompleto: string;
  status: StatusParticipanteAgendamento;
  checkInEm: Date | null;
  ausenciaRegistradaEm: Date | null;
  piloto: { id: string; numero: number; nomeExibicao: string } | null;
}

export interface AgendamentoAdministrativo {
  id: string;
  codigoPublico: string;
  status: StatusAgendamento;
  origem: OrigemAgendamento;
  quantidadeParticipantes: number;
  responsavelNome: string;
  responsavelTelefone: string;
  responsavelEmail: string;
  temParticipanteMenor: boolean;
  observacoesCliente: string | null;
  observacoesInternas: string | null;
  aceiteTermosEm: Date;
  versaoTermos: string;
  expiraEm: Date;
  confirmadoEm: Date | null;
  canceladoEm: Date | null;
  motivoCancelamento: string | null;
  concluidoEm: Date | null;
  naoCompareceuEm: Date | null;
  criadoEm: Date;
  atualizadoEm: Date;
  participantes: ParticipanteAgendamentoAdministrativo[];
}

export interface HorarioAgendamentoAdministrativo {
  id: string;
  inicioEm: Date;
  fimEm: Date;
  capacidade: number;
  status: StatusHorarioAgendamento;
  observacoesInternas: string | null;
  ocupadas: number;
  vagasDisponiveis: number;
  agendamentos: AgendamentoAdministrativo[];
}

export interface ResultadoLoteHorarios {
  loteId: string;
  criados: Array<{ id: string; inicioEm: Date; fimEm: Date }>;
  ignorados: Array<{ id: string; inicioEm: Date; fimEm: Date }>;
}
