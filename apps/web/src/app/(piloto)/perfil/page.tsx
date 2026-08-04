import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatarDataOperacional, formatarDiferenca, formatarTempo } from "@napole/core";
import { Aviso, Cartao } from "@/components/ui";
import { exigirPiloto } from "@/server/auth/guardas";
import { carregarPerfil } from "@/server/pilotos/perfil";

export const metadata: Metadata = { title: "Meu perfil" };

type Params = { searchParams: Promise<{ bemvindo?: string }> };

export default async function PaginaPerfil({ searchParams }: Params) {
  const sessao = await exigirPiloto();
  const perfil = await carregarPerfil(sessao.id);
  if (!perfil) notFound();

  const { bemvindo } = await searchParams;

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      {bemvindo && (
        <div className="mb-6">
          <Aviso tipo="sucesso">
            Cadastro criado. Você é o piloto <strong>#{bemvindo}</strong> — anote esse número, é por
            ele que a equipe lança seus tempos na pista.
          </Aviso>
        </div>
      )}

      <header>
        <p className="font-mono text-sm text-neutral-500">{perfil.numero}</p>
        <h1 className="mt-1 text-3xl font-bold">{perfil.nomeExibicao}</h1>
        <p className="mt-1 text-sm text-[var(--color-acelera-texto)]">{perfil.nomeDaCategoria}</p>
      </header>

      {perfil.melhorVoltaMs === null ? (
        <div className="mt-8">
          <Aviso tipo="info">
            Você ainda não tem tempo registrado. Sua primeira volta entra no ranking assim que a
            equipe lançar o resultado na pista.
          </Aviso>
        </div>
      ) : (
        <section className="mt-8">
          <Cartao>
            <p className="text-xs uppercase tracking-wider text-neutral-500">Minha melhor volta</p>
            <p className="mt-1 font-mono text-4xl font-bold tabular-nums">
              {formatarTempo(perfil.melhorVoltaMs)}
            </p>
            {perfil.melhorVoltaEm && (
              <p className="mt-1 text-xs text-neutral-500">
                marcada em {formatarDataOperacional(perfil.melhorVoltaEm)}
              </p>
            )}
          </Cartao>
        </section>
      )}

      {perfil.posicaoCategoria && (
        <section className="mt-4">
          <Cartao>
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              Minha posição — {perfil.nomeDaCategoria}
            </p>
            <p className="mt-1 text-2xl font-bold">
              {perfil.posicaoCategoria.posicao}º
              <span className="ml-2 text-sm font-normal text-neutral-500">
                de {perfil.posicaoCategoria.totalDePilotos}
              </span>
            </p>

            {perfil.posicaoCategoria.proximoAlvo ? (
              <p className="mt-3 text-sm text-neutral-300">
                Próximo alvo:{" "}
                <strong className="text-white">
                  {perfil.posicaoCategoria.proximoAlvo.nomeExibicao}
                </strong>{" "}
                em {perfil.posicaoCategoria.posicao - 1}º — faltam{" "}
                <strong className="font-mono text-[var(--color-acelera-texto)]">
                  {formatarDiferenca(perfil.posicaoCategoria.diferencaParaProximoMs)}
                </strong>
              </p>
            ) : (
              <p className="mt-3 text-sm text-[var(--color-pole)]">
                Você lidera a categoria. Agora o alvo é você.
              </p>
            )}
          </Cartao>
        </section>
      )}

      <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Indicador
          rotulo="Ranking geral"
          valor={perfil.posicaoGeral ? `${perfil.posicaoGeral.posicao}º` : "—"}
        />
        <Indicador rotulo="Corridas" valor={String(perfil.totalCorridas)} />
        <Indicador rotulo="Pontos" valor={String(perfil.pontosTotal)} />
        <Indicador
          rotulo="Penalidades"
          valor={String(perfil.totalPenalidades)}
          alerta={perfil.totalPenalidades > 0}
        />
      </section>

      <section className="mt-4">
        <Cartao>
          <p className="text-sm text-neutral-300">
            {perfil.ultimaCorridaEm
              ? `Última corrida em ${formatarDataOperacional(perfil.ultimaCorridaEm)}.`
              : "Nenhuma corrida registrada ainda."}
          </p>
          {perfil.inativo && perfil.ultimaCorridaEm && (
            <p className="mt-2 text-sm text-[var(--color-acelera-texto)]">
              Faz {perfil.diasSemCorrer} dias que você não corre. Seu kart está sentindo sua falta.
            </p>
          )}
        </Cartao>
      </section>
    </main>
  );
}

function Indicador({
  rotulo,
  valor,
  alerta = false,
}: {
  rotulo: string;
  valor: string;
  alerta?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--color-asfalto)] p-4">
      <p className="text-xs uppercase tracking-wider text-neutral-500">{rotulo}</p>
      <p
        className={`mt-1 text-2xl font-bold tabular-nums ${
          alerta ? "text-[var(--color-acelera-texto)]" : ""
        }`}
      >
        {valor}
      </p>
    </div>
  );
}
