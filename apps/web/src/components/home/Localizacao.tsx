import { ENDERECO } from "@/lib/endereco";

/**
 * Onde fica a pista.
 *
 * O mapa e um iframe do Google carregado sob demanda (`loading="lazy"`): ele so
 * baixa quando entra na tela, entao nao pesa no carregamento inicial da home
 * nem contata o Google para quem nunca rola ate aqui.
 */
export function Localizacao() {
  const consulta = encodeURIComponent(ENDERECO.busca);

  return (
    <section
      id="onde-estamos"
      aria-labelledby="titulo-onde-estamos"
      className="border-t border-white/[0.08] py-16 sm:py-20"
    >
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <h2 id="titulo-onde-estamos" className="text-2xl font-black tracking-tight sm:text-3xl">
          Onde estamos
        </h2>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <address className="not-italic text-base leading-7 text-neutral-300">
              {ENDERECO.rua}
              <br />
              {ENDERECO.bairro}
              <br />
              {ENDERECO.cidadeEstado} — CEP {ENDERECO.cep}
            </address>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${consulta}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 px-6 text-sm font-bold text-white transition hover:bg-white/[0.06]"
            >
              Abrir rota no Google Maps
            </a>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10">
            <iframe
              title={`Mapa com a localização da Na Pole Position: ${ENDERECO.busca}`}
              src={`https://www.google.com/maps?q=${consulta}&hl=pt-BR&z=16&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-72 w-full border-0 lg:h-full lg:min-h-72"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
