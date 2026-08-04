import { describe, expect, it } from "vitest";
import {
  TempoInvalidoError,
  formatarDiferenca,
  formatarTempo,
  melhorouTempo,
  parseTempo,
} from "./tempo";

describe("parseTempo", () => {
  it("le o formato usado na pista", () => {
    expect(parseTempo("32.487")).toBe(32_487);
    expect(parseTempo("32,487")).toBe(32_487);
    expect(parseTempo(" 32.487 ")).toBe(32_487);
  });

  it("le tempo acima de um minuto", () => {
    expect(parseTempo("1:02.487")).toBe(62_487);
    expect(parseTempo("2:00")).toBe(120_000);
    expect(parseTempo("1:02")).toBe(62_000);
  });

  it("rejeita segundos acima de 59 no formato com minutos", () => {
    expect(() => parseTempo("1:75.000")).toThrow(TempoInvalidoError);
  });

  it("completa milissegundos digitados pela metade", () => {
    expect(parseTempo("32.5")).toBe(32_500);
    expect(parseTempo("32.48")).toBe(32_480);
  });

  it("rejeita tempo fora dos limites plausiveis", () => {
    expect(() => parseTempo("3.200")).toThrow(TempoInvalidoError);
    expect(() => parseTempo("999")).toThrow(TempoInvalidoError);
  });

  it("rejeita entrada malformada", () => {
    expect(() => parseTempo("")).toThrow(TempoInvalidoError);
    expect(() => parseTempo("trinta e dois")).toThrow(TempoInvalidoError);
    expect(() => parseTempo("32.4.8")).toThrow(TempoInvalidoError);
  });
});

describe("formatarTempo", () => {
  it("usa o formato curto abaixo de um minuto", () => {
    expect(formatarTempo(32_487)).toBe("32.487s");
    expect(formatarTempo(9_050)).toBe("9.050s");
  });

  it("usa minutos quando passa de 60s", () => {
    expect(formatarTempo(62_487)).toBe("1:02.487");
  });

  it("ida e volta com parseTempo preserva o valor", () => {
    expect(parseTempo(formatarTempo(32_487).replace("s", ""))).toBe(32_487);
  });
});

describe("formatarDiferenca", () => {
  it("mostra o sinal", () => {
    expect(formatarDiferenca(221)).toBe("+0.221s");
    expect(formatarDiferenca(-221)).toBe("-0.221s");
    expect(formatarDiferenca(0)).toBe("0.000s");
  });
});

describe("melhorouTempo", () => {
  it("considera melhora quando nao ha tempo anterior", () => {
    expect(melhorouTempo(32_487, null)).toBe(true);
  });

  it("compara corretamente", () => {
    expect(melhorouTempo(32_487, 32_901)).toBe(true);
    expect(melhorouTempo(32_901, 32_487)).toBe(false);
    expect(melhorouTempo(32_487, 32_487)).toBe(false);
  });
});
