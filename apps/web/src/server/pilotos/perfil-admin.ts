import "server-only";

import {
  formatarNumeroPiloto,
  nomeCategoria,
  rotuloMotivo,
  rotuloPenalidade,
  type Categoria,
  type CategoriaBase,
  type MotivoPenalidade,
  type Sexo,
  type StatusPiloto,
  type TipoPenalidade,
} from "@napole/core";
import { prisma } from "@napole/db";
import { carregarMinhaPosicao } from "@/server/ranking/consultas";

export interface CorridaDoPerfilAdministrativo {
  id: string;
  data: Date;
  melhorVoltaMs: number;
  kart: string;
  categoria: Categoria;
  nomeDaCategoria: string;
  valida: boolean;
  pontosGanhos: number;
  pontosDescontados: number;
  pontosTotal: number;
  penalidades: string[];
  operador: string;
  observacao: string | null;
}

export interface PenalidadeDoPerfilAdministrativo {
  id: string;
  data: Date;
  tipo: TipoPenalidade;
  tipoRotulo: string;
  motivo: MotivoPenalidade;
  motivoRotulo: string;
  motivoDetalhe: string | null;
  pontosDescontados: number;
  observacao: string | null;
  corridaId: string;
  corridaData: Date;
  operador: string;
}

export interface PerfilAdministrativo {
  id: string;
  numero: number;
  numeroFormatado: string;
  nomeCompleto: string;
  nomeExibicao: string;
  telefone: string;
  /** Nulo quando o cadastro foi feito no balcao sem e-mail. */
  email: string | null;
  dataNascimento: Date;
  sexo: Sexo;
  categoriaBase: CategoriaBase | null;
  pesoDeclaradoKg: string;
  pesoConferidoKg: string | null;
  pesoConferidoEm: Date | null;
  categoria: Categoria;
  nomeDaCategoria: string;
  categoriaManual: boolean;
  status: StatusPiloto;
  criadoEm: Date;
  atualizadoEm: Date;
  observacoesInternas: string | null;
  melhorVoltaMs: number | null;
  melhorVoltaEm: Date | null;
  pontosTotal: number;
  totalCorridas: number;
  ultimaCorridaEm: Date | null;
  posicaoGeral: Awaited<ReturnType<typeof carregarMinhaPosicao>>;
  posicaoCategoria: Awaited<ReturnType<typeof carregarMinhaPosicao>>;
  corridas: CorridaDoPerfilAdministrativo[];
  penalidades: PenalidadeDoPerfilAdministrativo[];
}

/**
 * Perfil interno completo do piloto (secao 11.1).
 *
 * Esta consulta e separada do perfil do piloto porque aqui os dados pessoais e
 * os pesos precisam aparecer para a operacao. Nenhum hash ou token e selecionado.
 */
export async function carregarPerfilAdministrativo(
  numero: number,
): Promise<PerfilAdministrativo | null> {
  const piloto = await prisma.piloto.findUnique({
    where: { numero },
    select: {
      id: true,
      numero: true,
      nomeCompleto: true,
      nomeExibicao: true,
      telefone: true,
      email: true,
      dataNascimento: true,
      sexo: true,
      categoriaBase: true,
      pesoDeclaradoKg: true,
      pesoConferidoKg: true,
      pesoConferidoEm: true,
      categoria: true,
      categoriaManual: true,
      status: true,
      criadoEm: true,
      atualizadoEm: true,
      observacoesInternas: true,
      melhorVoltaMs: true,
      melhorVoltaEm: true,
      pontosTotal: true,
      totalCorridas: true,
      ultimaCorridaEm: true,
      corridas: {
        orderBy: [{ data: "desc" }, { criadoEm: "desc" }],
        select: {
          id: true,
          data: true,
          melhorVoltaMs: true,
          categoriaNaCorrida: true,
          valida: true,
          pontosGanhos: true,
          pontosDescontados: true,
          pontosTotal: true,
          observacao: true,
          kart: { select: { numero: true } },
          operador: { select: { nome: true } },
          penalidades: { select: { tipo: true } },
        },
      },
      penalidades: {
        orderBy: [{ data: "desc" }, { criadoEm: "desc" }],
        select: {
          id: true,
          data: true,
          tipo: true,
          motivo: true,
          motivoDetalhe: true,
          pontosDescontados: true,
          observacao: true,
          corrida: { select: { id: true, data: true } },
          operador: { select: { nome: true } },
        },
      },
    },
  });

  if (!piloto) return null;

  const [posicaoGeral, posicaoCategoria] = await Promise.all([
    carregarMinhaPosicao(piloto.id),
    carregarMinhaPosicao(piloto.id, { categoria: piloto.categoria }),
  ]);

  return {
    id: piloto.id,
    numero: piloto.numero,
    numeroFormatado: formatarNumeroPiloto(piloto.numero),
    nomeCompleto: piloto.nomeCompleto,
    nomeExibicao: piloto.nomeExibicao,
    telefone: piloto.telefone,
    email: piloto.email,
    dataNascimento: piloto.dataNascimento,
    sexo: piloto.sexo,
    categoriaBase: piloto.categoriaBase,
    pesoDeclaradoKg: piloto.pesoDeclaradoKg.toString(),
    pesoConferidoKg: piloto.pesoConferidoKg?.toString() ?? null,
    pesoConferidoEm: piloto.pesoConferidoEm,
    categoria: piloto.categoria,
    nomeDaCategoria: nomeCategoria(piloto.categoria),
    categoriaManual: piloto.categoriaManual,
    status: piloto.status,
    criadoEm: piloto.criadoEm,
    atualizadoEm: piloto.atualizadoEm,
    observacoesInternas: piloto.observacoesInternas,
    melhorVoltaMs: piloto.melhorVoltaMs,
    melhorVoltaEm: piloto.melhorVoltaEm,
    pontosTotal: piloto.pontosTotal,
    totalCorridas: piloto.totalCorridas,
    ultimaCorridaEm: piloto.ultimaCorridaEm,
    posicaoGeral,
    posicaoCategoria,
    corridas: piloto.corridas.map((corrida) => ({
      id: corrida.id,
      data: corrida.data,
      melhorVoltaMs: corrida.melhorVoltaMs,
      kart: corrida.kart ? `Kart ${corrida.kart.numero}` : "—",
      categoria: corrida.categoriaNaCorrida,
      nomeDaCategoria: nomeCategoria(corrida.categoriaNaCorrida),
      valida: corrida.valida,
      pontosGanhos: corrida.pontosGanhos,
      pontosDescontados: corrida.pontosDescontados,
      pontosTotal: corrida.pontosTotal,
      penalidades: corrida.penalidades.map((penalidade) => rotuloPenalidade(penalidade.tipo)),
      operador: corrida.operador.nome,
      observacao: corrida.observacao,
    })),
    penalidades: piloto.penalidades.map((penalidade) => ({
      id: penalidade.id,
      data: penalidade.data,
      tipo: penalidade.tipo,
      tipoRotulo: rotuloPenalidade(penalidade.tipo),
      motivo: penalidade.motivo,
      motivoRotulo: rotuloMotivo(penalidade.motivo),
      motivoDetalhe: penalidade.motivoDetalhe,
      pontosDescontados: penalidade.pontosDescontados,
      observacao: penalidade.observacao,
      corridaId: penalidade.corrida.id,
      corridaData: penalidade.corrida.data,
      operador: penalidade.operador.nome,
    })),
  };
}
