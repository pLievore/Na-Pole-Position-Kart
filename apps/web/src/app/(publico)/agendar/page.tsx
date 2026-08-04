import type { Metadata } from "next";
import Link from "next/link";
import { dataOperacionalISO } from "@napole/core";
import { env } from "@/env";
import {
  formatarHorariosPublicos,
  resumirHorariosPublicos,
} from "@/components/publico/horarios";
import { obterConfiguracaoPadroesAgendamento } from "@/server/agendamentos";
import { FormularioAgendamento } from "./FormularioAgendamento";

export const metadata: Metadata = {
  title: "Agendar corrida",
  description:
    "Solicite uma bateria de kart indoor na Na Pole Position. Escolha data, horário e participantes sem criar conta.",
};

type PropriedadesPagina = {
  searchParams: Promise<{ data?: string; quantidade?: string }>;
};

export default async function PaginaAgendar({ searchParams }: PropriedadesPagina) {
  const parametros = await searchParams;
  const dataInicial = /^\d{4}-\d{2}-\d{2}$/.test(parametros.data ?? "")
    ? parametros.data
    : undefined;
  const quantidadeRecebida = Number(parametros.quantidade);
  const quantidadeInicial =
    Number.isInteger(quantidadeRecebida) && quantidadeRecebida >= 1 && quantidadeRecebida <= 10
      ? quantidadeRecebida
      : 1;
  const whatsapp = env.NEXT_PUBLIC_WHATSAPP ? "https://wa.me/" + env.NEXT_PUBLIC_WHATSAPP : null;
  const dataMinima = dataOperacionalISO(new Date());
  const configuracao = await obterConfiguracaoPadroesAgendamento();
  const horarios = formatarHorariosPublicos(configuracao);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-16">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-neutral-400 transition-colors hover:text-white"
      >
        <span aria-hidden="true">←</span>
        Voltar para a página inicial
      </Link>

      <div className="mt-6 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
        <section aria-labelledby="titulo-pagina-agendar">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-acelera-texto)]">
            Solicitação de reserva
          </p>
          <h1
            id="titulo-pagina-agendar"
            className="titulo-display mt-4 text-4xl leading-[0.95] sm:text-6xl"
          >
            Sua próxima volta começa aqui.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-400">
            Escolha a bateria e conte quem vem com você. Não é preciso criar uma conta e nenhum
            pagamento será feito agora.
          </p>

          <div className="cartao-vitrine mt-10 rounded-3xl p-5 sm:p-8">
            <FormularioAgendamento
              dataInicial={dataInicial}
              dataMinima={dataMinima}
              quantidadeInicial={quantidadeInicial}
              whatsapp={whatsapp}
              resumoHorarios={resumirHorariosPublicos(configuracao)}
            />
          </div>
        </section>

        <aside className="cartao-vitrine rounded-3xl p-6 lg:sticky lg:top-28">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-acelera-texto)]">
            Como funciona
          </p>
          <ol className="mt-5 grid gap-5">
            <Resumo numero="01" titulo="Envie sua preferência">
              Data, horário, grupo e um contato responsável.
            </Resumo>
            <Resumo numero="02" titulo="Aguarde a equipe">
              A solicitação fica pendente até a confirmação manual.
            </Resumo>
            <Resumo numero="03" titulo="Chegue antes">
              Esteja na pista {configuracao.chegadaAntecedenciaMinutos} minutos antes da bateria de{" "}
              {configuracao.duracaoMinutos} minutos.
            </Resumo>
          </ol>

          <div className="my-6 h-px bg-white/10" />
          <dl className="grid gap-4 text-sm">
            {horarios.map((horario) => (
              <Horario key={`${horario.dias}-${horario.periodo}`} dia={horario.dias} periodo={horario.periodo} />
            ))}
          </dl>

          <Link
            href="/agendar/consultar"
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/15 px-4 text-sm font-bold text-white transition-colors hover:bg-white/[0.06]"
          >
            Consultar protocolo
          </Link>

          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/15 px-4 text-sm font-bold text-white transition-colors hover:bg-white/[0.06]"
            >
              Falar com a equipe
            </a>
          )}
        </aside>
      </div>
    </div>
  );
}

function Resumo({
  numero,
  titulo,
  children,
}: {
  numero: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <li className="grid grid-cols-[2rem_1fr] gap-3">
      <span className="font-mono text-xs font-bold text-red-300">{numero}</span>
      <div>
        <p className="text-sm font-bold text-white">{titulo}</p>
        <p className="mt-1 text-xs leading-5 text-neutral-500">{children}</p>
      </div>
    </li>
  );
}

function Horario({ dia, periodo }: { dia: string; periodo: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-neutral-500">{dia}</dt>
      <dd className="font-mono font-bold text-neutral-200">{periodo}</dd>
    </div>
  );
}
