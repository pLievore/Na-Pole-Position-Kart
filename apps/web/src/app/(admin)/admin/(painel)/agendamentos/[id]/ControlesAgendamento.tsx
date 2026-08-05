"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { StatusAgenda } from "@/components/admin/StatusAgenda";
import type { ParticipanteAgendamentoAdministrativo } from "@/server/agendamentos/tipos";
import {
  buscarPilotoParaAgendaAction,
  operarAgendamentoAction,
  operarParticipanteAction,
  type EstadoBuscaPilotoAgenda,
  type EstadoOperacaoAgenda,
} from "./acoes";

export function ControlesAgendamento({
  agendamentoId,
  status,
  observacoesInternas,
  administrador,
}: {
  agendamentoId: string;
  status: string;
  observacoesInternas: string | null;
  administrador: boolean;
}) {
  const [estado, acao] = useActionState<EstadoOperacaoAgenda, FormData>(
    operarAgendamentoAction,
    {},
  );

  return (
    <div className="grid gap-5">
      {estado.mensagem && <Retorno estado={estado} />}

      <form action={acao} className="flex flex-wrap gap-3">
        <input type="hidden" name="agendamentoId" value={agendamentoId} />
        {status === "PENDENTE" && (
          <BotaoOperacao operacao="CONFIRMAR" rotulo="Confirmar reserva" destaque />
        )}
        {status === "CONFIRMADO" && (
          <BotaoOperacao
            operacao="NAO_COMPARECEU"
            rotulo="Marcar grupo ausente"
            confirmacao="Registrar não comparecimento de todo o grupo? Esta ação encerra a reserva."
          />
        )}
        {status === "CHECK_IN" && (
          <BotaoOperacao
            operacao="CONCLUIR"
            rotulo="Concluir após a bateria"
            confirmacao="Confirmar que a bateria terminou e concluir esta reserva?"
            destaque
          />
        )}
      </form>

      {(status === "PENDENTE" || status === "CONFIRMADO" || (status === "CHECK_IN" && administrador)) && (
        <details className="rounded-xl border border-rose-400/15 bg-rose-400/[0.035] p-4">
          <summary className="cursor-pointer text-sm font-semibold text-rose-200">
            Cancelar esta reserva
          </summary>
          <form action={acao} className="mt-4 grid gap-3">
            <input type="hidden" name="agendamentoId" value={agendamentoId} />
            <input type="hidden" name="operacao" value="CANCELAR" />
            <label className="grid gap-2 text-sm font-medium text-neutral-200">
              Motivo do cancelamento
              <textarea
                name="motivo"
                required
                maxLength={2000}
                rows={3}
                className="rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-base text-white"
              />
            </label>
            {status === "CHECK_IN" && administrador && (
              <label className="flex items-start gap-3 text-sm text-neutral-300">
                <input type="checkbox" name="forcarComCheckIn" className="mt-0.5 size-5" />
                Confirmo o cancelamento mesmo com check-in registrado.
              </label>
            )}
            <BotaoEnvio rotulo="Confirmar cancelamento" perigo />
          </form>
        </details>
      )}

      <form action={acao} className="grid gap-3 border-t border-white/8 pt-5">
        <input type="hidden" name="agendamentoId" value={agendamentoId} />
        <input type="hidden" name="operacao" value="SALVAR_OBSERVACOES" />
        <label className="grid gap-2 text-sm font-medium text-neutral-200">
          Observações internas
          <textarea
            name="observacoesInternas"
            defaultValue={observacoesInternas ?? ""}
            maxLength={5000}
            rows={4}
            className="rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-base text-white"
          />
        </label>
        <p className="text-xs text-neutral-500">Somente a equipe vê este campo.</p>
        <BotaoEnvio rotulo="Salvar observações" />
      </form>
    </div>
  );
}

export function ControleParticipante({
  agendamentoId,
  statusAgendamento,
  participante,
}: {
  agendamentoId: string;
  statusAgendamento: string;
  participante: ParticipanteAgendamentoAdministrativo;
}) {
  const [estado, acao] = useActionState<EstadoOperacaoAgenda, FormData>(
    operarParticipanteAction,
    {},
  );
  const aceitaCheckIn = ["CONFIRMADO", "CHECK_IN"].includes(statusAgendamento);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">{participante.nomeCompleto}</h3>
          <p className="mt-1 text-xs text-neutral-500">
            {participante.piloto
              ? `Piloto #${participante.piloto.numero} · ${participante.piloto.nomeExibicao}`
              : "Ainda sem cadastro de piloto vinculado"}
          </p>
        </div>
        <StatusAgenda status={participante.status} />
      </div>

      {estado.mensagem && <div className="mt-4"><Retorno estado={estado} /></div>}

      {participante.status === "AGENDADO" && participante.piloto && aceitaCheckIn && (
        <form action={acao} className="mt-5 grid gap-3">
          <input type="hidden" name="agendamentoId" value={agendamentoId} />
          <input type="hidden" name="participanteId" value={participante.id} />
          <input type="hidden" name="numeroPiloto" value={participante.piloto.numero} />
          <BotaoOperacao
            operacao="CHECK_IN"
            rotulo={`Fazer check-in com ${participante.piloto.nomeExibicao}`}
            destaque
          />
        </form>
      )}

      {!participante.piloto &&
        (participante.status === "AGENDADO" || participante.status === "PRESENTE") && (
          <BuscaPilotoParaParticipante
            agendamentoId={agendamentoId}
            participanteId={participante.id}
            nomeParticipante={participante.nomeCompleto}
            permiteCheckIn={participante.status === "AGENDADO" && aceitaCheckIn}
          />
        )}

      {participante.status === "AGENDADO" && aceitaCheckIn && (
        <details className="mt-4 border-t border-white/8 pt-4">
          <summary className="cursor-pointer text-xs font-semibold text-neutral-400">
            Participante não compareceu
          </summary>
          <form action={acao} className="mt-3">
            <input type="hidden" name="agendamentoId" value={agendamentoId} />
            <input type="hidden" name="participanteId" value={participante.id} />
            <BotaoOperacao
              operacao="AUSENTE"
              rotulo="Confirmar ausência"
              confirmacao="Registrar este participante como ausente?"
              perigo
            />
          </form>
        </details>
      )}
    </article>
  );
}

function BuscaPilotoParaParticipante({
  agendamentoId,
  participanteId,
  nomeParticipante,
  permiteCheckIn,
}: {
  agendamentoId: string;
  participanteId: string;
  nomeParticipante: string;
  permiteCheckIn: boolean;
}) {
  const [busca, buscar] = useActionState<EstadoBuscaPilotoAgenda, FormData>(
    buscarPilotoParaAgendaAction,
    {},
  );
  const [operacao, operar] = useActionState<EstadoOperacaoAgenda, FormData>(
    operarParticipanteAction,
    {},
  );

  return (
    <div className="mt-5 grid gap-4 border-t border-white/8 pt-5">
      {operacao.mensagem && <Retorno estado={operacao} />}
      <form action={buscar} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="grid gap-2 text-sm font-medium text-neutral-200">
          Buscar cadastro existente
          <input
            name="termo"
            type="search"
            minLength={2}
            required
            autoComplete="off"
            placeholder="Número, nome, telefone ou e-mail"
            className="min-h-11 rounded-xl border border-white/15 bg-black/20 px-4 text-base text-white placeholder:text-neutral-600"
          />
        </label>
        <BotaoBusca />
      </form>

      {busca.mensagem && <p role="status" className="text-sm text-neutral-400">{busca.mensagem}</p>}
      {busca.resultados && (
        <ul className="grid gap-2" aria-label="Pilotos encontrados">
          {busca.resultados.map((piloto) => {
            const ativo = piloto.status === "ATIVO";
            return (
              <li key={piloto.numero} className="rounded-xl border border-white/10 bg-black/15 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">
                      {piloto.numeroFormatado} · {piloto.nomeExibicao}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {piloto.nomeCompleto} · {piloto.nomeDaCategoria}
                    </p>
                  </div>
                  <StatusAgenda status={piloto.status} />
                </div>
                {ativo && (
                  <form action={operar} className="mt-3 flex flex-wrap gap-2">
                    <input type="hidden" name="agendamentoId" value={agendamentoId} />
                    <input type="hidden" name="participanteId" value={participanteId} />
                    <input type="hidden" name="numeroPiloto" value={piloto.numero} />
                    {permiteCheckIn && (
                      <BotaoOperacao operacao="CHECK_IN" rotulo="Vincular e fazer check-in" destaque />
                    )}
                    <BotaoOperacao operacao="VINCULAR" rotulo="Só vincular" />
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
        <p className="text-xs leading-5 text-neutral-500">
          Sem cadastro? Cadastre no balcão com o piloto presente: o peso vai direto para a balança
          e o cadastro já volta vinculado a esta reserva.
        </p>
        <Link
          href={{
            pathname: "/admin/pilotos/novo",
            query: {
              participante: participanteId,
              nome: nomeParticipante,
              voltar: `/admin/agendamentos/${agendamentoId}`,
            },
          }}
          className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-4 text-sm font-bold text-white hover:bg-white/5"
        >
          Cadastrar {nomeParticipante.split(" ")[0]} como piloto
        </Link>
      </div>
    </div>
  );
}

function BotaoBusca() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-4 text-sm font-bold text-white hover:bg-white/5 disabled:opacity-50"
    >
      {pending ? "Buscando..." : "Buscar piloto"}
    </button>
  );
}

function BotaoOperacao({
  operacao,
  rotulo,
  destaque = false,
  perigo = false,
  confirmacao,
}: {
  operacao: string;
  rotulo: string;
  destaque?: boolean;
  perigo?: boolean;
  confirmacao?: string;
}) {
  const { pending } = useFormStatus();
  const estilo = perigo
    ? "border-rose-400/25 bg-rose-400/10 text-rose-100 hover:bg-rose-400/15"
    : destaque
      ? "border-[var(--color-acelera)] bg-[var(--color-acelera)] text-white hover:bg-[var(--color-acelera-forte)]"
      : "border-white/15 bg-white/5 text-white hover:bg-white/10";
  return (
    <button
      type="submit"
      name="operacao"
      value={operacao}
      disabled={pending}
      onClick={(evento) => {
        if (confirmacao && !window.confirm(confirmacao)) evento.preventDefault();
      }}
      className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-bold disabled:opacity-50 ${estilo}`}
    >
      {pending ? "Salvando..." : rotulo}
    </button>
  );
}

function BotaoEnvio({ rotulo, perigo = false }: { rotulo: string; perigo?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-bold disabled:opacity-50 sm:w-fit ${
        perigo ? "bg-rose-700 text-white hover:bg-rose-600" : "border border-white/15 text-white hover:bg-white/5"
      }`}
    >
      {pending ? "Salvando..." : rotulo}
    </button>
  );
}

function Retorno({ estado }: { estado: EstadoOperacaoAgenda }) {
  return (
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
  );
}
