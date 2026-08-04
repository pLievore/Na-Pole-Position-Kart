/**
 * Tipos compartilhados do dominio.
 *
 * Os valores destes tipos sao os mesmos nomes usados nos enums do Prisma
 * (packages/db/prisma/schema.prisma). Manter os dois lados iguais e proposital:
 * o banco persiste o mesmo vocabulario que as regras usam.
 */

/** Sexo informado pelo piloto no cadastro (secao 2.1 do escopo). */
export type Sexo = "MASCULINO" | "FEMININO" | "OUTRO";

/**
 * Base usada para definir a categoria por peso.
 *
 * Para sexo MASCULINO/FEMININO a base e a propria escolha do piloto. Para
 * OUTRO, o piloto (ou a administracao) precisa indicar em qual tabela de peso
 * ele corre — o escopo permite "outro" no cadastro, mas so define faixas
 * masculinas e femininas, entao a base e obrigatoria.
 */
export type CategoriaBase = "MASCULINO" | "FEMININO";

/** Categoria final em que o piloto compete e aparece no ranking. */
export type Categoria =
  | "MASCULINO_LEVE"
  | "MASCULINO_MEDIO"
  | "MASCULINO_PESADO"
  | "FEMININO_LEVE"
  | "FEMININO_MEDIO"
  | "FEMININO_PESADO"
  | "JUNIOR";

/** Tipos de penalidade previstos na secao 7.2 do escopo. */
export type TipoPenalidade =
  | "ADVERTENCIA"
  | "PUNICAO"
  | "PUNICAO_GRAVE"
  | "DESCLASSIFICACAO";

/** Motivos previstos na secao 7.1 do escopo. */
export type MotivoPenalidade =
  | "BATIDA"
  | "ULTRAPASSAGEM_FORCADA"
  | "DESRESPEITO_BANDEIRAS"
  | "BLOQUEIO_PISTA"
  | "NAO_CEDER_PASSAGEM"
  | "DIRECAO_PERIGOSA"
  | "REINCIDENCIA"
  | "OUTRO";

/** Situacao do cadastro do piloto. */
export type StatusPiloto = "ATIVO" | "BLOQUEADO" | "INATIVO";

/** Tempo de volta em milissegundos. Ex.: 32.487s => 32487. */
export type Milissegundos = number;
