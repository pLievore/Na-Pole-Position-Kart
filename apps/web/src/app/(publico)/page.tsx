import { BotaoLink } from "@/components/ui";
import { TabelaRanking } from "@/components/ranking/TabelaRanking";
import { carregarRankingPublico } from "@/server/ranking/consultas";
import { env } from "@/env";

// Sem cache: o layout publico le o cookie de sessao para trocar o link da barra,
// o que ja torna a renderizacao dinamica. Um `revalidate` aqui nao teria efeito
// nenhum e daria a falsa impressao de que a pagina esta em cache. No volume de
// uma pista unica, renderizar a cada acesso e barato.
export default async function PaginaInicial() {
  const top10 = await carregarRankingPublico({ limite: 10 });

  const whatsapp = env.NEXT_PUBLIC_WHATSAPP
    ? `https://wa.me/${env.NEXT_PUBLIC_WHATSAPP}`
    : null;

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <section className="flex flex-col gap-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-acelera)]">
          Na Pole Position Kart Indoor
        </p>
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
          Seu tempo.
          <br />
          Seu ranking.
          <br />
          <span className="text-[var(--color-acelera)]">Sua próxima disputa.</span>
        </h1>
        <p className="max-w-prose text-neutral-300">
          O Racing Club é o sistema oficial de ranking da Na Pole Position Kart Indoor.
          Cadastre-se, acompanhe sua melhor volta e veja em quanto tempo você está do
          piloto da frente.
        </p>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        <BotaoLink href="/cadastro" variante="primario">
          Cadastrar piloto
        </BotaoLink>
        <BotaoLink href="/entrar" variante="secundario">
          Entrar na minha conta
        </BotaoLink>
        <BotaoLink href="/ranking" variante="contorno">
          Ver ranking
        </BotaoLink>
        <BotaoLink href="/regras" variante="contorno">
          Ver regras do ranking
        </BotaoLink>
        {whatsapp && (
          <div className="sm:col-span-2">
            <BotaoLink href={whatsapp} variante="contorno" externo>
              Chamar no WhatsApp
            </BotaoLink>
          </div>
        )}
      </section>

      <section className="mt-12">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-bold">Top 10 geral</h2>
          <a href="/ranking" className="text-sm text-[var(--color-acelera)] hover:underline">
            Ver todos
          </a>
        </div>
        <TabelaRanking linhas={top10} />
        <p className="mt-3 text-xs text-neutral-500">
          O ranking geral considera os tempos dos últimos 12 meses.
        </p>
      </section>
    </main>
  );
}
