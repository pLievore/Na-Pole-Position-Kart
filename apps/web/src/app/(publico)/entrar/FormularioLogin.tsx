"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Aviso, Botao, Campo } from "@/components/ui";
import { entrarAction, type EstadoLogin } from "./acoes";

export function FormularioLogin() {
  const [estado, acao] = useActionState<EstadoLogin, FormData>(entrarAction, {});

  return (
    <form action={acao} className="flex flex-col gap-4">
      {estado.erro && <Aviso>{estado.erro}</Aviso>}

      <Campo
        id="email"
        name="email"
        type="email"
        label="E-mail"
        autoComplete="email"
        inputMode="email"
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
  );
}

function BotaoEnviar() {
  // useFormStatus so funciona num filho do form — daí o componente separado.
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending} className="mt-2">
      {pending ? "Entrando..." : "Entrar"}
    </Botao>
  );
}
