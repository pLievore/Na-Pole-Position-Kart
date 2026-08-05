import type { Metadata } from "next";
import Link from "next/link";
import { listarPilotos } from "@/server/pilotos/busca";
import { ListaPilotosAdmin } from "./ListaPilotosAdmin";

export const metadata: Metadata = { title: "Pilotos" };
export const dynamic = "force-dynamic";

export default async function PaginaPilotos() {
  const pilotos = await listarPilotos();
  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Pilotos</h1>
        <Link
          href="/admin/pilotos/novo"
          className="inline-flex min-h-11 items-center rounded-xl bg-[var(--color-acelera)] px-5 text-sm font-bold text-white hover:bg-[var(--color-acelera-forte)]"
        >
          Cadastrar piloto
        </Link>
      </div>
      <p className="mt-2 text-sm text-neutral-400">
        Busque pelo número, nome, telefone ou e-mail sem colocar dados pessoais na URL.
      </p>
      <ListaPilotosAdmin pilotosIniciais={pilotos} />
    </main>
  );
}
