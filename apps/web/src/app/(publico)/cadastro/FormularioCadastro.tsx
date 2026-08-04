"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { REGRAS_JUNIOR, calcularIdade, parseDataCivil, sugerirNomeExibicao } from "@napole/core";
import { Aviso, Botao, Campo, Selecao } from "@/components/ui";
import { cadastrarAction, type EstadoCadastro } from "./acoes";

function idadeDaDataNascimento(valor: string): number | null {
  if (!valor) return null;
  try {
    return calcularIdade(parseDataCivil(valor));
  } catch {
    // A validacao do servidor mostra o erro; o preview apenas deixa de inferir a idade.
    return null;
  }
}

export function FormularioCadastro() {
  const [estado, acao] = useActionState<EstadoCadastro, FormData>(cadastrarAction, {});
  const erros = estado.erros ?? {};
  const valores = estado.valores ?? {};

  const [nomeCompleto, setNomeCompleto] = useState(valores.nomeCompleto ?? "");
  const [nomeExibicao, setNomeExibicao] = useState(valores.nomeExibicao ?? "");
  const [nomeEditado, setNomeEditado] = useState(false);
  const [sexo, setSexo] = useState(valores.sexo ?? "");
  const [dataNascimento, setDataNascimento] = useState(valores.dataNascimento ?? "");

  // Sexo "outro" nao tem faixa de peso propria: o piloto escolhe onde competir.
  const precisaEscolherBase = sexo === "OUTRO";

  // Menor de idade precisa de contato do responsavel (secao 2.3 do escopo).
  const idade = idadeDaDataNascimento(dataNascimento);
  const menorDeIdade = idade !== null && idade < REGRAS_JUNIOR.idadeMaximaExclusiva;

  return (
    <form action={acao} className="flex flex-col gap-4">
      {erros.form && <Aviso>{erros.form}</Aviso>}

      <Campo
        id="nomeCompleto"
        name="nomeCompleto"
        label="Nome completo"
        autoComplete="name"
        required
        value={nomeCompleto}
        erro={erros.nomeCompleto}
        dica="Usado só internamente pela equipe."
        onChange={(evento) => {
          const valor = evento.target.value;
          setNomeCompleto(valor);
          // Preenche a sugestão enquanto o piloto não editar o campo na mão.
          if (!nomeEditado) setNomeExibicao(sugerirNomeExibicao(valor));
        }}
      />

      <Campo
        id="nomeExibicao"
        name="nomeExibicao"
        label="Como quer aparecer no ranking"
        required
        maxLength={30}
        value={nomeExibicao}
        erro={erros.nomeExibicao}
        dica="É este nome que aparece publicamente."
        onChange={(evento) => {
          setNomeEditado(true);
          setNomeExibicao(evento.target.value);
        }}
      />

      <Campo
        id="telefone"
        name="telefone"
        type="tel"
        label="Telefone / WhatsApp"
        autoComplete="tel"
        inputMode="tel"
        required
        defaultValue={valores.telefone}
        erro={erros.telefone}
        dica="Com DDD. Usado para contato e recuperação de senha."
      />

      <Campo
        id="email"
        name="email"
        type="email"
        label="E-mail"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={valores.email}
        erro={erros.email}
        dica="Será o seu login."
      />

      <Campo
        id="senha"
        name="senha"
        type="password"
        label="Senha"
        autoComplete="new-password"
        required
        erro={erros.senha}
        dica="Mínimo de 8 caracteres, com letras e números."
      />

      <Campo
        id="dataNascimento"
        name="dataNascimento"
        type="date"
        label="Data de nascimento"
        autoComplete="bday"
        required
        value={dataNascimento}
        erro={erros.dataNascimento}
        onChange={(evento) => setDataNascimento(evento.target.value)}
      />

      <Selecao
        id="sexo"
        name="sexo"
        label="Sexo"
        required
        value={sexo}
        erro={erros.sexo}
        onChange={(evento) => setSexo(evento.target.value)}
      >
        <option value="" disabled>
          Selecione
        </option>
        <option value="MASCULINO">Masculino</option>
        <option value="FEMININO">Feminino</option>
        <option value="OUTRO">Outro</option>
      </Selecao>

      {precisaEscolherBase && (
        <Selecao
          id="categoriaBase"
          name="categoriaBase"
          label="Em qual categoria quer competir?"
          required
          defaultValue={valores.categoriaBase ?? ""}
          erro={erros.categoriaBase}
        >
          <option value="" disabled>
            Selecione
          </option>
          <option value="MASCULINO">Categorias masculinas</option>
          <option value="FEMININO">Categorias femininas</option>
        </Selecao>
      )}

      <Campo
        id="pesoDeclaradoKg"
        name="pesoDeclaradoKg"
        label="Peso (kg)"
        inputMode="decimal"
        required
        defaultValue={valores.pesoDeclaradoKg}
        erro={erros.pesoDeclaradoKg}
        dica="Define sua categoria. Nunca é exibido publicamente — no ranking aparece só a categoria."
      />

      {menorDeIdade && (
        <fieldset className="flex flex-col gap-4 rounded-2xl border border-white/15 p-4">
          <legend className="px-2 text-sm font-medium text-neutral-200">Responsável</legend>
          <p className="text-xs text-neutral-500">
            Pilotos com menos de {REGRAS_JUNIOR.idadeMaximaExclusiva} anos correm na categoria
            Junior e precisam do contato de um responsável. Altura mínima de{" "}
            {REGRAS_JUNIOR.alturaMinimaMetros.toFixed(2).replace(".", ",")} m, conferida na pista.
          </p>

          <Campo
            id="responsavelNome"
            name="responsavelNome"
            label="Nome do responsável"
            required
            defaultValue={valores.responsavelNome}
            erro={erros.responsavelNome}
          />
          <Campo
            id="responsavelTelefone"
            name="responsavelTelefone"
            type="tel"
            label="Telefone do responsável"
            inputMode="tel"
            required
            defaultValue={valores.responsavelTelefone}
            erro={erros.responsavelTelefone}
          />
          <Campo
            id="responsavelEmail"
            name="responsavelEmail"
            type="email"
            label="E-mail do responsável"
            inputMode="email"
            defaultValue={valores.responsavelEmail}
            erro={erros.responsavelEmail}
          />
        </fieldset>
      )}

      <label className="mt-2 flex items-start gap-3 text-sm text-neutral-300">
        <input
          type="checkbox"
          name="aceiteTermos"
          className="mt-0.5 size-5 shrink-0 rounded border-white/25 bg-transparent"
          required
        />
        <span>
          Li e aceito os{" "}
          <a href="/termos" className="underline hover:text-white">
            termos de uso, a política de privacidade
          </a>{" "}
          e as{" "}
          <a href="/regras" className="underline hover:text-white">
            regras do ranking
          </a>
          .
        </span>
      </label>
      {erros.aceiteTermos && <Aviso>{erros.aceiteTermos}</Aviso>}

      <BotaoEnviar />
    </form>
  );
}

function BotaoEnviar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending} className="mt-2">
      {pending ? "Cadastrando..." : "Criar meu cadastro"}
    </Botao>
  );
}
