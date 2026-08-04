import { totalDescontado, type PenalidadeAplicada } from "./penalidade";

/**
 * Pontuacao esportiva (secao 6 do escopo).
 *
 * Lembrete que vale repetir porque muda o produto: pontos NAO sao credito,
 * carteira ou beneficio financeiro. Servem para medir participacao e
 * disciplina. O ranking principal continua sendo por melhor volta.
 */
export const TABELA_PONTOS = {
  PARTICIPACAO: { pontos: 10, rotulo: "Participou de uma corrida valida" },
  MELHOROU_TEMPO: { pontos: 5, rotulo: "Melhorou o proprio tempo" },
  ENTROU_TOP10: { pontos: 10, rotulo: "Entrou no Top 10 da categoria" },
  MELHOR_TEMPO_DO_DIA: { pontos: 15, rotulo: "Melhor tempo do dia na categoria" },
} as const;

export type CodigoPontuacao = keyof typeof TABELA_PONTOS;

export interface ItemPontuacao {
  codigo: CodigoPontuacao | "PENALIDADES";
  rotulo: string;
  pontos: number;
}

export interface ResultadoPontuacao {
  /** Detalhamento linha a linha — e o que o piloto ve no extrato de pontos. */
  itens: ItemPontuacao[];
  /** Pontos ganhos antes das penalidades. */
  pontosGanhos: number;
  /** Total descontado por penalidades (negativo ou zero). */
  pontosDescontados: number;
  /** Saldo da corrida. Pode ser negativo. */
  total: number;
}

export interface ContextoPontuacao {
  /** Corrida oficialmente registrada pela Na Pole Position (regra 1 da secao 17). */
  corridaValida: boolean;
  /**
   * Primeira bateria do piloto naquele dia.
   *
   * Um piloto pode correr varias baterias no mesmo dia e cada uma vira um
   * lancamento — mas os +10 de participacao valem uma vez por dia. Sem isso,
   * quem compra quatro baterias leva 40 pontos de uma vez e o ranking de pontos
   * vira medida de quanto a pessoa gastou, nao de com que frequencia ela volta.
   */
  primeiraCorridaDoDia: boolean;
  /** O tempo desta corrida superou a melhor volta pessoal anterior. */
  melhorouProprioTempo: boolean;
  /** O piloto estava fora do Top 10 da categoria e entrou apos esta corrida. */
  entrouNoTop10Categoria: boolean;
  /** Foi o melhor tempo do dia dentro da categoria. */
  melhorTempoDoDiaNaCategoria: boolean;
  penalidades?: readonly PenalidadeAplicada[];
}

/**
 * Calcula os pontos de uma corrida.
 *
 * Corrida invalida nao gera pontos de participacao nem bonus, mas as
 * penalidades continuam valendo — punir uma conduta perigosa nao depende
 * do tempo ter sido homologado.
 */
export function calcularPontosCorrida(contexto: ContextoPontuacao): ResultadoPontuacao {
  const itens: ItemPontuacao[] = [];

  const adicionar = (codigo: CodigoPontuacao) => {
    const { pontos, rotulo } = TABELA_PONTOS[codigo];
    itens.push({ codigo, rotulo, pontos });
  };

  if (contexto.corridaValida) {
    if (contexto.primeiraCorridaDoDia) adicionar("PARTICIPACAO");
    if (contexto.melhorouProprioTempo) adicionar("MELHOROU_TEMPO");
    if (contexto.entrouNoTop10Categoria) adicionar("ENTROU_TOP10");
    if (contexto.melhorTempoDoDiaNaCategoria) adicionar("MELHOR_TEMPO_DO_DIA");
  }

  const pontosGanhos = itens.reduce((soma, item) => soma + item.pontos, 0);
  const pontosDescontados = totalDescontado(contexto.penalidades ?? []);

  if (pontosDescontados !== 0) {
    itens.push({
      codigo: "PENALIDADES",
      rotulo: "Penalidades aplicadas",
      pontos: pontosDescontados,
    });
  }

  return {
    itens,
    pontosGanhos,
    pontosDescontados,
    total: pontosGanhos + pontosDescontados,
  };
}
