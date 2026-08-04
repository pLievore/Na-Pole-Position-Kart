"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { StatusAgenda } from "@/components/admin/StatusAgenda";
import { gerirHorarioAction, type EstadoGestaoHorario } from "./acoes";

export function FormularioGestaoHorario({
  horario,
}: {
  horario: {
    id: string;
    inicioLocal: string;
    fimLocal: string;
    capacidade: number;
    ocupadas: number;
    status: string;
    observacoesInternas: string | null;
    temCheckIn: boolean;
  };
}) {
  const [estado, acao] = useActionState<EstadoGestaoHorario, FormData>(gerirHorarioAction, {});
  const editavel = !["CANCELADO", "ENCERRADO"].includes(horario.status);

  return (
    <div className="grid gap-5">
      {estado.mensagem && (
        <p
          role={estado.ok ? "status" : "alert"}
          className={`rounded-xl border px-4 py-3 text-sm ${
            estado.ok
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
              : "border-rose-400/20 bg-rose-400/10 text-rose-200"
          }`}
        >
          {estado.mensagem}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusAgenda status={horario.status} />
        <span className="text-sm text-neutral-500">
          {horario.ocupadas}/{horario.capacidade} vagas ocupadas
        </span>
      </div>

      {editavel && (
        <form action={acao} className="grid gap-4">
          <input type="hidden" name="horarioId" value={horario.id} />
          <input type="hidden" name="operacao" value="EDITAR" />
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoHorario id="inicioLocal" label="Início" defaultValue={horario.inicioLocal} />
            <CampoHorario id="fimLocal" label="Fim" defaultValue={horario.fimLocal} />
          </div>
          <label className="grid gap-2 text-sm font-medium text-neutral-200">
            Capacidade
            <input
              type="number"
              name="capacidade"
              min={1}
              max={100}
              step={1}
              required
              defaultValue={horario.capacidade}
              className="min-h-11 rounded-xl border border-white/15 bg-black/20 px-4 text-base text-white"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-neutral-200">
            Observações internas
            <textarea
              name="observacoesInternas"
              rows={4}
              maxLength={5000}
              defaultValue={horario.observacoesInternas ?? ""}
              className="rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-base text-white"
            />
          </label>
          <label className="flex items-start gap-3 text-sm text-neutral-400">
            <input type="checkbox" name="permitirCapacidadeExcedida" className="mt-0.5 size-5" />
            Autorizar capacidade menor que a ocupação atual. As reservas existentes serão
            preservadas e o horário ficará acima da capacidade.
          </label>
          <BotaoEnvio rotulo="Salvar alterações" />
        </form>
      )}

      {editavel && (
        <div className="grid gap-3 border-t border-white/8 pt-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">Publicação</p>
          <form action={acao} className="flex flex-wrap gap-2">
            <input type="hidden" name="horarioId" value={horario.id} />
            {horario.status === "RASCUNHO" && <BotaoOperacao valor="PUBLICAR">Publicar horário</BotaoOperacao>}
            {horario.status === "ABERTO" && <BotaoOperacao valor="BLOQUEAR">Fechar novas reservas</BotaoOperacao>}
            {horario.status === "BLOQUEADO" && <BotaoOperacao valor="PUBLICAR">Reabrir reservas</BotaoOperacao>}
            {["ABERTO", "BLOQUEADO"].includes(horario.status) && (
              <BotaoOperacao
                valor="ENCERRAR"
                confirmacao="Encerrar este horário? Ele não poderá ser reaberto."
              >
                Encerrar operação
              </BotaoOperacao>
            )}
          </form>
        </div>
      )}

      {editavel && (
        <details className="border-t border-rose-400/15 pt-5">
          <summary className="cursor-pointer text-sm font-semibold text-rose-200">
            Cancelar horário
          </summary>
          <form action={acao} className="mt-4 grid gap-3">
            <input type="hidden" name="horarioId" value={horario.id} />
            <input type="hidden" name="operacao" value="CANCELAR" />
            <label className="grid gap-2 text-sm font-medium text-neutral-200">
              Motivo
              <textarea
                name="motivo"
                required
                maxLength={2000}
                rows={3}
                className="rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-base text-white"
              />
            </label>
            {horario.temCheckIn && (
              <label className="flex items-start gap-3 text-sm text-neutral-300">
                <input type="checkbox" name="forcarComCheckIn" className="mt-0.5 size-5" required />
                Confirmo o cancelamento mesmo com participantes presentes.
              </label>
            )}
            <BotaoEnvio rotulo="Cancelar horário e reservas ativas" perigo />
          </form>
        </details>
      )}
    </div>
  );
}

function CampoHorario({ id, label, defaultValue }: { id: string; label: string; defaultValue: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-neutral-200">
      {label}
      <input
        id={id}
        name={id}
        type="datetime-local"
        required
        defaultValue={defaultValue}
        className="min-h-11 rounded-xl border border-white/15 bg-black/20 px-4 text-base text-white"
      />
    </label>
  );
}

function BotaoOperacao({
  valor,
  children,
  confirmacao,
}: {
  valor: string;
  children: React.ReactNode;
  confirmacao?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="operacao"
      value={valor}
      disabled={pending}
      onClick={(evento) => {
        if (confirmacao && !window.confirm(confirmacao)) evento.preventDefault();
      }}
      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-4 text-sm font-bold text-white hover:bg-white/5 disabled:opacity-50"
    >
      {pending ? "Salvando..." : children}
    </button>
  );
}

function BotaoEnvio({ rotulo, perigo = false }: { rotulo: string; perigo?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-bold disabled:opacity-50 sm:w-fit ${
        perigo ? "bg-rose-700 text-white hover:bg-rose-600" : "bg-[var(--color-acelera)] text-white hover:bg-[var(--color-acelera-forte)]"
      }`}
    >
      {pending ? "Salvando..." : rotulo}
    </button>
  );
}
