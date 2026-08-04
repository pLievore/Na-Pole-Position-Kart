import {
  DataOperacionalInvalidaError,
  DataHoraOperacionalInvalidaError,
  criarDataOperacional,
  dataHoraOperacionalISO,
  dataOperacionalISO,
  formatarDataOperacional,
  parseDataCivil,
  parseDataHoraOperacional,
  parseDataOperacional,
  partesDataCivil,
  partesDataOperacional,
  periodoDoDiaOperacional,
} from "./data-operacional";

describe("data operacional", () => {
  it("preserva o dia civil escolhido no input HTML", () => {
    const data = parseDataOperacional("2026-08-04");

    expect(data.toISOString()).toBe("2026-08-04T03:00:00.000Z");
    expect(formatarDataOperacional(data)).toBe("04/08/2026");
  });

  it("representa data sem horario em UTC para colunas PostgreSQL date", () => {
    const data = parseDataCivil("2000-08-04");

    expect(data.toISOString()).toBe("2000-08-04T00:00:00.000Z");
    expect(partesDataCivil(data)).toEqual({ ano: 2000, mes: 8, dia: 4 });
  });

  it("descobre o dia da pista mesmo durante a virada UTC", () => {
    const noiteNaPista = new Date("2026-08-05T01:30:00.000Z");

    expect(dataOperacionalISO(noiteNaPista)).toBe("2026-08-04");
    expect(partesDataOperacional(noiteNaPista)).toEqual({ ano: 2026, mes: 8, dia: 4 });
  });

  it("calcula a janela diaria no fuso da pista", () => {
    const referencia = new Date("2026-08-05T01:30:00.000Z");

    expect(periodoDoDiaOperacional(referencia)).toEqual({
      inicio: new Date("2026-08-04T03:00:00.000Z"),
      fim: new Date("2026-08-05T03:00:00.000Z"),
    });
  });

  it.each(["", "04/08/2026", "2026-02-29", "2026-13-01", "2026-08-32"])(
    "rejeita a data invalida %j",
    (entrada) => {
      expect(() => parseDataOperacional(entrada)).toThrow(DataOperacionalInvalidaError);
    },
  );

  it("aceita o dia extra de um ano bissexto", () => {
    expect(parseDataOperacional("2028-02-29").toISOString()).toBe("2028-02-29T03:00:00.000Z");
  });

  it("cria uma data operacional a partir de partes validas", () => {
    expect(criarDataOperacional(2026, 8, 4).toISOString()).toBe("2026-08-04T03:00:00.000Z");
    expect(() => criarDataOperacional(2026, 2, 29)).toThrow(DataOperacionalInvalidaError);
  });

  it("converte data e hora da pista sem depender do fuso do processo", () => {
    const instante = parseDataHoraOperacional("2026-08-04T19:35");

    expect(instante.toISOString()).toBe("2026-08-04T22:35:00.000Z");
    expect(dataHoraOperacionalISO(instante)).toBe("2026-08-04T19:35");
  });

  it.each(["", "2026-08-04 19:35", "2026-08-04T24:00", "2026-02-29T10:00"])(
    "rejeita a data e hora local invalida %j",
    (entrada) => {
      expect(() => parseDataHoraOperacional(entrada)).toThrow(
        DataHoraOperacionalInvalidaError,
      );
    },
  );
});
