import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Aviso } from "@/components/ui";
import { carregarPerfilAdministrativo } from "@/server/pilotos/perfil-admin";
import { FormulariosGestaoPiloto } from "./FormulariosGestaoPiloto";

export const metadata: Metadata = { title: "Gerenciar piloto" };
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ numero: string }> };

export default async function PaginaGerenciarPiloto({ params }: Params) {
  const { numero: parametroNumero } = await params;
  if (!/^\d{1,10}$/.test(parametroNumero)) notFound();

  const numero = Number(parametroNumero);
  if (!Number.isSafeInteger(numero) || numero <= 0 || numero > 2_147_483_647) notFound();

  const piloto = await carregarPerfilAdministrativo(numero);
  if (!piloto) notFound();

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <Link
        href={`/admin/pilotos/${piloto.numero}`}
        className="inline-flex min-h-11 items-center text-sm text-neutral-400 hover:text-white"
      >
        ← Voltar ao perfil
      </Link>

      <header className="mt-5">
        <p className="font-mono text-sm text-neutral-500">{piloto.numeroFormatado}</p>
        <h1 className="mt-1 text-3xl font-bold">Gerenciar {piloto.nomeExibicao}</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Todas as alterações abaixo ficam registradas na trilha de auditoria.
        </p>
      </header>

      <div className="mt-6">
        <Aviso tipo="info">
          A categoria das corridas anteriores é histórica e nunca será alterada por estas operações.
        </Aviso>
      </div>

      <FormulariosGestaoPiloto
        piloto={{
          numero: piloto.numero,
          nomeCompleto: piloto.nomeCompleto,
          nomeExibicao: piloto.nomeExibicao,
          telefone: piloto.telefone,
          email: piloto.email,
          observacoesInternas: piloto.observacoesInternas ?? "",
          pesoConferidoKg: piloto.pesoConferidoKg ?? "",
          categoria: piloto.categoria,
          categoriaManual: piloto.categoriaManual,
          status: piloto.status,
        }}
      />
    </main>
  );
}
