import type { Milissegundos } from "./tipos";

/**
 * Tempos de volta sao SEMPRE guardados como inteiro em milissegundos.
 *
 * Motivo: comparar tempos e a operacao mais importante do sistema (ranking,
 * "melhorou o proprio tempo", diferenca para o piloto da frente). Numero
 * decimal (float) introduz erro de arredondamento; inteiro nao.
 */

const REGEX_MMSSMMM = /^(\d{1,2}):([0-5]\d)(?:[.,](\d{1,3}))?$/; // 1:02.487 ou 1:02
const REGEX_SSMMM = /^(\d{1,3})[.,](\d{1,3})$/; // 32.487
const REGEX_SEGUNDOS = /^(\d{1,3})$/; // 32

/** Limites de sanidade para uma volta de kart indoor. */
export const TEMPO_MINIMO_MS = 10_000; // 10s
export const TEMPO_MAXIMO_MS = 600_000; // 10min

export class TempoInvalidoError extends Error {
  constructor(entrada: string, motivo: string) {
    super(`Tempo invalido "${entrada}": ${motivo}`);
    this.name = "TempoInvalidoError";
  }
}

/** Completa os milissegundos digitados: "5" -> 500ms, "48" -> 480ms, "487" -> 487ms. */
function normalizarMilissegundos(fracao: string): number {
  return Number(fracao.padEnd(3, "0"));
}

/**
 * Converte o tempo digitado pelo operador em milissegundos.
 *
 * Aceita "32.487", "32,487", "32", "1:02.487". Rejeita qualquer outra coisa —
 * o lancamento de corrida e manual e um tempo errado contamina o ranking.
 */
export function parseTempo(entrada: string): Milissegundos {
  const texto = entrada.trim().replace(/\s+/g, "");
  if (texto === "") throw new TempoInvalidoError(entrada, "valor vazio");

  let ms: number;

  const comMinutos = REGEX_MMSSMMM.exec(texto);
  const comDecimal = REGEX_SSMMM.exec(texto);
  const soSegundos = REGEX_SEGUNDOS.exec(texto);

  if (comMinutos) {
    const [, min, seg, frac] = comMinutos as unknown as [
      string,
      string,
      string,
      string | undefined,
    ];
    ms =
      Number(min) * 60_000 +
      Number(seg) * 1_000 +
      (frac === undefined ? 0 : normalizarMilissegundos(frac));
  } else if (comDecimal) {
    const [, seg, frac] = comDecimal as unknown as [string, string, string];
    ms = Number(seg) * 1_000 + normalizarMilissegundos(frac);
  } else if (soSegundos) {
    const [, seg] = soSegundos as unknown as [string, string];
    ms = Number(seg) * 1_000;
  } else {
    throw new TempoInvalidoError(entrada, "use o formato 32.487 ou 1:02.487");
  }

  if (ms < TEMPO_MINIMO_MS) {
    throw new TempoInvalidoError(entrada, "tempo abaixo do minimo plausivel (10s)");
  }
  if (ms > TEMPO_MAXIMO_MS) {
    throw new TempoInvalidoError(entrada, "tempo acima do maximo plausivel (10min)");
  }

  return ms;
}

/**
 * Formata o tempo para exibicao.
 *
 * Abaixo de 1 minuto usa o formato curto que a pista ja usa ("32.487s");
 * a partir de 1 minuto usa "1:02.487".
 */
export function formatarTempo(ms: Milissegundos): string {
  const negativo = ms < 0;
  const total = Math.abs(Math.round(ms));

  const minutos = Math.floor(total / 60_000);
  const segundos = Math.floor((total % 60_000) / 1_000);
  const milis = total % 1_000;
  const frac = String(milis).padStart(3, "0");

  const texto =
    minutos > 0
      ? `${minutos}:${String(segundos).padStart(2, "0")}.${frac}`
      : `${segundos}.${frac}s`;

  return negativo ? `-${texto}` : texto;
}

/**
 * Formata uma diferenca entre tempos, sempre com sinal.
 * Usado em "Diferenca para o piloto da frente: 0.221s" (secao 5.1).
 */
export function formatarDiferenca(ms: Milissegundos): string {
  const sinal = ms > 0 ? "+" : ms < 0 ? "-" : "";
  return `${sinal}${formatarTempo(Math.abs(ms))}`;
}

/** true quando `novo` e mais rapido que `anterior`. Sem tempo anterior, qualquer tempo e melhora. */
export function melhorouTempo(
  novo: Milissegundos,
  anterior: Milissegundos | null | undefined,
): boolean {
  if (anterior === null || anterior === undefined) return true;
  return novo < anterior;
}
