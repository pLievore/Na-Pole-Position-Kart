import type { Metadata } from "next";
import { listarPilotos } from "@/server/pilotos/busca";
import { ListaPilotosAdmin } from "./ListaPilotosAdmin";

export const metadata: Metadata = { title: "Pilotos" };
export const dynamic = "force-dynamic";

export default async function PaginaPilotos() {
  const pilotos = await listarPilotos();
  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <h1 className="text-2xl font-bold">Pilotos</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Busque pelo número, nome, telefone ou e-mail sem colocar dados pessoais na URL.
      </p>
      <ListaPilotosAdmin pilotosIniciais={pilotos} />
    </main>
  );
}
