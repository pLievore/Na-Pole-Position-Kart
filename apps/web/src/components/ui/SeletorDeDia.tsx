"use client";

import { useMemo } from "react";

/**
 * Escolha de dia por botoes, no lugar de <input type="date">.
 *
 * O seletor de data nativo e desenhado pelo sistema operacional: chega com o
 * tema claro do Windows, ignora a identidade do site e exige dois toques no
 * celular (abrir o calendario, escolher). Como a pista so abre em alguns dias e
 * a reserva quase sempre e para a proxima semana, mostrar os dias abertos como
 * botoes resolve em um toque — e nunca oferece um dia fechado.
 */

const diaCurto = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  weekday: "short",
});
const diaMes = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
});

function rotuloDia(data: Date): string {
  const bruto = diaCurto.format(data).replace(".", "");
  return bruto.charAt(0).toUpperCase() + bruto.slice(1);
}

export interface DiaOferecido {
  valor: string;
  semana: string;
  dia: string;
}

/** Proximos `quantidade` dias em que a pista abre, a partir de `inicio` (AAAA-MM-DD). */
export function proximosDiasAbertos(
  inicio: string,
  diasAbertos: readonly number[],
  quantidade: number,
): DiaOferecido[] {
  // T12:00 evita que o fuso do visitante jogue a data para o dia anterior.
  const base = new Date(`${inicio}T12:00:00`);
  const abertos = new Set(diasAbertos);
  const oferecidos: DiaOferecido[] = [];

  for (let deslocamento = 0; oferecidos.length < quantidade; deslocamento += 1) {
    if (deslocamento > 120) break;

    const data = new Date(base.getTime() + deslocamento * 86_400_000);
    if (!abertos.has(data.getDay())) continue;

    oferecidos.push({
      valor: data.toISOString().slice(0, 10),
      semana: deslocamento === 0 ? "Hoje" : deslocamento === 1 ? "Amanhã" : rotuloDia(data),
      dia: diaMes.format(data),
    });
  }

  return oferecidos;
}

export function SeletorDeDia({
  id,
  rotulo,
  inicio,
  diasAbertos,
  quantidade = 7,
  valor,
  aoEscolher,
}: {
  id: string;
  rotulo: string;
  inicio: string;
  diasAbertos: readonly number[];
  quantidade?: number;
  valor: string;
  aoEscolher: (valor: string) => void;
}) {
  const dias = useMemo(
    () => proximosDiasAbertos(inicio, diasAbertos, quantidade),
    [inicio, diasAbertos, quantidade],
  );

  return (
    <div>
      <p id={id} className="text-sm font-semibold text-neutral-200">
        {rotulo}
      </p>
      <div
        role="radiogroup"
        aria-labelledby={id}
        className="-mx-1 mt-3 flex min-w-0 snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0"
      >
        {dias.map((item) => {
          const selecionado = item.valor === valor;
          return (
            <button
              key={item.valor}
              type="button"
              role="radio"
              aria-checked={selecionado}
              onClick={() => aoEscolher(item.valor)}
              className={`flex min-h-[4.25rem] shrink-0 snap-start flex-col items-center justify-center rounded-xl border px-4 transition ${
                selecionado
                  ? "border-[var(--color-acelera)] bg-[var(--color-acelera)] text-white"
                  : "border-white/12 bg-white/[0.04] text-neutral-300 hover:border-white/25 hover:bg-white/[0.08]"
              }`}
            >
              {/* Sem opacidade: sobre o vermelho selecionado ela derrubava o
                  contraste do rotulo para 3,35:1, abaixo do minimo de 4,5:1. */}
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {item.semana}
              </span>
              <span className="mt-0.5 text-base font-black tabular-nums">{item.dia}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SeletorDeQuantidade({
  id,
  rotulo,
  maximo = 10,
  valor,
  aoEscolher,
}: {
  id: string;
  rotulo: string;
  maximo?: number;
  valor: number;
  aoEscolher: (valor: number) => void;
}) {
  return (
    <div>
      <p id={id} className="text-sm font-semibold text-neutral-200">
        {rotulo}
      </p>
      <div role="radiogroup" aria-labelledby={id} className="-mx-1 mt-3 flex flex-wrap gap-2 px-1">
        {Array.from({ length: maximo }, (_, indice) => indice + 1).map((numero) => {
          const selecionado = numero === valor;
          return (
            <button
              key={numero}
              type="button"
              role="radio"
              aria-checked={selecionado}
              aria-label={`${numero} ${numero === 1 ? "pessoa" : "pessoas"}`}
              onClick={() => aoEscolher(numero)}
              className={`size-12 rounded-xl border text-base font-black tabular-nums transition ${
                selecionado
                  ? "border-[var(--color-acelera)] bg-[var(--color-acelera)] text-white"
                  : "border-white/12 bg-white/[0.04] text-neutral-300 hover:border-white/25 hover:bg-white/[0.08]"
              }`}
            >
              {numero}
            </button>
          );
        })}
      </div>
    </div>
  );
}
