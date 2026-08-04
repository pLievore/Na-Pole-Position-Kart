"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { nomeCategoria, type Categoria } from "@napole/core";
import { AreaTexto, Aviso, Botao, Campo, Cartao, Selecao } from "@/components/ui";
import {
  alterarCategoriaPilotoAction,
  alterarStatusPilotoAction,
  confirmarPesoPilotoAction,
  editarCadastroPilotoAction,
  inativarPilotoAction,
  resetarSenhaPilotoAction,
  type EstadoOperacaoPiloto,
} from "./acoes";

const CATEGORIAS: Categoria[] = [
  "MASCULINO_LEVE",
  "MASCULINO_MEDIO",
  "MASCULINO_PESADO",
  "FEMININO_LEVE",
  "FEMININO_MEDIO",
  "FEMININO_PESADO",
  "JUNIOR",
];

export interface DadosGestaoPiloto {
  numero: number;
  nomeCompleto: string;
  nomeExibicao: string;
  telefone: string;
  email: string;
  observacoesInternas: string;
  pesoConferidoKg: string;
  categoria: Categoria;
  categoriaManual: boolean;
  status: string;
}

export function FormulariosGestaoPiloto({ piloto }: { piloto: DadosGestaoPiloto }) {
  return (
    <div className="mt-7 grid gap-5 lg:grid-cols-2 lg:items-start">
      <FormularioCadastro piloto={piloto} />

      <div className="grid gap-5">
        <FormularioPeso piloto={piloto} />
        <FormularioCategoria piloto={piloto} />
        <FormularioStatus piloto={piloto} />
        <FormularioSenha numero={piloto.numero} />
        <FormularioInativacao piloto={piloto} />
      </div>
    </div>
  );
}

function FormularioCadastro({ piloto }: { piloto: DadosGestaoPiloto }) {
  const [estado, acao] = useActionState<EstadoOperacaoPiloto, FormData>(
    editarCadastroPilotoAction,
    {},
  );

  return (
    <Cartao>
      <h2 className="text-lg font-bold">Editar cadastro</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Estes dados são internos, exceto o nome de exibição, que aparece no ranking.
      </p>

      <form action={acao} className="mt-5 flex flex-col gap-4">
        <input type="hidden" name="numero" value={piloto.numero} />
        <Retorno estado={estado} />

        <Campo
          key={piloto.nomeCompleto}
          id="nomeCompleto"
          name="nomeCompleto"
          label="Nome completo"
          required
          autoComplete="name"
          defaultValue={piloto.nomeCompleto}
          erro={estado.erros?.nomeCompleto}
        />
        <Campo
          key={piloto.nomeExibicao}
          id="nomeExibicao"
          name="nomeExibicao"
          label="Nome de exibição"
          required
          maxLength={30}
          defaultValue={piloto.nomeExibicao}
          erro={estado.erros?.nomeExibicao}
          dica="Este nome é público no ranking."
        />
        <Campo
          key={piloto.telefone}
          id="telefone"
          name="telefone"
          type="tel"
          label="Telefone / WhatsApp"
          required
          autoComplete="tel"
          inputMode="tel"
          defaultValue={piloto.telefone}
          erro={estado.erros?.telefone}
        />
        <Campo
          key={piloto.email}
          id="email"
          name="email"
          type="email"
          label="E-mail"
          required
          autoComplete="email"
          inputMode="email"
          defaultValue={piloto.email}
          erro={estado.erros?.email}
          dica="Também é o login do piloto."
        />
        <AreaTexto
          key={piloto.observacoesInternas}
          id="observacoesInternas"
          name="observacoesInternas"
          label="Observações internas"
          maxLength={5000}
          defaultValue={piloto.observacoesInternas}
          erro={estado.erros?.observacoesInternas}
          dica="Visível apenas para a equipe administrativa."
        />

        <BotaoFormulario pendente="Salvando...">Salvar cadastro</BotaoFormulario>
      </form>
    </Cartao>
  );
}

function FormularioPeso({ piloto }: { piloto: DadosGestaoPiloto }) {
  const [estado, acao] = useActionState<EstadoOperacaoPiloto, FormData>(
    confirmarPesoPilotoAction,
    {},
  );

  return (
    <Cartao>
      <h2 className="text-lg font-bold">Confirmar peso na balança</h2>
      <p className="mt-1 text-sm text-neutral-500">
        {piloto.categoriaManual
          ? "O peso será registrado, mas a categoria continuará fixada manualmente."
          : "O peso aferido passa a prevalecer e a categoria é recalculada automaticamente."}
      </p>

      <form action={acao} className="mt-5 flex flex-col gap-4">
        <input type="hidden" name="numero" value={piloto.numero} />
        <Retorno estado={estado} />
        <Campo
          key={piloto.pesoConferidoKg}
          id="pesoConferidoKg"
          name="pesoConferidoKg"
          label="Peso aferido (kg)"
          required
          inputMode="decimal"
          defaultValue={piloto.pesoConferidoKg}
          erro={estado.erros?.pesoConferidoKg}
          dica="Aceita vírgula ou ponto, por exemplo 82,5."
        />
        <BotaoFormulario pendente="Registrando...">Confirmar peso</BotaoFormulario>
      </form>
    </Cartao>
  );
}

function FormularioCategoria({ piloto }: { piloto: DadosGestaoPiloto }) {
  const [estado, acao] = useActionState<EstadoOperacaoPiloto, FormData>(
    alterarCategoriaPilotoAction,
    {},
  );

  return (
    <Cartao>
      <h2 className="text-lg font-bold">Fixar categoria manual</h2>
      <p className="mt-1 text-sm text-neutral-500">
        A alteração vale para lançamentos futuros. A categoria gravada nas corridas anteriores não
        muda.
      </p>

      <form action={acao} className="mt-5 flex flex-col gap-4">
        <input type="hidden" name="numero" value={piloto.numero} />
        <Retorno estado={estado} />
        <Selecao
          key={piloto.categoria}
          id="categoria"
          name="categoria"
          label="Categoria final"
          required
          defaultValue={piloto.categoria}
          erro={estado.erros?.categoria}
        >
          {CATEGORIAS.map((categoria) => (
            <option key={categoria} value={categoria}>
              {nomeCategoria(categoria)}
            </option>
          ))}
        </Selecao>
        <BotaoFormulario pendente="Salvando...">Definir manualmente</BotaoFormulario>
      </form>
    </Cartao>
  );
}

function FormularioStatus({ piloto }: { piloto: DadosGestaoPiloto }) {
  const [estado, acao] = useActionState<EstadoOperacaoPiloto, FormData>(
    alterarStatusPilotoAction,
    {},
  );

  if (piloto.status === "INATIVO") {
    return (
      <Cartao>
        <h2 className="text-lg font-bold">Acesso do piloto</h2>
        <div className="mt-4">
          <Aviso tipo="info">Cadastro inativo. Esta operação não o reativa.</Aviso>
        </div>
      </Cartao>
    );
  }

  const bloquear = piloto.status === "ATIVO";

  return (
    <Cartao>
      <h2 className="text-lg font-bold">Acesso do piloto</h2>
      <p className="mt-1 text-sm text-neutral-500">
        {bloquear
          ? "Bloquear impede o login, remove o piloto do ranking atual e encerra as sessões abertas."
          : "Desbloquear permite o login e devolve os tempos válidos ao ranking atual."}
      </p>

      <form action={acao} className="mt-5 flex flex-col gap-4">
        <input type="hidden" name="numero" value={piloto.numero} />
        <input type="hidden" name="destino" value={bloquear ? "BLOQUEADO" : "ATIVO"} />
        <Retorno estado={estado} />
        <BotaoFormulario variante={bloquear ? "contorno" : "primario"} pendente="Alterando...">
          {bloquear ? "Bloquear piloto" : "Desbloquear piloto"}
        </BotaoFormulario>
      </form>
    </Cartao>
  );
}

function FormularioSenha({ numero }: { numero: number }) {
  const [estado, acao] = useActionState<EstadoOperacaoPiloto, FormData>(
    resetarSenhaPilotoAction,
    {},
  );
  const formulario = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.sucesso) formulario.current?.reset();
  }, [estado]);

  return (
    <Cartao>
      <h2 className="text-lg font-bold">Resetar senha</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Defina uma nova senha e comunique-a diretamente ao piloto. Ela não aparece em logs, URL ou
        auditoria.
      </p>

      <form ref={formulario} action={acao} className="mt-5 flex flex-col gap-4">
        <input type="hidden" name="numero" value={numero} />
        <Retorno estado={estado} />
        <Campo
          id="novaSenha"
          name="novaSenha"
          type="password"
          label="Nova senha"
          required
          autoComplete="new-password"
          erro={estado.erros?.novaSenha}
          dica="Mínimo de 8 caracteres, com letras e números."
        />
        <Campo
          id="confirmacaoSenha"
          name="confirmacaoSenha"
          type="password"
          label="Confirmar nova senha"
          required
          autoComplete="new-password"
          erro={estado.erros?.confirmacaoSenha}
        />
        <BotaoFormulario pendente="Redefinindo...">Redefinir senha</BotaoFormulario>
      </form>
    </Cartao>
  );
}

function FormularioInativacao({ piloto }: { piloto: DadosGestaoPiloto }) {
  const [estado, acao] = useActionState<EstadoOperacaoPiloto, FormData>(inativarPilotoAction, {});

  if (piloto.status === "INATIVO") {
    return estado.sucesso ? <Aviso tipo="sucesso">{estado.sucesso}</Aviso> : null;
  }

  return (
    <Cartao className="border-[var(--color-acelera)]/30">
      <h2 className="text-lg font-bold text-red-200">Cadastro criado com erro</h2>
      <p className="mt-1 text-sm text-neutral-400">
        O cadastro será marcado como inativo e as sessões serão encerradas. Corridas, pontos,
        penalidades e auditoria permanecem preservados.
      </p>

      <form action={acao} className="mt-5 flex flex-col gap-4">
        <input type="hidden" name="numero" value={piloto.numero} />
        <Retorno estado={estado} />
        <label className="flex items-start gap-3 text-sm text-neutral-300">
          <input
            id="confirmarInativacao"
            type="checkbox"
            name="confirmarInativacao"
            required
            aria-invalid={estado.erros?.confirmarInativacao ? true : undefined}
            aria-describedby={
              estado.erros?.confirmarInativacao ? "confirmarInativacao-erro" : undefined
            }
            className="mt-0.5 size-5 shrink-0 rounded border-white/25 bg-transparent"
          />
          <span>Confirmo que este cadastro foi criado com erro e deve ficar inativo.</span>
        </label>
        {estado.erros?.confirmarInativacao && (
          <p id="confirmarInativacao-erro" className="text-xs text-[var(--color-acelera)]">
            {estado.erros.confirmarInativacao}
          </p>
        )}
        <BotaoFormulario pendente="Inativando...">Marcar como inativo</BotaoFormulario>
      </form>
    </Cartao>
  );
}

function Retorno({ estado }: { estado: EstadoOperacaoPiloto }) {
  if (estado.erros?.form || estado.erros?.piloto || estado.erros?.status) {
    return <Aviso>{estado.erros.form ?? estado.erros.piloto ?? estado.erros.status}</Aviso>;
  }
  if (estado.sucesso) return <Aviso tipo="sucesso">{estado.sucesso}</Aviso>;
  return null;
}

function BotaoFormulario({
  children,
  pendente,
  variante = "primario",
}: {
  children: React.ReactNode;
  pendente: string;
  variante?: "primario" | "secundario" | "contorno";
}) {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" variante={variante} disabled={pending}>
      {pending ? pendente : children}
    </Botao>
  );
}
