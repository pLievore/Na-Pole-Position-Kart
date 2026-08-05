/**
 * Limite de taxa para endpoints publicos.
 *
 * O agendamento e o unico ponto do sistema em que alguem sem conta grava dados
 * e **ocupa vaga real**. Sem limite, um script com telefones aleatorios lota a
 * agenda de um fim de semana inteiro em segundos — e a operacao so descobre
 * quando ninguem aparece na pista.
 *
 * As regras sao definidas em janelas cumulativas: uma rajada curta e barrada
 * pela janela de minutos, e o uso constante durante o dia inteiro e barrado
 * pela janela longa. As duas precisam passar.
 */

export interface JanelaLimite {
  /** Tamanho da janela deslizante, em minutos. */
  janelaMinutos: number;
  /** Quantas tentativas sao aceitas dentro da janela. */
  maximo: number;
}

export type RegraLimite = readonly JanelaLimite[];

/**
 * Os valores partem do uso real esperado: uma pista unica, onde a mesma pessoa
 * raramente reserva mais de uma vez no mesmo dia. Sao folgados para o visitante
 * legitimo e apertados para automacao.
 */
export const REGRAS_LIMITE = {
  /** Solicitacao de reserva, por origem de rede. */
  AGENDAMENTO_POR_IP: [
    { janelaMinutos: 10, maximo: 3 },
    { janelaMinutos: 60 * 24, maximo: 10 },
  ],
  /** Solicitacao de reserva, por telefone informado. */
  AGENDAMENTO_POR_TELEFONE: [{ janelaMinutos: 60 * 24, maximo: 3 }],
  /** Consulta de protocolo — o codigo nao e adivinhavel, mas nao custa limitar. */
  CONSULTA_PROTOCOLO_POR_IP: [{ janelaMinutos: 10, maximo: 20 }],
  /** Tentativa de login, por origem de rede. */
  LOGIN_POR_IP: [
    { janelaMinutos: 15, maximo: 10 },
    { janelaMinutos: 60, maximo: 30 },
  ],
  /** Tentativa de login, por e-mail — protege uma conta especifica de forca bruta. */
  LOGIN_POR_IDENTIFICADOR: [{ janelaMinutos: 15, maximo: 5 }],
  /** Cadastro de piloto, por origem de rede. */
  CADASTRO_POR_IP: [{ janelaMinutos: 60, maximo: 5 }],
} as const satisfies Record<string, RegraLimite>;

export type AcaoLimitada = keyof typeof REGRAS_LIMITE;

export interface ResultadoLimite {
  permitido: boolean;
  /** Quantas tentativas ainda cabem na janela mais restritiva. */
  restantes: number;
  /** Quando a proxima tentativa passa a ser aceita. `null` quando permitido. */
  liberaEm: Date | null;
}

/** Instante em que a janela de `minutos` comeca, contando de `agora` para tras. */
export function inicioDaJanela(agora: Date, minutos: number): Date {
  return new Date(agora.getTime() - minutos * 60_000);
}

/** A janela mais longa da regra — define ate quando vale a pena guardar tentativas. */
export function janelaMaisLongaMinutos(regra: RegraLimite): number {
  return regra.reduce((maior, janela) => Math.max(maior, janela.janelaMinutos), 0);
}

/**
 * Avalia uma regra contra os instantes das tentativas ja registradas.
 *
 * `tentativas` deve incluir a tentativa atual — a contagem e feita depois do
 * registro, de propriedade: sob concorrencia, contar a mais bloqueia; contar a
 * menos deixa passar.
 */
export function avaliarLimite(
  tentativas: readonly Date[],
  regra: RegraLimite,
  agora: Date = new Date(),
): ResultadoLimite {
  let restantes = Number.POSITIVE_INFINITY;
  let liberaEm: Date | null = null;

  for (const janela of regra) {
    const inicio = inicioDaJanela(agora, janela.janelaMinutos);
    const dentroDaJanela = tentativas
      .filter((instante) => instante > inicio)
      .sort((a, b) => a.getTime() - b.getTime());

    restantes = Math.min(restantes, janela.maximo - dentroDaJanela.length);

    if (dentroDaJanela.length > janela.maximo) {
      // A vaga volta quando a tentativa mais antiga da janela sair dela.
      const maisAntigaRelevante = dentroDaJanela[dentroDaJanela.length - janela.maximo - 1];
      const liberacao = maisAntigaRelevante
        ? new Date(maisAntigaRelevante.getTime() + janela.janelaMinutos * 60_000)
        : new Date(agora.getTime() + janela.janelaMinutos * 60_000);

      if (!liberaEm || liberacao > liberaEm) liberaEm = liberacao;
    }
  }

  return {
    permitido: liberaEm === null,
    restantes: Math.max(0, restantes === Number.POSITIVE_INFINITY ? 0 : restantes),
    liberaEm,
  };
}

/** Texto para o visitante, sem revelar qual limite foi atingido nem o número de tentativas. */
export function mensagemLimite(liberaEm: Date | null, agora: Date = new Date()): string {
  if (!liberaEm) return "Muitas tentativas. Aguarde alguns minutos e tente de novo.";

  const minutos = Math.max(1, Math.ceil((liberaEm.getTime() - agora.getTime()) / 60_000));

  if (minutos <= 60) {
    return `Muitas tentativas. Tente de novo em ${minutos} ${minutos === 1 ? "minuto" : "minutos"}.`;
  }

  const horas = Math.ceil(minutos / 60);
  return `Muitas tentativas. Tente de novo em ${horas} ${horas === 1 ? "hora" : "horas"}. Se precisar de ajuda, fale com a equipe pelo WhatsApp.`;
}
