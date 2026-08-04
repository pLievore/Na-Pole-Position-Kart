import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusAgenda } from "@/components/admin/StatusAgenda";
import { Cartao } from "@/components/ui";
import {
  listarEventosDoAgendamento,
  obterAgendamentoAdministrativo,
} from "@/server/agendamentos";
import { adminAtual } from "@/server/auth/sessao";
import { ControleParticipante, ControlesAgendamento } from "./ControlesAgendamento";

export const metadata: Metadata = { title: "Detalhe do agendamento" };
export const dynamic = "force-dynamic";

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  dateStyle: "medium",
  timeStyle: "short",
});

const somenteHora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
});

const ROTULOS_ORIGEM: Record<string, string> = {
  SITE: "Site",
  BALCAO: "Balcão",
  ADMINISTRACAO: "Administração",
};

const ROTULOS_EVENTO: Record<string, string> = {
  AGENDAMENTO_CRIADO: "Solicitação recebida",
  AGENDAMENTO_CONFIRMADO: "Reserva confirmada",
  AGENDAMENTO_EXPIRADO: "Solicitação expirada",
  AGENDAMENTO_CANCELADO: "Reserva cancelada",
  AGENDAMENTO_CHECK_IN: "Grupo iniciou o check-in",
  CHECK_IN_REALIZADO: "Check-in de participante",
  PILOTO_VINCULADO: "Cadastro de piloto vinculado",
  NAO_COMPARECEU_REGISTRADO: "Ausência registrada",
  AGENDAMENTO_CONCLUIDO: "Bateria concluída",
};

type Props = { params: Promise<{ id: string }> };

export default async function PaginaDetalheAgendamento({ params }: Props) {
  const admin = await adminAtual();
  if (!admin) return null;
  const { id } = await params;
  if (!id || id.length > 100) notFound();

  const [resultado, eventos] = await Promise.all([
    obterAgendamentoAdministrativo(admin.id, id),
    listarEventosDoAgendamento(admin.id, id),
  ]);
  if (!resultado.ok) notFound();
  const agendamento = resultado.valor;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <Link
        href={{
          pathname: "/admin/agendamentos",
          query: { data: dataCivilOperacional(agendamento.horario.inicioEm) },
        }}
        className="inline-flex min-h-11 items-center text-sm text-neutral-400 hover:text-white"
      >
        ← Voltar para a agenda
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-neutral-500">
              {agendamento.codigoPublico}
            </p>
            <StatusAgenda status={agendamento.status} />
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            {agendamento.responsavelNome}
          </h1>
          <p className="mt-2 text-neutral-400">
            {dataHora.format(agendamento.horario.inicioEm)}–
            {somenteHora.format(agendamento.horario.fimEm)} · {agendamento.quantidadeParticipantes}{" "}
            {agendamento.quantidadeParticipantes === 1 ? "participante" : "participantes"}
          </p>
        </div>
        <StatusAgenda status={agendamento.horario.status} />
      </header>

      {agendamento.temParticipanteMenor && (
        <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] px-5 py-4 text-sm leading-6 text-amber-100">
          Este grupo informou participante menor de idade. Confirme responsável, idade e requisitos
          operacionais antes do check-in.
        </div>
      )}

      <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <div className="grid gap-5">
          <Cartao className="p-6">
            <h2 className="text-lg font-bold">Contato responsável</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <Linha rotulo="Nome" valor={agendamento.responsavelNome} />
              <Linha
                rotulo="WhatsApp"
                valor={
                  <a href={`tel:${agendamento.responsavelTelefone}`} className="underline underline-offset-4 hover:text-white">
                    {formatarTelefone(agendamento.responsavelTelefone)}
                  </a>
                }
              />
              <Linha
                rotulo="E-mail"
                valor={
                  <a href={`mailto:${agendamento.responsavelEmail}`} className="break-all underline underline-offset-4 hover:text-white">
                    {agendamento.responsavelEmail}
                  </a>
                }
              />
              <Linha rotulo="Origem" valor={ROTULOS_ORIGEM[agendamento.origem] ?? agendamento.origem} />
              <Linha rotulo="Solicitado em" valor={dataHora.format(agendamento.criadoEm)} />
              <Linha
                rotulo="Aceite"
                valor={`${dataHora.format(agendamento.aceiteTermosEm)} · versão ${agendamento.versaoTermos}`}
              />
            </dl>
            {agendamento.observacoesCliente && (
              <div className="mt-5 border-t border-white/8 pt-5">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
                  Observação enviada
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-300">
                  {agendamento.observacoesCliente}
                </p>
              </div>
            )}
          </Cartao>

          <section aria-labelledby="titulo-participantes">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="titulo-participantes" className="text-xl font-bold">Participantes e check-in</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Vincule um cadastro ativo antes de registrar a presença.
                </p>
              </div>
              <Link
                href="/admin/pilotos"
                className="inline-flex min-h-11 items-center text-sm font-semibold text-neutral-300 hover:text-white"
              >
                Buscar pilotos
              </Link>
            </div>
            <div className="mt-4 grid gap-3">
              {agendamento.participantes.map((participante) => (
                <ControleParticipante
                  key={participante.id}
                  agendamentoId={agendamento.id}
                  statusAgendamento={agendamento.status}
                  participante={participante}
                />
              ))}
            </div>
          </section>
        </div>

        <aside className="grid content-start gap-5">
          <Cartao className="p-6">
            <h2 className="text-lg font-bold">Operações</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Cada mudança fica registrada na auditoria e no histórico abaixo.
            </p>
            <div className="mt-5">
              <ControlesAgendamento
                agendamentoId={agendamento.id}
                status={agendamento.status}
                observacoesInternas={agendamento.observacoesInternas}
                administrador={admin.nivel === "ADMINISTRADOR"}
              />
            </div>
          </Cartao>

          <Cartao className="p-6">
            <h2 className="text-lg font-bold">Linha do tempo</h2>
            {eventos.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-500">Nenhum evento registrado.</p>
            ) : (
              <ol className="mt-5 grid gap-5 border-l border-white/10 pl-5">
                {eventos.map((evento) => (
                  <li key={evento.id} className="relative">
                    <span className="absolute -left-[1.48rem] top-1.5 size-2 rounded-full bg-[var(--color-acelera)] ring-4 ring-[#14161a]" />
                    <p className="text-sm font-semibold text-white">
                      {ROTULOS_EVENTO[evento.tipo] ?? evento.tipo}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-neutral-500">
                      {dataHora.format(evento.criadoEm)} · {evento.usuarioAdmin?.nome ?? rotuloOrigemEvento(evento.origem)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Cartao>
        </aside>
      </div>
    </main>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-4">
      <dt className="text-neutral-500">{rotulo}</dt>
      <dd className="text-neutral-200">{valor}</dd>
    </div>
  );
}

function formatarTelefone(valor: string): string {
  if (valor.length === 11) return `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7)}`;
  if (valor.length === 10) return `(${valor.slice(0, 2)}) ${valor.slice(2, 6)}-${valor.slice(6)}`;
  return valor;
}

function dataCivilOperacional(data: Date): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(data);
  const valor = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return `${valor.year}-${valor.month}-${valor.day}`;
}

function rotuloOrigemEvento(origem: string): string {
  if (origem === "PUBLICO") return "Solicitação pública";
  if (origem === "SISTEMA") return "Sistema";
  return origem === "ADMINISTRADOR" ? "Administrador" : "Operador";
}
