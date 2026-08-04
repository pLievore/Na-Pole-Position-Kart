import type { ConfiguracaoPadroesAgendamento } from "@napole/core";

const DIAS = [
  { indice: 1, nome: "Segunda" },
  { indice: 2, nome: "Terça" },
  { indice: 3, nome: "Quarta" },
  { indice: 4, nome: "Quinta" },
  { indice: 5, nome: "Sexta" },
  { indice: 6, nome: "Sábado" },
  { indice: 0, nome: "Domingo" },
] as const;

export interface HorarioPublicoFormatado {
  dias: string;
  periodo: string;
}

export function formatarHorariosPublicos(
  configuracao: ConfiguracaoPadroesAgendamento,
): HorarioPublicoFormatado[] {
  const grupos = new Map<string, Set<number>>();
  for (const faixa of configuracao.faixas) {
    const chave = `${faixa.horaInicio}|${faixa.horaFim}`;
    const dias = grupos.get(chave) ?? new Set<number>();
    faixa.diasSemana.forEach((dia) => dias.add(dia));
    grupos.set(chave, dias);
  }

  return [...grupos.entries()]
    .map(([chave, dias]) => {
      const [inicio, fim] = chave.split("|") as [string, string];
      return {
        dias: formatarDias(dias),
        periodo: `${formatarHora(inicio)}–${formatarHora(fim)}`,
        primeiraPosicao: Math.min(
          ...[...dias].map((dia) => DIAS.findIndex((item) => item.indice === dia)),
        ),
      };
    })
    .sort((a, b) => a.primeiraPosicao - b.primeiraPosicao)
    .map(({ dias, periodo }) => ({ dias, periodo }));
}

export function resumirHorariosPublicos(
  configuracao: ConfiguracaoPadroesAgendamento,
): string {
  return formatarHorariosPublicos(configuracao)
    .map((horario) => `${horario.dias}, ${horario.periodo}`)
    .join(". ");
}

function formatarDias(dias: Set<number>): string {
  const selecionados = DIAS.filter((dia) => dias.has(dia.indice));
  if (selecionados.length === 0) return "Sem dias configurados";
  if (selecionados.length === 1) return selecionados[0]!.nome;

  const posicoes = selecionados.map((dia) => DIAS.indexOf(dia));
  const consecutivos = posicoes.every(
    (posicao, indice) => indice === 0 || posicao === posicoes[indice - 1]! + 1,
  );
  if (consecutivos && selecionados.length > 2) {
    return `${selecionados[0]!.nome} a ${selecionados.at(-1)!.nome.toLowerCase()}`;
  }
  if (selecionados.length === 2) {
    return `${selecionados[0]!.nome} e ${selecionados[1]!.nome.toLowerCase()}`;
  }
  return `${selecionados
    .slice(0, -1)
    .map((dia) => dia.nome)
    .join(", ")} e ${selecionados.at(-1)!.nome.toLowerCase()}`;
}

function formatarHora(hora: string): string {
  const [horas, minutos] = hora.split(":");
  return minutos === "00" ? `${Number(horas)}h` : `${Number(horas)}h${minutos}`;
}
