import type { Metadata } from "next";
import Link from "next/link";
import { consultarProtocoloAgendamento } from "@/server/agendamentos";
import { consumirLimite, origemDaRequisicao } from "@/server/seguranca/limite-taxa";

export const metadata: Metadata = {
  title: "Consultar agendamento",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  dateStyle: "full",
  timeStyle: "short",
});

const hora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
});

const ROTULOS: Record<string, string> = {
  PENDENTE: "Aguardando confirmação",
  CONFIRMADO: "Confirmado",
  CHECK_IN: "Check-in iniciado",
  EXPIRADO: "Solicitação expirada",
  CANCELADO: "Cancelado",
  CONCLUIDO: "Concluído",
  NAO_COMPARECEU: "Não comparecimento registrado",
};

type Props = { searchParams: Promise<{ codigo?: string | string[] }> };

export default async function PaginaConsultarAgendamento({ searchParams }: Props) {
  const parametros = await searchParams;
  const recebido = Array.isArray(parametros.codigo) ? parametros.codigo[0] : parametros.codigo;
  const codigo = recebido?.trim().toUpperCase() ?? "";
  const codigoValido = codigo === "" || /^[A-Z0-9]{8,40}$/.test(codigo);

  // O codigo tem 64 bits de entropia e nao e adivinhavel por forca bruta, mas
  // limitar evita que a consulta vire um jeito barato de martelar o banco.
  const limite =
    codigo && codigoValido
      ? await consumirLimite("CONSULTA_PROTOCOLO_POR_IP", await origemDaRequisicao())
      : null;

  const resultado =
    codigo && codigoValido && limite?.permitido
      ? await consultarProtocoloAgendamento(codigo)
      : null;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
      <Link href="/agendar" className="inline-flex min-h-11 items-center text-sm text-neutral-400 hover:text-white">
        ← Voltar para agendar
      </Link>

      <header className="mt-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-acelera-texto)]">
          Sua solicitação
        </p>
        <h1 className="titulo-display mt-3 text-4xl leading-none sm:text-6xl">
          Consulte o protocolo.
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-neutral-400">
          Esta consulta mostra apenas horário e situação. Dados de contato e nomes nunca aparecem
          pelo protocolo público.
        </p>
      </header>

      <form method="get" action="/agendar/consultar" className="cartao-vitrine mt-8 grid gap-3 rounded-2xl p-5 sm:grid-cols-[1fr_auto] sm:items-end sm:p-6">
        <label className="grid gap-2 text-sm font-semibold text-neutral-200">
          Protocolo
          <input
            name="codigo"
            required
            minLength={8}
            maxLength={40}
            defaultValue={codigo}
            autoCapitalize="characters"
            autoComplete="off"
            placeholder="Ex.: 3A7C91D4B82F6E10"
            className="min-h-12 rounded-xl border border-white/15 bg-black/25 px-4 font-mono text-base uppercase text-white placeholder:text-neutral-600"
          />
        </label>
        <button type="submit" className="min-h-12 rounded-xl bg-[var(--color-acelera)] px-6 text-sm font-bold text-white hover:bg-[var(--color-acelera-forte)]">
          Consultar
        </button>
      </form>

      {!codigoValido && (
        <MensagemErro>Informe o protocolo com letras e números, sem espaços.</MensagemErro>
      )}

      {limite && !limite.permitido && <MensagemErro>{limite.mensagem}</MensagemErro>}

      {resultado && !resultado.ok && (
        <MensagemErro>Protocolo não encontrado. Confira os caracteres e tente novamente.</MensagemErro>
      )}

      {resultado?.ok && (
        <section aria-live="polite" className="cartao-vitrine mt-5 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-neutral-500">
                {resultado.valor.codigoPublico}
              </p>
              <h2 className="mt-2 text-2xl font-black">
                {ROTULOS[resultado.valor.status] ?? resultado.valor.status}
              </h2>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-neutral-300">
              {resultado.valor.status}
            </span>
          </div>

          <dl className="mt-6 grid gap-3 border-t border-white/10 pt-6 text-sm">
            <Linha rotulo="Data e início" valor={dataHora.format(resultado.valor.horario.inicioEm)} />
            <Linha rotulo="Término previsto" valor={hora.format(resultado.valor.horario.fimEm)} />
            <Linha
              rotulo="Chegada"
              valor={`${resultado.valor.instrucoes.chegadaAntecedenciaMinutos} minutos antes`}
            />
            {resultado.valor.status === "PENDENTE" && (
              <Linha rotulo="Vagas reservadas até" valor={dataHora.format(resultado.valor.expiraEm)} />
            )}
          </dl>

          <p className="mt-6 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm leading-6 text-neutral-300">
            {mensagemStatus(resultado.valor.status)}
          </p>
        </section>
      )}
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_1fr]">
      <dt className="text-neutral-500">{rotulo}</dt>
      <dd className="text-neutral-200">{valor}</dd>
    </div>
  );
}

function MensagemErro({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mt-5 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
      {children}
    </p>
  );
}

function mensagemStatus(status: string): string {
  if (status === "PENDENTE") return "A equipe ainda precisa confirmar a solicitação. Ela não é uma reserva confirmada.";
  if (status === "CONFIRMADO") return "Sua reserva está confirmada. Chegue com antecedência para cadastro, briefing e check-in.";
  if (status === "CHECK_IN") return "O check-in do grupo já começou. Siga as orientações da equipe na pista.";
  if (status === "CONCLUIDO") return "A participação foi concluída pela operação da pista.";
  if (status === "CANCELADO") return "Esta reserva foi cancelada. Fale com a equipe se precisar de outro horário.";
  if (status === "EXPIRADO") return "A solicitação não foi confirmada dentro do prazo e deixou de ocupar vagas.";
  return "A operação registrou que o grupo não compareceu a este horário.";
}
