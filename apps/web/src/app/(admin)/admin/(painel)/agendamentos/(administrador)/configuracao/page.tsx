import type { Metadata } from "next";
import Link from "next/link";
import { obterConfiguracaoPadroesAgendamento } from "@/server/agendamentos";
import { FormularioConfiguracaoAgenda } from "./FormularioConfiguracaoAgenda";

export const metadata: Metadata = { title: "Configuração da agenda" };
export const dynamic = "force-dynamic";

export default async function PaginaConfiguracaoAgenda() {
  const configuracao = await obterConfiguracaoPadroesAgendamento();

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
      <Link
        href="/admin/agendamentos"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-neutral-400 hover:text-white"
      >
        ← Voltar para a agenda
      </Link>
      <header className="mt-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-acelera-texto)]">
          Administração
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          Padrões da agenda
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
          Defina a semana operacional usada para gerar horários e comunicar o funcionamento no
          site público.
        </p>
      </header>

      <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-8">
        <FormularioConfiguracaoAgenda configuracao={configuracao} />
      </section>
    </main>
  );
}
