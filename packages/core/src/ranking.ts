import type { Categoria, Milissegundos } from "./tipos";

/**
 * Montagem do ranking (secoes 1.3, 5 e 15 do escopo).
 *
 * Regra central: o ranking e por MELHOR VOLTA, nunca por pontos. Cada piloto
 * entra uma unica vez, com a melhor volta dele no periodo considerado.
 */

/** Uma volta ja consolidada como "melhor volta do piloto no periodo". */
export interface TempoPiloto {
  pilotoId: string;
  numeroPiloto: number;
  nomeExibicao: string;
  categoria: Categoria;
  melhorVoltaMs: Milissegundos;
  dataDoTempo: Date;
  kart?: string | null;
}

export interface LinhaRanking extends TempoPiloto {
  posicao: number;
  /** Diferenca para o 1o colocado, em ms. Zero para o lider. */
  diferencaLiderMs: Milissegundos;
  /** Diferenca para quem esta imediatamente a frente, em ms. Zero para o lider. */
  diferencaAnteriorMs: Milissegundos;
}

export interface Periodo {
  inicio: Date;
  /** Exclusivo: `dataDoTempo < fim`. */
  fim: Date;
}

/**
 * Criterio de desempate, nesta ordem:
 * 1. menor tempo;
 * 2. quem marcou primeiro (data mais antiga) fica na frente — pratica padrao no automobilismo;
 * 3. menor numero de piloto, so para o resultado nunca depender da ordem de entrada.
 */
export function compararTempos(a: TempoPiloto, b: TempoPiloto): number {
  if (a.melhorVoltaMs !== b.melhorVoltaMs) return a.melhorVoltaMs - b.melhorVoltaMs;

  const dataA = a.dataDoTempo.getTime();
  const dataB = b.dataDoTempo.getTime();
  if (dataA !== dataB) return dataA - dataB;

  return a.numeroPiloto - b.numeroPiloto;
}

/** Mantem apenas a melhor volta de cada piloto (a lista de entrada pode ter varias corridas). */
export function consolidarMelhorVoltaPorPiloto(
  tempos: readonly TempoPiloto[],
): TempoPiloto[] {
  const melhores = new Map<string, TempoPiloto>();

  for (const tempo of tempos) {
    const atual = melhores.get(tempo.pilotoId);
    if (!atual || compararTempos(tempo, atual) < 0) {
      melhores.set(tempo.pilotoId, tempo);
    }
  }

  return [...melhores.values()];
}

/** Ranking completo, com posicoes e diferencas ja calculadas. */
export function calcularRanking(tempos: readonly TempoPiloto[]): LinhaRanking[] {
  const ordenado = consolidarMelhorVoltaPorPiloto(tempos).sort(compararTempos);
  const lider = ordenado[0];

  return ordenado.map((tempo, indice) => {
    const anterior = ordenado[indice - 1];
    return {
      ...tempo,
      posicao: indice + 1,
      diferencaLiderMs: lider ? tempo.melhorVoltaMs - lider.melhorVoltaMs : 0,
      diferencaAnteriorMs: anterior ? tempo.melhorVoltaMs - anterior.melhorVoltaMs : 0,
    };
  });
}

export function filtrarPorCategoria(
  tempos: readonly TempoPiloto[],
  categoria: Categoria,
): TempoPiloto[] {
  return tempos.filter((t) => t.categoria === categoria);
}

/** Recorte de periodo — base do ranking mensal. */
export function filtrarPorPeriodo(
  tempos: readonly TempoPiloto[],
  periodo: Periodo,
): TempoPiloto[] {
  return tempos.filter(
    (t) => t.dataDoTempo >= periodo.inicio && t.dataDoTempo < periodo.fim,
  );
}

/** Periodo do mes de uma data qualquer, em horario local. */
export function periodoDoMes(referencia: Date): Periodo {
  const inicio = new Date(referencia.getFullYear(), referencia.getMonth(), 1);
  const fim = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 1);
  return { inicio, fim };
}

/**
 * Janela do ranking geral.
 *
 * O ranking geral NAO e vitalicio: considera os ultimos 12 meses. Sem janela,
 * o Top 10 congela com pilotos que nao correm ha anos e quem esta ativo nunca
 * alcanca — o oposto do que a secao 5.1 quer provocar. O tempo antigo continua
 * no historico e no perfil do piloto; ele so deixa de disputar o ranking.
 */
export const JANELA_RANKING_GERAL_MESES = 12;

export function periodoRankingGeral(referencia: Date = new Date()): Periodo {
  const inicio = new Date(
    referencia.getFullYear(),
    referencia.getMonth() - JANELA_RANKING_GERAL_MESES,
    referencia.getDate(),
  );
  // Inicio do dia seguinte: o tempo marcado hoje ja conta.
  const fim = new Date(referencia.getFullYear(), referencia.getMonth(), referencia.getDate() + 1);
  return { inicio, fim };
}

export function top(ranking: readonly LinhaRanking[], quantidade = 10): LinhaRanking[] {
  return ranking.slice(0, quantidade);
}

export interface MinhaPosicao {
  posicao: number;
  totalDePilotos: number;
  melhorVoltaMs: Milissegundos;
  /** Piloto imediatamente a frente. `null` quando o piloto e o lider. */
  proximoAlvo: LinhaRanking | null;
  /** Quanto falta para alcancar o proximo alvo. Zero quando e lider. */
  diferencaParaProximoMs: Milissegundos;
  estaNoTop10: boolean;
}

/**
 * Bloco "Minha posicao" da area do piloto (secao 5.1).
 * Retorna `null` se o piloto ainda nao tem tempo no recorte pedido.
 */
export function minhaPosicao(
  ranking: readonly LinhaRanking[],
  pilotoId: string,
): MinhaPosicao | null {
  const indice = ranking.findIndex((linha) => linha.pilotoId === pilotoId);
  if (indice === -1) return null;

  const linha = ranking[indice]!;
  const alvo = indice > 0 ? ranking[indice - 1]! : null;

  return {
    posicao: linha.posicao,
    totalDePilotos: ranking.length,
    melhorVoltaMs: linha.melhorVoltaMs,
    proximoAlvo: alvo,
    diferencaParaProximoMs: linha.diferencaAnteriorMs,
    estaNoTop10: linha.posicao <= 10,
  };
}

export interface MudancaDePosicao {
  pilotoId: string;
  posicaoAnterior: number | null;
  posicaoAtual: number;
  entrouNoTop10: boolean;
  saiuDoTop10: boolean;
  perdeuPosicao: boolean;
}

/**
 * Compara dois rankings e devolve o que mudou.
 *
 * E daqui que saem as notificacoes da secao 8.1 ("seu tempo foi batido",
 * "voce entrou no Top 10", "voce saiu do Top 10"): o lancamento de corrida
 * calcula o ranking antes e depois e pergunta o que mudou.
 */
export function compararRankings(
  antes: readonly LinhaRanking[],
  depois: readonly LinhaRanking[],
): MudancaDePosicao[] {
  const posicoesAntes = new Map(antes.map((l) => [l.pilotoId, l.posicao]));
  const mudancas: MudancaDePosicao[] = [];

  for (const linha of depois) {
    const posicaoAnterior = posicoesAntes.get(linha.pilotoId) ?? null;
    if (posicaoAnterior === linha.posicao) continue;

    const estavaNoTop10 = posicaoAnterior !== null && posicaoAnterior <= 10;
    const estaNoTop10 = linha.posicao <= 10;

    mudancas.push({
      pilotoId: linha.pilotoId,
      posicaoAnterior,
      posicaoAtual: linha.posicao,
      entrouNoTop10: !estavaNoTop10 && estaNoTop10,
      saiuDoTop10: estavaNoTop10 && !estaNoTop10,
      perdeuPosicao: posicaoAnterior !== null && linha.posicao > posicaoAnterior,
    });
  }

  return mudancas;
}

/**
 * Pilotos que foram ultrapassados por `pilotoId` — os que estavam a frente
 * antes e ficaram atras depois. Alimenta o "Alerta de ultrapassagem!".
 */
export function pilotosSuperadosPor(
  antes: readonly LinhaRanking[],
  depois: readonly LinhaRanking[],
  pilotoId: string,
): string[] {
  const posicaoDepois = depois.find((l) => l.pilotoId === pilotoId)?.posicao;
  if (posicaoDepois === undefined) return [];

  const posicaoAntes = antes.find((l) => l.pilotoId === pilotoId)?.posicao ?? Infinity;
  if (posicaoDepois >= posicaoAntes) return [];

  return antes
    .filter((l) => l.pilotoId !== pilotoId)
    .filter((l) => l.posicao < posicaoAntes && l.posicao >= posicaoDepois)
    .map((l) => l.pilotoId);
}
