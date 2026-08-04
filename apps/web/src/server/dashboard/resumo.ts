import "server-only";

import { prisma } from "@napole/db";
import { periodoDoMes } from "@napole/core";

export interface ResumoOperacao {
  totalPilotos: number;
  pilotosAtivos: number;
  corridasNoMes: number;
  novosCadastrosNoMes: number;
  penalidadesNoMes: number;
}

/**
 * Numeros do topo do dashboard (secao 10 do escopo).
 *
 * "Piloto ativo" = correu nos ultimos 30 dias. O escopo pede o indicador sem
 * definir o corte; 30 dias conversa com o aviso de inatividade de 20 dias
 * previsto na secao 8.1.
 */
export async function carregarResumo(referencia: Date = new Date()): Promise<ResumoOperacao> {
  const mes = periodoDoMes(referencia);
  const trintaDiasAtras = new Date(referencia.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalPilotos, pilotosAtivos, corridasNoMes, novosCadastrosNoMes, penalidadesNoMes] =
    await Promise.all([
      prisma.piloto.count({ where: { status: { not: "INATIVO" } } }),
      prisma.piloto.count({
        where: { status: "ATIVO", ultimaCorridaEm: { gte: trintaDiasAtras } },
      }),
      prisma.corrida.count({ where: { data: { gte: mes.inicio, lt: mes.fim } } }),
      prisma.piloto.count({ where: { criadoEm: { gte: mes.inicio, lt: mes.fim } } }),
      prisma.penalidade.count({ where: { data: { gte: mes.inicio, lt: mes.fim } } }),
    ]);

  return {
    totalPilotos,
    pilotosAtivos,
    corridasNoMes,
    novosCadastrosNoMes,
    penalidadesNoMes,
  };
}
