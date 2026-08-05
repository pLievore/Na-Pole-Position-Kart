"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { REGRAS_JUNIOR, calcularIdade, sugerirNomeExibicao } from "@napole/core";
import { Aviso, Botao, Campo, Cartao, Selecao } from "@/components/ui";
import { cadastrarNoBalcaoAction, type EstadoCadastroBalcao } from "./acoes";

export function FormularioBalcao({
  participanteId,
  nomeSugerido = "",
  voltarPara,
}: {
  /** Quando vem do check-in, o piloto criado ja e vinculado ao participante. */
  participanteId?: string;
  nomeSugerido?: string;
  voltarPara?: string;
}) {
  const [estado, acao] = useActionState<EstadoCadastroBalcao, FormData>(
    cadastrarNoBalcaoAction,
    {},
  );
  const erros = estado.erros ?? {};
  const valores = estado.valores ?? {};

  const [nomeCompleto, setNomeCompleto] = useState(valores.nomeCompleto ?? nomeSugerido);
  const [nomeExibicao, setNomeExibicao] = useState(
    valores.nomeExibicao ?? sugerirNomeExibicao(nomeSugerido),
  );
  const [nomeEditado, setNomeEditado] = useState(false);
  const [sexo, setSexo] = useState(valores.sexo ?? "");
  const [dataNascimento, setDataNascimento] = useState(valores.dataNascimento ?? "");

  const idade = dataNascimento ? calcularIdade(new Date(dataNascimento)) : null;
  const menorDeIdade = idade !== null && idade < REGRAS_JUNIOR.idadeMaximaExclusiva;

  if (estado.sucesso) {
    return <Confirmacao resultado={estado.sucesso} voltarPara={voltarPara} />;
  }

  return (
    <form action={acao} className="flex flex-col gap-4">
      {participanteId && <input type="hidden" name="participanteId" value={participanteId} />}
      {erros.form && <Aviso>{erros.form}</Aviso>}

      <Campo
        id="nomeCompleto"
        name="nomeCompleto"
        label="Nome completo"
        autoComplete="off"
        autoFocus
        required
        value={nomeCompleto}
        erro={erros.nomeCompleto}
        onChange={(evento) => {
          setNomeCompleto(evento.target.value);
          if (!nomeEditado) setNomeExibicao(sugerirNomeExibicao(evento.target.value));
        }}
      />

      <Campo
        id="nomeExibicao"
        name="nomeExibicao"
        label="Nome no ranking"
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
        inputMode="tel"
        required
        defaultValue={valores.telefone}
        erro={erros.telefone}
        dica="Com DDD."
      />

      <Campo
        id="email"
        name="email"
        type="email"
        label="E-mail (opcional)"
        inputMode="email"
        defaultValue={valores.email}
        erro={erros.email}
        dica="Sem e-mail o piloto corre e entra no ranking, mas não consegue acessar o site."
      />

      <Campo
        id="dataNascimento"
        name="dataNascimento"
        type="date"
        label="Data de nascimento"
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

      {sexo === "OUTRO" && (
        <Selecao
          id="categoriaBase"
          name="categoriaBase"
          label="Em qual categoria vai competir?"
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
        id="pesoAferidoKg"
        name="pesoAferidoKg"
        label="Peso na balança (kg)"
        inputMode="decimal"
        required
        defaultValue={valores.pesoAferidoKg}
        erro={erros.pesoAferidoKg}
        dica="Pese o piloto agora: o valor entra como peso conferido e define a categoria."
      />

      {menorDeIdade && (
        <fieldset className="flex flex-col gap-4 rounded-2xl border border-white/15 p-4">
          <legend className="px-2 text-sm font-medium text-neutral-200">Responsável</legend>
          <p className="text-xs text-neutral-500">
            Menores de {REGRAS_JUNIOR.idadeMaximaExclusiva} anos correm na categoria Junior.
            Altura mínima de {REGRAS_JUNIOR.alturaMinimaMetros.toFixed(2).replace(".", ",")} m.
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
            id="alturaMetros"
            name="alturaMetros"
            label="Altura (m)"
            inputMode="decimal"
            defaultValue={valores.alturaMetros}
            erro={erros.alturaMetros}
            dica="Ex.: 1.62"
          />
        </fieldset>
      )}

      <Campo
        id="observacoesInternas"
        name="observacoesInternas"
        label="Observações internas (opcional)"
        maxLength={500}
        defaultValue={valores.observacoesInternas}
        erro={erros.observacoesInternas}
        dica="Uso da equipe. O piloto tem direito de acesso aos próprios dados."
      />

      <label className="mt-2 flex items-start gap-3 text-sm text-neutral-300">
        <input
          type="checkbox"
          name="aceiteTermos"
          required
          className="mt-0.5 size-5 shrink-0 accent-[var(--color-acelera)]"
        />
        <span>
          Confirmo que apresentei as{" "}
          <a href="/regras" target="_blank" className="underline">
            regras do ranking
          </a>{" "}
          e os{" "}
          <a href="/termos" target="_blank" className="underline">
            termos de uso
          </a>{" "}
          ao piloto, e que ele concordou.
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
      {pending ? "Cadastrando..." : "Cadastrar piloto"}
    </Botao>
  );
}

function Confirmacao({
  resultado,
  voltarPara,
}: {
  resultado: NonNullable<EstadoCadastroBalcao["sucesso"]>;
  voltarPara?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Aviso tipo="sucesso">
        <strong>{resultado.nomeExibicao}</strong> agora é o piloto{" "}
        <strong>{resultado.numeroFormatado}</strong>.
        {resultado.vinculadoAoParticipante && " Vinculado à reserva."}
      </Aviso>

      <Cartao>
        <p className="text-xs uppercase tracking-wider text-neutral-500">Número do piloto</p>
        <p className="mt-1 font-mono text-4xl font-black">{resultado.numeroFormatado}</p>
        <p className="mt-2 text-sm text-neutral-400">
          Anote este número: é por ele que a equipe lança os tempos.
        </p>
      </Cartao>

      {resultado.linkPrimeiroAcesso ? (
        <Cartao>
          <p className="text-sm font-semibold text-neutral-200">Link de primeiro acesso</p>
          <p className="mt-1 text-xs text-neutral-500">
            Envie ao piloto para ele criar a senha. Vale por 7 dias e{" "}
            <strong>aparece apenas agora</strong> — depois desta tela não há como vê-lo de novo.
          </p>
          <code className="mt-3 block break-all rounded-lg bg-black/40 p-3 font-mono text-xs text-neutral-300">
            {resultado.linkPrimeiroAcesso}
          </code>
        </Cartao>
      ) : (
        <Cartao>
          <p className="text-sm text-neutral-300">
            Cadastro sem e-mail: o piloto corre e aparece no ranking normalmente, mas ainda não
            consegue acessar o site. Para liberar o acesso, adicione um e-mail na edição do
            cadastro.
          </p>
        </Cartao>
      )}

      <div className="flex flex-wrap gap-3">
        {voltarPara && (
          <Link
            href={voltarPara as never}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-[var(--color-acelera)] px-5 text-sm font-semibold text-white"
          >
            Voltar para a reserva
          </Link>
        )}
        <Link
          href={`/admin/pilotos/${resultado.numero}`}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-white/25 px-5 text-sm font-semibold"
        >
          Ver cadastro
        </Link>
        <Link
          href="/admin/pilotos/novo"
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-white/25 px-5 text-sm font-semibold"
        >
          Cadastrar outro
        </Link>
      </div>
    </div>
  );
}
