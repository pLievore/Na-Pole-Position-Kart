"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Aviso, Botao, Campo } from "@/components/ui";
import { entrarAdminAction, type EstadoLoginAdmin } from "./acoes";

/**
 * Login administrativo.
 *
 * Fica fora do layout do painel de proposito: o layout de (admin)/admin exige
 * sessao, e esta e a pagina onde a sessao ainda nao existe.
 */
export default function PaginaLoginAdmin() {
  const [estado, acao] = useActionState<EstadoLoginAdmin, FormData>(entrarAdminAction, {});

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-12">
      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Na Pole Position</p>
      <h1 className="mt-2 text-2xl font-bold">Painel administrativo</h1>

      <form action={acao} className="mt-8 flex flex-col gap-4">
        {estado.erro && <Aviso>{estado.erro}</Aviso>}

        <Campo
          id="email"
          name="email"
          type="email"
          label="E-mail"
          autoComplete="email"
          required
        />
        <Campo
          id="senha"
          name="senha"
          type="password"
          label="Senha"
          autoComplete="current-password"
          required
        />

        <BotaoEnviar />
      </form>
    </main>
  );
}

function BotaoEnviar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending} className="mt-2">
      {pending ? "Entrando..." : "Entrar"}
    </Botao>
  );
}
