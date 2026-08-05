import Link from "next/link";
import { JANELA_RANKING_GERAL_MESES } from "@napole/core";
import { TabelaRanking } from "@/components/ranking/TabelaRanking";
import { carregarRankingPublico } from "@/server/ranking/consultas";

export async function RankingEmDestaque() {
  const linhas = await carregarRankingPublico({ limite: 5 });

  return (
    <section aria-labelledby="titulo-ranking-home" className="py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2 id="titulo-ranking-home" className="text-2xl font-black tracking-tight sm:text-3xl">
            Melhores tempos
          </h2>
          <Link
            href="/ranking"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-acelera-texto)] hover:underline"
          >
            Ver ranking completo →
          </Link>
        </div>
        <p className="mt-1 text-sm text-neutral-400">
          Últimos {JANELA_RANKING_GERAL_MESES} meses, todas as categorias.
        </p>

        <div className="mt-6">
          <TabelaRanking linhas={linhas} />
        </div>
      </div>
    </section>
  );
}

export function EsqueletoRanking() {
  return (
    <section aria-label="Carregando ranking" aria-busy="true" className="py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="h-8 w-52 animate-pulse rounded bg-white/10" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-white/[0.07]" />
        <div className="mt-6 h-64 animate-pulse rounded-2xl border border-white/10 bg-white/[0.035]" />
      </div>
    </section>
  );
}
