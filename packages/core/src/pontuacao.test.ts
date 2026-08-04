import { describe, expect, it } from "vitest";
import { calcularPontosCorrida } from "./pontuacao";
import { pontosDaPenalidade, totalDescontado } from "./penalidade";

const base = {
  corridaValida: true,
  primeiraCorridaDoDia: true,
  melhorouProprioTempo: false,
  entrouNoTop10Categoria: false,
  melhorTempoDoDiaNaCategoria: false,
};

describe("calcularPontosCorrida", () => {
  it("da 10 pontos por participar de corrida valida", () => {
    expect(calcularPontosCorrida(base).total).toBe(10);
  });

  it("soma todos os bonus quando a corrida foi perfeita", () => {
    const resultado = calcularPontosCorrida({
      ...base,
      melhorouProprioTempo: true,
      entrouNoTop10Categoria: true,
      melhorTempoDoDiaNaCategoria: true,
    });
    expect(resultado.total).toBe(40); // 10 + 5 + 10 + 15
    expect(resultado.itens).toHaveLength(4);
  });

  it("paga participacao uma vez por dia, mesmo com varias baterias", () => {
    const segundaBateria = calcularPontosCorrida({ ...base, primeiraCorridaDoDia: false });
    expect(segundaBateria.total).toBe(0);
    expect(segundaBateria.itens).toHaveLength(0);
  });

  it("mantem os bonus nas baterias seguintes do mesmo dia", () => {
    const resultado = calcularPontosCorrida({
      ...base,
      primeiraCorridaDoDia: false,
      melhorouProprioTempo: true,
      melhorTempoDoDiaNaCategoria: true,
    });
    expect(resultado.total).toBe(20); // 5 + 15, sem os 10 de participacao
  });

  it("nao pontua corrida invalida, mas mantem a penalidade", () => {
    const resultado = calcularPontosCorrida({
      ...base,
      corridaValida: false,
      melhorouProprioTempo: true,
      penalidades: [{ tipo: "PUNICAO" }],
    });
    expect(resultado.pontosGanhos).toBe(0);
    expect(resultado.total).toBe(-3);
  });

  it("desconta penalidades do saldo", () => {
    const resultado = calcularPontosCorrida({
      ...base,
      melhorouProprioTempo: true,
      penalidades: [{ tipo: "ADVERTENCIA" }, { tipo: "PUNICAO_GRAVE" }],
    });
    expect(resultado.pontosGanhos).toBe(15);
    expect(resultado.pontosDescontados).toBe(-6);
    expect(resultado.total).toBe(9);
  });

  it("permite saldo negativo na corrida", () => {
    const resultado = calcularPontosCorrida({
      ...base,
      penalidades: [{ tipo: "PUNICAO_GRAVE" }, { tipo: "PUNICAO_GRAVE" }, { tipo: "PUNICAO" }],
    });
    expect(resultado.total).toBe(-3); // 10 - 13
  });

  it("detalha os itens para o extrato do piloto", () => {
    const resultado = calcularPontosCorrida({
      ...base,
      entrouNoTop10Categoria: true,
      penalidades: [{ tipo: "ADVERTENCIA" }],
    });
    expect(resultado.itens.map((i) => i.codigo)).toEqual([
      "PARTICIPACAO",
      "ENTROU_TOP10",
      "PENALIDADES",
    ]);
  });
});

describe("penalidades", () => {
  it("aplica a tabela do escopo", () => {
    expect(pontosDaPenalidade({ tipo: "ADVERTENCIA" })).toBe(-1);
    expect(pontosDaPenalidade({ tipo: "PUNICAO" })).toBe(-3);
    expect(pontosDaPenalidade({ tipo: "PUNICAO_GRAVE" })).toBe(-5);
  });

  it("exige valor manual na desclassificacao", () => {
    expect(() => pontosDaPenalidade({ tipo: "DESCLASSIFICACAO" })).toThrow(/manualmente/);
    expect(pontosDaPenalidade({ tipo: "DESCLASSIFICACAO", pontosManuais: 8 })).toBe(-8);
    expect(pontosDaPenalidade({ tipo: "DESCLASSIFICACAO", pontosManuais: -8 })).toBe(-8);
  });

  it("soma zero quando nao ha penalidade", () => {
    expect(totalDescontado([])).toBe(0);
  });
});
