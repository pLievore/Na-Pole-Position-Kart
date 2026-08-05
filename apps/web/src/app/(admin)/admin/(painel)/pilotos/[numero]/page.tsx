import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatarDataOperacional, formatarTempo } from "@napole/core";
import { Cartao } from "@/components/ui";
import { adminAtual } from "@/server/auth/sessao";
import { carregarPerfilAdministrativo } from "@/server/pilotos/perfil-admin";

export const metadata: Metadata = { title: "Perfil administrativo do piloto" };
export const dynamic = "force-dynamic";

const dataCivil = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "UTC",
});
const dataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});
const peso = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const ROTULOS_SEXO: Record<string, string> = {
  MASCULINO: "Masculino",
  FEMININO: "Feminino",
  OUTRO: "Outro",
};

const ROTULOS_STATUS: Record<string, string> = {
  ATIVO: "Ativo",
  BLOQUEADO: "Bloqueado",
  INATIVO: "Inativo",
};

type Params = { params: Promise<{ numero: string }> };

export default async function PaginaPerfilAdministrativo({ params }: Params) {
  const { numero: parametroNumero } = await params;
  if (!/^\d{1,10}$/.test(parametroNumero)) notFound();

  const numero = Number(parametroNumero);
  if (!Number.isSafeInteger(numero) || numero <= 0 || numero > 2_147_483_647) notFound();

  const [piloto, admin] = await Promise.all([carregarPerfilAdministrativo(numero), adminAtual()]);
  if (!piloto) notFound();

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <Link
        href="/admin/pilotos"
        className="inline-flex min-h-11 items-center text-sm text-neutral-400 hover:text-white"
      >
        ← Voltar para pilotos
      </Link>

      <header className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-sm text-neutral-500">{piloto.numeroFormatado}</p>
            <Status status={piloto.status} />
          </div>
          <h1 className="mt-1 text-3xl font-bold">{piloto.nomeExibicao}</h1>
          <p className="mt-1 text-sm text-neutral-400">{piloto.nomeCompleto}</p>
        </div>

        {admin?.nivel === "ADMINISTRADOR" && (
          <Link
            href={`/admin/pilotos/${piloto.numero}/editar`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--color-acelera)] px-5 text-sm font-semibold text-white"
          >
            Gerenciar cadastro
          </Link>
        )}
      </header>

      <div
        aria-label="Resumo de desempenho do piloto"
        className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      >
        <Indicador
          rotulo="Melhor volta"
          valor={piloto.melhorVoltaMs === null ? "—" : formatarTempo(piloto.melhorVoltaMs)}
          monoespaco
        />
        <Indicador
          rotulo="Ranking geral"
          valor={piloto.posicaoGeral ? `${piloto.posicaoGeral.posicao}º` : "—"}
        />
        <Indicador
          rotulo="Na categoria"
          valor={piloto.posicaoCategoria ? `${piloto.posicaoCategoria.posicao}º` : "—"}
        />
        <Indicador rotulo="Pontos" valor={String(piloto.pontosTotal)} />
        <Indicador rotulo="Corridas" valor={String(piloto.totalCorridas)} />
        <Indicador rotulo="Penalidades" valor={String(piloto.penalidades.length)} />
      </div>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <Cartao>
          <h2 className="text-lg font-bold">Cadastro e contato</h2>
          <dl className="mt-4 divide-y divide-white/5 text-sm">
            <LinhaDado rotulo="Número" valor={piloto.numeroFormatado} monoespaco />
            <LinhaDado rotulo="Nome completo" valor={piloto.nomeCompleto} />
            <LinhaDado rotulo="Nome de exibição" valor={piloto.nomeExibicao} />
            <LinhaDado rotulo="Telefone / WhatsApp" valor={formatarTelefone(piloto.telefone)} />
            <LinhaDado rotulo="E-mail" valor={piloto.email ?? "— sem e-mail cadastrado"} />
            <LinhaDado
              rotulo="Data de nascimento"
              valor={dataCivil.format(piloto.dataNascimento)}
            />
            <LinhaDado rotulo="Sexo" valor={ROTULOS_SEXO[piloto.sexo] ?? piloto.sexo} />
            <LinhaDado
              rotulo="Categoria-base"
              valor={
                piloto.categoriaBase
                  ? (ROTULOS_SEXO[piloto.categoriaBase] ?? piloto.categoriaBase)
                  : "Automática pelo sexo"
              }
            />
          </dl>
        </Cartao>

        <Cartao>
          <h2 className="text-lg font-bold">Categoria e situação</h2>
          <dl className="mt-4 divide-y divide-white/5 text-sm">
            <LinhaDado
              rotulo="Peso declarado"
              valor={`${peso.format(Number(piloto.pesoDeclaradoKg))} kg`}
            />
            <LinhaDado
              rotulo="Peso conferido"
              valor={
                piloto.pesoConferidoKg === null
                  ? "Ainda não aferido"
                  : `${peso.format(Number(piloto.pesoConferidoKg))} kg`
              }
            />
            <LinhaDado
              rotulo="Conferido em"
              valor={piloto.pesoConferidoEm ? dataHora.format(piloto.pesoConferidoEm) : "—"}
            />
            <LinhaDado rotulo="Categoria final" valor={piloto.nomeDaCategoria} />
            <LinhaDado
              rotulo="Definição da categoria"
              valor={piloto.categoriaManual ? "Manual" : "Automática por peso"}
            />
            <LinhaDado rotulo="Status" valor={ROTULOS_STATUS[piloto.status] ?? piloto.status} />
            <LinhaDado rotulo="Cadastrado em" valor={dataHora.format(piloto.criadoEm)} />
            <LinhaDado rotulo="Atualizado em" valor={dataHora.format(piloto.atualizadoEm)} />
          </dl>
        </Cartao>
      </section>

      <section className="mt-4">
        <Cartao>
          <h2 className="text-lg font-bold">Observações internas</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-300">
            {piloto.observacoesInternas || "Nenhuma observação interna."}
          </p>
        </Cartao>
      </section>

      <section className="mt-9">
        <h2 className="text-xl font-bold">Histórico de corridas</h2>
        {piloto.corridas.length === 0 ? (
          <Vazio>Nenhuma corrida registrada.</Vazio>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[64rem] border-collapse text-left text-sm">
              <caption className="sr-only">Corridas registradas para {piloto.nomeExibicao}</caption>
              <thead>
                <tr className="bg-white/5 text-xs uppercase tracking-wider text-neutral-400">
                  <th scope="col" className="px-4 py-3 font-medium">
                    Data
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    Melhor volta
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Kart
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Categoria na corrida
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    Pontos
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Penalidades
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Observação
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Operador
                  </th>
                </tr>
              </thead>
              <tbody>
                {piloto.corridas.map((corrida) => (
                  <tr
                    key={corrida.id}
                    className={`border-t border-white/5 ${corrida.valida ? "" : "bg-white/[0.02]"}`}
                  >
                    <th
                      scope="row"
                      className="whitespace-nowrap px-4 py-3 font-normal text-neutral-300"
                    >
                      {formatarDataOperacional(corrida.data)}
                      {!corrida.valida && (
                        <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase">
                          inválida
                        </span>
                      )}
                    </th>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {formatarTempo(corrida.melhorVoltaMs)}
                    </td>
                    <td className="px-4 py-3 text-neutral-400">{corrida.kart}</td>
                    <td className="px-4 py-3 text-neutral-400">{corrida.nomeDaCategoria}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      <Pontos valor={corrida.pontosTotal} />
                      <span className="mt-0.5 block text-[10px] text-neutral-500">
                        +{corrida.pontosGanhos} / {corrida.pontosDescontados}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-400">
                      {corrida.penalidades.length > 0 ? corrida.penalidades.join(", ") : "—"}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-neutral-400">
                      {corrida.observacao || "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{corrida.operador}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-9">
        <h2 className="text-xl font-bold">Penalidades</h2>
        {piloto.penalidades.length === 0 ? (
          <Vazio>Nenhuma penalidade registrada.</Vazio>
        ) : (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {piloto.penalidades.map((penalidade) => (
              <li
                key={penalidade.id}
                className="rounded-2xl border border-white/10 bg-[var(--color-asfalto)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{penalidade.tipoRotulo}</p>
                    <p className="mt-1 text-sm text-neutral-400">
                      {penalidade.motivoRotulo}
                      {penalidade.motivoDetalhe ? ` — ${penalidade.motivoDetalhe}` : ""}
                    </p>
                  </div>
                  <span className="font-mono text-[var(--color-acelera-texto)] tabular-nums">
                    {penalidade.pontosDescontados} pt
                  </span>
                </div>
                <p className="mt-3 text-xs text-neutral-500">
                  {formatarDataOperacional(penalidade.data)} · corrida de{" "}
                  {formatarDataOperacional(penalidade.corridaData)} · {penalidade.operador}
                </p>
                {penalidade.observacao && (
                  <p className="mt-3 border-t border-white/5 pt-3 text-sm text-neutral-400">
                    {penalidade.observacao}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Indicador({
  rotulo,
  valor,
  monoespaco = false,
}: {
  rotulo: string;
  valor: string;
  monoespaco?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--color-asfalto)] p-4">
      <p className="text-xs uppercase tracking-wider text-neutral-500">{rotulo}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${monoespaco ? "font-mono" : ""}`}>
        {valor}
      </p>
    </div>
  );
}

function LinhaDado({
  rotulo,
  valor,
  monoespaco = false,
}: {
  rotulo: string;
  valor: string;
  monoespaco?: boolean;
}) {
  return (
    <div className="grid gap-1 py-2.5 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="text-neutral-500">{rotulo}</dt>
      <dd className={`break-words text-neutral-200 ${monoespaco ? "font-mono" : ""}`}>{valor}</dd>
    </div>
  );
}

function Status({ status }: { status: string }) {
  const estilos = {
    ATIVO: "bg-emerald-500/15 text-emerald-300",
    BLOQUEADO: "bg-amber-500/15 text-amber-300",
    INATIVO: "bg-white/10 text-neutral-400",
  } as const;

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
        estilos[status as keyof typeof estilos] ?? estilos.INATIVO
      }`}
    >
      {ROTULOS_STATUS[status] ?? status}
    </span>
  );
}

function Pontos({ valor }: { valor: number }) {
  return (
    <span className={valor < 0 ? "text-[var(--color-acelera-texto)]" : "text-emerald-400"}>
      {valor > 0 ? `+${valor}` : valor}
    </span>
  );
}

function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 rounded-2xl border border-white/10 bg-[var(--color-asfalto)] px-5 py-8 text-center text-sm text-neutral-400">
      {children}
    </p>
  );
}

function formatarTelefone(valor: string): string {
  if (valor.length === 11) {
    return `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7)}`;
  }
  if (valor.length === 10) {
    return `(${valor.slice(0, 2)}) ${valor.slice(2, 6)}-${valor.slice(6)}`;
  }
  return valor;
}
