import "server-only";

import { prisma } from "@napole/db";
import {
  diasSemCorrer,
  estaInativo,
  formatarNumeroPiloto,
  nomeCategoria,
  type Categoria,
} from "@napole/core";
import { carregarMinhaPosicao } from "@/server/ranking/consultas";

export interface Perfil {
  numero: string;
  nomeExibicao: string;
  categoria: Categoria;
  nomeDaCategoria: string;
  melhorVoltaMs: number | null;
  melhorVoltaEm: Date | null;
  totalCorridas: number;
  pontosTotal: number;
  ultimaCorridaEm: Date | null;
  diasSemCorrer: number;
  inativo: boolean;
  totalPenalidades: number;
  posicaoGeral: Awaited<ReturnType<typeof carregarMinhaPosicao>>;
  posicaoCategoria: Awaited<ReturnType<typeof carregarMinhaPosicao>>;
}

/**
 * Dados do perfil do piloto (secao 3 do escopo).
 *
 * O peso NAO e retornado: o piloto ve apenas a categoria (secao 2.4).
 */
export async function carregarPerfil(pilotoId: string): Promise<Perfil | null> {
  const piloto = await prisma.piloto.findUnique({
    where: { id: pilotoId },
    select: {
      numero: true,
      nomeExibicao: true,
      categoria: true,
      melhorVoltaMs: true,
      melhorVoltaEm: true,
      totalCorridas: true,
      pontosTotal: true,
      ultimaCorridaEm: true,
      _count: { select: { penalidades: true } },
    },
  });

  if (!piloto) return null;

  const [posicaoGeral, posicaoCategoria] = await Promise.all([
    carregarMinhaPosicao(pilotoId),
    carregarMinhaPosicao(pilotoId, { categoria: piloto.categoria }),
  ]);

  return {
    numero: formatarNumeroPiloto(piloto.numero),
    nomeExibicao: piloto.nomeExibicao,
    categoria: piloto.categoria,
    nomeDaCategoria: nomeCategoria(piloto.categoria),
    melhorVoltaMs: piloto.melhorVoltaMs,
    melhorVoltaEm: piloto.melhorVoltaEm,
    totalCorridas: piloto.totalCorridas,
    pontosTotal: piloto.pontosTotal,
    ultimaCorridaEm: piloto.ultimaCorridaEm,
    diasSemCorrer: diasSemCorrer(piloto.ultimaCorridaEm),
    inativo: estaInativo(piloto.ultimaCorridaEm),
    totalPenalidades: piloto._count.penalidades,
    posicaoGeral,
    posicaoCategoria,
  };
}
