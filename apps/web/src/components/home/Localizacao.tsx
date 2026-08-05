import { ENDERECO } from "@/lib/endereco";

/**
 * Onde fica a pista — fecha a pagina inicial.
 *
 * E a ultima duvida de quem decidiu vir, entao encerra a leitura em vez de
 * interromper. O mapa ocupa a largura toda porque, num mapa, tamanho e
 * legibilidade: em faixa estreita nao da para reconhecer as ruas em volta.
 *
 * O iframe carrega sob demanda (`loading="lazy"`): so baixa quando entra na
 * tela, entao nao pesa no carregamento inicial nem contata o Google para quem
 * nunca rola ate aqui.
 */
export function Localizacao() {
  const consulta = encodeURIComponent(ENDERECO.busca);

  return (
    <section
      id="onde-estamos"
      aria-labelledby="titulo-onde-estamos"
      className="border-t border-white/[0.08] bg-[var(--color-superficie)] py-16 sm:py-20"
    >
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div>
            <h2 id="titulo-onde-estamos" className="text-2xl font-black tracking-tight sm:text-3xl">
              Onde estamos
            </h2>
            <address className="mt-3 not-italic text-base leading-7 text-neutral-300">
              {ENDERECO.rua} — {ENDERECO.bairro}
              <br />
              {ENDERECO.cidadeEstado}, CEP {ENDERECO.cep}
            </address>
          </div>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${consulta}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 px-6 text-sm font-bold text-white transition hover:bg-white/[0.06]"
          >
            Abrir rota no Google Maps
          </a>
        </div>

        <div className="mt-7 overflow-hidden rounded-2xl border border-white/10">
          <iframe
            title={`Mapa com a localização da Na Pole Position: ${ENDERECO.busca}`}
            src={`https://www.google.com/maps?q=${consulta}&hl=pt-BR&z=16&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block h-[24rem] w-full border-0 sm:h-[32rem]"
          />
        </div>
      </div>
    </section>
  );
}
