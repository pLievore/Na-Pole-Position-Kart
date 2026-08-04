import Link from "next/link";
import { exigirAdmin } from "@/server/auth/guardas";
import { sairAdminAction } from "./acoes";

/**
 * Layout do painel.
 *
 * O grupo (painel) existe para que /admin/entrar fique FORA desta guarda —
 * senao a pagina de login exigiria login e o acesso entraria em loop.
 */
export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  const admin = await exigirAdmin();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-white/10 bg-[var(--color-asfalto)]">
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 py-3 sm:py-4">
          <Link
            href="/admin"
            className="inline-flex min-h-11 shrink-0 items-center text-sm font-bold"
          >
            Painel
            <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-neutral-300">
              {admin.nivel === "ADMINISTRADOR" ? "Admin" : "Operador"}
            </span>
          </Link>

          <div className="flex w-full items-center gap-4 overflow-x-auto text-sm sm:w-auto sm:overflow-visible">
            <Link
              href="/admin/pilotos"
              className="inline-flex min-h-11 shrink-0 items-center text-neutral-300 hover:text-white"
            >
              Pilotos
            </Link>
            <Link
              href="/admin/corridas"
              className="inline-flex min-h-11 shrink-0 items-center text-neutral-300 hover:text-white"
            >
              Corridas
            </Link>
            <Link
              href="/admin/corridas/nova"
              className="inline-flex min-h-11 shrink-0 items-center rounded-lg bg-[var(--color-acelera)] px-3 font-medium text-white"
            >
              Lançar
            </Link>
            <span className="hidden shrink-0 text-neutral-400 md:inline">{admin.nome}</span>
            <form action={sairAdminAction} className="shrink-0">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center text-neutral-400 hover:text-white"
              >
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
