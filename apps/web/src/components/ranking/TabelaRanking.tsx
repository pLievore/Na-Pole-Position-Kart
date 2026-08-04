import type { LinhaRankingPublico } from "@napole/core";

/**
 * Tabela de ranking publico.
 *
 * Recebe `LinhaRankingPublico`, nao a linha interna: o tipo nao tem peso,
 * telefone nem e-mail, entao nao ha como vazar dado pessoal por descuido aqui.
 */

const CORES_POSICAO: Record<number, string> = {
  1: "text-[var(--color-pole)]",
  2: "text-neutral-300",
  3: "text-amber-600",
};

export function TabelaRanking({
  linhas,
  mostrarCategoria = true,
  destacarPiloto,
}: {
  linhas: LinhaRankingPublico[];
  mostrarCategoria?: boolean;
  /** Numero do piloto a destacar, ex.: "#231". */
  destacarPiloto?: string;
}) {
  if (linhas.length === 0) {
    return (
      <p className="rounded-2xl border border-white/10 bg-[var(--color-asfalto)] px-5 py-8 text-center text-sm text-neutral-400">
        Nenhum tempo registrado neste ranking ainda. Venha marcar o primeiro.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-white/5 text-xs uppercase tracking-wider text-neutral-400">
            <th scope="col" className="px-4 py-3 font-medium">Pos.</th>
            <th scope="col" className="px-4 py-3 font-medium">Piloto</th>
            {mostrarCategoria && (
              <th scope="col" className="px-4 py-3 font-medium">Categoria</th>
            )}
            <th scope="col" className="px-4 py-3 text-right font-medium">Melhor volta</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => {
            const destacada = destacarPiloto === linha.numeroPiloto;
            return (
              <tr
                key={linha.numeroPiloto}
                className={`border-t border-white/5 ${destacada ? "bg-[var(--color-acelera)]/15" : ""}`}
              >
                <td className={`px-4 py-3 font-bold tabular-nums ${CORES_POSICAO[linha.posicao] ?? "text-neutral-400"}`}>
                  {linha.posicao}º
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-white">{linha.nome}</span>
                  <span className="ml-2 text-xs text-neutral-500 tabular-nums">
                    {linha.numeroPiloto}
                  </span>
                </td>
                {mostrarCategoria && (
                  <td className="px-4 py-3 text-neutral-400">{linha.categoria}</td>
                )}
                <td className="px-4 py-3 text-right font-mono tabular-nums text-white">
                  {linha.melhorVolta}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
