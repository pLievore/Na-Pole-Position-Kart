"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type {
  ConfiguracaoPadroesAgendamento,
  DiaSemanaAgendamento,
} from "@napole/core";
import { Aviso, Botao, Campo } from "@/components/ui";
import {
  salvarConfiguracaoAgendaAction,
  type EstadoConfiguracaoAgenda,
} from "./acoes";

const DIAS: ReadonlyArray<{ indice: DiaSemanaAgendamento; nome: string }> = [
  { indice: 1, nome: "Segunda-feira" },
  { indice: 2, nome: "Terça-feira" },
  { indice: 3, nome: "Quarta-feira" },
  { indice: 4, nome: "Quinta-feira" },
  { indice: 5, nome: "Sexta-feira" },
  { indice: 6, nome: "Sábado" },
  { indice: 0, nome: "Domingo" },
];

export function FormularioConfiguracaoAgenda({
  configuracao,
}: {
  configuracao: ConfiguracaoPadroesAgendamento;
}) {
  const [estado, acao] = useActionState<EstadoConfiguracaoAgenda, FormData>(
    salvarConfiguracaoAgendaAction,
    {},
  );

  return (
    <form action={acao} className="grid gap-8">
      {estado.erro && <Aviso>{estado.erro}</Aviso>}
      {estado.mensagem && <Aviso tipo="sucesso">{estado.mensagem}</Aviso>}

      <fieldset>
        <legend className="text-lg font-bold text-white">Funcionamento semanal</legend>
        <p className="mt-2 text-sm leading-6 text-neutral-500">
          Estes horários geram novas grades e alimentam as informações exibidas no site. A grade
          já publicada permanece congelada.
        </p>
        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
          {DIAS.map((dia) => {
            const faixa = configuracao.faixas.find((item) =>
              item.diasSemana.includes(dia.indice),
            );
            return (
              <div
                key={dia.indice}
                className="grid gap-4 border-b border-white/8 bg-white/[0.02] p-4 last:border-b-0 sm:grid-cols-[minmax(10rem,1fr)_9rem_9rem] sm:items-end"
              >
                <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-white">
                  <input
                    type="checkbox"
                    name={`ativo_${dia.indice}`}
                    defaultChecked={Boolean(faixa)}
                    className="size-5 accent-[var(--color-acelera)]"
                  />
                  {dia.nome}
                </label>
                <Campo
                  id={`inicio_${dia.indice}`}
                  name={`inicio_${dia.indice}`}
                  type="time"
                  label="Abre"
                  required
                  defaultValue={faixa?.horaInicio ?? "18:00"}
                />
                <Campo
                  id={`fim_${dia.indice}`}
                  name={`fim_${dia.indice}`}
                  type="time"
                  label="Fecha"
                  required
                  defaultValue={faixa?.horaFim ?? "22:00"}
                />
              </div>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-lg font-bold text-white">Regras operacionais</legend>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Campo
            id="intervaloEntreIniciosMinutos"
            name="intervaloEntreIniciosMinutos"
            type="number"
            min={1}
            max={240}
            label="Intervalo entre largadas (min)"
            required
            defaultValue={configuracao.intervaloEntreIniciosMinutos}
          />
          <Campo
            id="duracaoMinutos"
            name="duracaoMinutos"
            type="number"
            min={1}
            max={240}
            label="Duração da bateria (min)"
            required
            defaultValue={configuracao.duracaoMinutos}
          />
          <Campo
            id="capacidade"
            name="capacidade"
            type="number"
            min={1}
            max={100}
            label="Capacidade padrão"
            required
            defaultValue={configuracao.capacidade}
          />
          <Campo
            id="antecedenciaMinimaMinutos"
            name="antecedenciaMinimaMinutos"
            type="number"
            min={0}
            max={10080}
            label="Fechar reservas antes (min)"
            required
            defaultValue={configuracao.antecedenciaMinimaMinutos}
          />
          <Campo
            id="chegadaAntecedenciaMinutos"
            name="chegadaAntecedenciaMinutos"
            type="number"
            min={0}
            max={240}
            label="Chegada recomendada (min)"
            required
            defaultValue={configuracao.chegadaAntecedenciaMinutos}
          />
          <Campo
            id="pendenciaHoras"
            name="pendenciaHoras"
            type="number"
            min={1}
            max={168}
            label="Expiração da pendência (h)"
            required
            defaultValue={configuracao.pendenciaHoras}
          />
        </div>
      </fieldset>

      <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.05] p-4 text-sm leading-6 text-amber-100">
        Alterar estes padrões não edita reservas nem horários já criados. Gere uma nova grade para
        aplicar a configuração às próximas datas.
      </div>

      <BotaoSalvar />
    </form>
  );
}

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending} className="sm:w-fit">
      {pending ? "Salvando padrões..." : "Salvar padrões da agenda"}
    </Botao>
  );
}
