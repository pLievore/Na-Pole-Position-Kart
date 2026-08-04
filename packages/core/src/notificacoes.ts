import { nomeCategoria } from "./categoria";
import { formatarDiferenca, formatarTempo } from "./tempo";
import type { Categoria, Milissegundos } from "./tipos";

/**
 * Textos das notificacoes automaticas (secao 8.2 do escopo).
 *
 * Ficam no core, e nao na camada de banco, por dois motivos: sao regra de
 * produto (o tom faz parte do que a Na Pole Position quer provocar) e assim
 * podem ser testados sem subir banco.
 */

export type TipoNotificacao =
  | "TEMPO_SUPERADO"
  | "ENTROU_TOP10"
  | "SAIU_TOP10"
  | "MELHOROU_TEMPO"
  | "TEMPO_EMPATADO"
  | "INATIVIDADE";

export interface Notificacao {
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
}

export function avisoTempoSuperado(categoria: Categoria): Notificacao {
  return {
    tipo: "TEMPO_SUPERADO",
    titulo: "Alerta de ultrapassagem!",
    mensagem: `Seu tempo foi batido na categoria ${nomeCategoria(categoria)}. Vai deixar assim?`,
  };
}

export function avisoEntrouTop10(categoria: Categoria, posicao: number): Notificacao {
  return {
    tipo: "ENTROU_TOP10",
    titulo: "Voce entrou no Top 10",
    mensagem: `Voce e o ${posicao}o da categoria ${nomeCategoria(categoria)} na Na Pole Position. Agora o alvo e voce.`,
  };
}

export function avisoSaiuTop10(categoria: Categoria, posicao: number): Notificacao {
  return {
    tipo: "SAIU_TOP10",
    titulo: "Voce saiu do Top 10",
    mensagem: `Voce caiu para ${posicao}o na categoria ${nomeCategoria(categoria)}. A pista esta chamando para a revanche.`,
  };
}

export function avisoMelhorouTempo(
  novo: Milissegundos,
  anterior: Milissegundos,
): Notificacao {
  return {
    tipo: "MELHOROU_TEMPO",
    titulo: "Novo recorde pessoal",
    mensagem: `Sua melhor volta agora e ${formatarTempo(novo)} — ${formatarDiferenca(
      novo - anterior,
    )} em relacao ao seu tempo anterior.`,
  };
}

export function avisoTempoEmpatado(
  tempo: Milissegundos,
  categoria: Categoria,
): Notificacao {
  return {
    tipo: "TEMPO_EMPATADO",
    titulo: "Empataram seu tempo",
    mensagem: `Alguem cravou ${formatarTempo(tempo)} na categoria ${nomeCategoria(
      categoria,
    )}, exatamente o seu tempo. Voce ainda esta na frente por ter marcado antes — por enquanto.`,
  };
}

export function avisoInatividade(dias: number): Notificacao {
  return {
    tipo: "INATIVIDADE",
    titulo: "Seu kart esta sentindo sua falta",
    mensagem: `Faz ${dias} dias que voce nao corre. Volte para tentar melhorar sua volta.`,
  };
}
