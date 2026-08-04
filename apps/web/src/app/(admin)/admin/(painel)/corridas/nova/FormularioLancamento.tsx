"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  MOTIVOS_PENALIDADE,
  TABELA_PENALIDADES,
  dataOperacionalISO,
  formatarTempo,
} from "@napole/core";
import { Aviso, Botao, Campo, Cartao, Selecao } from "@/components/ui";
import { lancarCorridaAction, type EstadoLancamento } from "./acoes";

interface Kart {
  id: string;
  numero: number;
  status: string;
}

export function FormularioLancamento({ karts }: { karts: Kart[] }) {
  const [estado, acao] = useActionState<EstadoLancamento, FormData>(lancarCorridaAction, {});
  const erros = estado.erros ?? {};
  const valores = estado.valores ?? {};

  const [penalidade, setPenalidade] = useState(valores.penalidade ?? "SEM_PENALIDADE");
  const [motivo, setMotivo] = useState(valores.motivoPenalidade ?? "");

  const temPenalidade = penalidade !== "SEM_PENALIDADE";
  const hoje = dataOperacionalISO(new Date());

  if (estado.sucesso) {
    return <Confirmacao resultado={estado.sucesso} />;
  }

  return (
    <form action={acao} className="flex flex-col gap-4">
      {erros.form && <Aviso>{erros.form}</Aviso>}

      <Campo
        id="numeroPiloto"
        name="numeroPiloto"
        label="Número do piloto"
        inputMode="numeric"
        autoFocus
        required
        defaultValue={valores.numeroPiloto}
        erro={erros.numeroPiloto}
        dica="O número que aparece no ranking, ex.: 231."
      />

      <Campo
        id="data"
        name="data"
        type="date"
        label="Data da corrida"
        required
        max={hoje}
        defaultValue={valores.data ?? hoje}
        erro={erros.data}
      />

      <Campo
        id="melhorVolta"
        name="melhorVolta"
        label="Melhor volta"
        inputMode="decimal"
        required
        defaultValue={valores.melhorVolta}
        erro={erros.melhorVolta}
        dica="Formato 32.487 ou 1:02.487."
      />

      <Selecao
        id="kartId"
        name="kartId"
        label="Kart utilizado"
        required
        defaultValue={valores.kartId ?? ""}
        erro={erros.kartId}
      >
        <option value="" disabled>
          Selecione
        </option>
        {karts.map((kart) => (
          <option key={kart.id} value={kart.id}>
            Kart {kart.numero}
            {kart.status !== "OPERACIONAL" ? ` (${kart.status.toLowerCase()})` : ""}
          </option>
        ))}
      </Selecao>

      <Selecao
        id="penalidade"
        name="penalidade"
        label="Penalidade"
        required
        value={penalidade}
        erro={erros.penalidade}
        onChange={(evento) => setPenalidade(evento.target.value)}
      >
        <option value="SEM_PENALIDADE">Sem penalidade</option>
        {Object.entries(TABELA_PENALIDADES).map(([codigo, item]) => (
          <option key={codigo} value={codigo}>
            {item.rotulo}
            {item.pontos !== null ? ` (${item.pontos})` : ""}
          </option>
        ))}
      </Selecao>

      {temPenalidade && (
        <fieldset className="flex flex-col gap-4 rounded-2xl border border-[var(--color-acelera)]/30 p-4">
          <legend className="px-2 text-sm font-medium text-neutral-200">
            Detalhes da penalidade
          </legend>

          <Selecao
            id="motivoPenalidade"
            name="motivoPenalidade"
            label="Motivo"
            required
            value={motivo}
            erro={erros.motivoPenalidade}
            onChange={(evento) => setMotivo(evento.target.value)}
          >
            <option value="" disabled>
              Selecione
            </option>
            {Object.entries(MOTIVOS_PENALIDADE).map(([codigo, rotulo]) => (
              <option key={codigo} value={codigo}>
                {rotulo}
              </option>
            ))}
          </Selecao>

          {motivo === "OUTRO" && (
            <Campo
              id="motivoDetalhe"
              name="motivoDetalhe"
              label="Descreva o motivo"
              required
              maxLength={300}
              defaultValue={valores.motivoDetalhe}
              erro={erros.motivoDetalhe}
            />
          )}

          {penalidade === "DESCLASSIFICACAO" && (
            <Campo
              id="pontosDesclassificacao"
              name="pontosDesclassificacao"
              label="Pontos a descontar"
              inputMode="numeric"
              required
              defaultValue={valores.pontosDesclassificacao}
              erro={erros.pontosDesclassificacao}
              dica="Desclassificação é decisão administrativa: informe quantos pontos descontar."
            />
          )}
        </fieldset>
      )}

      <Campo
        id="observacao"
        name="observacao"
        label="Observação (opcional)"
        maxLength={500}
        defaultValue={valores.observacao}
        erro={erros.observacao}
        dica="Uso interno. O piloto vê esta observação no histórico dele."
      />

      <BotaoEnviar />
    </form>
  );
}

function BotaoEnviar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending} className="mt-2">
      {pending ? "Salvando..." : "Lançar corrida"}
    </Botao>
  );
}

function Confirmacao({ resultado }: { resultado: NonNullable<EstadoLancamento["sucesso"]> }) {
  return (
    <div className="flex flex-col gap-4">
      <Aviso tipo="sucesso">
        Corrida lançada para <strong>{resultado.nomeExibicao}</strong> (#{resultado.numeroPiloto}).
      </Aviso>

      <Cartao>
        <dl className="flex flex-col gap-2 text-sm">
          <Linha rotulo="Melhor volta" valor={formatarTempo(resultado.melhorVoltaMs)} />
          <Linha
            rotulo="Recorde pessoal"
            valor={resultado.recordePessoal ? "Sim — melhorou o próprio tempo" : "Não"}
          />
          <Linha rotulo="Posição na categoria" valor={`${resultado.posicaoNaCategoria}º`} />
          <Linha rotulo="Pontos do piloto" valor={String(resultado.pontosTotal)} />
          <Linha
            rotulo="Avisos gerados"
            valor={
              resultado.notificacoesGeradas === 0
                ? "Nenhum"
                : `${resultado.notificacoesGeradas} piloto(s) notificado(s)`
            }
          />
        </dl>
      </Cartao>

      <div className="flex gap-3">
        <Link
          href="/admin/corridas/nova"
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-[var(--color-acelera)] px-5 text-sm font-semibold text-white"
        >
          Lançar outra
        </Link>
        <Link
          href="/admin/corridas"
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-white/25 px-5 text-sm font-semibold"
        >
          Ver lançamentos
        </Link>
      </div>
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 pb-2 last:border-0">
      <dt className="text-neutral-400">{rotulo}</dt>
      <dd className="text-right font-medium">{valor}</dd>
    </div>
  );
}
