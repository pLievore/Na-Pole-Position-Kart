import type { Metadata } from "next";
import { TabelaRanking } from "@/components/ranking/TabelaRanking";
import { carregarResumo } from "@/server/dashboard/resumo";
import { carregarRankingPublico } from "@/server/ranking/consultas";

export const metadata: Metadata = { title: "Dashboard" };

// O painel reflete o que a operação acabou de lançar — nada de cache.
export const dynamic = "force-dynamic";

export default async function PaginaDashboard() {
  const [resumo, top10] = await Promise.all([
    carregarResumo(),
    carregarRankingPublico({ limite: 10 }),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Indicador rotulo="Pilotos cadastrados" valor={resumo.totalPilotos} />
        <Indicador rotulo="Ativos (30 dias)" valor={resumo.pilotosAtivos} />
        <Indicador rotulo="Corridas no mês" valor={resumo.corridasNoMes} />
        <Indicador rotulo="Novos cadastros" valor={resumo.novosCadastrosNoMes} />
        <Indicador rotulo="Penalidades no mês" valor={resumo.penalidadesNoMes} />
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold">Top 10 geral</h2>
        <TabelaRanking linhas={top10} />
      </section>
    </main>
  );
}

function Indicador({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--color-asfalto)] p-4">
      <p className="text-xs uppercase tracking-wider text-neutral-500">{rotulo}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{valor}</p>
    </div>
  );
}
