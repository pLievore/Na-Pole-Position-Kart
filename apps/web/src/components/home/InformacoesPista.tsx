import Link from "next/link";
import type { HorarioPublicoFormatado } from "@/components/publico/horarios";

export function InformacoesPista({
  whatsapp,
  horarios,
  duracaoMinutos,
  chegadaAntecedenciaMinutos,
}: {
  whatsapp: string | null;
  horarios: HorarioPublicoFormatado[];
  duracaoMinutos: number;
  chegadaAntecedenciaMinutos: number;
}) {
  return (
    <section
      id="visite"
      aria-labelledby="titulo-visite"
      className="border-t border-white/[0.08] bg-[var(--color-superficie)] py-24"
    >
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-acelera-texto)]">
            Antes de vir
          </p>
          <h2 id="titulo-visite" className="titulo-display mt-4 text-4xl leading-none sm:text-5xl">
            Prepare-se para a próxima volta.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-neutral-400">
            A equipe envia a localização e as orientações de chegada quando confirmar sua
            solicitação. Programe-se para estar na pista {chegadaAntecedenciaMinutos} minutos antes.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/agendar"
              className="botao-acao inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--color-acelera)] px-6 text-sm font-extrabold text-white transition hover:bg-[var(--color-acelera-forte)]"
            >
              Agendar corrida
            </Link>
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 px-6 text-sm font-bold text-white transition hover:bg-white/[0.06]"
              >
                Tirar dúvida no WhatsApp
              </a>
            )}
          </div>
        </div>

        <div className="cartao-vitrine overflow-hidden rounded-3xl">
          <div className="grid gap-px bg-white/10 sm:grid-cols-2">
            {horarios.map((horario) => (
              <Informacao key={`${horario.dias}-${horario.periodo}`} rotulo={horario.dias} valor={horario.periodo} />
            ))}
            <Informacao rotulo="Tempo de pista" valor={`${duracaoMinutos} minutos`} />
            <Informacao
              rotulo="Chegada recomendada"
              valor={`${chegadaAntecedenciaMinutos} min antes`}
            />
          </div>
          <div className="linha-pista h-1.5 opacity-40" />
        </div>
      </div>
    </section>
  );
}

function Informacao({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="bg-[var(--color-superficie-elevada)] p-6 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">{rotulo}</p>
      <p className="mt-3 font-mono text-xl font-bold tracking-tight text-white">{valor}</p>
    </div>
  );
}
