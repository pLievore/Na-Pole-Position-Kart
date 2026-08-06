import { describe, expect, it } from "vitest";
import { digitosTelefone, formatarTelefone, telefoneCompleto } from "./telefone";

describe("digitosTelefone", () => {
  it("mantem apenas digitos", () => {
    expect(digitosTelefone("(11) 99999-0000")).toBe("11999990000");
    expect(digitosTelefone("+55 11 99999 0000")).toBe("55119999900");
  });

  it("corta no maximo de onze digitos", () => {
    expect(digitosTelefone("11999990000123")).toBe("11999990000");
  });
});

describe("formatarTelefone", () => {
  it("formata celular e fixo", () => {
    expect(formatarTelefone("11999990000")).toBe("(11) 99999-0000");
    expect(formatarTelefone("1133334444")).toBe("(11) 3333-4444");
  });

  it("aceita valor ja formatado sem duplicar pontuacao", () => {
    expect(formatarTelefone("(11) 99999-0000")).toBe("(11) 99999-0000");
  });

  it("formata valor parcial para servir de mascara de digitacao", () => {
    expect(formatarTelefone("")).toBe("");
    expect(formatarTelefone("1")).toBe("(1");
    expect(formatarTelefone("11")).toBe("(11");
    expect(formatarTelefone("119")).toBe("(11) 9");
    expect(formatarTelefone("119999")).toBe("(11) 9999");
    expect(formatarTelefone("1199999")).toBe("(11) 9999-9");
  });

  it("nao reinsere separador que a pessoa acabou de apagar", () => {
    // Apagar o ultimo digito de "(11) 9" devolve "(11) " ao onChange; se a
    // mascara respondesse "(11) " de volta, o campo travaria com o espaco.
    expect(formatarTelefone("(11) ")).toBe("(11");
    expect(formatarTelefone("(11")).toBe("(11");
  });
});

describe("telefoneCompleto", () => {
  it("exige DDD e numero", () => {
    expect(telefoneCompleto("(11) 3333-4444")).toBe(true);
    expect(telefoneCompleto("(11) 99999-0000")).toBe(true);
    expect(telefoneCompleto("(11) 9999")).toBe(false);
    expect(telefoneCompleto("")).toBe(false);
  });
});
