import type { Metadata } from "next";
import Link from "next/link";
import { Aviso } from "@/components/ui";
import { conferirConvite } from "@/server/pilotos/primeiro-acesso";
import { FormularioDefinirSenha } from "./FormularioDefinirSenha";

export const metadata: Metadata = {
  title: "Definir senha",
  // Link pessoal: nao deve aparecer em buscador nenhum.
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ token?: string | string[] }> };

export default async function PaginaDefinirSenha({ searchParams }: Props) {
  const parametros = await searchParams;
  const recebido = Array.isArray(parametros.token) ? parametros.token[0] : parametros.token;
  const token = recebido?.trim() ?? "";
  const convite = token ? await conferirConvite(token) : null;

  return (
    <main className="mx-auto max-w-sm px-5 py-12">
      {!convite ? (
        <>
          <h1 className="text-3xl font-bold">Link inválido</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Este link já foi usado ou expirou.
          </p>
          <div className="mt-6">
            <Aviso tipo="info">
              Fale com a equipe da Na Pole Position para receber um novo link de acesso.
            </Aviso>
          </div>
          <p className="mt-6 text-center text-sm text-neutral-400">
            <Link href="/" className="font-medium text-[var(--color-acelera)] hover:underline">
              Voltar para a página inicial
            </Link>
          </p>
        </>
      ) : (
        <>
          <p className="font-mono text-sm text-neutral-500">#{convite.numero}</p>
          <h1 className="mt-1 text-3xl font-bold">
            {convite.primeiroAcesso ? `Bem-vindo, ${convite.nomeExibicao}` : "Nova senha"}
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            {convite.primeiroAcesso
              ? "Crie sua senha para acompanhar seus tempos e sua posição no ranking."
              : "Escolha uma nova senha para a sua conta."}
          </p>

          <div className="mt-8">
            <FormularioDefinirSenha token={token} primeiroAcesso={convite.primeiroAcesso} />
          </div>
        </>
      )}
    </main>
  );
}
