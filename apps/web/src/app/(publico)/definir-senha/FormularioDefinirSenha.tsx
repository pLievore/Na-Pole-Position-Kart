"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Aviso, Botao, Campo } from "@/components/ui";
import { definirSenhaAction, type EstadoDefinirSenha } from "./acoes";

export function FormularioDefinirSenha({
  token,
  primeiroAcesso,
}: {
  token: string;
  primeiroAcesso: boolean;
}) {
  const [estado, acao] = useActionState<EstadoDefinirSenha, FormData>(definirSenhaAction, {});
  const erros = estado.erros ?? {};

  return (
    <form action={acao} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      {estado.erro && <Aviso>{estado.erro}</Aviso>}
      {erros.form && <Aviso>{erros.form}</Aviso>}

      <Campo
        id="novaSenha"
        name="novaSenha"
        type="password"
        label={primeiroAcesso ? "Crie sua senha" : "Nova senha"}
        autoComplete="new-password"
        required
        erro={erros.novaSenha}
        dica="Mínimo de 8 caracteres, com letras e números."
      />
      <Campo
        id="confirmacaoSenha"
        name="confirmacaoSenha"
        type="password"
        label="Repita a senha"
        autoComplete="new-password"
        required
        erro={erros.confirmacaoSenha}
      />

      <BotaoEnviar primeiroAcesso={primeiroAcesso} />
    </form>
  );
}

function BotaoEnviar({ primeiroAcesso }: { primeiroAcesso: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending} className="mt-2">
      {pending ? "Salvando..." : primeiroAcesso ? "Criar senha e entrar" : "Salvar nova senha"}
    </Botao>
  );
}
