import type { Metadata } from "next";
import { formatarDataOperacional } from "@napole/core";
import { exigirPiloto } from "@/server/auth/guardas";
import { historicoDoPiloto } from "@/server/corridas/consultas";

export const metadata: Metadata = { title: "Meu histórico" };
export const dynamic = "force-dynamic";

export default async function PaginaHistorico() {
  const piloto = await exigirPiloto();
  const corridas = await historicoDoPiloto(piloto.id);

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-bold">Meu histórico</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Todas as suas corridas registradas pela Na Pole Position.
      </p>

      {corridas.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-white/10 bg-[var(--color-asfalto)] px-5 py-8 text-center text-sm text-neutral-400">
          Você ainda não tem corridas registradas.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {corridas.map((corrida) => (
            <li
              key={corrida.id}
              className="rounded-2xl border border-white/10 bg-[var(--color-asfalto)] p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="font-mono text-2xl font-bold tabular-nums">{corrida.melhorVolta}</p>
                <p
                  className={`font-mono text-sm tabular-nums ${
                    corrida.pontos < 0 ? "text-[var(--color-acelera)]" : "text-emerald-400"
                  }`}
                >
                  {corrida.pontos > 0 ? `+${corrida.pontos}` : corrida.pontos} pontos
                </p>
              </div>

              <p className="mt-2 text-sm text-neutral-400">
                {formatarDataOperacional(corrida.data)} · {corrida.kart}
              </p>

              {corrida.penalidades.length > 0 && (
                <p className="mt-2 text-sm text-[var(--color-acelera)]">
                  {corrida.penalidades.join(", ")}
                  {corrida.pontosDescontados !== 0 && ` (${corrida.pontosDescontados} pontos)`}
                </p>
              )}

              {corrida.observacao && (
                <p className="mt-2 border-t border-white/5 pt-2 text-sm text-neutral-500">
                  {corrida.observacao}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
