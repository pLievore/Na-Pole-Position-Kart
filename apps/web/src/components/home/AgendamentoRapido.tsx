import { dataOperacionalISO, type ConfiguracaoPadroesAgendamento } from "@napole/core";
import { SeletorRapido } from "./SeletorRapido";

export function AgendamentoRapido({
  resumoHorarios,
  configuracao,
}: {
  resumoHorarios: string;
  configuracao: ConfiguracaoPadroesAgendamento;
}) {
  const hoje = dataOperacionalISO(new Date());
  const diasAbertos = [...new Set(configuracao.faixas.flatMap((faixa) => faixa.diasSemana))];

  // O cartao ficava sobreposto ao hero por margem negativa, e a borda inferior
  // do hero cortava o topo dele. Agora ele comeca abaixo dessa linha, que
  // continua marcando o fim do video.

  return (
    <section
      id="agendamento"
      aria-labelledby="titulo-agendamento"
      className="pb-16 pt-12 sm:pb-20 sm:pt-16"
    >
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="cartao-vitrine overflow-hidden rounded-3xl bg-[var(--color-superficie-elevada)] p-6 shadow-[var(--sombra-elevada)] sm:p-9">
          <h2 id="titulo-agendamento" className="text-2xl font-black sm:text-3xl">
            Escolha quando quer correr.
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
            {resumoHorarios}. Você envia a solicitação e a equipe confirma o horário com você.
          </p>

          <form action="/agendar" method="get" className="mt-7">
            <SeletorRapido hoje={hoje} diasAbertos={diasAbertos} />

            <button
              type="submit"
              className="botao-acao mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-acelera)] px-8 text-base font-extrabold text-white transition hover:bg-[var(--color-acelera-forte)] sm:w-auto"
            >
              Ver horários disponíveis
              <span aria-hidden="true">→</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
