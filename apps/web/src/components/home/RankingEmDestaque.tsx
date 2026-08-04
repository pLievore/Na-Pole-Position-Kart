import Link from "next/link";
import { TabelaRanking } from "@/components/ranking/TabelaRanking";
import { carregarRankingPublico } from "@/server/ranking/consultas";

export async function RankingEmDestaque() {
  const linhas = await carregarRankingPublico({ limite: 5 });

  return (
    <section aria-labelledby="titulo-ranking-home" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-8 flex items-end justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-acelera-texto)]">
              Cronômetro aberto
            </p>
            <h2
              id="titulo-ranking-home"
              className="titulo-display mt-4 text-4xl leading-none sm:text-5xl"
            >
              Os tempos a serem batidos.
            </h2>
          </div>
          <Link
            href="/ranking"
            className="hidden min-h-11 items-center font-semibold text-white underline decoration-[var(--color-acelera)] decoration-2 underline-offset-4 sm:inline-flex"
          >
            Ranking completo
          </Link>
        </div>

        <TabelaRanking linhas={linhas} />

        <Link
          href="/ranking"
          className="mt-5 inline-flex min-h-11 items-center font-semibold text-white underline decoration-[var(--color-acelera)] decoration-2 underline-offset-4 sm:hidden"
        >
          Ranking completo
        </Link>
      </div>
    </section>
  );
}

export function EsqueletoRanking() {
  return (
    <section aria-label="Carregando ranking" aria-busy="true" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="h-3 w-36 animate-pulse rounded bg-white/10" />
        <div className="mt-5 h-12 max-w-xl animate-pulse rounded-xl bg-white/10" />
        <div className="mt-8 h-72 animate-pulse rounded-3xl border border-white/10 bg-white/[0.035]" />
      </div>
    </section>
  );
}
