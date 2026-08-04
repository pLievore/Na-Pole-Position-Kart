import type { MotivoPenalidade, TipoPenalidade } from "./tipos";

/**
 * Tabela de penalidades (secao 7.2 do escopo).
 *
 * DESCLASSIFICACAO tem desconto `null` porque o escopo diz "Manual, conforme
 * decisao administrativa" — quem lanca informa quantos pontos descontar.
 */
export const TABELA_PENALIDADES = {
  ADVERTENCIA: { pontos: -1, rotulo: "Advertencia" },
  PUNICAO: { pontos: -3, rotulo: "Punicao" },
  PUNICAO_GRAVE: { pontos: -5, rotulo: "Punicao grave" },
  DESCLASSIFICACAO: { pontos: null, rotulo: "Desclassificacao da bateria" },
} as const satisfies Record<TipoPenalidade, { pontos: number | null; rotulo: string }>;

export const MOTIVOS_PENALIDADE = {
  BATIDA: "Batida em outro piloto",
  ULTRAPASSAGEM_FORCADA: "Ultrapassagem forcada",
  DESRESPEITO_BANDEIRAS: "Nao respeitar bandeiras",
  BLOQUEIO_PISTA: "Travar a pista propositalmente",
  NAO_CEDER_PASSAGEM: "Nao deixar piloto mais rapido ultrapassar",
  DIRECAO_PERIGOSA: "Direcao perigosa",
  REINCIDENCIA: "Reincidencia de conduta inadequada",
  OUTRO: "Outro motivo",
} as const satisfies Record<MotivoPenalidade, string>;

export interface PenalidadeAplicada {
  tipo: TipoPenalidade;
  /** Obrigatorio apenas para DESCLASSIFICACAO; ignorado nos demais tipos. */
  pontosManuais?: number | null;
}

/**
 * Pontos descontados por uma penalidade. Sempre negativo ou zero.
 *
 * Para DESCLASSIFICACAO o valor manual e obrigatorio; o sinal e normalizado
 * para negativo, entao tanto faz o operador digitar 5 ou -5.
 */
export function pontosDaPenalidade(penalidade: PenalidadeAplicada): number {
  const definicao = TABELA_PENALIDADES[penalidade.tipo];

  if (definicao.pontos !== null) return definicao.pontos;

  if (penalidade.pontosManuais == null) {
    throw new Error(
      "Desclassificacao exige informar manualmente os pontos descontados (decisao administrativa).",
    );
  }
  return -Math.abs(penalidade.pontosManuais);
}

/** Soma dos descontos de todas as penalidades de uma corrida. */
export function totalDescontado(penalidades: readonly PenalidadeAplicada[]): number {
  return penalidades.reduce((soma, p) => soma + pontosDaPenalidade(p), 0);
}

export function rotuloPenalidade(tipo: TipoPenalidade): string {
  return TABELA_PENALIDADES[tipo].rotulo;
}

export function rotuloMotivo(motivo: MotivoPenalidade): string {
  return MOTIVOS_PENALIDADE[motivo];
}
