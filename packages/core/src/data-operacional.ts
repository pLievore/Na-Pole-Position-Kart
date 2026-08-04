/** Fuso da pista: datas de corrida representam um dia civil neste local. */
export const FUSO_HORARIO_OPERACIONAL = "America/Sao_Paulo";

const REGEX_DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const REGEX_HORA = /^(\d{2}):(\d{2})$/;
const REGEX_DATA_HORA_LOCAL = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/;

const formatadorPartes = new Intl.DateTimeFormat("en-US-u-ca-gregory-nu-latn", {
  timeZone: FUSO_HORARIO_OPERACIONAL,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: FUSO_HORARIO_OPERACIONAL,
});

interface PartesDataHora {
  ano: number;
  mes: number;
  dia: number;
  hora: number;
  minuto: number;
  segundo: number;
}

export interface PartesDataCivil {
  ano: number;
  mes: number;
  dia: number;
}

export interface PeriodoDiaOperacional {
  inicio: Date;
  /** Exclusivo: `data < fim`. */
  fim: Date;
}

export class DataOperacionalInvalidaError extends Error {
  constructor(entrada: string) {
    super(`Data operacional invalida "${entrada}": use o formato AAAA-MM-DD`);
    this.name = "DataOperacionalInvalidaError";
  }
}

export class HoraOperacionalInvalidaError extends Error {
  constructor(entrada: string) {
    super(`Hora operacional invalida "${entrada}": use o formato HH:mm`);
    this.name = "HoraOperacionalInvalidaError";
  }
}

export class DataHoraOperacionalInvalidaError extends Error {
  constructor(entrada: string) {
    super(`Data e hora operacional invalidas "${entrada}": use o formato AAAA-MM-DDTHH:mm`);
    this.name = "DataHoraOperacionalInvalidaError";
  }
}

function conferirDate(valor: Date): void {
  if (!Number.isFinite(valor.getTime())) {
    throw new DataOperacionalInvalidaError(String(valor));
  }
}

function partesEmSaoPaulo(valor: Date): PartesDataHora {
  conferirDate(valor);

  const partes = new Map(
    formatadorPartes
      .formatToParts(valor)
      .filter((parte) => parte.type !== "literal")
      .map((parte) => [parte.type, Number(parte.value)]),
  );

  return {
    ano: partes.get("year")!,
    mes: partes.get("month")!,
    dia: partes.get("day")!,
    hora: partes.get("hour")!,
    minuto: partes.get("minute")!,
    segundo: partes.get("second")!,
  };
}

function inicioDoDiaNoFuso(ano: number, mes: number, dia: number): Date {
  const meiaNoiteComoUtc = Date.UTC(ano, mes - 1, dia);
  let candidato = new Date(meiaNoiteComoUtc);

  // Intl informa a hora civil do candidato. A diferenca para a meia-noite
  // desejada corrige o instante sem depender do fuso configurado no servidor.
  for (let tentativa = 0; tentativa < 3; tentativa += 1) {
    const partes = partesEmSaoPaulo(candidato);
    const horarioCivilComoUtc = Date.UTC(
      partes.ano,
      partes.mes - 1,
      partes.dia,
      partes.hora,
      partes.minuto,
      partes.segundo,
    );
    const ajuste = meiaNoiteComoUtc - horarioCivilComoUtc;
    if (ajuste === 0) return candidato;
    candidato = new Date(candidato.getTime() + ajuste);
  }

  return candidato;
}

function instanteNoFuso(
  ano: number,
  mes: number,
  dia: number,
  hora: number,
  minuto: number,
): Date {
  const horarioCivilComoUtc = Date.UTC(ano, mes - 1, dia, hora, minuto);
  let candidato = new Date(horarioCivilComoUtc);

  // O deslocamento do fuso pode mudar historicamente. Consultar Intl a cada
  // tentativa evita assumir que Sao Paulo sera UTC-3 para sempre.
  for (let tentativa = 0; tentativa < 4; tentativa += 1) {
    const partes = partesEmSaoPaulo(candidato);
    const candidatoCivilComoUtc = Date.UTC(
      partes.ano,
      partes.mes - 1,
      partes.dia,
      partes.hora,
      partes.minuto,
      partes.segundo,
    );
    const ajuste = horarioCivilComoUtc - candidatoCivilComoUtc;
    if (ajuste === 0) break;
    candidato = new Date(candidato.getTime() + ajuste);
  }

  const prova = partesEmSaoPaulo(candidato);
  if (
    prova.ano !== ano ||
    prova.mes !== mes ||
    prova.dia !== dia ||
    prova.hora !== hora ||
    prova.minuto !== minuto
  ) {
    throw new DataHoraOperacionalInvalidaError(
      `${dataISO(ano, mes, dia)}T${horaISO(hora, minuto)}`,
    );
  }

  return candidato;
}

function validarPartes(entrada: string): [ano: number, mes: number, dia: number] {
  const resultado = REGEX_DATA_ISO.exec(entrada);
  if (!resultado) throw new DataOperacionalInvalidaError(entrada);

  const ano = Number(resultado[1]);
  const mes = Number(resultado[2]);
  const dia = Number(resultado[3]);
  const prova = new Date(Date.UTC(ano, mes - 1, dia, 12));

  if (
    ano < 1000 ||
    prova.getUTCFullYear() !== ano ||
    prova.getUTCMonth() !== mes - 1 ||
    prova.getUTCDate() !== dia
  ) {
    throw new DataOperacionalInvalidaError(entrada);
  }

  return [ano, mes, dia];
}

function dataISO(ano: number, mes: number, dia: number): string {
  return `${String(ano).padStart(4, "0")}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function horaISO(hora: number, minuto: number): string {
  return `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
}

function validarHora(entrada: string): [hora: number, minuto: number] {
  const resultado = REGEX_HORA.exec(entrada);
  if (!resultado) throw new HoraOperacionalInvalidaError(entrada);

  const hora = Number(resultado[1]);
  const minuto = Number(resultado[2]);
  if (hora > 23 || minuto > 59) throw new HoraOperacionalInvalidaError(entrada);

  return [hora, minuto];
}

/**
 * Le um `Date` que representa somente uma data, como uma coluna PostgreSQL
 * `date`. Prisma entrega esse valor em meia-noite UTC; getters locais fariam a
 * data retroceder em fusos a oeste de Greenwich.
 */
export function partesDataCivil(valor: Date): PartesDataCivil {
  conferirDate(valor);
  return {
    ano: valor.getUTCFullYear(),
    mes: valor.getUTCMonth() + 1,
    dia: valor.getUTCDate(),
  };
}

/** Converte `AAAA-MM-DD` em um portador estavel de data civil, sem horario. */
export function parseDataCivil(entrada: string): Date {
  const texto = entrada.trim();
  const [ano, mes, dia] = validarPartes(texto);
  return new Date(Date.UTC(ano, mes - 1, dia));
}

/** Partes do dia corrente na pista para um instante qualquer. */
export function partesDataOperacional(valor: Date): PartesDataCivil {
  const { ano, mes, dia } = partesEmSaoPaulo(valor);
  return { ano, mes, dia };
}

/** Cria o inicio de uma data valida no fuso da pista. */
export function criarDataOperacional(ano: number, mes: number, dia: number): Date {
  validarPartes(dataISO(ano, mes, dia));
  return inicioDoDiaNoFuso(ano, mes, dia);
}

/**
 * Converte o valor de um `<input type="date">` no inicio daquele dia na pista.
 *
 * `new Date("2026-08-04")` significa meia-noite UTC, que ainda e 03/08 em Sao
 * Paulo. Esta funcao preserva o dia escolhido independentemente do fuso do
 * navegador, servidor ou banco.
 */
export function parseDataOperacional(entrada: string): Date {
  const texto = entrada.trim();
  const [ano, mes, dia] = validarPartes(texto);
  return criarDataOperacional(ano, mes, dia);
}

/** Converte data e hora civis da pista em um instante absoluto. */
export function parseDataHoraOperacional(entrada: string): Date {
  const texto = entrada.trim();
  const resultado = REGEX_DATA_HORA_LOCAL.exec(texto);
  if (!resultado) throw new DataHoraOperacionalInvalidaError(texto);

  let ano: number;
  let mes: number;
  let dia: number;
  let hora: number;
  let minuto: number;

  try {
    [ano, mes, dia] = validarPartes(resultado[1]!);
    [hora, minuto] = validarHora(resultado[2]!);
  } catch {
    throw new DataHoraOperacionalInvalidaError(texto);
  }

  return instanteNoFuso(ano, mes, dia, hora, minuto);
}

/** Hora civil da pista em formato aceito por `<input type="time">`. */
export function horaOperacionalISO(valor: Date): string {
  const partes = partesEmSaoPaulo(valor);
  return horaISO(partes.hora, partes.minuto);
}

/** Data e hora civis da pista em formato aceito por `<input type="datetime-local">`. */
export function dataHoraOperacionalISO(valor: Date): string {
  const partes = partesEmSaoPaulo(valor);
  return `${dataISO(partes.ano, partes.mes, partes.dia)}T${horaISO(partes.hora, partes.minuto)}`;
}

/** Data civil da pista em formato aceito por `<input type="date">`. */
export function dataOperacionalISO(valor: Date): string {
  const partes = partesDataOperacional(valor);
  return dataISO(partes.ano, partes.mes, partes.dia);
}

/** Formata uma data de corrida sem deixar o fuso do ambiente mudar o dia. */
export function formatarDataOperacional(valor: Date): string {
  conferirDate(valor);
  return formatadorData.format(valor);
}

/** Limites exatos do dia civil da pista, usados nas regras que valem uma vez ao dia. */
export function periodoDoDiaOperacional(referencia: Date): PeriodoDiaOperacional {
  const partes = partesDataOperacional(referencia);
  const inicio = criarDataOperacional(partes.ano, partes.mes, partes.dia);

  const proximoDia = new Date(Date.UTC(partes.ano, partes.mes - 1, partes.dia + 1, 12));
  const fim = criarDataOperacional(
    proximoDia.getUTCFullYear(),
    proximoDia.getUTCMonth() + 1,
    proximoDia.getUTCDate(),
  );

  return { inicio, fim };
}
