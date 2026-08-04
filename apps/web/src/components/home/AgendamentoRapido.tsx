import { dataOperacionalISO } from "@napole/core";

export function AgendamentoRapido() {
  const hoje = dataOperacionalISO(new Date());
  return (
    <section id="agendamento" aria-labelledby="titulo-agendamento" className="relative z-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="cartao-vitrine -mt-8 grid overflow-hidden rounded-3xl bg-[var(--color-superficie-elevada)] shadow-[var(--sombra-elevada)] lg:grid-cols-[0.85fr_1.45fr]">
          <div className="border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-acelera-texto)]">
              Próxima bateria
            </p>
            <h2
              id="titulo-agendamento"
              className="texto-equilibrado mt-3 text-2xl font-black sm:text-3xl"
            >
              Escolha quando quer correr.
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-400">
              Você envia a solicitação sem criar conta. A equipe confere a agenda e confirma o
              horário com você.
            </p>
          </div>

          <form
            action="/agendar"
            method="get"
            className="grid items-end gap-4 p-6 sm:grid-cols-[1fr_0.7fr_auto] sm:p-8"
          >
            <div className="grid gap-2">
              <label htmlFor="agendamento-data" className="text-sm font-semibold text-neutral-200">
                Data da corrida
              </label>
              <input
                id="agendamento-data"
                name="data"
                type="date"
                min={hoje}
                required
                className="min-h-12 rounded-xl border border-white/15 bg-black/25 px-4 text-base text-white accent-[var(--color-acelera)]"
              />
            </div>
            <div className="grid gap-2">
              <label
                htmlFor="agendamento-quantidade"
                className="text-sm font-semibold text-neutral-200"
              >
                Participantes
              </label>
              <select
                id="agendamento-quantidade"
                name="quantidade"
                defaultValue="1"
                className="min-h-12 rounded-xl border border-white/15 bg-black/25 px-4 text-base text-white"
              >
                {Array.from({ length: 10 }, (_, indice) => indice + 1).map((quantidade) => (
                  <option key={quantidade} value={quantidade}>
                    {quantidade}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="botao-acao inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--color-acelera)] px-6 text-sm font-extrabold text-white transition hover:bg-[var(--color-acelera-forte)]"
            >
              Ver horários
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
