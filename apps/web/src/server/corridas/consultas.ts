import "server-only";

import { prisma } from "@napole/db";
import { formatarNumeroPiloto, formatarTempo, nomeCategoria, rotuloPenalidade } from "@napole/core";

export interface LinhaCorrida {
  id: string;
  data: Date;
  numeroPiloto: string;
  nomeExibicao: string;
  categoria: string;
  melhorVolta: string;
  kart: string;
  pontosTotal: number;
  penalidades: string[];
  valida: boolean;
  operador: string;
  observacao: string | null;
}

/** Ultimos lancamentos, do mais recente para o mais antigo (secao 12). */
export async function listarCorridas(limite = 50): Promise<LinhaCorrida[]> {
  const corridas = await prisma.corrida.findMany({
    take: limite,
    orderBy: [{ data: "desc" }, { criadoEm: "desc" }],
    select: {
      id: true,
      data: true,
      numeroPiloto: true,
      melhorVoltaMs: true,
      categoriaNaCorrida: true,
      pontosTotal: true,
      valida: true,
      observacao: true,
      piloto: { select: { nomeExibicao: true } },
      kart: { select: { numero: true } },
      operador: { select: { nome: true } },
      penalidades: { select: { tipo: true } },
    },
  });

  return corridas.map((corrida) => ({
    id: corrida.id,
    data: corrida.data,
    numeroPiloto: formatarNumeroPiloto(corrida.numeroPiloto),
    nomeExibicao: corrida.piloto.nomeExibicao,
    categoria: nomeCategoria(corrida.categoriaNaCorrida),
    melhorVolta: formatarTempo(corrida.melhorVoltaMs),
    kart: corrida.kart ? `Kart ${corrida.kart.numero}` : "—",
    pontosTotal: corrida.pontosTotal,
    penalidades: corrida.penalidades.map((p) => rotuloPenalidade(p.tipo)),
    valida: corrida.valida,
    operador: corrida.operador.nome,
    observacao: corrida.observacao,
  }));
}

/** Historico do piloto para a area logada (secao 4 do escopo). */
export async function historicoDoPiloto(pilotoId: string, limite = 50) {
  const corridas = await prisma.corrida.findMany({
    where: { pilotoId, valida: true },
    take: limite,
    orderBy: [{ data: "desc" }, { criadoEm: "desc" }],
    select: {
      id: true,
      data: true,
      melhorVoltaMs: true,
      pontosTotal: true,
      pontosDescontados: true,
      observacao: true,
      kart: { select: { numero: true } },
      penalidades: { select: { tipo: true, motivo: true } },
    },
  });

  return corridas.map((corrida) => ({
    id: corrida.id,
    data: corrida.data,
    melhorVolta: formatarTempo(corrida.melhorVoltaMs),
    melhorVoltaMs: corrida.melhorVoltaMs,
    kart: corrida.kart ? `Kart ${corrida.kart.numero}` : "—",
    pontos: corrida.pontosTotal,
    pontosDescontados: corrida.pontosDescontados,
    penalidades: corrida.penalidades.map((p) => rotuloPenalidade(p.tipo)),
    observacao: corrida.observacao,
  }));
}
