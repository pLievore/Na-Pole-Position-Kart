import type { Metadata } from "next";
import Link from "next/link";
import {
  dataOperacionalISO,
  parseDataCivil,
  parseDataHoraOperacional,
} from "@napole/core";
import { TabelaRanking } from "@/components/ranking/TabelaRanking";
import { listarHorariosAdministrativos } from "@/server/agendamentos";
import { adminAtual } from "@/server/auth/sessao";
import { carregarResumo } from "@/server/dashboard/resumo";
import { carregarRankingPublico } from "@/server/ranking/consultas";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const hora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function PaginaDashboard() {
  const admin = await adminAtual();
  if (!admin) return null;

  const data = dataOperacionalISO(new Date());
  const civil = parseDataCivil(data);
  const amanha = new Date(civil.getTime() + 86_400_000).toISOString().slice(0, 10);
  const [resumo, top10, agenda] = await Promise.all([
    carregarResumo(),
    carregarRankingPublico({ limite: 10 }),
    listarHorariosAdministrativos(admin.id, {
      de: parseDataHoraOperacional(`${data}T00:00`),
      ate: parseDataHoraOperacional(`${amanha}T00:00`),
    }),
  ]);

  const horarios = agenda.ok ? agenda.valor : [];
  const reservas = horarios.flatMap((horario) => horario.agendamentos);
  const pendentes = reservas.filter((reserva) => reserva.status === "PENDENTE").length;
  const ocupadas = horarios.reduce((total, horario) => total + horario.ocupadas, 0);
  const capacidade = horarios.reduce((total, horario) => total + horario.capacidade, 0);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-acelera-texto)]">
            Visão operacional
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Olá, {primeiroNome(admin.nome)}.
          </h1>
          <p className="mt-2 text-neutral-400">Acompanhe a pista e resolva as próximas ações.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={{ pathname: "/admin/agendamentos", query: { data } }}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-4 text-sm font-bold text-white hover:bg-white/5"
          >
            Abrir agenda
          </Link>
          <Link
            href="/admin/corridas/nova"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--color-acelera)] px-4 text-sm font-bold text-white hover:bg-[var(--color-acelera-forte)]"
          >
            Lançar corrida
          </Link>
        </div>
      </header>

      <section aria-label="Indicadores principais" className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Indicador rotulo="A confirmar hoje" valor={pendentes} alerta={pendentes > 0} />
        <Indicador rotulo="Ocupação hoje" valor={capacidade > 0 ? `${ocupadas}/${capacidade}` : "—"} />
        <Indicador rotulo="Pilotos cadastrados" valor={resumo.totalPilotos} />
        <Indicador rotulo="Ativos · 30 dias" valor={resumo.pilotosAtivos} />
        <Indicador rotulo="Corridas no mês" valor={resumo.corridasNoMes} />
        <Indicador rotulo="Penalidades no mês" valor={resumo.penalidadesNoMes} />
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Agenda de hoje</h2>
              <p className="mt-1 text-sm text-neutral-500">Próximas saídas e ocupação</p>
            </div>
            <Link
              href={{ pathname: "/admin/agendamentos", query: { data } }}
              className="inline-flex min-h-11 items-center text-sm font-semibold text-neutral-300 hover:text-white"
            >
              Ver tudo →
            </Link>
          </div>

          {!agenda.ok ? (
            <p className="mt-5 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              {agenda.erro.mensagem}
            </p>
          ) : horarios.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-white/15 px-5 py-8 text-center">
              <p className="text-sm text-neutral-400">Nenhum horário criado para hoje.</p>
              {admin.nivel === "ADMINISTRADOR" && (
                <Link
                  href="/admin/agendamentos/horarios/novo"
                  className="mt-3 inline-flex min-h-11 items-center font-semibold text-white underline underline-offset-4"
                >
                  Criar grade de horários
                </Link>
              )}
            </div>
          ) : (
            <ol className="mt-5 grid gap-3">
              {horarios.slice(0, 6).map((horario) => {
                const aConfirmar = horario.agendamentos.filter((item) => item.status === "PENDENTE").length;
                return (
                  <li key={horario.id}>
                    <Link
                      href={{ pathname: "/admin/agendamentos", query: { data } }}
                      className="grid grid-cols-[4rem_1fr_auto] items-center gap-3 rounded-xl border border-white/8 bg-black/10 px-4 py-3 hover:bg-white/[0.035]"
                    >
                      <span className="font-mono text-lg font-black">{hora.format(horario.inicioEm)}</span>
                      <span className="text-sm text-neutral-400">
                        {horario.ocupadas}/{horario.capacidade} vagas
                      </span>
                      <span className={aConfirmar > 0 ? "text-xs font-bold text-amber-300" : "text-xs text-neutral-600"}>
                        {aConfirmar > 0 ? `${aConfirmar} pendente(s)` : "Em dia"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Top 10 geral</h2>
              <p className="mt-1 text-sm text-neutral-500">Ranking oficial da pista</p>
            </div>
            <Link href="/ranking" target="_blank" className="inline-flex min-h-11 items-center text-sm font-semibold text-neutral-300 hover:text-white">
              Ver público ↗
            </Link>
          </div>
          <div className="mt-5 overflow-x-auto">
            <TabelaRanking linhas={top10} />
          </div>
        </section>
      </div>
    </main>
  );
}

function Indicador({ rotulo, valor, alerta = false }: { rotulo: string; valor: number | string; alerta?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${alerta ? "border-amber-400/20 bg-amber-400/[0.07]" : "border-white/10 bg-white/[0.025]"}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">{rotulo}</p>
      <p className="mt-2 text-2xl font-black tabular-nums">{valor}</p>
    </div>
  );
}

function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] || "equipe";
}
