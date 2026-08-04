import "server-only";

import { prisma } from "@napole/db";
import { formatarNumeroPiloto, nomeCategoria } from "@napole/core";

export interface PilotoEncontrado {
  id: string;
  numero: number;
  numeroFormatado: string;
  nomeCompleto: string;
  nomeExibicao: string;
  categoria: string;
  nomeDaCategoria: string;
  status: string;
  melhorVoltaMs: number | null;
}

const SELECAO_PILOTO = {
  id: true,
  numero: true,
  nomeCompleto: true,
  nomeExibicao: true,
  categoria: true,
  status: true,
  melhorVoltaMs: true,
} as const;

type PilotoSelecionado = {
  id: string;
  numero: number;
  nomeCompleto: string;
  nomeExibicao: string;
  categoria: Parameters<typeof nomeCategoria>[0];
  status: string;
  melhorVoltaMs: number | null;
};

function paraPilotoEncontrado(piloto: PilotoSelecionado): PilotoEncontrado {
  return {
    ...piloto,
    numeroFormatado: formatarNumeroPiloto(piloto.numero),
    nomeDaCategoria: nomeCategoria(piloto.categoria),
  };
}

/** Busca pelo numero do piloto — o caminho do balcao (secao 12.1). */
export async function buscarPorNumero(numero: number): Promise<PilotoEncontrado | null> {
  if (!Number.isSafeInteger(numero) || numero <= 0 || numero > 2_147_483_647) return null;

  const piloto = await prisma.piloto.findUnique({
    where: { numero },
    select: SELECAO_PILOTO,
  });

  if (!piloto) return null;

  return paraPilotoEncontrado(piloto);
}

/** Lista inicial do painel, em ordem de numero do piloto. */
export async function listarPilotos(limite = 50): Promise<PilotoEncontrado[]> {
  const pilotos = await prisma.piloto.findMany({
    select: SELECAO_PILOTO,
    orderBy: { numero: "asc" },
    take: limite,
  });

  return pilotos.map(paraPilotoEncontrado);
}

/**
 * Busca livre por numero, nome, telefone ou e-mail (secao 11).
 *
 * Um campo so no painel: o operador digita o que tem em maos, sem escolher
 * antes em qual coluna procurar.
 */
export async function buscarPilotos(termo: string, limite = 20): Promise<PilotoEncontrado[]> {
  const texto = termo.trim();
  if (texto === "") return [];

  const digitos = texto.replace(/\D/g, "");
  const numeroInformado = /^#?\d+$/.test(texto) ? Number(texto.replace("#", "")) : null;
  const numero =
    numeroInformado !== null &&
    Number.isSafeInteger(numeroInformado) &&
    numeroInformado > 0 &&
    numeroInformado <= 2_147_483_647
      ? numeroInformado
      : null;

  const pilotos = await prisma.piloto.findMany({
    where: {
      OR: [
        ...(numero !== null ? [{ numero }] : []),
        { nomeCompleto: { contains: texto, mode: "insensitive" as const } },
        { nomeExibicao: { contains: texto, mode: "insensitive" as const } },
        { email: { contains: texto, mode: "insensitive" as const } },
        ...(digitos.length >= 4 ? [{ telefone: { contains: digitos } }] : []),
      ],
    },
    select: SELECAO_PILOTO,
    orderBy: { numero: "asc" },
    take: limite,
  });

  return pilotos.map(paraPilotoEncontrado);
}
