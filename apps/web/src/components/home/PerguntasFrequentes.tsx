export function PerguntasFrequentes({
  chegadaAntecedenciaMinutos,
}: {
  chegadaAntecedenciaMinutos: number;
}) {
  const perguntas = [
  {
    pergunta: "Preciso criar uma conta para reservar?",
    resposta:
      "Não. A solicitação é feita com seus dados de contato e os nomes dos participantes. O cadastro de piloto é tratado no fluxo da pista.",
  },
  {
    pergunta: "O horário fica confirmado na hora?",
    resposta:
      "Não. A equipe confere a disponibilidade e responde pelo contato informado. A reserva só está garantida depois dessa confirmação.",
  },
  {
    pergunta: "Preciso pagar pelo site?",
    resposta:
      "Não há pagamento online nesta etapa. As orientações comerciais são informadas diretamente pela equipe ao confirmar a solicitação.",
  },
  {
    pergunta: "Quanto antes devo chegar?",
    resposta:
      `Chegue ${chegadaAntecedenciaMinutos} minutos antes do horário confirmado para fazer o check-in e receber as orientações da pista.`,
  },
  {
    pergunta: "Posso incluir menores de idade?",
    resposta:
      "Informe isso na solicitação. A equipe verificará os requisitos aplicáveis antes de confirmar a participação.",
  },
] as const;
  return (
    <section aria-labelledby="titulo-faq" className="bg-[var(--color-superficie)] pb-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-acelera-texto)]">
            Dúvidas rápidas
          </p>
          <h2 id="titulo-faq" className="titulo-display mt-4 text-4xl leading-none">
            Antes de acelerar.
          </h2>
        </div>

        <div className="divide-y divide-white/10 border-y border-white/10">
          {perguntas.map((item) => (
            <details key={item.pergunta} className="group py-1">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-4 text-left font-semibold text-white">
                {item.pergunta}
                <span
                  aria-hidden="true"
                  className="grid size-7 shrink-0 place-items-center rounded-full border border-white/15 text-lg font-light transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="max-w-2xl pb-6 pr-10 text-sm leading-6 text-neutral-400">
                {item.resposta}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
