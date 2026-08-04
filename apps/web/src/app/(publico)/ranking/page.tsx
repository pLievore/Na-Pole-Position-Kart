import type { Metadata } from "next";
import Link from "next/link";
import { nomeCategoria, type Categoria } from "@napole/core";
import { TabelaRanking } from "@/components/ranking/TabelaRanking";
import { carregarRankingPublico, categoriasComTempos } from "@/server/ranking/consultas";

export const metadata: Metadata = { title: "Ranking" };

/** Ordem fixa de exibicao — nao depende do que veio do banco. */
const ORDEM_CATEGORIAS: Categoria[] = [
  "MASCULINO_LEVE",
  "MASCULINO_MEDIO",
  "MASCULINO_PESADO",
  "FEMININO_LEVE",
  "FEMININO_MEDIO",
  "FEMININO_PESADO",
  "JUNIOR",
];

type Params = { searchParams: Promise<{ periodo?: string; categoria?: string }> };

export default async function PaginaRanking({ searchParams }: Params) {
  const filtros = await searchParams;
  const tipo = filtros.periodo === "mensal" ? "MENSAL" : "GERAL";

  const categoriaSelecionada = ORDEM_CATEGORIAS.find((c) => c === filtros.categoria) ?? null;

  const [linhas, disponiveis] = await Promise.all([
    carregarRankingPublico({ tipo, categoria: categoriaSelecionada }),
    categoriasComTempos(tipo),
  ]);

  const categorias = ORDEM_CATEGORIAS.filter((c) => disponiveis.includes(c));

  const href = (params: { periodo?: string; categoria?: string }) => {
    const busca = new URLSearchParams();
    const periodo = params.periodo ?? (tipo === "MENSAL" ? "mensal" : "geral");
    if (periodo === "mensal") busca.set("periodo", "mensal");
    const categoria = params.categoria ?? categoriaSelecionada ?? "";
    if (categoria) busca.set("categoria", categoria);
    const query = busca.toString();
    return query ? `/ranking?${query}` : "/ranking";
  };

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="text-3xl font-bold">Ranking</h1>
      <p className="mt-2 text-sm text-neutral-400">
        {tipo === "MENSAL"
          ? "Melhores voltas registradas neste mês."
          : "Melhores voltas dos últimos 12 meses."}
      </p>

      <nav aria-label="Período" className="mt-6 flex gap-2">
        <Filtro ativo={tipo === "GERAL"} href={href({ periodo: "geral" })}>
          Geral
        </Filtro>
        <Filtro ativo={tipo === "MENSAL"} href={href({ periodo: "mensal" })}>
          Mensal
        </Filtro>
      </nav>

      {categorias.length > 0 && (
        <nav aria-label="Categoria" className="mt-3 flex flex-wrap gap-2">
          <Filtro ativo={categoriaSelecionada === null} href={href({ categoria: "" })}>
            Todas
          </Filtro>
          {categorias.map((categoria) => (
            <Filtro
              key={categoria}
              ativo={categoriaSelecionada === categoria}
              href={href({ categoria })}
            >
              {nomeCategoria(categoria)}
            </Filtro>
          ))}
        </nav>
      )}

      <div className="mt-6">
        <TabelaRanking linhas={linhas} mostrarCategoria={categoriaSelecionada === null} />
      </div>

      <p className="mt-6 text-xs text-neutral-500">
        Em caso de empate, fica na frente quem marcou o tempo primeiro.{" "}
        <Link href="/regras" className="underline hover:text-neutral-300">
          Ver todas as regras
        </Link>
      </p>
    </main>
  );
}

function Filtro({
  ativo,
  href,
  children,
}: {
  ativo: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href as never}
      aria-current={ativo ? "page" : undefined}
      className={`min-h-9 rounded-full px-4 py-1.5 text-sm transition-colors ${
        ativo
          ? "bg-[var(--color-acelera)] font-medium text-white"
          : "border border-white/15 text-neutral-300 hover:bg-white/10"
      }`}
    >
      {children}
    </Link>
  );
}
