import Link from "next/link";
import { REGRAS_JUNIOR } from "@napole/core";
import type { HorarioPublicoFormatado } from "@/components/publico/horarios";

/**
 * Fatos da operacao, sem rodeio.
 *
 * Tudo aqui vem da configuracao real da agenda — se a operacao mudar horario,
 * capacidade ou tempo de bateria no painel, esta secao muda junto. Numero
 * publicado que diverge do que vale na pista e o tipo de erro que gera
 * discussao no balcao.
 */
export function InformacoesPista({
  whatsapp,
  horarios,
  duracaoMinutos,
  chegadaAntecedenciaMinutos,
  capacidade,
}: {
  whatsapp: string | null;
  horarios: HorarioPublicoFormatado[];
  duracaoMinutos: number;
  chegadaAntecedenciaMinutos: number;
  capacidade: number;
}) {
  const fatos = [
    ...horarios.map((horario) => ({ rotulo: horario.dias, valor: horario.periodo })),
    { rotulo: "Duração da bateria", valor: `${duracaoMinutos} min` },
    { rotulo: "Chegue antes", valor: `${chegadaAntecedenciaMinutos} min` },
    { rotulo: "Pilotos por bateria", valor: `até ${capacidade}` },
    { rotulo: "Idade mínima", valor: `${REGRAS_JUNIOR.idadeMinima} anos` },
    { rotulo: "Pagamento", valor: "na pista" },
  ];

  return (
    <section
      id="visite"
      aria-labelledby="titulo-visite"
      className="border-t border-white/[0.08] bg-[var(--color-superficie)] py-16 sm:py-20"
    >
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <h2 id="titulo-visite" className="text-2xl font-black tracking-tight sm:text-3xl">
          A pista
        </h2>

        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
          {fatos.map((fato) => (
            <div key={fato.rotulo} className="bg-[var(--color-superficie-elevada)] p-5">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                {fato.rotulo}
              </dt>
              <dd className="mt-2 text-lg font-bold text-white">{fato.valor}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 text-sm text-neutral-400">
          A equipe envia a localização e as orientações ao confirmar sua reserva.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/agendar"
            className="botao-acao inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--color-acelera)] px-7 text-sm font-extrabold text-white transition hover:bg-[var(--color-acelera-forte)]"
          >
            Agendar corrida
          </Link>
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 px-7 text-sm font-bold text-white transition hover:bg-white/[0.06]"
            >
              Falar no WhatsApp
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
