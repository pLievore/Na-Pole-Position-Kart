import type { Metadata } from "next";
import Link from "next/link";
import { exigirAdmin } from "@/server/auth/guardas";
import { FormularioBalcao } from "./FormularioBalcao";

export const metadata: Metadata = { title: "Cadastrar piloto" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ participante?: string; nome?: string; voltar?: string }>;
};

export default async function PaginaCadastroBalcao({ searchParams }: Props) {
  // Cadastro de balcao e trabalho de operador, nao so de administrador.
  await exigirAdmin();
  const { participante, nome, voltar } = await searchParams;

  return (
    <main className="mx-auto max-w-lg px-5 py-8">
      <Link
        href="/admin/pilotos"
        className="inline-flex min-h-11 items-center text-sm text-neutral-400 hover:text-white"
      >
        ← Voltar para pilotos
      </Link>

      <h1 className="mt-2 text-2xl font-bold">Cadastrar piloto</h1>
      <p className="mt-2 text-sm text-neutral-400">
        {participante
          ? "O piloto será vinculado à reserva assim que o cadastro for criado."
          : "Use no balcão, com o piloto presente. O peso é aferido na balança da pista."}
      </p>

      <div className="mt-6">
        <FormularioBalcao
          participanteId={participante}
          nomeSugerido={nome ?? ""}
          voltarPara={voltar}
        />
      </div>
    </main>
  );
}
