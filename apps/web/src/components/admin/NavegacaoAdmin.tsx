"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { sairAdminAction } from "@/app/(admin)/admin/(painel)/acoes";

type ItemNavegacao = {
  href: string;
  rotulo: string;
  descricao: string;
  exato?: boolean;
};

const ITENS: ItemNavegacao[] = [
  { href: "/admin", rotulo: "Visão geral", descricao: "Indicadores da operação", exato: true },
  { href: "/admin/agendamentos", rotulo: "Agenda", descricao: "Horários e reservas" },
  { href: "/admin/pilotos", rotulo: "Pilotos", descricao: "Cadastros e desempenho" },
  { href: "/admin/corridas", rotulo: "Corridas", descricao: "Resultados lançados" },
];

function itemAtivo(caminho: string, item: ItemNavegacao) {
  return item.exato ? caminho === item.href : caminho === item.href || caminho.startsWith(`${item.href}/`);
}

export function NavegacaoAdmin({
  nome,
  nivel,
}: {
  nome: string;
  nivel: "ADMINISTRADOR" | "OPERADOR";
}) {
  const caminho = usePathname();

  return (
    <>
      <aside className="hidden h-dvh border-r border-white/8 bg-[#0a0a0d] lg:sticky lg:top-0 lg:flex lg:flex-col">
        <div className="border-b border-white/8 px-6 py-6">
          <Link href="/admin" className="group block rounded-lg focus-visible:outline-offset-4">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-acelera-texto)]">
              Na Pole Position
            </span>
            <span className="mt-1 block text-lg font-black tracking-tight text-white">
              Central da pista
            </span>
          </Link>
        </div>

        <nav aria-label="Navegação administrativa" className="flex-1 space-y-1 px-3 py-5">
          {ITENS.map((item) => {
            const ativo = itemAtivo(caminho, item);
            return (
              <Link
                key={item.href}
                href={item.href as Route}
                aria-current={ativo ? "page" : undefined}
                className={`block rounded-xl border px-3 py-3 transition-colors ${
                  ativo
                    ? "border-white/10 bg-white/8 text-white"
                    : "border-transparent text-neutral-400 hover:border-white/8 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="block text-sm font-semibold">{item.rotulo}</span>
                <span className="mt-0.5 block text-xs text-neutral-500">{item.descricao}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/8 p-4">
          <div className="rounded-xl bg-white/[0.035] px-3 py-3">
            <p className="truncate text-sm font-medium text-white">{nome}</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              {nivel === "ADMINISTRADOR" ? "Administrador" : "Operador"}
            </p>
          </div>
          <form action={sairAdminAction} className="mt-2">
            <button
              type="submit"
              className="flex min-h-11 w-full items-center rounded-xl px-3 text-sm font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              Encerrar sessão
            </button>
          </form>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0d]/95 backdrop-blur lg:hidden">
        <div className="flex min-h-16 items-center justify-between gap-3 px-4">
          <Link href="/admin" className="min-w-0">
            <span className="block truncate text-sm font-black text-white">Central da pista</span>
            <span className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--color-acelera-texto)]">
              Na Pole Position
            </span>
          </Link>
          <form action={sairAdminAction}>
            <button type="submit" className="inline-flex min-h-11 items-center px-2 text-sm text-neutral-400">
              Sair
            </button>
          </form>
        </div>
        <nav
          aria-label="Navegação administrativa"
          className="flex gap-1 overflow-x-auto px-3 pb-3 [scrollbar-width:none]"
        >
          {ITENS.map((item) => {
            const ativo = itemAtivo(caminho, item);
            return (
              <Link
                key={item.href}
                href={item.href as Route}
                aria-current={ativo ? "page" : undefined}
                className={`inline-flex min-h-10 shrink-0 items-center rounded-lg px-3 text-sm font-semibold ${
                  ativo ? "bg-white/10 text-white" : "text-neutral-400"
                }`}
              >
                {item.rotulo}
              </Link>
            );
          })}
          <Link
            href="/admin/corridas/nova"
            className="inline-flex min-h-10 shrink-0 items-center rounded-lg bg-[var(--color-acelera)] px-3 text-sm font-semibold text-white"
          >
            Lançar tempo
          </Link>
        </nav>
      </header>
    </>
  );
}
