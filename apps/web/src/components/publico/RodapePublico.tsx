import Link from "next/link";
import type { HorarioPublicoFormatado } from "./horarios";
import { Marca } from "./Marca";

export function RodapePublico({
  whatsapp,
  horarios,
}: {
  whatsapp: string | null;
  horarios: HorarioPublicoFormatado[];
}) {
  return (
    <footer className="border-t border-white/[0.08] bg-black/20">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.35fr_1fr_1fr]">
        <div>
          <Marca />
          <p className="mt-5 max-w-sm text-sm leading-6 text-neutral-400">
            Kart indoor com ranking oficial. Reserve seu horário e acompanhe seus tempos.
          </p>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
            Explore
          </h2>
          <nav aria-label="Links do rodapé" className="mt-4 grid gap-2 text-sm">
            <Link href="/agendar" className="link-rodape">
              Agendar corrida
            </Link>
            <Link href="/ranking" className="link-rodape">
              Ranking
            </Link>
            <Link href="/regras" className="link-rodape">
              Regras do ranking
            </Link>
            <Link href="/termos" className="link-rodape">
              Termos e privacidade
            </Link>
          </nav>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
            Pista aberta
          </h2>
          <p className="mt-4 text-sm leading-6 text-neutral-300">
            {horarios.map((horario) => (
              <span key={`${horario.dias}-${horario.periodo}`} className="block">
                {horario.dias}, {horario.periodo}
              </span>
            ))}
          </p>
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-white underline decoration-[var(--color-acelera)] decoration-2 underline-offset-4"
            >
              Falar com a equipe
            </a>
          )}
        </div>
      </div>

      <div className="border-t border-white/[0.07] px-5 py-5 text-center text-xs text-neutral-600">
        © {new Date().getFullYear()} Na Pole Position Kart Indoor
      </div>
    </footer>
  );
}
