import type { Metadata } from "next";
import Link from "next/link";
import {
  dataOperacionalISO,
  parseDataCivil,
  parseDataHoraOperacional,
} from "@napole/core";
import { StatusAgenda } from "@/components/admin/StatusAgenda";
import { listarHorariosAdministrativos } from "@/server/agendamentos/consultas";
import { adminAtual } from "@/server/auth/sessao";

export const metadata: Metadata = { title: "Agenda" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    data?: string | string[];
    filtro?: string | string[];
    q?: string | string[];
  }>;
};

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
});

const dataCompleta = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  weekday: "long",
  day: "2-digit",
  month: "long",
});

function primeiro(valor?: string | string[]): string {
  return Array.isArray(valor) ? (valor[0] ?? "") : (valor ?? "");
}

function dataValida(valor: string): string {
  try {
    parseDataCivil(valor);
    return valor;
  } catch {
    return dataOperacionalISO(new Date());
  }
}

function deslocarData(data: string, dias: number): string {
  const civil = parseDataCivil(data);
  return new Date(civil.getTime() + dias * 86_400_000).toISOString().slice(0, 10);
}

export default async function PaginaAgenda({ searchParams }: Props) {
  const admin = await adminAtual();
  if (!admin) return null;

  const parametros = await searchParams;
  const data = dataValida(primeiro(parametros.data));
  const filtro = primeiro(parametros.filtro) || "operacao";
  // Busca em URL aceita somente o protocolo opaco; PII não deve parar em
  // histórico do navegador nem em logs de proxy.
  const buscaInformada = primeiro(parametros.q).trim().toUpperCase();
  const busca = /^[A-F0-9]{16}$/.test(buscaInformada) ? buscaInformada : "";
  const inicio = parseDataHoraOperacional(`${data}T00:00`);
  const fim = parseDataHoraOperacional(`${deslocarData(data, 1)}T00:00`);
  const consulta = await listarHorariosAdministrativos(
    admin.id,
    busca ? { busca } : { de: inicio, ate: fim },
  );

  const horariosBase = consulta.ok ? consulta.valor : [];
  const horarios = horariosBase.filter((horario) => {
    if (filtro === "pendentes") {
      return horario.agendamentos.some((agendamento) => agendamento.status === "PENDENTE");
    }
    if (filtro === "confirmados") {
      return horario.agendamentos.some((agendamento) =>
        ["CONFIRMADO", "CHECK_IN"].includes(agendamento.status),
      );
    }
    if (filtro === "rascunhos") return horario.status === "RASCUNHO";
    if (filtro === "todos") return true;
    return !["CANCELADO", "ENCERRADO"].includes(horario.status);
  });

  const reservas = horariosBase.flatMap((horario) => horario.agendamentos);
  const pendentes = reservas.filter((item) => item.status === "PENDENTE").length;
  const confirmados = reservas.filter((item) =>
    ["CONFIRMADO", "CHECK_IN"].includes(item.status),
  ).length;
  const ocupadas = horariosBase.reduce((total, horario) => total + horario.ocupadas, 0);
  const capacidade = horariosBase.reduce((total, horario) => total + horario.capacidade, 0);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-acelera-texto)]">
            Operação da pista
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Agenda</h1>
          <p className="mt-2 text-neutral-400">
            Horários, ocupação, confirmações e check-in em um só lugar.
          </p>
        </div>
        {admin?.nivel === "ADMINISTRADOR" && (
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/agendamentos/configuracao"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-5 text-sm font-bold text-white hover:bg-white/5"
            >
              Configurar padrões
            </Link>
            <Link
              href="/admin/agendamentos/horarios/novo"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--color-acelera)] px-5 text-sm font-bold text-white hover:bg-[var(--color-acelera-forte)]"
            >
              Criar horários
            </Link>
          </div>
        )}
      </header>

      <section aria-label="Resumo da agenda" className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador rotulo="Horários" valor={String(horariosBase.length)} />
        <Indicador rotulo="A confirmar" valor={String(pendentes)} destaque={pendentes > 0} />
        <Indicador rotulo="Confirmadas" valor={String(confirmados)} />
        <Indicador rotulo="Ocupação" valor={capacidade > 0 ? `${ocupadas}/${capacidade}` : "—"} />
      </section>

      <section className="mt-7 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              href={{ pathname: "/admin/agendamentos", query: { data: deslocarData(data, -1), filtro } }}
              aria-label="Dia anterior"
              className="grid size-11 place-items-center rounded-xl border border-white/10 text-neutral-300 hover:bg-white/5 hover:text-white"
            >
              ←
            </Link>
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Data da operação
              <input
                form="filtro-agenda"
                type="date"
                name="data"
                defaultValue={data}
                className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-base font-medium normal-case tracking-normal text-white"
              />
            </label>
            <Link
              href={{ pathname: "/admin/agendamentos", query: { data: deslocarData(data, 1), filtro } }}
              aria-label="Próximo dia"
              className="grid size-11 place-items-center rounded-xl border border-white/10 text-neutral-300 hover:bg-white/5 hover:text-white"
            >
              →
            </Link>
          </div>

          <form id="filtro-agenda" method="get" action="/admin/agendamentos" className="flex flex-1 flex-wrap justify-end gap-3">
            <select
              name="filtro"
              defaultValue={filtro}
              aria-label="Filtrar agenda"
              className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white"
            >
              <option value="operacao">Operação do dia</option>
              <option value="pendentes">Com pendências</option>
              <option value="confirmados">Com confirmados</option>
              <option value="rascunhos">Rascunhos</option>
              <option value="todos">Todos os status</option>
            </select>
            <input
              type="search"
              name="q"
              defaultValue={busca}
              aria-label="Buscar reserva por protocolo"
              placeholder="Protocolo da reserva"
              minLength={16}
              maxLength={16}
              pattern="[A-Fa-f0-9]{16}"
              title="Informe os 16 caracteres do protocolo."
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white placeholder:text-neutral-600 sm:max-w-sm"
            />
            <button
              type="submit"
              className="min-h-11 rounded-xl border border-white/15 px-5 text-sm font-bold text-white hover:bg-white/5"
            >
              Aplicar
            </button>
          </form>
        </div>
      </section>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold capitalize">
            {busca ? "Resultado global por protocolo" : dataCompleta.format(inicio)}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {horarios.length} {horarios.length === 1 ? "horário exibido" : "horários exibidos"}
          </p>
        </div>
        {(busca || filtro !== "operacao") && (
          <Link href={{ pathname: "/admin/agendamentos", query: { data } }} className="inline-flex min-h-11 items-center text-sm text-neutral-400 hover:text-white">
            Limpar filtros
          </Link>
        )}
      </div>

      {!consulta.ok ? (
        <EstadoVazio titulo="Não foi possível carregar a agenda" texto={consulta.erro.mensagem} />
      ) : horarios.length === 0 ? (
        <EstadoVazio
          titulo={busca ? "Nenhuma reserva encontrada" : "Nenhum horário neste dia"}
          texto={
            busca
              ? "Revise a busca ou limpe os filtros."
              : admin.nivel === "ADMINISTRADOR"
                ? "Gere a grade padrão ou crie um horário excepcional."
                : "Peça a um administrador para publicar a grade."
          }
        />
      ) : (
        <ol className="mt-5 grid gap-4">
          {horarios.map((horario) => (
            <li key={horario.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#111216]">
              <div className="grid gap-5 border-b border-white/8 p-5 md:grid-cols-[9rem_1fr_auto] md:items-center">
                <div>
                  <p className="font-mono text-2xl font-black tabular-nums">
                    {dataHora.format(horario.inicioEm)}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">até {dataHora.format(horario.fimEm)}</p>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusAgenda status={horario.status} />
                    <span className="text-sm text-neutral-400">
                      {horario.ocupadas} de {horario.capacidade} vagas ocupadas
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
                    <span
                      className="block h-full rounded-full bg-[var(--color-acelera)]"
                      style={{ width: `${Math.min(100, (horario.ocupadas / horario.capacidade) * 100)}%` }}
                    />
                  </div>
                </div>
                {admin.nivel === "ADMINISTRADOR" && (
                  <Link
                    href={`/admin/agendamentos/horarios/${horario.id}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-4 text-sm font-bold text-white hover:bg-white/5"
                  >
                    Gerenciar horário
                  </Link>
                )}
              </div>

              {horario.agendamentos.length === 0 ? (
                <p className="px-5 py-6 text-sm text-neutral-500">Nenhuma solicitação neste horário.</p>
              ) : (
                <ul className="divide-y divide-white/8">
                  {horario.agendamentos.map((agendamento) => (
                    <li key={agendamento.id}>
                      <Link
                        href={`/admin/agendamentos/${agendamento.id}`}
                        className="grid gap-3 px-5 py-4 transition-colors hover:bg-white/[0.035] md:grid-cols-[minmax(0,1fr)_11rem_9rem_auto] md:items-center"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-semibold text-white">{agendamento.responsavelNome}</p>
                            <span className="font-mono text-[10px] text-neutral-600">{agendamento.codigoPublico}</span>
                          </div>
                          <p className="mt-1 truncate text-xs text-neutral-500">
                            {agendamento.responsavelTelefone} · {agendamento.responsavelEmail}
                          </p>
                        </div>
                        <p className="text-sm text-neutral-400">
                          {agendamento.quantidadeParticipantes} {agendamento.quantidadeParticipantes === 1 ? "participante" : "participantes"}
                        </p>
                        <StatusAgenda status={agendamento.status} />
                        <span aria-hidden="true" className="text-right text-neutral-600">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

function Indicador({ rotulo, valor, destaque = false }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${destaque ? "border-amber-400/20 bg-amber-400/[0.07]" : "border-white/10 bg-white/[0.025]"}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">{rotulo}</p>
      <p className="mt-2 text-2xl font-black tabular-nums text-white">{valor}</p>
    </div>
  );
}

function EstadoVazio({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div role="status" className="mt-5 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center">
      <p className="font-semibold text-white">{titulo}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">{texto}</p>
    </div>
  );
}
