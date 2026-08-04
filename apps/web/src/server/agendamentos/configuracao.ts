import "server-only";

import { cache } from "react";
import { prisma, Prisma } from "@napole/db";
import {
  CHAVE_CONFIGURACAO_PADROES_AGENDAMENTO,
  CONFIGURACAO_PADROES_AGENDAMENTO_INICIAL,
  validarConfiguracaoPadroesAgendamento,
  type ConfiguracaoPadroesAgendamento,
} from "@napole/core";
import type { ClientePrisma } from "@/server/auditoria/registrar";
import {
  ErroPersistenciaAgendamento,
  comoResultado,
  exigirAdministradorAtivo,
  registrarAuditoriaAgendamento as registrarAuditoria,
  travarGradeDeHorarios,
} from "@/server/agendamentos/interno";
import type { ResultadoServicoAgendamento } from "@/server/agendamentos/tipos";

function paraJson(valor: ConfiguracaoPadroesAgendamento): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(valor)) as Prisma.InputJsonValue;
}

export async function obterConfiguracaoPadroesTx(
  cliente: ClientePrisma,
): Promise<ConfiguracaoPadroesAgendamento> {
  const registro = await cliente.configuracao.findUnique({
    where: { chave: CHAVE_CONFIGURACAO_PADROES_AGENDAMENTO },
    select: { valor: true },
  });
  if (!registro) return validarConfiguracaoPadroesAgendamento(CONFIGURACAO_PADROES_AGENDAMENTO_INICIAL);

  try {
    return validarConfiguracaoPadroesAgendamento(
      registro.valor as unknown as ConfiguracaoPadroesAgendamento,
    );
  } catch {
    throw new ErroPersistenciaAgendamento(
      "CONFIGURACAO_CORROMPIDA",
      "A configuracao persistida de agendamento e invalida.",
    );
  }
}

export const obterConfiguracaoPadroesAgendamento = cache(
  async (): Promise<ConfiguracaoPadroesAgendamento> => obterConfiguracaoPadroesTx(prisma),
);

export async function atualizarConfiguracaoPadroesAgendamento(
  administradorId: string,
  entrada: ConfiguracaoPadroesAgendamento,
): Promise<ResultadoServicoAgendamento<ConfiguracaoPadroesAgendamento>> {
  return comoResultado(async () => {
    const configuracao = validarConfiguracaoPadroesAgendamento(entrada);

    return prisma.$transaction(async (tx) => {
      await exigirAdministradorAtivo(tx, administradorId);
      await travarGradeDeHorarios(tx);
      const anterior = await tx.configuracao.findUnique({
        where: { chave: CHAVE_CONFIGURACAO_PADROES_AGENDAMENTO },
        select: { valor: true },
      });
      await tx.configuracao.upsert({
        where: { chave: CHAVE_CONFIGURACAO_PADROES_AGENDAMENTO },
        create: {
          chave: CHAVE_CONFIGURACAO_PADROES_AGENDAMENTO,
          valor: paraJson(configuracao),
          descricao: "Defaults editaveis usados para sugerir horarios de agendamento.",
        },
        update: { valor: paraJson(configuracao) },
      });
      await registrarAuditoria(tx, {
        usuarioId: administradorId,
        entidade: "ConfiguracaoAgendamento",
        entidadeId: CHAVE_CONFIGURACAO_PADROES_AGENDAMENTO,
        acao: "EDITAR",
        antes: anterior?.valor,
        depois: configuracao,
      });
      return configuracao;
    });
  });
}
