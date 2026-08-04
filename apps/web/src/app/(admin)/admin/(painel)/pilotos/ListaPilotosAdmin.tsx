"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { formatarTempo } from "@napole/core";
import { Botao, Campo } from "@/components/ui";
import type { PilotoEncontrado } from "@/server/pilotos/busca";
import { buscarPilotosAdminAction, type EstadoBuscaPilotosAdmin } from "./acoes";

export function ListaPilotosAdmin({ pilotosIniciais }: { pilotosIniciais: PilotoEncontrado[] }) {
  const [estado, acao] = useActionState<EstadoBuscaPilotosAdmin, FormData>(
    buscarPilotosAdminAction,
    { pilotos: pilotosIniciais, termo: "" },
  );

  return (
    <>
      <form
        action={acao}
        className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
      >
        <Campo
          key={estado.termo}
          id="q"
          name="q"
          type="search"
          label="Buscar piloto"
          defaultValue={estado.termo}
          placeholder="Ex.: 231, Patrick, telefone ou e-mail"
          autoComplete="off"
          autoFocus
        />
        <BotaoBusca />
      </form>

      <div className="mt-6 flex items-center justify-between gap-4 text-sm text-neutral-500">
        <p role="status">
          {estado.termo
            ? `${estado.pilotos.length} ${estado.pilotos.length === 1 ? "resultado" : "resultados"}`
            : `Mostrando até ${estado.pilotos.length} ${estado.pilotos.length === 1 ? "piloto" : "pilotos"}`}
        </p>
        {estado.termo && (
          <form action={acao}>
            <button
              type="submit"
              name="limpar"
              value="1"
              className="inline-flex min-h-11 shrink-0 items-center hover:text-white"
            >
              Limpar busca
            </button>
          </form>
        )}
      </div>

      {estado.pilotos.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-white/10 bg-[var(--color-asfalto)] px-5 py-8 text-center text-sm text-neutral-400">
          Nenhum piloto encontrado.
        </p>
      ) : (
        <TabelaPilotos pilotos={estado.pilotos} />
      )}
    </>
  );
}

function BotaoBusca() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" variante="secundario" disabled={pending}>
      {pending ? "Buscando..." : "Buscar"}
    </Botao>
  );
}

function TabelaPilotos({ pilotos }: { pilotos: PilotoEncontrado[] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
        <caption className="sr-only">Pilotos encontrados no painel administrativo</caption>
        <thead>
          <tr className="bg-white/5 text-xs uppercase tracking-wider text-neutral-400">
            <th scope="col" className="px-4 py-3 font-medium">Número</th>
            <th scope="col" className="px-4 py-3 font-medium">Nome</th>
            <th scope="col" className="px-4 py-3 font-medium">Categoria</th>
            <th scope="col" className="px-4 py-3 font-medium">Status</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Melhor volta</th>
          </tr>
        </thead>
        <tbody>
          {pilotos.map((piloto) => (
            <tr key={piloto.id} className="border-t border-white/5">
              <td className="whitespace-nowrap px-4 py-3 font-mono text-neutral-400">
                {piloto.numeroFormatado}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/pilotos/${piloto.numero}`}
                  className="inline-flex min-h-11 items-center font-medium text-white hover:underline"
                >
                  {piloto.nomeExibicao}
                </Link>
              </td>
              <td className="px-4 py-3 text-neutral-400">{piloto.nomeDaCategoria}</td>
              <td className="px-4 py-3"><StatusPiloto status={piloto.status} /></td>
              <td className="px-4 py-3 text-right font-mono tabular-nums">
                {piloto.melhorVoltaMs === null ? "—" : formatarTempo(piloto.melhorVoltaMs)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const STATUS: Record<string, { rotulo: string; classe: string }> = {
  ATIVO: { rotulo: "Ativo", classe: "bg-emerald-500/10 text-emerald-300" },
  BLOQUEADO: { rotulo: "Bloqueado", classe: "bg-amber-500/10 text-amber-300" },
  INATIVO: { rotulo: "Inativo", classe: "bg-white/10 text-neutral-400" },
};

function StatusPiloto({ status }: { status: string }) {
  const item = STATUS[status] ?? { rotulo: status, classe: "bg-white/10 text-neutral-400" };
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${item.classe}`}>
      {item.rotulo}
    </span>
  );
}
