"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AreaTexto, Aviso, Botao, Campo } from "@/components/ui";
import {
  criarHorarioManualAction,
  gerarHorariosPadraoAction,
  type EstadoCriacaoHorarios,
} from "./acoes";

export function FormularioGeracaoPadrao({
  dataInicial,
  dataFinal,
  dataMaxima,
}: {
  dataInicial: string;
  dataFinal: string;
  dataMaxima: string;
}) {
  const [estado, acao] = useActionState<EstadoCriacaoHorarios, FormData>(
    gerarHorariosPadraoAction,
    {},
  );

  return (
    <form action={acao} className="mt-5 grid gap-4">
      {estado.erro && <Aviso>{estado.erro}</Aviso>}
      {estado.mensagem && <Aviso tipo="sucesso">{estado.mensagem}</Aviso>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id="dataInicial"
          name="dataInicial"
          type="date"
          label="Primeiro dia"
          required
          max={dataMaxima}
          defaultValue={estado.valores?.dataInicial ?? dataInicial}
        />
        <Campo
          id="dataFinal"
          name="dataFinal"
          type="date"
          label="Último dia"
          required
          max={dataMaxima}
          defaultValue={estado.valores?.dataFinal ?? dataFinal}
        />
      </div>
      <p className="text-xs leading-5 text-neutral-500">
        Gere no máximo 45 dias por vez para revisar a oferta antes de publicar o próximo lote.
      </p>
      <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm text-neutral-300">
        <input
          type="checkbox"
          name="publicar"
          defaultChecked={estado.valores?.publicar !== "false"}
          className="mt-0.5 size-5 shrink-0 accent-[var(--color-acelera)]"
        />
        <span>
          <strong className="block font-semibold text-white">Publicar imediatamente</strong>
          Desmarque para revisar os horários como rascunho antes de abrir reservas.
        </span>
      </label>
      <BotaoPendente rotulo="Gerar grade padrão" rotuloPendente="Gerando horários..." />
    </form>
  );
}

export function FormularioHorarioManual({
  inicioPadrao,
  fimPadrao,
  capacidadePadrao,
}: {
  inicioPadrao: string;
  fimPadrao: string;
  capacidadePadrao: number;
}) {
  const [estado, acao] = useActionState<EstadoCriacaoHorarios, FormData>(
    criarHorarioManualAction,
    {},
  );

  return (
    <form action={acao} className="mt-5 grid gap-4">
      {estado.erro && <Aviso>{estado.erro}</Aviso>}
      {estado.mensagem && <Aviso tipo="sucesso">{estado.mensagem}</Aviso>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id="inicioLocal"
          name="inicioLocal"
          type="datetime-local"
          label="Início"
          required
          defaultValue={estado.valores?.inicioLocal ?? inicioPadrao}
        />
        <Campo
          id="fimLocal"
          name="fimLocal"
          type="datetime-local"
          label="Fim"
          required
          defaultValue={estado.valores?.fimLocal ?? fimPadrao}
        />
      </div>
      <Campo
        id="capacidade"
        name="capacidade"
        type="number"
        min={1}
        max={100}
        step={1}
        label="Capacidade de pilotos"
        required
        defaultValue={estado.valores?.capacidade ?? capacidadePadrao}
      />
      <AreaTexto
        id="observacoesInternas"
        name="observacoesInternas"
        label="Observações internas"
        maxLength={5000}
        defaultValue={estado.valores?.observacoesInternas}
        dica="Visível somente para a equipe."
      />
      <label className="flex items-center gap-3 text-sm text-neutral-300">
        <input
          type="checkbox"
          name="publicar"
          defaultChecked={estado.valores?.publicar === "true"}
          className="size-5 accent-[var(--color-acelera)]"
        />
        Publicar e aceitar reservas agora
      </label>
      <BotaoPendente rotulo="Criar horário" rotuloPendente="Criando horário..." />
    </form>
  );
}

function BotaoPendente({ rotulo, rotuloPendente }: { rotulo: string; rotuloPendente: string }) {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending} className="sm:w-fit">
      {pending ? rotuloPendente : rotulo}
    </Botao>
  );
}
