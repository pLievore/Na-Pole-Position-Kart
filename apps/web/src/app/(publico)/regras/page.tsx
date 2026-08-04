import type { Metadata } from "next";
import {
  FAIXAS_PESO,
  JANELA_RANKING_GERAL_MESES,
  REGRAS_JUNIOR,
  TABELA_PENALIDADES,
  TABELA_PONTOS,
  nomeCategoria,
  type Categoria,
} from "@napole/core";
import { Cartao } from "@/components/ui";

export const metadata: Metadata = { title: "Regras do ranking" };

/**
 * As tabelas desta pagina sao geradas a partir das constantes do core.
 *
 * Se a operacao mudar uma faixa de peso ou um valor de pontuacao, a pagina de
 * regras muda junto. Regra publicada divergindo da regra aplicada e o tipo de
 * erro que vira discussao na pista.
 */
export default function PaginaRegras() {
  const faixas = (["MASCULINO", "FEMININO"] as const).map((base) => ({
    base,
    linhas: FAIXAS_PESO[base].map((faixa, indice, todas) => {
      const anterior = todas[indice - 1];
      const de = anterior ? anterior.pesoMaximoKg : 0;
      const ate = faixa.pesoMaximoKg;
      return {
        categoria: nomeCategoria(faixa.categoria as Categoria),
        peso:
          ate === Infinity
            ? `acima de ${de} kg`
            : anterior
              ? `mais de ${de} kg até ${ate} kg`
              : `até ${ate} kg`,
      };
    }),
  }));

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-bold">Regras do ranking</h1>
      <p className="mt-2 text-neutral-300">
        Como funciona o Na Pole Position Racing Club.
      </p>

      <Secao titulo="O que vale no ranking">
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-neutral-300">
          <li>Só entram no ranking tempos registrados oficialmente pela Na Pole Position.</li>
          <li>O tempo válido é sempre a melhor volta individual registrada.</li>
          <li>
            O ranking geral considera os tempos dos últimos {JANELA_RANKING_GERAL_MESES} meses.
            Seus tempos anteriores continuam no seu histórico.
          </li>
          <li>Em caso de empate, fica na frente quem marcou o tempo primeiro.</li>
          <li>O piloto aparece no ranking com número de piloto e nome abreviado.</li>
          <li>A participação no ranking depende do aceite dos termos.</li>
          <li>A Na Pole Position pode remover tempos lançados incorretamente.</li>
          <li>A Na Pole Position pode alterar as regras mediante comunicação.</li>
        </ol>
      </Secao>

      <Secao titulo="Categorias por peso">
        <p className="mb-4 text-sm text-neutral-300">
          O peso informado no cadastro define sua categoria. A administração pode solicitar
          pesagem na balança da pista para confirmar. <strong>Seu peso nunca é exibido
          publicamente</strong> — no ranking aparece apenas a categoria.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {faixas.map(({ base, linhas }) => (
            <div key={base}>
              <h3 className="mb-2 text-sm font-semibold text-white">
                {base === "MASCULINO" ? "Masculinas" : "Femininas"}
              </h3>
              <ul className="flex flex-col gap-1 text-sm text-neutral-300">
                {linhas.map((linha) => (
                  <li key={linha.categoria} className="flex justify-between gap-4">
                    <span>{linha.categoria}</span>
                    <span className="text-neutral-500">{linha.peso}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-white/10 pt-4">
          <h3 className="mb-2 text-sm font-semibold text-white">Junior</h3>
          <p className="text-sm text-neutral-300">
            Categoria única para pilotos de {REGRAS_JUNIOR.idadeMinima} a{" "}
            {REGRAS_JUNIOR.idadeMaximaExclusiva - 1} anos, com altura mínima de{" "}
            {REGRAS_JUNIOR.alturaMinimaMetros.toFixed(2).replace(".", ",")} m e cadastro com
            contato do responsável. A partir de {REGRAS_JUNIOR.idadeMaximaExclusiva} anos o
            piloto passa a competir pela faixa de peso.
          </p>
        </div>
      </Secao>

      <Secao titulo="Pontos">
        <p className="mb-4 text-sm text-neutral-300">
          Pontos medem participação e disciplina. Eles{" "}
          <strong>não são crédito, cashback nem benefício financeiro</strong>. O ranking
          principal continua sendo por melhor volta.
        </p>
        <ul className="flex flex-col gap-1 text-sm text-neutral-300">
          {Object.entries(TABELA_PONTOS).map(([codigo, item]) => (
            <li key={codigo} className="flex justify-between gap-4">
              <span>{item.rotulo}</span>
              <span className="font-mono text-emerald-400">+{item.pontos}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-neutral-500">
          Os pontos de participação são creditados uma vez por dia de corrida.
        </p>
      </Secao>

      <Secao titulo="Penalidades">
        <p className="mb-4 text-sm text-neutral-300">
          Penalidades podem ser aplicadas por batida em outro piloto, ultrapassagem forçada,
          desrespeito às bandeiras, travar a pista propositalmente, não deixar piloto mais
          rápido ultrapassar, direção perigosa e reincidência de conduta inadequada.
        </p>
        <ul className="flex flex-col gap-1 text-sm text-neutral-300">
          {Object.entries(TABELA_PENALIDADES).map(([codigo, item]) => (
            <li key={codigo} className="flex justify-between gap-4">
              <span>{item.rotulo}</span>
              <span className="font-mono text-[var(--color-acelera)]">
                {item.pontos === null ? "conforme decisão" : item.pontos}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-neutral-500">
          Condutas perigosas podem resultar em bloqueio no ranking ou suspensão administrativa.
        </p>
      </Secao>

      <Secao titulo="Correções">
        <p className="text-sm text-neutral-300">
          A administração pode corrigir peso, categoria ou tempo em caso de erro. Toda
          alteração fica registrada com o responsável e a data.
        </p>
      </Secao>
    </main>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xl font-bold">{titulo}</h2>
      <Cartao>{children}</Cartao>
    </section>
  );
}
