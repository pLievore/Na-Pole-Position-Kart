import "server-only";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@napole/db";
import {
  REGRAS_LIMITE,
  avaliarLimite,
  inicioDaJanela,
  janelaMaisLongaMinutos,
  mensagemLimite,
  type AcaoLimitada,
} from "@napole/core";
import { env } from "@/env";

/**
 * Limite de taxa persistido em Postgres.
 *
 * Contador em memoria nao serve aqui: em serverless cada instancia teria o seu,
 * e o limite viraria "N por instancia" — ou seja, nenhum limite. Postgres e o
 * unico estado compartilhado que o projeto ja tem, e o volume e baixo o
 * bastante para nao justificar Redis.
 */

/**
 * O identificador (IP ou telefone) nunca e gravado em claro.
 *
 * IP e dado pessoal: guardar a lista de quem acessou o site, de onde e quando
 * cria uma base que a operacao nao precisa e que teria de constar na politica
 * de privacidade. O HMAC permite contar tentativas do mesmo identificador sem
 * permitir descobrir qual e.
 */
function chaveDe(identificador: string): string {
  return createHmac("sha256", env.AUTH_SECRET)
    .update(identificador.trim().toLowerCase())
    .digest("hex");
}

/**
 * Origem da requisicao.
 *
 * Na Vercel o IP real vem no primeiro salto de `x-forwarded-for`. Os demais
 * saltos sao controlados por quem chama e nao servem para nada.
 */
export async function origemDaRequisicao(): Promise<string> {
  const cabecalhos = await headers();

  const encaminhado = cabecalhos.get("x-forwarded-for");
  const primeiro = encaminhado?.split(",")[0]?.trim();
  if (primeiro) return primeiro;

  return cabecalhos.get("x-real-ip")?.trim() || "desconhecido";
}

export interface ResultadoConsumo {
  permitido: boolean;
  /** Mensagem pronta para o visitante. Vazia quando permitido. */
  mensagem: string;
  liberaEm: Date | null;
}

const PERMITIDO: ResultadoConsumo = { permitido: true, mensagem: "", liberaEm: null };

/**
 * Registra a tentativa e diz se ela pode prosseguir.
 *
 * A tentativa e gravada ANTES da contagem de proposito: sob concorrencia, isso
 * faz o limite contar a mais e bloquear, em vez de contar a menos e deixar
 * passar. Falhar fechado e o comportamento certo para um controle de abuso.
 */
export async function consumirLimite(
  acao: AcaoLimitada,
  identificador: string,
): Promise<ResultadoConsumo> {
  const regra = REGRAS_LIMITE[acao];
  const chave = chaveDe(identificador);
  const agora = new Date();
  const inicio = inicioDaJanela(agora, janelaMaisLongaMinutos(regra));

  try {
    await prisma.tentativaLimitada.create({ data: { acao, chave, criadoEm: agora } });

    const tentativas = await prisma.tentativaLimitada.findMany({
      where: { acao, chave, criadoEm: { gt: inicio } },
      select: { criadoEm: true },
      orderBy: { criadoEm: "asc" },
      // Teto de leitura: passando disso o limite ja estourou de qualquer jeito.
      take: 200,
    });

    const resultado = avaliarLimite(
      tentativas.map((t) => t.criadoEm),
      regra,
      agora,
    );

    if (resultado.permitido) return PERMITIDO;

    return {
      permitido: false,
      mensagem: mensagemLimite(resultado.liberaEm, agora),
      liberaEm: resultado.liberaEm,
    };
  } catch (erro) {
    // Banco indisponivel nao pode derrubar o agendamento inteiro. A operacao
    // continua sem o limite — e o erro fica registrado para investigacao.
    console.error("[limite-taxa] falha ao aplicar limite", { acao, erro });
    return PERMITIDO;
  }
}

/**
 * Verifica o limite sem registrar tentativa.
 *
 * Util para bloquear antes de fazer trabalho caro, quando a tentativa ja foi
 * contabilizada em outro ponto do fluxo.
 */
export async function verificarLimite(
  acao: AcaoLimitada,
  identificador: string,
): Promise<ResultadoConsumo> {
  const regra = REGRAS_LIMITE[acao];
  const agora = new Date();
  const inicio = inicioDaJanela(agora, janelaMaisLongaMinutos(regra));

  try {
    const tentativas = await prisma.tentativaLimitada.findMany({
      where: { acao, chave: chaveDe(identificador), criadoEm: { gt: inicio } },
      select: { criadoEm: true },
      orderBy: { criadoEm: "asc" },
      take: 200,
    });

    const resultado = avaliarLimite(
      tentativas.map((t) => t.criadoEm),
      regra,
      agora,
    );

    return resultado.permitido
      ? PERMITIDO
      : {
          permitido: false,
          mensagem: mensagemLimite(resultado.liberaEm, agora),
          liberaEm: resultado.liberaEm,
        };
  } catch (erro) {
    console.error("[limite-taxa] falha ao verificar limite", { acao, erro });
    return PERMITIDO;
  }
}

/**
 * Zera o contador de uma acao para um identificador.
 * Chamado quando um login da certo: quem acertou a senha nao e um atacante.
 */
export async function limparLimite(
  acao: AcaoLimitada,
  identificador: string,
): Promise<void> {
  try {
    await prisma.tentativaLimitada.deleteMany({
      where: { acao, chave: chaveDe(identificador) },
    });
  } catch (erro) {
    console.error("[limite-taxa] falha ao limpar limite", { acao, erro });
  }
}

/**
 * Remove tentativas antigas.
 *
 * Chamado de tempos em tempos a partir do proprio fluxo, para a tabela nao
 * crescer sem fim — o projeto nao tem agendador de tarefas.
 */
export async function limparTentativasAntigas(diasDeGuarda = 2): Promise<void> {
  try {
    await prisma.tentativaLimitada.deleteMany({
      where: { criadoEm: { lt: new Date(Date.now() - diasDeGuarda * 24 * 60 * 60 * 1000) } },
    });
  } catch (erro) {
    console.error("[limite-taxa] falha na limpeza", { erro });
  }
}
