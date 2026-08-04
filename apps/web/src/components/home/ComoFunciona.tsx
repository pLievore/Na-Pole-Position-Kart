export function ComoFunciona({
  chegadaAntecedenciaMinutos,
  duracaoMinutos,
}: {
  chegadaAntecedenciaMinutos: number;
  duracaoMinutos: number;
}) {
  const passos = [
  {
    numero: "1",
    titulo: "Escolha data e horário",
    texto: "Veja os horários disponíveis e envie a opção que funciona para o seu grupo.",
  },
  {
    numero: "2",
    titulo: "Aguarde a confirmação",
    texto: "A reserva só fica garantida depois do retorno da equipe pelo contato informado.",
  },
  {
    numero: "3",
    titulo: `Chegue ${chegadaAntecedenciaMinutos} minutos antes`,
    texto: `Esse tempo é reservado para check-in e orientações antes da bateria de ${duracaoMinutos} minutos.`,
  },
] as const;
  return (
    <section
      id="como-funciona"
      aria-labelledby="titulo-como-funciona"
      className="border-y border-white/[0.08] bg-white/[0.025] py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-acelera-texto)]">
              Simples e direto
            </p>
            <h2
              id="titulo-como-funciona"
              className="titulo-display mt-4 text-4xl leading-none sm:text-5xl"
            >
              Da agenda para a pista.
            </h2>
          </div>
          <p className="text-sm text-neutral-500">Sem pagamento online nesta etapa.</p>
        </div>

        <ol className="mt-12 grid gap-8 md:grid-cols-3 md:gap-0">
          {passos.map((passo, indice) => (
            <li
              key={passo.numero}
              className={
                "relative pr-8 " + (indice > 0 ? "md:border-l md:border-white/10 md:pl-8" : "")
              }
            >
              <span className="grid size-10 place-items-center rounded-full border border-[var(--color-acelera)]/50 bg-[var(--color-acelera)]/10 font-mono text-sm font-bold text-red-300">
                {passo.numero.padStart(2, "0")}
              </span>
              <h3 className="mt-5 text-lg font-bold">{passo.titulo}</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-400">{passo.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
