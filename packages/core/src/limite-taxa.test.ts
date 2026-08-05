import { describe, expect, it } from "vitest";
import {
  REGRAS_LIMITE,
  avaliarLimite,
  janelaMaisLongaMinutos,
  mensagemLimite,
  type RegraLimite,
} from "./limite-taxa";

const AGORA = new Date(2026, 7, 4, 20, 0, 0);

/** Instantes a N minutos atras, do mais antigo para o mais recente. */
function minutosAtras(...minutos: number[]): Date[] {
  return minutos
    .map((m) => new Date(AGORA.getTime() - m * 60_000))
    .sort((a, b) => a.getTime() - b.getTime());
}

const regraSimples: RegraLimite = [{ janelaMinutos: 10, maximo: 3 }];

describe("avaliarLimite", () => {
  it("permite quando esta dentro do limite", () => {
    const resultado = avaliarLimite(minutosAtras(9, 5, 0), regraSimples, AGORA);
    expect(resultado.permitido).toBe(true);
    expect(resultado.restantes).toBe(0);
    expect(resultado.liberaEm).toBeNull();
  });

  it("bloqueia ao ultrapassar o maximo", () => {
    const resultado = avaliarLimite(minutosAtras(9, 6, 3, 0), regraSimples, AGORA);
    expect(resultado.permitido).toBe(false);
    expect(resultado.liberaEm).not.toBeNull();
  });

  it("ignora tentativas que ja sairam da janela", () => {
    const resultado = avaliarLimite(minutosAtras(60, 45, 30, 0), regraSimples, AGORA);
    expect(resultado.permitido).toBe(true);
  });

  it("libera quando a tentativa mais antiga sai da janela", () => {
    const resultado = avaliarLimite(minutosAtras(8, 6, 3, 0), regraSimples, AGORA);
    // A mais antiga relevante e a de 8 minutos atras; a vaga volta 10 min depois dela.
    expect(resultado.liberaEm).toEqual(new Date(AGORA.getTime() + 2 * 60_000));
  });

  it("aceita lista vazia", () => {
    const resultado = avaliarLimite([], regraSimples, AGORA);
    expect(resultado.permitido).toBe(true);
    expect(resultado.restantes).toBe(3);
  });
});

describe("janelas cumulativas", () => {
  const regra: RegraLimite = [
    { janelaMinutos: 10, maximo: 3 },
    { janelaMinutos: 60 * 24, maximo: 5 },
  ];

  it("barra a rajada curta mesmo com folga na janela longa", () => {
    const resultado = avaliarLimite(minutosAtras(4, 3, 2, 1), regra, AGORA);
    expect(resultado.permitido).toBe(false);
  });

  it("barra o uso constante mesmo sem rajada", () => {
    const resultado = avaliarLimite(minutosAtras(600, 480, 360, 240, 120, 0), regra, AGORA);
    expect(resultado.permitido).toBe(false);
  });

  it("permite uso espacado dentro das duas janelas", () => {
    const resultado = avaliarLimite(minutosAtras(600, 300, 0), regra, AGORA);
    expect(resultado.permitido).toBe(true);
  });
});

describe("regras configuradas", () => {
  it("um visitante que reserva uma vez passa com folga", () => {
    expect(avaliarLimite([AGORA], REGRAS_LIMITE.AGENDAMENTO_POR_IP, AGORA).permitido).toBe(true);
  });

  it("uma rajada de quatro reservas seguidas e barrada", () => {
    const rajada = minutosAtras(2, 1, 1, 0);
    expect(avaliarLimite(rajada, REGRAS_LIMITE.AGENDAMENTO_POR_IP, AGORA).permitido).toBe(false);
  });

  it("o mesmo telefone nao reserva quatro vezes no dia", () => {
    const dia = minutosAtras(600, 400, 200, 0);
    expect(avaliarLimite(dia, REGRAS_LIMITE.AGENDAMENTO_POR_TELEFONE, AGORA).permitido).toBe(false);
  });

  it("forca bruta de senha para uma conta e barrada em 15 minutos", () => {
    const tentativas = minutosAtras(10, 8, 6, 4, 2, 0);
    expect(avaliarLimite(tentativas, REGRAS_LIMITE.LOGIN_POR_IDENTIFICADOR, AGORA).permitido).toBe(
      false,
    );
  });
});

describe("janelaMaisLongaMinutos", () => {
  it("devolve a maior janela da regra", () => {
    expect(janelaMaisLongaMinutos(REGRAS_LIMITE.AGENDAMENTO_POR_IP)).toBe(1440);
    expect(janelaMaisLongaMinutos(regraSimples)).toBe(10);
  });
});

describe("mensagemLimite", () => {
  it("usa minutos para esperas curtas", () => {
    expect(mensagemLimite(new Date(AGORA.getTime() + 5 * 60_000), AGORA)).toContain("5 minutos");
  });

  it("usa horas para esperas longas e oferece o WhatsApp", () => {
    const texto = mensagemLimite(new Date(AGORA.getTime() + 3 * 60 * 60_000), AGORA);
    expect(texto).toContain("3 horas");
    expect(texto).toContain("WhatsApp");
  });

  it("nao revela contagem nem qual limite foi atingido", () => {
    const texto = mensagemLimite(new Date(AGORA.getTime() + 60_000), AGORA);
    expect(texto).not.toMatch(/\bIP\b|telefone|tentativas restantes/i);
  });
});
