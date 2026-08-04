import type { Metadata } from "next";
import Link from "next/link";
import { listarCorridas } from "@/server/corridas/consultas";

export const metadata: Metadata = { title: "Corridas" };
export const dynamic = "force-dynamic";

const dataCurta = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

export default async function PaginaCorridas() {
  const corridas = await listarCorridas();

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Corridas lançadas</h1>
        <Link
          href="/admin/corridas/nova"
          className="inline-flex min-h-11 items-center rounded-xl bg-[var(--color-acelera)] px-5 text-sm font-semibold text-white"
        >
          Lançar corrida
        </Link>
      </div>

      {corridas.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-white/10 bg-[var(--color-asfalto)] px-5 py-8 text-center text-sm text-neutral-400">
          Nenhuma corrida lançada ainda.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-white/5 text-xs uppercase tracking-wider text-neutral-400">
                <th scope="col" className="px-4 py-3 font-medium">Data</th>
                <th scope="col" className="px-4 py-3 font-medium">Piloto</th>
                <th scope="col" className="px-4 py-3 font-medium">Categoria</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Melhor volta</th>
                <th scope="col" className="px-4 py-3 font-medium">Kart</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Pontos</th>
                <th scope="col" className="px-4 py-3 font-medium">Penalidade</th>
                <th scope="col" className="px-4 py-3 font-medium">Operador</th>
              </tr>
            </thead>
            <tbody>
              {corridas.map((corrida) => (
                <tr
                  key={corrida.id}
                  className={`border-t border-white/5 ${corrida.valida ? "" : "opacity-40"}`}
                >
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-neutral-300">
                    {dataCurta.format(corrida.data)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{corrida.nomeExibicao}</span>
                    <span className="ml-2 font-mono text-xs text-neutral-500">
                      {corrida.numeroPiloto}
                    </span>
                    {!corrida.valida && (
                      <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase">
                        invalidada
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{corrida.categoria}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {corrida.melhorVolta}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{corrida.kart}</td>
                  <td
                    className={`px-4 py-3 text-right font-mono tabular-nums ${
                      corrida.pontosTotal < 0 ? "text-[var(--color-acelera)]" : "text-emerald-400"
                    }`}
                  >
                    {corrida.pontosTotal > 0 ? `+${corrida.pontosTotal}` : corrida.pontosTotal}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">
                    {corrida.penalidades.length > 0 ? corrida.penalidades.join(", ") : "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{corrida.operador}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
