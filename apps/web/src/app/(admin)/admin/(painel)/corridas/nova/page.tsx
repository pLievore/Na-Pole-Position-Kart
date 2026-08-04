import type { Metadata } from "next";
import Link from "next/link";
import { Aviso } from "@/components/ui";
import { listarKartsDisponiveis } from "@/server/karts/consultas";
import { FormularioLancamento } from "./FormularioLancamento";

export const metadata: Metadata = { title: "Lançar corrida" };
export const dynamic = "force-dynamic";

export default async function PaginaLancarCorrida() {
  const karts = await listarKartsDisponiveis();

  return (
    <main className="mx-auto max-w-lg px-5 py-8">
      <h1 className="text-2xl font-bold">Lançar corrida</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Ao salvar, o sistema atualiza a melhor volta, os rankings, os pontos e avisa os pilotos
        afetados.
      </p>

      <div className="mt-6">
        {karts.length === 0 ? (
          <Aviso>
            Nenhum kart cadastrado. Cadastre a frota antes de lançar corridas —{" "}
            <Link href="/admin" className="underline">
              voltar ao painel
            </Link>
            .
          </Aviso>
        ) : (
          <FormularioLancamento karts={karts} />
        )}
      </div>
    </main>
  );
}
