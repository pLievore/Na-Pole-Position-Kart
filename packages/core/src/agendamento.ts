import {
  FUSO_HORARIO_OPERACIONAL,
  dataHoraOperacionalISO,
  parseDataCivil,
  parseDataHoraOperacional,
} from "./data-operacional";

/** RASCUNHO ainda e interno; ABERTO significa publicado e reservavel. */
export const STATUS_HORARIO_AGENDAMENTO = [
  "RASCUNHO",
  "ABERTO",
  "BLOQUEADO",
  "CANCELADO",
  "ENCERRADO",
] as const;

export type StatusHorarioAgendamento = (typeof STATUS_HORARIO_AGENDAMENTO)[number];

/** A confirmacao e manual; toda reserva publica nasce PENDENTE. */
export const STATUS_AGENDAMENTO = [
  "PENDENTE",
  "CONFIRMADO",
  "CHECK_IN",
  "EXPIRADO",
  "CANCELADO",
  "CONCLUIDO",
  "NAO_COMPARECEU",
] as const;

export type StatusAgendamento = (typeof STATUS_AGENDAMENTO)[number];

export const STATUS_PARTICIPANTE_AGENDAMENTO = [
  "AGENDADO",
  "PRESENTE",
  "AUSENTE",
  "CANCELADO",
] as const;

export type StatusParticipanteAgendamento =
  (typeof STATUS_PARTICIPANTE_AGENDAMENTO)[number];

export const ORIGENS_AGENDAMENTO = ["SITE", "BALCAO", "ADMINISTRACAO"] as const;
export type OrigemAgendamento = (typeof ORIGENS_AGENDAMENTO)[number];

export const TIPOS_EVENTO_AGENDAMENTO = [
  "HORARIO_CRIADO",
  "HORARIO_ALTERADO",
  "HORARIO_CANCELADO",
  "AGENDAMENTO_CRIADO",
  "AGENDAMENTO_EDITADO",
  "AGENDAMENTO_CONFIRMADO",
  "AGENDAMENTO_CHECK_IN",
  "AGENDAMENTO_EXPIRADO",
  "AGENDAMENTO_CANCELADO",
  "AGENDAMENTO_CONCLUIDO",
  "CHECK_IN_REALIZADO",
  "PILOTO_VINCULADO",
  "NAO_COMPARECEU_REGISTRADO",
] as const;

export type TipoEventoAgendamento = (typeof TIPOS_EVENTO_AGENDAMENTO)[number];

export const ORIGENS_EVENTO_AGENDAMENTO = [
  "PUBLICO",
  "OPERADOR",
  "ADMINISTRADOR",
  "SISTEMA",
] as const;

export type OrigemEventoAgendamento = (typeof ORIGENS_EVENTO_AGENDAMENTO)[number];

export const MAXIMO_PARTICIPANTES_POR_AGENDAMENTO = 10;
export const CHAVE_CONFIGURACAO_PADROES_AGENDAMENTO = "agendamento.padroes";

export type CodigoRegraAgendamento =
  | "ANTECEDENCIA_INSUFICIENTE"
  | "CAPACIDADE_INVALIDA"
  | "CAPACIDADE_ESGOTADA"
  | "CONFIGURACAO_INVALIDA"
  | "DURACAO_INVALIDA"
  | "EMAIL_INVALIDO"
  | "HORARIO_DUPLICADO"
  | "HORARIOS_SOBREPOSTOS"
  | "INTERVALO_INVALIDO"
  | "NOME_INVALIDO"
  | "OBSERVACOES_INVALIDAS"
  | "PARTICIPANTES_INVALIDOS"
  | "TELEFONE_INVALIDO"
  | "TERMOS_NAO_ACEITOS"
  | "TRANSICAO_INVALIDA";

export class RegraAgendamentoError extends Error {
  constructor(
    public readonly codigo: CodigoRegraAgendamento,
    mensagem: string,
    public readonly campo?: string,
  ) {
    super(mensagem);
    this.name = "RegraAgendamentoError";
  }
}

export interface ParticipanteParaAgendamento {
  nomeCompleto: string;
}

export interface DadosAgendamentoPublico {
  responsavelNome: string;
  responsavelTelefone: string;
  responsavelEmail: string;
  participantes: readonly ParticipanteParaAgendamento[];
  temParticipanteMenor: boolean;
  observacoesCliente?: string | null;
  aceiteTermos: boolean;
  versaoTermos: string;
}

export interface DadosAgendamentoPublicoNormalizados {
  responsavelNome: string;
  responsavelTelefone: string;
  responsavelEmail: string;
  participantes: ParticipanteParaAgendamento[];
  temParticipanteMenor: boolean;
  observacoesCliente: string | null;
  aceiteTermos: true;
  versaoTermos: string;
}

export interface OcupacaoAgendamento {
  status: StatusAgendamento;
  quantidadeParticipantes: number;
  expiraEm: Date | null;
}

export interface ResultadoCapacidade {
  capacidade: number;
  ocupadas: number;
  solicitadas: number;
  disponiveisAntes: number;
  disponiveisDepois: number;
  excedente: number;
}

export type DiaSemanaAgendamento = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface FaixaHorarioAgendamento {
  diasSemana: readonly DiaSemanaAgendamento[];
  /** Horas civis da pista no formato HH:mm. */
  horaInicio: string;
  horaFim: string;
}

export interface ConfiguracaoPadroesAgendamento {
  fusoHorario: string;
  faixas: readonly FaixaHorarioAgendamento[];
  intervaloEntreIniciosMinutos: number;
  duracaoMinutos: number;
  capacidade: number;
  antecedenciaMinimaMinutos: number;
  chegadaAntecedenciaMinutos: number;
  pendenciaHoras: number;
}

export interface HorarioPadraoGerado {
  inicioEm: Date;
  fimEm: Date;
  capacidade: number;
}

/**
 * Defaults editaveis: nao restringem horarios criados manualmente.
 *
 * Funcionamento confirmado pela operacao em 2026-08-04: segunda a sabado, das
 * 18h as 22h. Domingo fechado.
 */
export const CONFIGURACAO_PADROES_AGENDAMENTO_INICIAL: ConfiguracaoPadroesAgendamento = {
  fusoHorario: FUSO_HORARIO_OPERACIONAL,
  faixas: [{ diasSemana: [1, 2, 3, 4, 5, 6], horaInicio: "18:00", horaFim: "22:00" }],
  intervaloEntreIniciosMinutos: 30,
  duracaoMinutos: 15,
  capacidade: 10,
  antecedenciaMinimaMinutos: 120,
  chegadaAntecedenciaMinutos: 30,
  pendenciaHoras: 24,
};

const TRANSICOES_AGENDAMENTO: Record<StatusAgendamento, readonly StatusAgendamento[]> = {
  PENDENTE: ["CONFIRMADO", "EXPIRADO", "CANCELADO"],
  CONFIRMADO: ["CHECK_IN", "CANCELADO", "NAO_COMPARECEU"],
  CHECK_IN: ["CONCLUIDO"],
  EXPIRADO: [],
  CANCELADO: [],
  CONCLUIDO: [],
  NAO_COMPARECEU: [],
};

const TRANSICOES_HORARIO: Record<
  StatusHorarioAgendamento,
  readonly StatusHorarioAgendamento[]
> = {
  RASCUNHO: ["ABERTO", "CANCELADO"],
  ABERTO: ["BLOQUEADO", "CANCELADO", "ENCERRADO"],
  BLOQUEADO: ["ABERTO", "CANCELADO", "ENCERRADO"],
  CANCELADO: [],
  ENCERRADO: [],
};

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_HORA = /^(\d{2}):(\d{2})$/;

function validarNome(valor: string, campo: string): string {
  const normalizado = valor.trim().replace(/\s+/g, " ");
  if (normalizado.length < 2 || normalizado.length > 120) {
    throw new RegraAgendamentoError(
      "NOME_INVALIDO",
      "Informe um nome com 2 a 120 caracteres.",
      campo,
    );
  }
  return normalizado;
}

function minutosDaHora(valor: string, campo: string): number {
  const resultado = REGEX_HORA.exec(valor.trim());
  const hora = Number(resultado?.[1]);
  const minuto = Number(resultado?.[2]);
  if (!resultado || hora > 23 || minuto > 59) {
    throw new RegraAgendamentoError(
      "INTERVALO_INVALIDO",
      "Use uma hora valida no formato HH:mm.",
      campo,
    );
  }
  return hora * 60 + minuto;
}

function horaDosMinutos(minutos: number): string {
  const hora = Math.floor(minutos / 60);
  const minuto = minutos % 60;
  return `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
}

function exigirInteiroPositivo(
  valor: number,
  codigo: "CAPACIDADE_INVALIDA" | "DURACAO_INVALIDA" | "CONFIGURACAO_INVALIDA",
  campo: string,
): number {
  if (!Number.isSafeInteger(valor) || valor <= 0) {
    throw new RegraAgendamentoError(
      codigo,
      "O valor precisa ser um numero inteiro maior que zero.",
      campo,
    );
  }
  return valor;
}

function exigirInteiroNaoNegativo(valor: number, campo: string): number {
  if (!Number.isSafeInteger(valor) || valor < 0) {
    throw new RegraAgendamentoError(
      "CONFIGURACAO_INVALIDA",
      "O valor precisa ser um numero inteiro maior ou igual a zero.",
      campo,
    );
  }
  return valor;
}

export function validarDadosAgendamentoPublico(
  dados: DadosAgendamentoPublico,
): DadosAgendamentoPublicoNormalizados {
  const responsavelNome = validarNome(dados.responsavelNome, "responsavelNome");
  const responsavelTelefone = dados.responsavelTelefone.replace(/\D/g, "");
  if (!/^\d{10,11}$/.test(responsavelTelefone)) {
    throw new RegraAgendamentoError(
      "TELEFONE_INVALIDO",
      "Informe DDD e telefone com 10 ou 11 digitos.",
      "responsavelTelefone",
    );
  }

  const responsavelEmail = dados.responsavelEmail.trim().toLowerCase();
  if (responsavelEmail.length > 254 || !REGEX_EMAIL.test(responsavelEmail)) {
    throw new RegraAgendamentoError(
      "EMAIL_INVALIDO",
      "Informe um e-mail valido.",
      "responsavelEmail",
    );
  }

  if (
    dados.participantes.length === 0 ||
    dados.participantes.length > MAXIMO_PARTICIPANTES_POR_AGENDAMENTO
  ) {
    throw new RegraAgendamentoError(
      "PARTICIPANTES_INVALIDOS",
      `Inclua de 1 a ${MAXIMO_PARTICIPANTES_POR_AGENDAMENTO} participantes.`,
      "participantes",
    );
  }

  const participantes = dados.participantes.map((participante, indice) => ({
    nomeCompleto: validarNome(participante.nomeCompleto, `participantes.${indice}.nomeCompleto`),
  }));

  const observacoesCliente = dados.observacoesCliente?.trim() || null;
  if (observacoesCliente !== null && observacoesCliente.length > 2_000) {
    throw new RegraAgendamentoError(
      "OBSERVACOES_INVALIDAS",
      "As observacoes devem ter no maximo 2000 caracteres.",
      "observacoesCliente",
    );
  }

  const versaoTermos = dados.versaoTermos.trim();
  if (!dados.aceiteTermos || versaoTermos.length === 0) {
    throw new RegraAgendamentoError(
      "TERMOS_NAO_ACEITOS",
      "O responsavel precisa aceitar os termos vigentes.",
      "aceiteTermos",
    );
  }

  return {
    responsavelNome,
    responsavelTelefone,
    responsavelEmail,
    participantes,
    temParticipanteMenor: dados.temParticipanteMenor,
    observacoesCliente,
    aceiteTermos: true,
    versaoTermos,
  };
}

export function validarIntervaloHorario(inicioEm: Date, fimEm: Date): void {
  const inicio = inicioEm.getTime();
  const fim = fimEm.getTime();
  const duracaoMinutos = (fim - inicio) / 60_000;

  if (
    !Number.isFinite(inicio) ||
    !Number.isFinite(fim) ||
    fim <= inicio ||
    !Number.isInteger(duracaoMinutos) ||
    duracaoMinutos > 24 * 60
  ) {
    throw new RegraAgendamentoError(
      "INTERVALO_INVALIDO",
      "O horario precisa terminar depois do inicio, em minutos inteiros, e durar no maximo 24 horas.",
      "fimEm",
    );
  }
}

export function validarCapacidadeHorario(capacidade: number): number {
  return exigirInteiroPositivo(capacidade, "CAPACIDADE_INVALIDA", "capacidade");
}

export function agendamentoOcupaVaga(
  agendamento: OcupacaoAgendamento,
  referencia: Date,
): boolean {
  if (agendamento.status === "CONFIRMADO" || agendamento.status === "CHECK_IN") return true;
  if (agendamento.status !== "PENDENTE") return false;
  return agendamento.expiraEm !== null && agendamento.expiraEm.getTime() > referencia.getTime();
}

/** Pendencias vencidas deixam de ocupar mesmo antes da materializacao pelo job. */
export function calcularOcupacaoAgendamentos(
  agendamentos: readonly OcupacaoAgendamento[],
  referencia: Date,
): number {
  if (!Number.isFinite(referencia.getTime())) {
    throw new RegraAgendamentoError("INTERVALO_INVALIDO", "A referencia e invalida.");
  }
  return agendamentos.reduce((total, agendamento) => {
    if (!agendamentoOcupaVaga(agendamento, referencia)) return total;
    return (
      total +
      exigirInteiroPositivo(
        agendamento.quantidadeParticipantes,
        "CAPACIDADE_INVALIDA",
        "quantidadeParticipantes",
      )
    );
  }, 0);
}

export function avaliarCapacidadeAgendamento(
  capacidade: number,
  ocupadas: number,
  solicitadas: number,
  permitirExcedente = false,
): ResultadoCapacidade {
  validarCapacidadeHorario(capacidade);
  if (!Number.isSafeInteger(ocupadas) || ocupadas < 0) {
    throw new RegraAgendamentoError(
      "CAPACIDADE_INVALIDA",
      "A ocupacao atual precisa ser um inteiro maior ou igual a zero.",
      "ocupadas",
    );
  }
  exigirInteiroPositivo(solicitadas, "CAPACIDADE_INVALIDA", "solicitadas");

  const disponiveisAntes = Math.max(0, capacidade - ocupadas);
  const excedente = Math.max(0, ocupadas + solicitadas - capacidade);
  if (excedente > 0 && !permitirExcedente) {
    throw new RegraAgendamentoError(
      "CAPACIDADE_ESGOTADA",
      `Restam ${disponiveisAntes} vaga(s) neste horario.`,
      "participantes",
    );
  }

  return {
    capacidade,
    ocupadas,
    solicitadas,
    disponiveisAntes,
    disponiveisDepois: Math.max(0, capacidade - ocupadas - solicitadas),
    excedente,
  };
}

/** Alterar capacidade nao cria uma vaga ficticia: lotacao exata continua valida. */
export function avaliarAlteracaoCapacidadeHorario(
  capacidade: number,
  ocupadas: number,
  permitirExcedente = false,
): { capacidade: number; ocupadas: number; excedente: number } {
  validarCapacidadeHorario(capacidade);
  if (!Number.isSafeInteger(ocupadas) || ocupadas < 0) {
    throw new RegraAgendamentoError(
      "CAPACIDADE_INVALIDA",
      "A ocupacao atual precisa ser um inteiro maior ou igual a zero.",
      "ocupadas",
    );
  }
  const excedente = Math.max(0, ocupadas - capacidade);
  if (excedente > 0 && !permitirExcedente) {
    throw new RegraAgendamentoError(
      "CAPACIDADE_ESGOTADA",
      `A capacidade nao pode ficar abaixo das ${ocupadas} vagas ocupadas sem override.`,
      "capacidade",
    );
  }
  return { capacidade, ocupadas, excedente };
}

export function calcularExpiracaoPendencia(
  criadoEm: Date,
  inicioEm: Date,
  pendenciaHoras = CONFIGURACAO_PADROES_AGENDAMENTO_INICIAL.pendenciaHoras,
  antecedenciaMinimaMinutos =
    CONFIGURACAO_PADROES_AGENDAMENTO_INICIAL.antecedenciaMinimaMinutos,
): Date {
  const criado = criadoEm.getTime();
  const inicio = inicioEm.getTime();
  exigirInteiroPositivo(pendenciaHoras, "CONFIGURACAO_INVALIDA", "pendenciaHoras");
  exigirInteiroNaoNegativo(antecedenciaMinimaMinutos, "antecedenciaMinimaMinutos");

  if (!Number.isFinite(criado) || !Number.isFinite(inicio)) {
    throw new RegraAgendamentoError("INTERVALO_INVALIDO", "A data informada e invalida.");
  }

  const limiteDoHorario = inicio - antecedenciaMinimaMinutos * 60_000;
  if (limiteDoHorario <= criado) {
    throw new RegraAgendamentoError(
      "ANTECEDENCIA_INSUFICIENTE",
      `Reservas encerram ${antecedenciaMinimaMinutos} minutos antes do horario.`,
      "horarioId",
    );
  }

  return new Date(Math.min(criado + pendenciaHoras * 60 * 60_000, limiteDoHorario));
}

export function podeTransicionarAgendamento(
  atual: StatusAgendamento,
  proximo: StatusAgendamento,
): boolean {
  return TRANSICOES_AGENDAMENTO[atual].includes(proximo);
}

export function exigirTransicaoAgendamento(
  atual: StatusAgendamento,
  proximo: StatusAgendamento,
): void {
  if (!podeTransicionarAgendamento(atual, proximo)) {
    throw new RegraAgendamentoError(
      "TRANSICAO_INVALIDA",
      `Nao e permitido alterar o agendamento de ${atual} para ${proximo}.`,
      "status",
    );
  }
}

export function podeTransicionarHorario(
  atual: StatusHorarioAgendamento,
  proximo: StatusHorarioAgendamento,
): boolean {
  return TRANSICOES_HORARIO[atual].includes(proximo);
}

export function exigirTransicaoHorario(
  atual: StatusHorarioAgendamento,
  proximo: StatusHorarioAgendamento,
): void {
  if (!podeTransicionarHorario(atual, proximo)) {
    throw new RegraAgendamentoError(
      "TRANSICAO_INVALIDA",
      `Nao e permitido alterar o horario de ${atual} para ${proximo}.`,
      "status",
    );
  }
}

/** Check-in nao conclui a bateria; CONCLUIDO exige uma acao operacional posterior. */
export function resolverStatusAgendamentoPorParticipantes(
  statusAtual: StatusAgendamento,
  participantes: readonly StatusParticipanteAgendamento[],
): StatusAgendamento {
  if (
    (statusAtual !== "CONFIRMADO" && statusAtual !== "CHECK_IN") ||
    participantes.length === 0
  ) {
    return statusAtual;
  }
  if (participantes.every((status) => status === "AUSENTE" || status === "CANCELADO")) {
    return "NAO_COMPARECEU";
  }
  if (participantes.some((status) => status === "PRESENTE")) return "CHECK_IN";
  return "CONFIRMADO";
}

export function validarConfiguracaoPadroesAgendamento(
  configuracao: ConfiguracaoPadroesAgendamento,
): ConfiguracaoPadroesAgendamento {
  if (configuracao.fusoHorario !== FUSO_HORARIO_OPERACIONAL) {
    throw new RegraAgendamentoError(
      "CONFIGURACAO_INVALIDA",
      `O fuso operacional precisa ser ${FUSO_HORARIO_OPERACIONAL}.`,
      "fusoHorario",
    );
  }

  const intervaloEntreIniciosMinutos = exigirInteiroPositivo(
    configuracao.intervaloEntreIniciosMinutos,
    "CONFIGURACAO_INVALIDA",
    "intervaloEntreIniciosMinutos",
  );
  const duracaoMinutos = exigirInteiroPositivo(
    configuracao.duracaoMinutos,
    "DURACAO_INVALIDA",
    "duracaoMinutos",
  );
  if (duracaoMinutos > intervaloEntreIniciosMinutos) {
    throw new RegraAgendamentoError(
      "HORARIOS_SOBREPOSTOS",
      "A duracao nao pode ultrapassar o intervalo entre inicios.",
      "duracaoMinutos",
    );
  }

  const capacidade = validarCapacidadeHorario(configuracao.capacidade);
  const antecedenciaMinimaMinutos = exigirInteiroNaoNegativo(
    configuracao.antecedenciaMinimaMinutos,
    "antecedenciaMinimaMinutos",
  );
  const chegadaAntecedenciaMinutos = exigirInteiroNaoNegativo(
    configuracao.chegadaAntecedenciaMinutos,
    "chegadaAntecedenciaMinutos",
  );
  const pendenciaHoras = exigirInteiroPositivo(
    configuracao.pendenciaHoras,
    "CONFIGURACAO_INVALIDA",
    "pendenciaHoras",
  );

  if (configuracao.faixas.length === 0) {
    throw new RegraAgendamentoError(
      "CONFIGURACAO_INVALIDA",
      "Configure ao menos uma faixa semanal de atendimento.",
      "faixas",
    );
  }

  const faixas = configuracao.faixas.map((faixa, indice) => {
    if (faixa.diasSemana.length === 0 || new Set(faixa.diasSemana).size !== faixa.diasSemana.length) {
      throw new RegraAgendamentoError(
        "CONFIGURACAO_INVALIDA",
        "Informe ao menos um dia, sem repeticoes, em cada faixa.",
        `faixas.${indice}.diasSemana`,
      );
    }
    for (const dia of faixa.diasSemana) {
      if (!Number.isInteger(dia) || dia < 0 || dia > 6) {
        throw new RegraAgendamentoError(
          "CONFIGURACAO_INVALIDA",
          "Dia da semana invalido.",
          `faixas.${indice}.diasSemana`,
        );
      }
    }

    const inicio = minutosDaHora(faixa.horaInicio, `faixas.${indice}.horaInicio`);
    const fim = minutosDaHora(faixa.horaFim, `faixas.${indice}.horaFim`);
    if (fim <= inicio || inicio + duracaoMinutos > fim) {
      throw new RegraAgendamentoError(
        "INTERVALO_INVALIDO",
        "A faixa precisa terminar depois do inicio e comportar ao menos um horario.",
        `faixas.${indice}.horaFim`,
      );
    }

    return {
      diasSemana: [...faixa.diasSemana].sort((a, b) => a - b),
      horaInicio: faixa.horaInicio.trim(),
      horaFim: faixa.horaFim.trim(),
      inicio,
      fim,
    };
  });

  for (let dia = 0; dia <= 6; dia += 1) {
    const faixasDoDia = faixas
      .filter((faixa) => faixa.diasSemana.includes(dia as DiaSemanaAgendamento))
      .sort((a, b) => a.inicio - b.inicio);
    for (let indice = 1; indice < faixasDoDia.length; indice += 1) {
      const anterior = faixasDoDia[indice - 1]!;
      const atual = faixasDoDia[indice]!;
      if (anterior.fim > atual.inicio) {
        throw new RegraAgendamentoError(
          "HORARIOS_SOBREPOSTOS",
          `As faixas ${anterior.horaInicio}-${anterior.horaFim} e ${atual.horaInicio}-${atual.horaFim} se sobrepoem.`,
          "faixas",
        );
      }
    }
  }

  return {
    fusoHorario: FUSO_HORARIO_OPERACIONAL,
    faixas: faixas.map(({ diasSemana, horaInicio, horaFim }) => ({
      diasSemana,
      horaInicio,
      horaFim,
    })),
    intervaloEntreIniciosMinutos,
    duracaoMinutos,
    capacidade,
    antecedenciaMinimaMinutos,
    chegadaAntecedenciaMinutos,
    pendenciaHoras,
  };
}

/** Gera sugestoes; persistir/publicar os horarios continua sendo decisao do admin. */
export function gerarHorariosPadraoParaData(
  dataCivil: string,
  configuracao: ConfiguracaoPadroesAgendamento = CONFIGURACAO_PADROES_AGENDAMENTO_INICIAL,
): HorarioPadraoGerado[] {
  const config = validarConfiguracaoPadroesAgendamento(configuracao);
  const diaSemana = parseDataCivil(dataCivil).getUTCDay() as DiaSemanaAgendamento;
  const horarios: HorarioPadraoGerado[] = [];

  for (const faixa of config.faixas) {
    if (!faixa.diasSemana.includes(diaSemana)) continue;
    const inicioFaixa = minutosDaHora(faixa.horaInicio, "horaInicio");
    const fimFaixa = minutosDaHora(faixa.horaFim, "horaFim");

    for (
      let inicioMinutos = inicioFaixa;
      inicioMinutos + config.duracaoMinutos <= fimFaixa;
      inicioMinutos += config.intervaloEntreIniciosMinutos
    ) {
      const inicioEm = parseDataHoraOperacional(`${dataCivil}T${horaDosMinutos(inicioMinutos)}`);
      const fimEm = new Date(inicioEm.getTime() + config.duracaoMinutos * 60_000);
      horarios.push({ inicioEm, fimEm, capacidade: config.capacidade });
    }
  }

  return horarios.sort((a, b) =>
    dataHoraOperacionalISO(a.inicioEm).localeCompare(dataHoraOperacionalISO(b.inicioEm)),
  );
}
