/**
 * Perguntas que a equipe responde todo dia no WhatsApp.
 *
 * Ficaram so as que "Como reservar" e "A pista" nao respondem — repetir o que
 * ja esta acima transforma a pagina em ruido e faz o visitante parar de ler.
 */
export function PerguntasFrequentes() {
  const perguntas = [
    {
      pergunta: "Preciso de conta para reservar?",
      resposta:
        "Não. Basta informar seu contato e o nome de quem vai correr. O cadastro de piloto é feito na pista, no dia.",
    },
    {
      pergunta: "Nunca andei de kart. Posso ir?",
      resposta:
        "Pode. A equipe passa as orientações de segurança antes da bateria e a pista é indoor, com kart de aluguel.",
    },
    {
      pergunta: "Preciso levar equipamento?",
      resposta:
        "Não. Capacete e balaclava são fornecidos. Use calçado fechado e roupa confortável.",
    },
    {
      pergunta: "Posso levar menores de idade?",
      resposta:
        "Sim, a partir de 14 anos, com autorização e contato do responsável. Informe isso na solicitação.",
    },
    {
      pergunta: "Como funciona o ranking?",
      resposta:
        "Sua melhor volta entra no ranking da sua categoria, definida por peso. Você acompanha sua posição pelo site depois que a equipe registrar seu tempo.",
    },
  ] as const;

  return (
    <section aria-labelledby="titulo-faq" className="bg-[var(--color-superficie)] pb-20">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <h2 id="titulo-faq" className="text-2xl font-black tracking-tight sm:text-3xl">
          Dúvidas frequentes
        </h2>

        <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
          {perguntas.map((item) => (
            <details key={item.pergunta} className="group">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-4 text-left font-semibold text-white">
                {item.pergunta}
                <span
                  aria-hidden="true"
                  className="grid size-7 shrink-0 place-items-center rounded-full border border-white/15 text-lg font-light transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="max-w-2xl pb-5 pr-10 text-sm leading-6 text-neutral-400">
                {item.resposta}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
