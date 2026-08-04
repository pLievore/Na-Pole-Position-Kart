import Link from "next/link";
import { pilotoAtual } from "@/server/auth/sessao";

export default async function LayoutPublico({ children }: { children: React.ReactNode }) {
  // A barra muda para quem ja esta logado: quem tem conta quer ir direto ao perfil.
  const piloto = await pilotoAtual();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-white/10">
        <nav className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="text-sm font-bold tracking-tight">
            Na Pole Position
            <span className="ml-1.5 font-normal text-[var(--color-acelera)]">Racing Club</span>
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <Link href="/ranking" className="text-neutral-300 hover:text-white">
              Ranking
            </Link>
            {piloto ? (
              <Link href="/perfil" className="font-medium text-white">
                Meu perfil
              </Link>
            ) : (
              <Link href="/entrar" className="font-medium text-white">
                Entrar
              </Link>
            )}
          </div>
        </nav>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-white/10 px-5 py-6 text-center text-xs text-neutral-500">
        <p>Na Pole Position Kart Indoor</p>
        <p className="mt-2 flex justify-center gap-4">
          <Link href="/regras" className="hover:text-neutral-300">
            Regras do ranking
          </Link>
          <Link href="/termos" className="hover:text-neutral-300">
            Termos e privacidade
          </Link>
        </p>
      </footer>
    </div>
  );
}
