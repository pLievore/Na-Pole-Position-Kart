import Image from "next/image";
import pizza from "../../../public/images/pizza-forno.png";

/**
 * A pizzaria da casa.
 *
 * Fica logo depois de "A pista" porque responde a pergunta que vem naturalmente
 * depois de escolher o horario: o que fazer quando a bateria acabar. Tambem e o
 * argumento para o grupo ficar mais tempo — e para quem nao vai correr aceitar
 * o convite.
 */
export function Pizzaria() {
  return (
    <section
      id="pizzaria"
      aria-labelledby="titulo-pizzaria"
      className="border-t border-white/[0.08] bg-white/[0.02] py-16 sm:py-20"
    >
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="order-2 lg:order-1">
            <h2 id="titulo-pizzaria" className="text-2xl font-black tracking-tight sm:text-3xl">
              A melhor pizza da cidade
            </h2>
            <p className="mt-4 text-base leading-7 text-neutral-300">
              A pizzaria funciona no mesmo endereço da pista. Corra sua bateria e sente à mesa
              logo em seguida — sem sair do lugar, sem marcar outro horário.
            </p>
            <p className="mt-3 text-sm leading-6 text-neutral-400">
              Quem veio junto e não vai correr também tem o que fazer enquanto espera.
            </p>
          </div>

          <div className="order-1 overflow-hidden rounded-2xl border border-white/10 lg:order-2">
            <Image
              src={pizza}
              alt="Pizza assada em forno a lenha, com muçarela derretida e folhas de manjericão, sobre tábua de madeira"
              sizes="(max-width: 1024px) 100vw, 34rem"
              placeholder="blur"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
