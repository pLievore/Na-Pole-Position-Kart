import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pilotoAtual } from "@/server/auth/sessao";
import { FormularioLogin } from "./FormularioLogin";

export const metadata: Metadata = { title: "Entrar" };

export default async function PaginaLogin() {
  if (await pilotoAtual()) redirect("/perfil");

  return (
    <div className="mx-auto max-w-sm px-5 py-12">
      <h1 className="text-3xl font-bold">Entrar</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Acesse para ver sua melhor volta e sua posição no ranking.
      </p>

      <div className="mt-8">
        <FormularioLogin />
      </div>

      <p className="mt-6 text-center text-sm text-neutral-400">
        Primeira vez na pista?{" "}
        <Link
          href="/agendar"
          className="font-medium text-[var(--color-acelera-texto)] hover:underline"
        >
          Agende sua corrida
        </Link>
      </p>
    </div>
  );
}
