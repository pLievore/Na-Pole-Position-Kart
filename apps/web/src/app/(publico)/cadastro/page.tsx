import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pilotoAtual } from "@/server/auth/sessao";
import { FormularioCadastro } from "./FormularioCadastro";

export const metadata: Metadata = { title: "Cadastro de piloto" };

export default async function PaginaCadastro() {
  if (await pilotoAtual()) redirect("/perfil");

  return (
    <div className="mx-auto max-w-sm px-5 py-12">
      <h1 className="text-3xl font-bold">Cadastrar piloto</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Depois do cadastro você recebe seu número de piloto e passa a disputar o ranking.
      </p>

      <div className="mt-8">
        <FormularioCadastro />
      </div>

      <p className="mt-6 text-center text-sm text-neutral-400">
        Já tem cadastro?{" "}
        <Link href="/entrar" className="font-medium text-[var(--color-acelera-texto)] hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
