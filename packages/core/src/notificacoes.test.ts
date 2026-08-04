import { describe, expect, it } from "vitest";
import {
  avisoEntrouTop10,
  avisoInatividade,
  avisoMelhorouTempo,
  avisoSaiuTop10,
  avisoTempoEmpatado,
  avisoTempoSuperado,
} from "./notificacoes";

describe("mensagens automaticas", () => {
  it("nomeia a categoria no alerta de ultrapassagem", () => {
    const aviso = avisoTempoSuperado("MASCULINO_MEDIO");
    expect(aviso.tipo).toBe("TEMPO_SUPERADO");
    expect(aviso.mensagem).toContain("Masculino Medio");
  });

  it("informa a posicao ao entrar e ao sair do Top 10", () => {
    expect(avisoEntrouTop10("FEMININO_LEVE", 7).mensagem).toContain("7o");
    expect(avisoSaiuTop10("FEMININO_LEVE", 11).mensagem).toContain("11o");
  });

  it("mostra o ganho no recorde pessoal", () => {
    const aviso = avisoMelhorouTempo(32_487, 32_901);
    expect(aviso.mensagem).toContain("32.487s");
    expect(aviso.mensagem).toContain("-0.414s");
  });

  it("explica o criterio de desempate no aviso de empate", () => {
    const aviso = avisoTempoEmpatado(32_487, "JUNIOR");
    expect(aviso.mensagem).toContain("32.487s");
    expect(aviso.mensagem).toContain("marcado antes");
  });

  it("conta os dias parado", () => {
    expect(avisoInatividade(23).mensagem).toContain("23 dias");
  });
});
