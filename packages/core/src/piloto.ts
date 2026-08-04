import { nomeCategoria } from "./categoria";
import { formatarTempo } from "./tempo";
import type { LinhaRanking } from "./ranking";

/** Primeiro numero de piloto emitido. Numeros nao sao reaproveitados. */
export const NUMERO_PILOTO_INICIAL = 100;

/** Exibicao do numero do piloto: 231 -> "#231" (secao 2.2). */
export function formatarNumeroPiloto(numero: number): string {
  return `#${numero}`;
}

/**
 * Sugere o nome de exibicao a partir do nome completo (secao 2.1:
 * "preferencialmente primeiro nome + inicial do sobrenome").
 *
 * "Patrick Wallace Souza" -> "Patrick S."
 * Preposicoes ("de", "da", "dos"...) sao ignoradas ao escolher o sobrenome.
 * O piloto pode editar a sugestao; isto e so o valor inicial do campo.
 */
const PREPOSICOES = new Set(["de", "da", "do", "das", "dos", "e"]);

export function sugerirNomeExibicao(nomeCompleto: string): string {
  const partes = nomeCompleto
    .trim()
    .split(/\s+/)
    .filter((parte) => parte.length > 0);

  const primeiro = partes[0];
  if (!primeiro) return "";

  const sobrenomes = partes
    .slice(1)
    .filter((parte) => !PREPOSICOES.has(parte.toLowerCase()));

  const ultimo = sobrenomes[sobrenomes.length - 1];
  if (!ultimo) return primeiro;

  return `${primeiro} ${ultimo.charAt(0).toUpperCase()}.`;
}

/**
 * Linha do ranking publico.
 *
 * Este tipo existe para tornar o vazamento de dado pessoal um erro de
 * compilacao, e nao um descuido de template: peso, telefone, e-mail e data de
 * nascimento simplesmente nao cabem aqui (tabela da secao 1.4).
 */
export interface LinhaRankingPublico {
  posicao: number;
  numeroPiloto: string;
  nome: string;
  categoria: string;
  melhorVolta: string;
  dataDoTempo: Date;
}

/** Converte uma linha interna de ranking na versao que pode ir para a web publica. */
export function paraRankingPublico(linha: LinhaRanking): LinhaRankingPublico {
  return {
    posicao: linha.posicao,
    numeroPiloto: formatarNumeroPiloto(linha.numeroPiloto),
    nome: linha.nomeExibicao,
    categoria: nomeCategoria(linha.categoria),
    melhorVolta: formatarTempo(linha.melhorVoltaMs),
    dataDoTempo: linha.dataDoTempo,
  };
}

/** Dias sem correr, usado no aviso de inatividade (secao 8.1: 20 dias). */
export const DIAS_PARA_INATIVIDADE = 20;

export function diasSemCorrer(ultimaCorrida: Date | null, referencia: Date = new Date()): number {
  if (!ultimaCorrida) return Infinity;
  const umDia = 24 * 60 * 60 * 1000;
  return Math.floor((referencia.getTime() - ultimaCorrida.getTime()) / umDia);
}

export function estaInativo(ultimaCorrida: Date | null, referencia: Date = new Date()): boolean {
  return diasSemCorrer(ultimaCorrida, referencia) >= DIAS_PARA_INATIVIDADE;
}
