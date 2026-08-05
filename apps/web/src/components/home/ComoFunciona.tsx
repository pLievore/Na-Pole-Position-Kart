/**
 * Como reservar, em tres passos.
 *
 * Cada passo responde uma duvida pratica: o que fazer, o que esperar depois e o
 * que acontece no dia. Sem frase de efeito — quem chega aqui ja decidiu olhar a
 * agenda e so precisa saber como funciona.
 */
export function ComoFunciona({
  chegadaAntecedenciaMinutos,
  duracaoMinutos,
}: {
  chegadaAntecedenciaMinutos: number;
  duracaoMinutos: number;
}) {
  const passos = [
    {
      titulo: "Escolha o horário",
      texto: "Veja as baterias com vaga na data que você quer e envie a solicitação.",
    },
    {
      titulo: "Aguarde a confirmação",
      texto:
        "A equipe responde pelo WhatsApp ou e-mail que você informar. A vaga fica reservada até lá.",
    },
    {
      titulo: `Chegue ${chegadaAntecedenciaMinutos} minutos antes`,
      texto: `Tempo do check-in e das orientações de segurança. A bateria dura ${duracaoMinutos} minutos.`,
    },
  ] as const;

  return (
    <section
      id="como-funciona"
      aria-labelledby="titulo-como-funciona"
      className="border-y border-white/[0.08] bg-white/[0.02] py-16 sm:py-20"
    >
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <h2 id="titulo-como-funciona" className="text-2xl font-black tracking-tight sm:text-3xl">
          Como reservar
        </h2>

        <ol className="mt-8 grid gap-6 sm:grid-cols-3 sm:gap-8">
          {passos.map((passo, indice) => (
            <li key={passo.titulo} className="flex gap-4 sm:block">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--color-acelera)] font-mono text-sm font-black text-white">
                {indice + 1}
              </span>
              <div className="sm:mt-4">
                <h3 className="font-bold text-white">{passo.titulo}</h3>
                <p className="mt-1.5 text-sm leading-6 text-neutral-400">{passo.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
