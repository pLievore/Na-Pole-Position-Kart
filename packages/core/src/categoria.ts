import { partesDataCivil, partesDataOperacional } from "./data-operacional";
import type { Categoria, CategoriaBase, Sexo } from "./tipos";

/**
 * Categoria automatica por peso (secao 2.3 do escopo).
 *
 * As faixas ficam nesta constante e nao espalhadas em `if`s, porque o escopo ja
 * avisa que as faixas femininas "podem ser ajustadas depois, conforme a
 * distribuicao real das pilotas". A tela "Configuracoes de categorias" do ADM
 * vai editar exatamente estes valores.
 *
 * IMPORTANTE — faixas continuas: o documento escreve "ate 66 kg" e "67 a 85 kg",
 * o que deixa 66,5 kg sem categoria. Aqui o limite superior de cada faixa e
 * inclusivo e a proxima comeca logo acima, entao nenhum peso fica de fora.
 */
export const FAIXAS_PESO = {
  MASCULINO: [
    { categoria: "MASCULINO_LEVE", pesoMaximoKg: 66 },
    { categoria: "MASCULINO_MEDIO", pesoMaximoKg: 85 },
    { categoria: "MASCULINO_PESADO", pesoMaximoKg: Infinity },
  ],
  FEMININO: [
    { categoria: "FEMININO_LEVE", pesoMaximoKg: 60 },
    { categoria: "FEMININO_MEDIO", pesoMaximoKg: 75 },
    { categoria: "FEMININO_PESADO", pesoMaximoKg: Infinity },
  ],
} as const satisfies Record<
  CategoriaBase,
  ReadonlyArray<{ categoria: Categoria; pesoMaximoKg: number }>
>;

/** Criterios operacionais da categoria Junior (secao 2.3 do escopo). */
export const REGRAS_JUNIOR = {
  idadeMinima: 14,
  alturaMinimaMetros: 1.6,
  /**
   * Idade a partir da qual o piloto deixa de correr no Junior e passa a competir
   * pela categoria de peso. Confirmado com a operacao em 2026-08-04: vale de 14
   * a 17 anos, em categoria unica (sem divisao por sexo nem por peso).
   */
  idadeMaximaExclusiva: 18,
  exigeContatoResponsavel: true,
} as const;

export const PESO_MINIMO_KG = 25;
export const PESO_MAXIMO_KG = 250;

export type ResultadoElegibilidade = { elegivel: true } | { elegivel: false; motivos: string[] };

/** Idade em anos completos na data de referencia. */
export function calcularIdade(dataNascimento: Date, referencia: Date = new Date()): number {
  const nascimento = partesDataCivil(dataNascimento);
  const hoje = partesDataOperacional(referencia);

  let idade = hoje.ano - nascimento.ano;
  const mes = hoje.mes - nascimento.mes;
  if (mes < 0 || (mes === 0 && hoje.dia < nascimento.dia)) {
    idade -= 1;
  }
  return idade;
}

/**
 * Verifica se um piloto menor de idade pode correr no Junior.
 * A altura e aferida na pista, entao pode nao existir no momento do cadastro.
 */
export function verificarElegibilidadeJunior(entrada: {
  idade: number;
  alturaMetros?: number | null;
  temContatoResponsavel: boolean;
}): ResultadoElegibilidade {
  const motivos: string[] = [];

  if (entrada.idade < REGRAS_JUNIOR.idadeMinima) {
    motivos.push(`Idade minima para correr e ${REGRAS_JUNIOR.idadeMinima} anos.`);
  }
  if (entrada.alturaMetros != null && entrada.alturaMetros < REGRAS_JUNIOR.alturaMinimaMetros) {
    motivos.push(`Altura minima para correr e ${REGRAS_JUNIOR.alturaMinimaMetros.toFixed(2)} m.`);
  }
  if (REGRAS_JUNIOR.exigeContatoResponsavel && !entrada.temContatoResponsavel) {
    motivos.push("E necessario cadastrar e-mail/contato do responsavel.");
  }

  return motivos.length === 0 ? { elegivel: true } : { elegivel: false, motivos };
}

/**
 * Resolve a base de peso a partir do sexo informado.
 * Sexo OUTRO exige uma base explicita — nao ha faixa de peso neutra no escopo.
 */
export function resolverCategoriaBase(
  sexo: Sexo,
  baseInformada?: CategoriaBase | null,
): CategoriaBase {
  if (sexo === "MASCULINO" || sexo === "FEMININO") return sexo;
  if (baseInformada) return baseInformada;
  throw new Error(
    "Sexo 'OUTRO' exige informar a categoria-base (MASCULINO ou FEMININO) para definir a faixa de peso.",
  );
}

/** Categoria a partir da base e do peso, ignorando idade. */
export function categoriaPorPeso(base: CategoriaBase, pesoKg: number): Categoria {
  if (!Number.isFinite(pesoKg) || pesoKg < PESO_MINIMO_KG || pesoKg > PESO_MAXIMO_KG) {
    throw new Error(
      `Peso invalido: ${pesoKg} kg. Informe um valor entre ${PESO_MINIMO_KG} e ${PESO_MAXIMO_KG} kg.`,
    );
  }

  const faixa = FAIXAS_PESO[base].find((f) => pesoKg <= f.pesoMaximoKg);
  // A ultima faixa tem limite Infinity, entao sempre ha correspondencia.
  return faixa!.categoria;
}

/**
 * Categoria final do piloto (secao 2.3).
 *
 * Ordem das regras:
 * 1. Menor de `idadeMaximaExclusiva` e elegivel -> JUNIOR;
 * 2. Caso contrario -> categoria pela faixa de peso da base.
 *
 * O peso conferido na balanca, quando existe, tem precedencia sobre o
 * declarado — e a administracao pode sobrescrever a categoria manualmente
 * (secao 11), o que e feito na camada de aplicacao, nao aqui.
 */
export function definirCategoria(entrada: {
  sexo: Sexo;
  categoriaBase?: CategoriaBase | null;
  pesoDeclaradoKg: number;
  pesoConferidoKg?: number | null;
  dataNascimento: Date;
  alturaMetros?: number | null;
  temContatoResponsavel?: boolean;
  referencia?: Date;
}): Categoria {
  const idade = calcularIdade(entrada.dataNascimento, entrada.referencia ?? new Date());

  if (idade < REGRAS_JUNIOR.idadeMaximaExclusiva) {
    const elegibilidade = verificarElegibilidadeJunior({
      idade,
      alturaMetros: entrada.alturaMetros,
      temContatoResponsavel: entrada.temContatoResponsavel ?? false,
    });
    if (!elegibilidade.elegivel) {
      throw new Error(`Piloto nao elegivel para correr: ${elegibilidade.motivos.join(" ")}`);
    }
    return "JUNIOR";
  }

  const base = resolverCategoriaBase(entrada.sexo, entrada.categoriaBase);
  return categoriaPorPeso(base, entrada.pesoConferidoKg ?? entrada.pesoDeclaradoKg);
}

const NOMES_CATEGORIA: Record<Categoria, string> = {
  MASCULINO_LEVE: "Masculino Leve",
  MASCULINO_MEDIO: "Masculino Medio",
  MASCULINO_PESADO: "Masculino Pesado",
  FEMININO_LEVE: "Feminino Leve",
  FEMININO_MEDIO: "Feminino Medio",
  FEMININO_PESADO: "Feminino Pesado",
  JUNIOR: "Junior",
};

/** Nome da categoria para exibicao ao publico. */
export function nomeCategoria(categoria: Categoria): string {
  return NOMES_CATEGORIA[categoria];
}
