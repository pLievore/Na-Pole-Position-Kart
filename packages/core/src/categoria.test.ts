import { describe, expect, it } from "vitest";
import { parseDataCivil, parseDataOperacional } from "./data-operacional";
import {
  calcularIdade,
  categoriaPorPeso,
  definirCategoria,
  nomeCategoria,
  resolverCategoriaBase,
  verificarElegibilidadeJunior,
} from "./categoria";

const HOJE = parseDataOperacional("2026-08-04");
const adulto = parseDataCivil("1990-01-01");

describe("categoriaPorPeso — faixas masculinas", () => {
  it("classifica nos limites do escopo", () => {
    expect(categoriaPorPeso("MASCULINO", 60)).toBe("MASCULINO_LEVE");
    expect(categoriaPorPeso("MASCULINO", 66)).toBe("MASCULINO_LEVE");
    expect(categoriaPorPeso("MASCULINO", 67)).toBe("MASCULINO_MEDIO");
    expect(categoriaPorPeso("MASCULINO", 85)).toBe("MASCULINO_MEDIO");
    expect(categoriaPorPeso("MASCULINO", 86)).toBe("MASCULINO_PESADO");
    expect(categoriaPorPeso("MASCULINO", 120)).toBe("MASCULINO_PESADO");
  });

  it("nao deixa peso quebrado sem categoria", () => {
    expect(categoriaPorPeso("MASCULINO", 66.5)).toBe("MASCULINO_MEDIO");
    expect(categoriaPorPeso("MASCULINO", 85.4)).toBe("MASCULINO_PESADO");
  });
});

describe("categoriaPorPeso — faixas femininas", () => {
  it("classifica nos limites do escopo", () => {
    expect(categoriaPorPeso("FEMININO", 55)).toBe("FEMININO_LEVE");
    expect(categoriaPorPeso("FEMININO", 60)).toBe("FEMININO_LEVE");
    expect(categoriaPorPeso("FEMININO", 61)).toBe("FEMININO_MEDIO");
    expect(categoriaPorPeso("FEMININO", 75)).toBe("FEMININO_MEDIO");
    expect(categoriaPorPeso("FEMININO", 76)).toBe("FEMININO_PESADO");
  });
});

describe("categoriaPorPeso — pesos invalidos", () => {
  it("recusa valores fora da faixa plausivel", () => {
    expect(() => categoriaPorPeso("MASCULINO", 0)).toThrow(/Peso invalido/);
    expect(() => categoriaPorPeso("MASCULINO", -70)).toThrow(/Peso invalido/);
    expect(() => categoriaPorPeso("MASCULINO", 500)).toThrow(/Peso invalido/);
    expect(() => categoriaPorPeso("MASCULINO", Number.NaN)).toThrow(/Peso invalido/);
  });
});

describe("resolverCategoriaBase", () => {
  it("usa o proprio sexo quando masculino ou feminino", () => {
    expect(resolverCategoriaBase("MASCULINO")).toBe("MASCULINO");
    expect(resolverCategoriaBase("FEMININO")).toBe("FEMININO");
  });

  it("exige base explicita para sexo OUTRO", () => {
    expect(resolverCategoriaBase("OUTRO", "FEMININO")).toBe("FEMININO");
    expect(() => resolverCategoriaBase("OUTRO")).toThrow(/categoria-base/);
  });
});

describe("calcularIdade", () => {
  it("conta anos completos", () => {
    expect(calcularIdade(parseDataCivil("2000-08-04"), HOJE)).toBe(26);
  });

  it("nao conta o ano quando o aniversario ainda nao chegou", () => {
    expect(calcularIdade(parseDataCivil("2000-08-05"), HOJE)).toBe(25);
  });

  it("nao antecipa o aniversario durante a virada UTC", () => {
    const noiteDeQuatroDeAgosto = new Date("2026-08-05T01:30:00.000Z");

    expect(calcularIdade(parseDataCivil("2000-08-05"), noiteDeQuatroDeAgosto)).toBe(25);
    expect(calcularIdade(parseDataCivil("2000-08-04"), noiteDeQuatroDeAgosto)).toBe(26);
  });
});

describe("verificarElegibilidadeJunior", () => {
  it("aprova quem cumpre idade, altura e responsavel", () => {
    expect(
      verificarElegibilidadeJunior({
        idade: 15,
        alturaMetros: 1.65,
        temContatoResponsavel: true,
      }),
    ).toEqual({ elegivel: true });
  });

  it("reprova por idade, altura e falta de responsavel", () => {
    const resultado = verificarElegibilidadeJunior({
      idade: 13,
      alturaMetros: 1.5,
      temContatoResponsavel: false,
    });
    expect(resultado.elegivel).toBe(false);
    if (!resultado.elegivel) expect(resultado.motivos).toHaveLength(3);
  });

  it("nao reprova por altura quando ela ainda nao foi aferida", () => {
    expect(
      verificarElegibilidadeJunior({
        idade: 16,
        alturaMetros: null,
        temContatoResponsavel: true,
      }).elegivel,
    ).toBe(true);
  });
});

describe("definirCategoria", () => {
  it("classifica adulto pelo peso declarado", () => {
    expect(
      definirCategoria({
        sexo: "MASCULINO",
        pesoDeclaradoKg: 82,
        dataNascimento: adulto,
        referencia: HOJE,
      }),
    ).toBe("MASCULINO_MEDIO");
  });

  it("da precedencia ao peso conferido na balanca", () => {
    expect(
      definirCategoria({
        sexo: "MASCULINO",
        pesoDeclaradoKg: 84,
        pesoConferidoKg: 88,
        dataNascimento: adulto,
        referencia: HOJE,
      }),
    ).toBe("MASCULINO_PESADO");
  });

  it("coloca menor de idade elegivel no Junior, independente do peso", () => {
    expect(
      definirCategoria({
        sexo: "MASCULINO",
        pesoDeclaradoKg: 90,
        dataNascimento: parseDataCivil("2010-01-01"),
        alturaMetros: 1.72,
        temContatoResponsavel: true,
        referencia: HOJE,
      }),
    ).toBe("JUNIOR");
  });

  it("recusa menor de idade sem responsavel cadastrado", () => {
    expect(() =>
      definirCategoria({
        sexo: "FEMININO",
        pesoDeclaradoKg: 55,
        dataNascimento: parseDataCivil("2012-01-01"),
        alturaMetros: 1.65,
        temContatoResponsavel: false,
        referencia: HOJE,
      }),
    ).toThrow(/responsavel/);
  });

  it("passa a usar a faixa de peso ao completar 18 anos", () => {
    expect(
      definirCategoria({
        sexo: "FEMININO",
        pesoDeclaradoKg: 58,
        dataNascimento: parseDataCivil("2008-08-04"),
        referencia: HOJE,
      }),
    ).toBe("FEMININO_LEVE");
  });
});

describe("nomeCategoria", () => {
  it("devolve o rotulo de exibicao", () => {
    expect(nomeCategoria("MASCULINO_MEDIO")).toBe("Masculino Medio");
    expect(nomeCategoria("JUNIOR")).toBe("Junior");
  });
});
