import { describe, expect, it } from "vitest";
import { parseDataOperacional } from "./data-operacional";
import {
  calcularRanking,
  compararRankings,
  consolidarMelhorVoltaPorPiloto,
  filtrarPorCategoria,
  filtrarPorPeriodo,
  minhaPosicao,
  periodoDoMes,
  periodoRankingGeral,
  pilotosSuperadosPor,
  top,
  type TempoPiloto,
} from "./ranking";

function tempo(
  over: Partial<TempoPiloto> & Pick<TempoPiloto, "pilotoId" | "melhorVoltaMs">,
): TempoPiloto {
  return {
    numeroPiloto: 100,
    nomeExibicao: "Piloto",
    categoria: "MASCULINO_MEDIO",
    dataDoTempo: new Date(2026, 7, 4),
    ...over,
  };
}

describe("calcularRanking", () => {
  it("ordena do mais rapido para o mais lento", () => {
    const ranking = calcularRanking([
      tempo({ pilotoId: "b", melhorVoltaMs: 32_901, numeroPiloto: 145 }),
      tempo({ pilotoId: "a", melhorVoltaMs: 32_487, numeroPiloto: 231 }),
      tempo({ pilotoId: "c", melhorVoltaMs: 33_284, numeroPiloto: 12 }),
    ]);

    expect(ranking.map((l) => l.pilotoId)).toEqual(["a", "b", "c"]);
    expect(ranking.map((l) => l.posicao)).toEqual([1, 2, 3]);
  });

  it("calcula diferenca para o lider e para o piloto da frente", () => {
    const ranking = calcularRanking([
      tempo({ pilotoId: "a", melhorVoltaMs: 32_487 }),
      tempo({ pilotoId: "b", melhorVoltaMs: 32_901 }),
      tempo({ pilotoId: "c", melhorVoltaMs: 33_284 }),
    ]);

    expect(ranking[0]!.diferencaLiderMs).toBe(0);
    expect(ranking[1]!.diferencaLiderMs).toBe(414);
    expect(ranking[2]!.diferencaLiderMs).toBe(797);
    expect(ranking[2]!.diferencaAnteriorMs).toBe(383);
  });

  it("no empate, quem marcou primeiro fica na frente", () => {
    const ranking = calcularRanking([
      tempo({ pilotoId: "novo", melhorVoltaMs: 32_487, dataDoTempo: new Date(2026, 7, 10) }),
      tempo({ pilotoId: "antigo", melhorVoltaMs: 32_487, dataDoTempo: new Date(2026, 6, 1) }),
    ]);

    expect(ranking.map((l) => l.pilotoId)).toEqual(["antigo", "novo"]);
  });

  it("nao muda o resultado conforme a ordem de entrada", () => {
    const entrada = [
      tempo({
        pilotoId: "a",
        melhorVoltaMs: 32_487,
        numeroPiloto: 231,
        dataDoTempo: new Date(2026, 7, 4),
      }),
      tempo({
        pilotoId: "b",
        melhorVoltaMs: 32_487,
        numeroPiloto: 145,
        dataDoTempo: new Date(2026, 7, 4),
      }),
    ];
    const direto = calcularRanking(entrada).map((l) => l.pilotoId);
    const invertido = calcularRanking([...entrada].reverse()).map((l) => l.pilotoId);
    expect(direto).toEqual(invertido);
    expect(direto).toEqual(["b", "a"]); // desempate final pelo menor numero
  });

  it("aceita lista vazia", () => {
    expect(calcularRanking([])).toEqual([]);
  });
});

describe("consolidarMelhorVoltaPorPiloto", () => {
  it("mantem apenas a melhor volta de cada piloto", () => {
    const consolidado = consolidarMelhorVoltaPorPiloto([
      tempo({ pilotoId: "a", melhorVoltaMs: 33_284 }),
      tempo({ pilotoId: "a", melhorVoltaMs: 32_487 }),
      tempo({ pilotoId: "a", melhorVoltaMs: 32_981 }),
    ]);

    expect(consolidado).toHaveLength(1);
    expect(consolidado[0]!.melhorVoltaMs).toBe(32_487);
  });

  it("um piloto aparece uma unica vez no ranking", () => {
    const ranking = calcularRanking([
      tempo({ pilotoId: "a", melhorVoltaMs: 33_284 }),
      tempo({ pilotoId: "a", melhorVoltaMs: 32_487 }),
      tempo({ pilotoId: "b", melhorVoltaMs: 32_901 }),
    ]);

    expect(ranking).toHaveLength(2);
    expect(ranking[0]!.pilotoId).toBe("a");
  });
});

describe("filtros", () => {
  const tempos = [
    tempo({
      pilotoId: "a",
      melhorVoltaMs: 32_487,
      categoria: "MASCULINO_MEDIO",
      dataDoTempo: parseDataOperacional("2026-08-04"),
    }),
    tempo({
      pilotoId: "b",
      melhorVoltaMs: 31_900,
      categoria: "FEMININO_LEVE",
      dataDoTempo: parseDataOperacional("2026-08-04"),
    }),
    tempo({
      pilotoId: "c",
      melhorVoltaMs: 33_000,
      categoria: "MASCULINO_MEDIO",
      dataDoTempo: parseDataOperacional("2026-07-15"),
    }),
  ];

  it("filtra por categoria", () => {
    expect(filtrarPorCategoria(tempos, "MASCULINO_MEDIO").map((t) => t.pilotoId)).toEqual([
      "a",
      "c",
    ]);
  });

  it("filtra pelo mes de referencia", () => {
    const agosto = periodoDoMes(parseDataOperacional("2026-08-20"));
    expect(filtrarPorPeriodo(tempos, agosto).map((t) => t.pilotoId)).toEqual(["a", "b"]);
  });

  it("mantem o mes da pista durante a virada UTC", () => {
    // Em Sao Paulo ainda e 31/08, embora em UTC ja seja 01/09.
    const agosto = periodoDoMes(new Date("2026-09-01T01:30:00.000Z"));

    expect(agosto).toEqual({
      inicio: new Date("2026-08-01T03:00:00.000Z"),
      fim: new Date("2026-09-01T03:00:00.000Z"),
    });
  });

  it("ranking geral cobre os ultimos 12 meses, incluindo hoje", () => {
    const hoje = parseDataOperacional("2026-08-04");
    const janela = periodoRankingGeral(hoje);

    const historico = [
      tempo({ pilotoId: "hoje", melhorVoltaMs: 32_000, dataDoTempo: hoje }),
      tempo({
        pilotoId: "ontem",
        melhorVoltaMs: 32_000,
        dataDoTempo: parseDataOperacional("2026-08-03"),
      }),
      tempo({
        pilotoId: "onze-meses",
        melhorVoltaMs: 32_000,
        dataDoTempo: parseDataOperacional("2025-09-10"),
      }),
      tempo({
        pilotoId: "treze-meses",
        melhorVoltaMs: 31_000,
        dataDoTempo: parseDataOperacional("2025-07-10"),
      }),
    ];

    const dentro = filtrarPorPeriodo(historico, janela).map((t) => t.pilotoId);
    expect(dentro).toEqual(["hoje", "ontem", "onze-meses"]);
    expect(dentro).not.toContain("treze-meses");
  });

  it("usa o dia da pista na janela geral durante a virada UTC", () => {
    // Em Sao Paulo ainda e 04/08, embora em UTC ja seja 05/08.
    const janela = periodoRankingGeral(new Date("2026-08-05T01:30:00.000Z"));

    expect(janela).toEqual({
      inicio: new Date("2025-08-04T03:00:00.000Z"),
      fim: new Date("2026-08-05T03:00:00.000Z"),
    });

    const limites = [
      tempo({
        pilotoId: "antes",
        melhorVoltaMs: 32_000,
        dataDoTempo: new Date(janela.inicio.getTime() - 1),
      }),
      tempo({ pilotoId: "inicio", melhorVoltaMs: 32_000, dataDoTempo: janela.inicio }),
      tempo({
        pilotoId: "fim-de-hoje",
        melhorVoltaMs: 32_000,
        dataDoTempo: new Date(janela.fim.getTime() - 1),
      }),
      tempo({ pilotoId: "amanha", melhorVoltaMs: 32_000, dataDoTempo: janela.fim }),
    ];

    expect(filtrarPorPeriodo(limites, janela).map((item) => item.pilotoId)).toEqual([
      "inicio",
      "fim-de-hoje",
    ]);
  });

  it("tempo antigo e rapido nao segura posicao no ranking geral", () => {
    const hoje = parseDataOperacional("2026-08-04");
    const historico = [
      tempo({
        pilotoId: "sumido",
        melhorVoltaMs: 30_000,
        dataDoTempo: parseDataOperacional("2024-01-15"),
      }),
      tempo({ pilotoId: "ativo", melhorVoltaMs: 32_487, dataDoTempo: hoje }),
    ];

    const ranking = calcularRanking(filtrarPorPeriodo(historico, periodoRankingGeral(hoje)));
    expect(ranking.map((l) => l.pilotoId)).toEqual(["ativo"]);
  });

  it("inclui o primeiro instante e exclui o inicio do mes seguinte", () => {
    const agosto = periodoDoMes(parseDataOperacional("2026-08-01"));
    const limites = [
      tempo({ pilotoId: "inicio", melhorVoltaMs: 32_000, dataDoTempo: agosto.inicio }),
      tempo({ pilotoId: "fim", melhorVoltaMs: 32_000, dataDoTempo: agosto.fim }),
    ];
    expect(filtrarPorPeriodo(limites, agosto).map((t) => t.pilotoId)).toEqual(["inicio"]);
  });
});

describe("top", () => {
  it("corta no Top 10 por padrao", () => {
    const tempos = Array.from({ length: 15 }, (_, i) =>
      tempo({ pilotoId: `p${i}`, melhorVoltaMs: 32_000 + i * 100, numeroPiloto: 100 + i }),
    );
    expect(top(calcularRanking(tempos))).toHaveLength(10);
    expect(top(calcularRanking(tempos), 3).map((l) => l.pilotoId)).toEqual(["p0", "p1", "p2"]);
  });
});

describe("minhaPosicao", () => {
  const ranking = calcularRanking([
    tempo({ pilotoId: "a", melhorVoltaMs: 33_063 }),
    tempo({ pilotoId: "b", melhorVoltaMs: 33_284 }),
  ]);

  it("mostra o proximo alvo e a diferenca", () => {
    const posicao = minhaPosicao(ranking, "b")!;
    expect(posicao.posicao).toBe(2);
    expect(posicao.proximoAlvo!.pilotoId).toBe("a");
    expect(posicao.diferencaParaProximoMs).toBe(221);
    expect(posicao.estaNoTop10).toBe(true);
  });

  it("lider nao tem proximo alvo", () => {
    const posicao = minhaPosicao(ranking, "a")!;
    expect(posicao.proximoAlvo).toBeNull();
    expect(posicao.diferencaParaProximoMs).toBe(0);
  });

  it("devolve null para piloto sem tempo no recorte", () => {
    expect(minhaPosicao(ranking, "zzz")).toBeNull();
  });
});

describe("compararRankings", () => {
  const antes = calcularRanking([
    tempo({ pilotoId: "a", melhorVoltaMs: 32_487 }),
    tempo({ pilotoId: "b", melhorVoltaMs: 32_901 }),
    tempo({ pilotoId: "c", melhorVoltaMs: 33_284 }),
  ]);

  it("detecta quem perdeu posicao", () => {
    const depois = calcularRanking([
      tempo({ pilotoId: "a", melhorVoltaMs: 32_487 }),
      tempo({ pilotoId: "b", melhorVoltaMs: 32_901 }),
      tempo({ pilotoId: "c", melhorVoltaMs: 32_600 }),
    ]);

    const mudancas = compararRankings(antes, depois);
    const b = mudancas.find((m) => m.pilotoId === "b")!;
    expect(b.perdeuPosicao).toBe(true);
    expect(b.posicaoAnterior).toBe(2);
    expect(b.posicaoAtual).toBe(3);
  });

  it("detecta entrada e saida do Top 10", () => {
    const dez = Array.from({ length: 10 }, (_, i) =>
      tempo({ pilotoId: `p${i}`, melhorVoltaMs: 32_000 + i * 100, numeroPiloto: 100 + i }),
    );
    const rankingAntes = calcularRanking([
      ...dez,
      tempo({ pilotoId: "novato", melhorVoltaMs: 35_000, numeroPiloto: 999 }),
    ]);
    const rankingDepois = calcularRanking([
      ...dez,
      tempo({ pilotoId: "novato", melhorVoltaMs: 31_500, numeroPiloto: 999 }),
    ]);

    const mudancas = compararRankings(rankingAntes, rankingDepois);
    expect(mudancas.find((m) => m.pilotoId === "novato")!.entrouNoTop10).toBe(true);
    expect(mudancas.find((m) => m.pilotoId === "p9")!.saiuDoTop10).toBe(true);
  });

  it("nao reporta quem ficou na mesma posicao", () => {
    expect(compararRankings(antes, antes)).toEqual([]);
  });

  // Protege o bonus de "entrou no Top 10": quem ja estava la e apenas melhorou
  // o proprio tempo sem mudar de posicao nao entrou de novo, e nao pode receber
  // os +10 a cada corrida.
  it("nao reporta mudanca para quem ja estava no Top 10 e manteve a posicao", () => {
    const depois = calcularRanking([
      tempo({ pilotoId: "a", melhorVoltaMs: 32_100 }),
      tempo({ pilotoId: "b", melhorVoltaMs: 32_901 }),
      tempo({ pilotoId: "c", melhorVoltaMs: 33_284 }),
    ]);

    const mudancas = compararRankings(antes, depois);
    expect(mudancas.find((m) => m.pilotoId === "a")).toBeUndefined();
  });
});

describe("pilotosSuperadosPor", () => {
  it("lista quem foi ultrapassado", () => {
    const antes = calcularRanking([
      tempo({ pilotoId: "a", melhorVoltaMs: 32_487 }),
      tempo({ pilotoId: "b", melhorVoltaMs: 32_901 }),
      tempo({ pilotoId: "c", melhorVoltaMs: 33_284 }),
    ]);
    const depois = calcularRanking([
      tempo({ pilotoId: "a", melhorVoltaMs: 32_487 }),
      tempo({ pilotoId: "b", melhorVoltaMs: 32_901 }),
      tempo({ pilotoId: "c", melhorVoltaMs: 32_600 }),
    ]);

    expect(pilotosSuperadosPor(antes, depois, "c")).toEqual(["b"]);
  });

  it("nao lista ninguem quando o piloto nao ganhou posicao", () => {
    const ranking = calcularRanking([
      tempo({ pilotoId: "a", melhorVoltaMs: 32_487 }),
      tempo({ pilotoId: "b", melhorVoltaMs: 32_901 }),
    ]);
    expect(pilotosSuperadosPor(ranking, ranking, "b")).toEqual([]);
  });

  it("conta todos os ultrapassados de uma vez", () => {
    const antes = calcularRanking([
      tempo({ pilotoId: "a", melhorVoltaMs: 32_100 }),
      tempo({ pilotoId: "b", melhorVoltaMs: 32_400 }),
      tempo({ pilotoId: "c", melhorVoltaMs: 32_700 }),
      tempo({ pilotoId: "d", melhorVoltaMs: 33_900 }),
    ]);
    const depois = calcularRanking([
      tempo({ pilotoId: "a", melhorVoltaMs: 32_100 }),
      tempo({ pilotoId: "b", melhorVoltaMs: 32_400 }),
      tempo({ pilotoId: "c", melhorVoltaMs: 32_700 }),
      tempo({ pilotoId: "d", melhorVoltaMs: 32_200 }),
    ]);

    expect(pilotosSuperadosPor(antes, depois, "d").sort()).toEqual(["b", "c"]);
  });
});
