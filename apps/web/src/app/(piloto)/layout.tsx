import Link from "next/link";
import { exigirPiloto } from "@/server/auth/guardas";
import { sairAction } from "./acoes";

/**
 * Guarda unica da area do piloto.
 *
 * Toda pagina dentro de (piloto) esta protegida por este layout — nenhuma
 * pagina filha deve verificar login por conta propria, para que uma pagina nova
 * nao nasca desprotegida por esquecimento.
 */
export default async function LayoutPiloto({ children }: { children: React.ReactNode }) {
  const piloto = await exigirPiloto();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-white/10">
        <nav className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/perfil" className="text-sm font-bold tracking-tight">
            {piloto.nomeExibicao}
            <span className="ml-2 font-mono text-xs font-normal text-neutral-500">
              #{piloto.numero}
            </span>
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <Link href="/historico" className="text-neutral-300 hover:text-white">
              Histórico
            </Link>
            <Link href="/ranking" className="text-neutral-300 hover:text-white">
              Ranking
            </Link>
            <form action={sairAction}>
              <button type="submit" className="text-neutral-400 hover:text-white">
                Sair
              </button>
            </form>
          </div>
        </nav>
      </header>

      <div className="flex-1">{children}</div>
    </div>
  );
}
