import {
  CONFIGURACAO_PADROES_AGENDAMENTO_INICIAL,
  MAXIMO_PARTICIPANTES_POR_AGENDAMENTO,
  RegraAgendamentoError,
  avaliarCapacidadeAgendamento,
  avaliarAlteracaoCapacidadeHorario,
  calcularExpiracaoPendencia,
  calcularOcupacaoAgendamentos,
  exigirTransicaoAgendamento,
  gerarHorariosPadraoParaData,
  resolverStatusAgendamentoPorParticipantes,
  validarConfiguracaoPadroesAgendamento,
  validarDadosAgendamentoPublico,
  validarIntervaloHorario,
} from "./agendamento";
import { dataHoraOperacionalISO } from "./data-operacional";

describe("agendamento", () => {
  it("normaliza os dados aprovados no formulario publico", () => {
    expect(
      validarDadosAgendamentoPublico({
        responsavelNome: "  Ana   Souza ",
        responsavelTelefone: "(11) 99999-0000",
        responsavelEmail: " ANA@EXEMPLO.COM ",
        participantes: [{ nomeCompleto: " Bruno   Souza " }],
        temParticipanteMenor: true,
        observacoesCliente: "  Precisa de apoio na chegada.  ",
        aceiteTermos: true,
        versaoTermos: "2026-08-04",
      }),
    ).toEqual({
      responsavelNome: "Ana Souza",
      responsavelTelefone: "11999990000",
      responsavelEmail: "ana@exemplo.com",
      participantes: [{ nomeCompleto: "Bruno Souza" }],
      temParticipanteMenor: true,
      observacoesCliente: "Precisa de apoio na chegada.",
      aceiteTermos: true,
      versaoTermos: "2026-08-04",
    });
  });

  it("limita cada reserva a 1-10 participantes e exige os termos", () => {
    const base = {
      responsavelNome: "Ana Souza",
      responsavelTelefone: "11999990000",
      responsavelEmail: "ana@exemplo.com",
      temParticipanteMenor: false,
      aceiteTermos: true,
      versaoTermos: "v1",
    };

    expect(() => validarDadosAgendamentoPublico({ ...base, participantes: [] })).toThrowError(
      expect.objectContaining({ codigo: "PARTICIPANTES_INVALIDOS" }),
    );
    expect(() =>
      validarDadosAgendamentoPublico({
        ...base,
        participantes: Array.from(
          { length: MAXIMO_PARTICIPANTES_POR_AGENDAMENTO + 1 },
          (_, indice) => ({ nomeCompleto: `Piloto ${indice}` }),
        ),
      }),
    ).toThrowError(expect.objectContaining({ codigo: "PARTICIPANTES_INVALIDOS" }));
    expect(() =>
      validarDadosAgendamentoPublico({
        ...base,
        participantes: [{ nomeCompleto: "Ana Souza" }],
        aceiteTermos: false,
      }),
    ).toThrowError(expect.objectContaining({ codigo: "TERMOS_NAO_ACEITOS" }));
  });

  it("ignora pendencia vencida na ocupacao mesmo antes de materializar o status", () => {
    const agora = new Date("2026-08-04T18:00:00.000Z");
    expect(
      calcularOcupacaoAgendamentos(
        [
          {
            status: "PENDENTE",
            quantidadeParticipantes: 2,
            expiraEm: new Date("2026-08-04T17:59:59.999Z"),
          },
          {
            status: "PENDENTE",
            quantidadeParticipantes: 3,
            expiraEm: new Date("2026-08-04T18:00:00.001Z"),
          },
          { status: "CONFIRMADO", quantidadeParticipantes: 4, expiraEm: null },
          { status: "CHECK_IN", quantidadeParticipantes: 1, expiraEm: null },
          { status: "EXPIRADO", quantidadeParticipantes: 9, expiraEm: null },
        ],
        agora,
      ),
    ).toBe(8);
  });

  it("recusa excesso de capacidade e explicita o override administrativo", () => {
    expect(() => avaliarCapacidadeAgendamento(10, 8, 3)).toThrowError(
      expect.objectContaining({ codigo: "CAPACIDADE_ESGOTADA" }),
    );

    expect(avaliarCapacidadeAgendamento(10, 8, 3, true)).toMatchObject({
      disponiveisAntes: 2,
      disponiveisDepois: 0,
      excedente: 1,
    });
  });

  it("aceita capacidade exatamente lotada e exige override apenas abaixo da ocupacao", () => {
    expect(avaliarAlteracaoCapacidadeHorario(10, 10)).toEqual({
      capacidade: 10,
      ocupadas: 10,
      excedente: 0,
    });
    expect(() => avaliarAlteracaoCapacidadeHorario(9, 10)).toThrowError(
      expect.objectContaining({ codigo: "CAPACIDADE_ESGOTADA" }),
    );
    expect(avaliarAlteracaoCapacidadeHorario(9, 10, true).excedente).toBe(1);
  });

  it("vence em 24h, mas nunca depois do corte de duas horas", () => {
    const criadoEm = new Date("2026-08-04T12:00:00.000Z");

    expect(
      calcularExpiracaoPendencia(criadoEm, new Date("2026-08-06T18:00:00.000Z")).toISOString(),
    ).toBe("2026-08-05T12:00:00.000Z");
    expect(
      calcularExpiracaoPendencia(criadoEm, new Date("2026-08-05T10:00:00.000Z")).toISOString(),
    ).toBe("2026-08-05T08:00:00.000Z");
    expect(() =>
      calcularExpiracaoPendencia(criadoEm, new Date("2026-08-04T13:59:59.000Z")),
    ).toThrowError(expect.objectContaining({ codigo: "ANTECEDENCIA_INSUFICIENTE" }));
  });

  it("aceita somente transicoes previstas pela confirmacao manual", () => {
    expect(() => exigirTransicaoAgendamento("PENDENTE", "CONFIRMADO")).not.toThrow();
    expect(() => exigirTransicaoAgendamento("PENDENTE", "EXPIRADO")).not.toThrow();
    expect(() => exigirTransicaoAgendamento("CHECK_IN", "CONCLUIDO")).not.toThrow();
    expect(() => exigirTransicaoAgendamento("PENDENTE", "CONCLUIDO")).toThrowError(
      expect.objectContaining({ codigo: "TRANSICAO_INVALIDA" }),
    );
    expect(() => exigirTransicaoAgendamento("EXPIRADO", "CONFIRMADO")).toThrow(
      RegraAgendamentoError,
    );
  });

  it("entra em check-in sem concluir a bateria e reconhece ausencia total", () => {
    expect(
      resolverStatusAgendamentoPorParticipantes("CONFIRMADO", ["PRESENTE", "AGENDADO"]),
    ).toBe("CHECK_IN");
    expect(
      resolverStatusAgendamentoPorParticipantes("CONFIRMADO", ["PRESENTE", "AUSENTE"]),
    ).toBe("CHECK_IN");
    expect(
      resolverStatusAgendamentoPorParticipantes("CONFIRMADO", ["AUSENTE", "AUSENTE"]),
    ).toBe("NAO_COMPARECEU");
  });

  it("valida intervalos inteiros de no maximo um dia", () => {
    expect(() =>
      validarIntervaloHorario(
        new Date("2026-08-04T20:00:00.000Z"),
        new Date("2026-08-04T20:20:00.000Z"),
      ),
    ).not.toThrow();
    expect(() =>
      validarIntervaloHorario(
        new Date("2026-08-04T20:00:00.000Z"),
        new Date("2026-08-04T19:59:00.000Z"),
      ),
    ).toThrowError(expect.objectContaining({ codigo: "INTERVALO_INVALIDO" }));
  });

  it("expoe os defaults operacionais como configuracao validavel", () => {
    expect(validarConfiguracaoPadroesAgendamento(CONFIGURACAO_PADROES_AGENDAMENTO_INICIAL)).toEqual(
      CONFIGURACAO_PADROES_AGENDAMENTO_INICIAL,
    );
  });

  it("gera sugestoes de quarta a sexta e no fim de semana, sem torna-las obrigatorias", () => {
    const quarta = gerarHorariosPadraoParaData("2026-08-05");
    const domingo = gerarHorariosPadraoParaData("2026-08-09");
    const segunda = gerarHorariosPadraoParaData("2026-08-10");

    expect(quarta).toHaveLength(8);
    expect(dataHoraOperacionalISO(quarta[0]!.inicioEm)).toBe("2026-08-05T18:00");
    expect(dataHoraOperacionalISO(quarta.at(-1)!.inicioEm)).toBe("2026-08-05T21:30");
    expect(domingo).toHaveLength(16);
    expect(dataHoraOperacionalISO(domingo[0]!.inicioEm)).toBe("2026-08-09T14:00");
    expect(segunda).toEqual([]);
  });

  it("rejeita faixas ou duracoes que produziriam sobreposicao", () => {
    expect(() =>
      validarConfiguracaoPadroesAgendamento({
        ...CONFIGURACAO_PADROES_AGENDAMENTO_INICIAL,
        faixas: [],
      }),
    ).toThrowError(expect.objectContaining({ codigo: "CONFIGURACAO_INVALIDA", campo: "faixas" }));

    expect(() =>
      validarConfiguracaoPadroesAgendamento({
        ...CONFIGURACAO_PADROES_AGENDAMENTO_INICIAL,
        duracaoMinutos: 31,
      }),
    ).toThrowError(expect.objectContaining({ codigo: "HORARIOS_SOBREPOSTOS" }));

    expect(() =>
      validarConfiguracaoPadroesAgendamento({
        ...CONFIGURACAO_PADROES_AGENDAMENTO_INICIAL,
        faixas: [
          { diasSemana: [3], horaInicio: "18:00", horaFim: "20:00" },
          { diasSemana: [3], horaInicio: "19:00", horaFim: "21:00" },
        ],
      }),
    ).toThrowError(expect.objectContaining({ codigo: "HORARIOS_SOBREPOSTOS" }));
  });
});
