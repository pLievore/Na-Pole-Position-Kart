import type { Metadata } from "next";
import Link from "next/link";
import { formatarTempo } from "@napole/core";
import { Botao, Campo } from "@/components/ui";
import { buscarPilotos, listarPilotos, type PilotoEncontrado } from "@/server/pilotos/busca";

export const metadata: Metadata = { title: "Pilotos" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string | string[] }> };

export default async function PaginaPilotos({ searchParams }: Props) {
  const parametros = await searchParams;
  const busca = Array.isArray(parametros.q) ? parametros.q[0] : parametros.q;
  const termo = busca?.trim() ?? "";
  const pilotos = termo ? await buscarPilotos(termo) : await listarPilotos();

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <h1 className="text-2xl font-bold">Pilotos</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Busque pelo número, nome, telefone ou e-mail do piloto.
      </p>

      <form
        method="get"
        action="/admin/pilotos"
        className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
      >
        <Campo
          id="q"
          name="q"
          label="Buscar piloto"
          defaultValue={termo}
          placeholder="Ex.: 231, Patrick, telefone ou e-mail"
          autoFocus
        />
        <Botao type="submit" variante="secundario">
          Buscar
        </Botao>
      </form>

      <div className="mt-6 flex items-center justify-between gap-4 text-sm text-neutral-500">
        <p>
          {termo
            ? `${pilotos.length} ${pilotos.length === 1 ? "resultado" : "resultados"}`
            : `Mostrando até ${pilotos.length} ${pilotos.length === 1 ? "piloto" : "pilotos"}`}
        </p>
        {termo && (
          <Link
            href="/admin/pilotos"
            className="inline-flex min-h-11 shrink-0 items-center hover:text-white"
          >
            Limpar busca
          </Link>
        )}
      </div>

      {pilotos.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-white/10 bg-[var(--color-asfalto)] px-5 py-8 text-center text-sm text-neutral-400">
          Nenhum piloto encontrado.
        </p>
      ) : (
        <TabelaPilotos pilotos={pilotos} />
      )}
    </main>
  );
}

function TabelaPilotos({ pilotos }: { pilotos: PilotoEncontrado[] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
        <caption className="sr-only">Pilotos encontrados no painel administrativo</caption>
        <thead>
          <tr className="bg-white/5 text-xs uppercase tracking-wider text-neutral-400">
            <th scope="col" className="px-4 py-3 font-medium">
              Número
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Nome
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Categoria
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Status
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Melhor volta
            </th>
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
              <td className="px-4 py-3">
                <StatusPiloto status={piloto.status} />
              </td>
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
