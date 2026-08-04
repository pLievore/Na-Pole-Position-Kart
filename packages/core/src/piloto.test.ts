import { describe, expect, it } from "vitest";
import {
  diasSemCorrer,
  estaInativo,
  formatarNumeroPiloto,
  paraRankingPublico,
  sugerirNomeExibicao,
} from "./piloto";
import { calcularRanking } from "./ranking";

describe("formatarNumeroPiloto", () => {
  it("prefixa com cerquilha", () => {
    expect(formatarNumeroPiloto(231)).toBe("#231");
  });
});

describe("sugerirNomeExibicao", () => {
  it("usa primeiro nome + inicial do sobrenome", () => {
    expect(sugerirNomeExibicao("Patrick Wallace")).toBe("Patrick W.");
    expect(sugerirNomeExibicao("Rafael Santos Lima")).toBe("Rafael L.");
  });

  it("ignora preposicoes ao escolher o sobrenome", () => {
    expect(sugerirNomeExibicao("Maria de Souza")).toBe("Maria S.");
    expect(sugerirNomeExibicao("Joao dos Santos")).toBe("Joao S.");
  });

  it("lida com nome unico e espacos extras", () => {
    expect(sugerirNomeExibicao("Patrick")).toBe("Patrick");
    expect(sugerirNomeExibicao("  Patrick   Wallace  ")).toBe("Patrick W.");
    expect(sugerirNomeExibicao("")).toBe("");
  });
});

describe("paraRankingPublico", () => {
  it("expoe somente os campos permitidos pela secao 1.4", () => {
    const [linha] = calcularRanking([
      {
        pilotoId: "a",
        numeroPiloto: 231,
        nomeExibicao: "Patrick W.",
        categoria: "MASCULINO_MEDIO",
        melhorVoltaMs: 32_487,
        dataDoTempo: new Date(2026, 7, 4),
      },
    ]);

    const publico = paraRankingPublico(linha!);

    expect(publico).toEqual({
      posicao: 1,
      numeroPiloto: "#231",
      nome: "Patrick W.",
      categoria: "Masculino Medio",
      melhorVolta: "32.487s",
      dataDoTempo: new Date(2026, 7, 4),
    });
    expect(Object.keys(publico)).not.toContain("pilotoId");
  });
});

describe("inatividade", () => {
  const hoje = new Date(2026, 7, 24);

  it("conta os dias desde a ultima corrida", () => {
    expect(diasSemCorrer(new Date(2026, 7, 4), hoje)).toBe(20);
  });

  it("marca inativo a partir de 20 dias", () => {
    expect(estaInativo(new Date(2026, 7, 4), hoje)).toBe(true);
    expect(estaInativo(new Date(2026, 7, 10), hoje)).toBe(false);
  });

  it("trata piloto que nunca correu como inativo", () => {
    expect(estaInativo(null, hoje)).toBe(true);
  });
});
