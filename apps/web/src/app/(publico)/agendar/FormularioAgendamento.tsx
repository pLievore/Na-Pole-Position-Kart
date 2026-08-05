"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { SeletorDeDia, SeletorDeQuantidade } from "@/components/ui/SeletorDeDia";
import { consultarHorariosAction, solicitarAgendamentoAction } from "./acoes";
import { ESTADO_INICIAL_SOLICITACAO, type HorarioAgendamentoDto } from "./contrato";

const CLASSE_CAMPO =
  "min-h-12 w-full rounded-xl border border-white/15 bg-black/25 px-4 text-base text-white placeholder:text-neutral-600 transition-colors hover:border-white/25 focus:border-white/35";

type PropriedadesFormulario = {
  dataInicial?: string;
  dataMinima: string;
  quantidadeInicial?: number;
  whatsapp: string | null;
  resumoHorarios: string;
  /** Dias da semana em que a pista abre (0 = domingo). */
  diasAbertos: number[];
};

export function FormularioAgendamento({
  dataInicial = "",
  dataMinima,
  quantidadeInicial = 1,
  whatsapp,
  resumoHorarios,
  diasAbertos,
}: PropriedadesFormulario) {
  const [estado, acao] = useActionState(solicitarAgendamentoAction, ESTADO_INICIAL_SOLICITACAO);
  const [data, setData] = useState(dataInicial);
  const [quantidade, setQuantidade] = useState(quantidadeInicial);
  const [horarios, setHorarios] = useState<HorarioAgendamentoDto[]>([]);
  const [horarioSelecionado, setHorarioSelecionado] = useState("");
  const [erroConsulta, setErroConsulta] = useState("");
  const [consultando, iniciarConsulta] = useTransition();
  const retornoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHorarioSelecionado("");
    setErroConsulta("");

    if (!data) {
      setHorarios([]);
      return;
    }

    let consultaAtiva = true;
    iniciarConsulta(async () => {
      try {
        const resposta = await consultarHorariosAction(data);
        if (!consultaAtiva) return;
        setHorarios(resposta.horarios);
        if (!resposta.ok) setErroConsulta(resposta.mensagem);
      } catch {
        if (consultaAtiva) {
          setHorarios([]);
          setErroConsulta("Não foi possível consultar os horários. Tente novamente.");
        }
      }
    });

    return () => {
      consultaAtiva = false;
    };
  }, [data]);

  useEffect(() => {
    if (!horarioSelecionado) return;
    const horario = horarios.find((item) => item.id === horarioSelecionado);
    if (!horario || horario.status === "LOTADO" || horario.vagasDisponiveis < quantidade) {
      setHorarioSelecionado("");
    }
  }, [horarioSelecionado, horarios, quantidade]);

  useEffect(() => {
    if (estado.status !== "inicial") retornoRef.current?.focus();
  }, [estado.status]);

  if (estado.status === "sucesso") {
    return (
      <div
        ref={retornoRef}
        role="status"
        tabIndex={-1}
        className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-6 text-sm leading-6 text-emerald-100 outline-none"
      >
        <strong className="block text-lg text-white">Solicitação recebida.</strong>
        <p className="mt-2">
          {estado.mensagem ?? "Ela está aguardando confirmação da equipe."}
        </p>
        {estado.protocolo && (
          <div className="mt-5">
            <span className="block font-mono text-sm">Protocolo: {estado.protocolo}</span>
            <a
              href={`/agendar/consultar?codigo=${encodeURIComponent(estado.protocolo)}`}
              className="mt-3 inline-flex min-h-11 items-center rounded-xl border border-emerald-300/25 px-4 font-bold text-white hover:bg-white/5"
            >
              Acompanhar solicitação
            </a>
          </div>
        )}
        <a
          href="/agendar"
          className="mt-3 inline-flex min-h-11 items-center px-1 font-semibold text-neutral-300 underline underline-offset-4"
        >
          Fazer outra solicitação
        </a>
      </div>
    );
  }

  return (
    <form action={acao} className="grid gap-8">
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label htmlFor="website">Não preencha este campo</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {estado.status === "erro" && estado.mensagem && (
        <div
          ref={retornoRef}
          role="alert"
          tabIndex={-1}
          className="rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-4 text-sm leading-6 text-red-100 outline-none"
        >
          {estado.mensagem}
          {whatsapp && estado.erros === undefined && (
            <>
              {" "}
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline underline-offset-4"
              >
                Chamar no WhatsApp
              </a>
            </>
          )}
        </div>
      )}

      {/*
        O <legend> nao participa do grid do <fieldset>: o navegador o posiciona
        sobre a borda, fora do fluxo. Com `grid` no fieldset e margem negativa no
        paragrafo, os dois textos acabavam empilhados um sobre o outro. Titulo e
        descricao ficam agora num bloco normal, e o grid vale so para os campos.
      */}
      <fieldset className="border-0 p-0">
        <legend className="mb-1 text-xl font-black tracking-tight text-white">
          Escolha a bateria
        </legend>
        <p className="text-sm leading-6 text-neutral-400">{resumoHorarios}.</p>

        <div className="mt-5">
          <input type="hidden" name="data" value={data} />
          <SeletorDeDia
            id="rotulo-data"
            rotulo="Data"
            inicio={dataMinima}
            diasAbertos={diasAbertos}
            quantidade={14}
            valor={data}
            aoEscolher={setData}
          />
          <ErroCampo id="data-erro">{estado.erros?.data}</ErroCampo>
        </div>

        <div role="region" aria-label="Horários disponíveis" className="mt-5">
          <fieldset
            className="border-0 p-0"
            aria-invalid={estado.erros?.horarioId ? true : undefined}
            aria-describedby={estado.erros?.horarioId ? "horario-erro" : undefined}
          >
            <legend className="text-sm font-semibold text-neutral-200">Horários disponíveis</legend>

            {!data && (
              <p
                role="status"
                className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-neutral-400"
              >
                Nenhum horário disponível até você escolher uma data.
              </p>
            )}

            {data && consultando && (
              <p
                role="status"
                className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-neutral-400"
              >
                Consultando horários…
              </p>
            )}

            {data && !consultando && horarios.length === 0 && (
              <p
                role="status"
                className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-neutral-400"
              >
                Nenhum horário disponível para esta data.
              </p>
            )}

            {erroConsulta && (
              <p role="alert" className="mt-3 text-sm text-red-300">
                {erroConsulta}
              </p>
            )}

            {horarios.length > 0 && !consultando && (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {horarios.map((horario) => {
                  const indisponivel =
                    horario.status === "LOTADO" || horario.vagasDisponiveis < quantidade;
                  const id = "horario-" + horario.id;

                  return (
                    <div key={horario.id}>
                      <input
                        id={id}
                        type="radio"
                        name="horarioId"
                        value={horario.id}
                        checked={horarioSelecionado === horario.id}
                        onChange={() => setHorarioSelecionado(horario.id)}
                        disabled={indisponivel}
                        required
                        className="peer sr-only"
                      />
                      <label
                        htmlFor={id}
                        className="flex min-h-16 cursor-pointer flex-col justify-center rounded-xl border border-white/15 bg-black/20 px-4 transition hover:border-white/30 peer-checked:border-[var(--color-acelera)] peer-checked:bg-[var(--color-acelera)]/10 peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-red-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-35"
                      >
                        <span className="font-mono text-sm font-bold text-white">
                          {horaCivil(horario.inicioEm)}–{horaCivil(horario.fimEm)}
                        </span>
                        <span className="mt-1 text-[11px] text-neutral-500">
                          {rotuloStatus(horario)}
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
            )}

            <ErroCampo id="horario-erro">{estado.erros?.horarioId}</ErroCampo>
          </fieldset>
        </div>
      </fieldset>

      <div className="h-px bg-white/10" />

      <fieldset className="border-0 p-0">
        <legend className="mb-5 text-xl font-black tracking-tight text-white">Seu grupo</legend>

        <div>
          <input type="hidden" name="quantidade" value={quantidade} />
          <SeletorDeQuantidade
            id="rotulo-quantidade"
            rotulo="Quantidade de participantes"
            valor={quantidade}
            aoEscolher={setQuantidade}
          />
          <ErroCampo id="quantidade-erro">{estado.erros?.quantidade}</ErroCampo>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: quantidade }, (_, indice) => {
            const nome = "participanteNome_" + indice;
            const idErro = nome + "-erro";
            return (
              <div key={nome} className="grid gap-2">
                <label htmlFor={nome} className="text-sm font-semibold text-neutral-200">
                  Nome do participante {indice + 1}
                </label>
                <input
                  id={nome}
                  name={nome}
                  type="text"
                  autoComplete="off"
                  required
                  aria-invalid={estado.erros?.[nome] ? true : undefined}
                  aria-describedby={estado.erros?.[nome] ? idErro : undefined}
                  className={CLASSE_CAMPO}
                />
                <ErroCampo id={idErro}>{estado.erros?.[nome]}</ErroCampo>
              </div>
            );
          })}
        </div>

        <fieldset
          className="mt-5 border-0 p-0"
          aria-invalid={estado.erros?.menorDeIdade ? true : undefined}
          aria-describedby={estado.erros?.menorDeIdade ? "menor-erro" : undefined}
        >
          <legend className="text-sm font-semibold text-neutral-200">
            Algum participante é menor de idade?
          </legend>
          <div className="mt-3 flex flex-wrap gap-3">
            <OpcaoRadio name="menorDeIdade" value="NAO" label="Não" />
            <OpcaoRadio name="menorDeIdade" value="SIM" label="Sim" />
          </div>
          <p className="mt-2 text-xs leading-5 text-neutral-500">
            A equipe confirmará os requisitos aplicáveis antes da reserva.
          </p>
          <ErroCampo id="menor-erro">{estado.erros?.menorDeIdade}</ErroCampo>
        </fieldset>
      </fieldset>

      <div className="h-px bg-white/10" />

      <fieldset className="border-0 p-0">
        <legend className="mb-5 text-xl font-black tracking-tight text-white">
          Contato da reserva
        </legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <label htmlFor="nomeResponsavel" className="text-sm font-semibold text-neutral-200">
              Nome do responsável
            </label>
            <input
              id="nomeResponsavel"
              name="nomeResponsavel"
              type="text"
              autoComplete="name"
              required
              aria-invalid={estado.erros?.nomeResponsavel ? true : undefined}
              aria-describedby={estado.erros?.nomeResponsavel ? "responsavel-erro" : undefined}
              className={CLASSE_CAMPO}
            />
            <ErroCampo id="responsavel-erro">{estado.erros?.nomeResponsavel}</ErroCampo>
          </div>

          <div className="grid gap-2">
            <label htmlFor="whatsapp" className="text-sm font-semibold text-neutral-200">
              WhatsApp
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(00) 00000-0000"
              required
              aria-invalid={estado.erros?.whatsapp ? true : undefined}
              aria-describedby={estado.erros?.whatsapp ? "whatsapp-erro" : undefined}
              className={CLASSE_CAMPO}
            />
            <ErroCampo id="whatsapp-erro">{estado.erros?.whatsapp}</ErroCampo>
          </div>

          <div className="grid gap-2">
            <label htmlFor="email" className="text-sm font-semibold text-neutral-200">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              aria-invalid={estado.erros?.email ? true : undefined}
              aria-describedby={estado.erros?.email ? "email-erro" : undefined}
              className={CLASSE_CAMPO}
            />
            <ErroCampo id="email-erro">{estado.erros?.email}</ErroCampo>
          </div>
        </div>

        <div className="mt-5 grid gap-2">
          <label htmlFor="observacoes" className="text-sm font-semibold text-neutral-200">
            Observações <span className="font-normal text-neutral-500">(opcional)</span>
          </label>
          <textarea
            id="observacoes"
            name="observacoes"
            rows={4}
            maxLength={500}
            placeholder="Conte algo que a equipe precisa saber sobre o grupo."
            aria-invalid={estado.erros?.observacoes ? true : undefined}
            aria-describedby={estado.erros?.observacoes ? "observacoes-erro" : undefined}
            className={CLASSE_CAMPO + " resize-y py-3"}
          />
          <ErroCampo id="observacoes-erro">{estado.erros?.observacoes}</ErroCampo>
        </div>
      </fieldset>

      <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-neutral-300">
          <input
            type="checkbox"
            name="aceiteTermos"
            value="SIM"
            required
            aria-invalid={estado.erros?.aceiteTermos ? true : undefined}
            aria-describedby={estado.erros?.aceiteTermos ? "termos-erro" : undefined}
            className="mt-1 size-5 shrink-0 accent-[var(--color-acelera)]"
          />
          <span>
            Li e aceito os{" "}
            <a
              href="/termos"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white underline underline-offset-4"
            >
              termos de uso e privacidade
            </a>{" "}
            e entendo que o envio é uma solicitação sujeita à confirmação da equipe.
          </span>
        </label>
        <ErroCampo id="termos-erro">{estado.erros?.aceiteTermos}</ErroCampo>
      </div>

      <BotaoEnviar />
      <p className="-mt-4 text-center text-xs leading-5 text-neutral-500">
        Nenhum pagamento é realizado pelo site.
      </p>
    </form>
  );
}

function BotaoEnviar() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="botao-acao inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--color-acelera)] px-6 text-sm font-extrabold text-white transition hover:bg-[var(--color-acelera-forte)] disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Enviando solicitação…" : "Solicitar agendamento"}
    </button>
  );
}

function OpcaoRadio({ name, value, label }: { name: string; value: string; label: string }) {
  const id = name + "-" + value.toLowerCase();

  return (
    <div>
      <input id={id} type="radio" name={name} value={value} required className="peer sr-only" />
      <label
        htmlFor={id}
        className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-white/15 px-5 text-sm font-semibold text-neutral-300 transition hover:border-white/30 peer-checked:border-[var(--color-acelera)] peer-checked:bg-[var(--color-acelera)]/10 peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-red-300"
      >
        {label}
      </label>
    </div>
  );
}

function ErroCampo({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} className="text-xs font-medium text-red-300">
      {children}
    </p>
  );
}

function horaCivil(valorIso: string): string {
  return valorIso.slice(11, 16);
}

function rotuloStatus(horario: HorarioAgendamentoDto): string {
  if (horario.status === "LOTADO") return "Lotado";
  if (horario.status === "ULTIMAS_VAGAS") return "Últimas vagas";
  return horario.vagasDisponiveis + " vagas para solicitar";
}
