"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { Marca } from "./Marca";

type PropriedadesNavegacao = {
  pilotoLogado: boolean;
};

const links = [
  { href: "/#como-funciona", rotulo: "Como funciona" },
  { href: "/#pizzaria", rotulo: "Pizzaria" },
  { href: "/#onde-estamos", rotulo: "Onde estamos" },
  { href: "/ranking", rotulo: "Ranking" },
] as const;

export function NavegacaoPublica({ pilotoLogado }: PropriedadesNavegacao) {
  const caminho = usePathname();
  const menuRef = useRef<HTMLDetailsElement>(null);
  const rotuloConta = pilotoLogado ? "Meu perfil" : "Entrar";
  const hrefConta = pilotoLogado ? "/perfil" : "/entrar";
  const fecharMenu = () => menuRef.current?.removeAttribute("open");

  return (
    <header className="cabecalho-publico sticky top-0 z-50 border-b border-white/[0.08]">
      <nav
        aria-label="Navegação principal"
        className="mx-auto flex min-h-[4.5rem] max-w-7xl items-center justify-between gap-5 px-5 sm:px-8"
      >
        <Marca />

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={!link.href.includes("#") && caminho === link.href ? "page" : undefined}
              className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-neutral-300 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              {link.rotulo}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <Link
            href={hrefConta}
            aria-current={caminho === hrefConta ? "page" : undefined}
            className="inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold text-neutral-200 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            {rotuloConta}
          </Link>
          <Link
            href="/agendar"
            aria-current={caminho === "/agendar" ? "page" : undefined}
            className="botao-acao inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--color-acelera)] px-5 text-sm font-bold text-white transition hover:bg-[var(--color-acelera-forte)]"
          >
            Agendar corrida
          </Link>
        </div>

        <details ref={menuRef} className="menu-publico relative sm:hidden">
          <summary
            aria-label="Abrir menu"
            className="relative grid size-11 cursor-pointer list-none place-items-center rounded-lg border border-white/15 bg-white/[0.04] text-white transition-colors hover:bg-white/[0.09]"
          >
            <span aria-hidden="true" className="absolute inset-0 z-10 opacity-0">
              Abrir menu
            </span>
            <span
              aria-hidden="true"
              className="menu-publico-icone pointer-events-none grid gap-1.5"
            >
              <span className="block h-px w-5 bg-current" />
              <span className="block h-px w-5 bg-current" />
            </span>
          </summary>

          <div className="absolute right-0 top-[calc(100%+0.75rem)] w-[min(19rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-white/10 bg-[var(--color-superficie-elevada)] p-2 shadow-2xl shadow-black/50">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={!link.href.includes("#") && caminho === link.href ? "page" : undefined}
                onClick={fecharMenu}
                className="flex min-h-11 items-center rounded-xl px-4 text-sm font-medium text-neutral-200 transition-colors hover:bg-white/[0.07] hover:text-white"
              >
                {link.rotulo}
              </Link>
            ))}
            <div className="my-2 h-px bg-white/10" />
            <Link
              href={hrefConta}
              aria-current={caminho === hrefConta ? "page" : undefined}
              onClick={fecharMenu}
              className="flex min-h-11 items-center rounded-xl px-4 text-sm font-medium text-neutral-200 transition-colors hover:bg-white/[0.07] hover:text-white"
            >
              {rotuloConta}
            </Link>
            <Link
              href="/agendar"
              aria-current={caminho === "/agendar" ? "page" : undefined}
              onClick={fecharMenu}
              className="mt-1 flex min-h-11 items-center justify-center rounded-xl bg-[var(--color-acelera)] px-4 text-sm font-bold text-white"
            >
              Agendar corrida
            </Link>
          </div>
        </details>
      </nav>
    </header>
  );
}
