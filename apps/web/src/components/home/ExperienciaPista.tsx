const destaques = [
  {
    numero: "01",
    titulo: "Entre para disputar",
    texto: "Escolha sua bateria e chegue pronto para transformar pista em referência de tempo.",
  },
  {
    numero: "02",
    titulo: "Cada milésimo conta",
    texto: "Sua melhor volta vira posição. O ranking mostra exatamente quem está à sua frente.",
  },
  {
    numero: "03",
    titulo: "Volte para evoluir",
    texto: "Acompanhe seu histórico, ataque seu próprio recorde e encontre o próximo alvo.",
  },
] as const;

export function ExperienciaPista() {
  return (
    <section id="experiencia" aria-labelledby="titulo-experiencia" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-end gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-acelera-texto)]">
              Mais do que uma volta
            </p>
            <h2
              id="titulo-experiencia"
              className="titulo-display mt-4 text-4xl leading-[0.95] sm:text-6xl"
            >
              A pista termina. A disputa continua.
            </h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-neutral-400 lg:justify-self-end">
            O Racing Club conecta sua experiência na pista ao histórico que fica depois da
            bandeirada: tempo, posição, evolução e o próximo piloto a alcançar.
          </p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-3">
          {destaques.map((destaque) => (
            <article
              key={destaque.numero}
              className="relative min-h-64 overflow-hidden bg-[var(--color-superficie)] p-7 sm:p-8"
            >
              <span
                aria-hidden="true"
                className="absolute -bottom-10 -right-8 size-40 rounded-full border-[18px] border-white/[0.045]"
              />
              <span className="font-mono text-xs font-bold text-[var(--color-acelera-texto)]">
                {destaque.numero}
              </span>
              <h3 className="mt-16 text-xl font-bold tracking-tight">{destaque.titulo}</h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-neutral-400">{destaque.texto}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
