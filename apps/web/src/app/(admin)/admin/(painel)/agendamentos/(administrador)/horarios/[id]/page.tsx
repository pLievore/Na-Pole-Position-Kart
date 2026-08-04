import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dataHoraOperacionalISO, dataOperacionalISO } from "@napole/core";
import { StatusAgenda } from "@/components/admin/StatusAgenda";
import { Cartao } from "@/components/ui";
import { obterHorarioAdministrativo } from "@/server/agendamentos";
import { adminAtual } from "@/server/auth/sessao";
import { FormularioGestaoHorario } from "./FormularioGestaoHorario";

export const metadata: Metadata = { title: "Gerenciar horário" };
export const dynamic = "force-dynamic";

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  dateStyle: "full",
  timeStyle: "short",
});

type Props = { params: Promise<{ id: string }> };

export default async function PaginaGerenciarHorario({ params }: Props) {
  const admin = await adminAtual();
  if (!admin) return null;
  const { id } = await params;
  if (!id || id.length > 100) notFound();

  const resultado = await obterHorarioAdministrativo(admin.id, id);
  if (!resultado.ok) notFound();
  const horario = resultado.valor;
  const temCheckIn = horario.agendamentos.some((agendamento) =>
    agendamento.participantes.some((participante) => participante.status === "PRESENTE"),
  );

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <Link
        href={{
          pathname: "/admin/agendamentos",
          query: { data: dataOperacionalISO(horario.inicioEm) },
        }}
        className="inline-flex min-h-11 items-center text-sm text-neutral-400 hover:text-white"
      >
        ← Voltar para a agenda
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-acelera-texto)]">
            Grade operacional
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            {dataHora.format(horario.inicioEm)}
          </h1>
          <p className="mt-2 text-neutral-400">
            Término às {hora(horario.fimEm)} · {horario.ocupadas} de {horario.capacidade} vagas
          </p>
        </div>
        <StatusAgenda status={horario.status} />
      </header>

      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(20rem,0.7fr)_minmax(0,1.3fr)]">
        <Cartao className="p-6">
          <h2 className="text-lg font-bold">Configurar horário</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Alterações de capacidade e publicação são auditadas. Reservas existentes nunca são
            apagadas.
          </p>
          <div className="mt-5">
            <FormularioGestaoHorario
              horario={{
                id: horario.id,
                inicioLocal: dataHoraOperacionalISO(horario.inicioEm),
                fimLocal: dataHoraOperacionalISO(horario.fimEm),
                capacidade: horario.capacidade,
                ocupadas: horario.ocupadas,
                status: horario.status,
                observacoesInternas: horario.observacoesInternas,
                temCheckIn,
              }}
            />
          </div>
        </Cartao>

        <section aria-labelledby="reservas-horario">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="reservas-horario" className="text-xl font-bold">Reservas deste horário</h2>
              <p className="mt-1 text-sm text-neutral-500">
                {horario.agendamentos.length} {horario.agendamentos.length === 1 ? "grupo" : "grupos"}
              </p>
            </div>
            <span className="text-sm font-semibold text-neutral-300">
              {horario.vagasDisponiveis} vagas disponíveis
            </span>
          </div>

          {horario.agendamentos.length === 0 ? (
            <div role="status" className="mt-4 rounded-2xl border border-dashed border-white/15 px-6 py-10 text-center text-sm text-neutral-500">
              Nenhuma reserva vinculada a este horário.
            </div>
          ) : (
            <ul className="mt-4 grid gap-3">
              {horario.agendamentos.map((agendamento) => (
                <li key={agendamento.id}>
                  <Link
                    href={`/admin/agendamentos/${agendamento.id}`}
                    className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition-colors hover:bg-white/[0.05] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-white">{agendamento.responsavelNome}</p>
                        <span className="font-mono text-[10px] text-neutral-600">{agendamento.codigoPublico}</span>
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">
                        {agendamento.quantidadeParticipantes} {agendamento.quantidadeParticipantes === 1 ? "participante" : "participantes"}
                      </p>
                    </div>
                    <StatusAgenda status={agendamento.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function hora(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}
