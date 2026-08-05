import Link from "next/link";
import { getImageProps } from "next/image";
import { VideoHero } from "./VideoHero";
import posterDesktop from "../../../public/images/hero-kart-poster.png";
import posterMobile from "../../../public/images/hero-kart-poster-mobile.png";

export function HeroPrincipal() {
  const { props: imagemDesktop } = getImageProps({
    src: posterDesktop,
    alt: "",
    priority: true,
    sizes: "100vw",
  });
  const { props: imagemMobile } = getImageProps({
    src: posterMobile,
    alt: "",
    priority: true,
    sizes: "100vw",
  });

  return (
    <section className="relative isolate flex min-h-[calc(100svh-4.5rem)] items-stretch overflow-hidden border-b border-white/[0.08] sm:items-center">
      <div className="hero-poster" aria-hidden="true">
        <picture>
          <source media="(max-width: 767px)" srcSet={imagemMobile.srcSet} sizes="100vw" />
          <source media="(min-width: 768px)" srcSet={imagemDesktop.srcSet} sizes="100vw" />
          <img
            {...imagemDesktop}
            srcSet={undefined}
            sizes={undefined}
            alt=""
            className="hero-imagem"
          />
        </picture>
        <VideoHero
          srcMobile="/videos/hero-kart-mobile-fb0b95e7.mp4"
          srcDesktop="/videos/hero-kart-desktop-b23732da.mp4"
        />
        {/* A imagem continua por baixo para carregamento, falha de autoplay e movimento reduzido. */}
        <span className="hero-grade" />
      </div>

      {/*
        No celular o conteudo ocupa a altura toda e se divide: titulo no topo,
        botoes no rodape, e o espaco que sobra no meio deixa o video aparecer.
        A partir de sm o bloco volta a ser um so, centralizado verticalmente,
        com folga maior embaixo para levantar o texto.
      */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-5 pb-10 pt-12 sm:block sm:px-8 sm:pb-40 sm:pt-20 lg:pb-52 lg:pt-24">
        <div className="max-w-3xl">
          <h1 className="titulo-display text-[clamp(3.25rem,8vw,7.6rem)] leading-[0.88] text-white">
            Na Pole Position{" "}
            <span className="text-[var(--color-acelera)]">Racing Club</span>
          </h1>
          <p className="mt-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.24em] text-neutral-300">
            <span aria-hidden="true" className="h-px w-10 bg-[var(--color-acelera)]" />
            Kart indoor
          </p>
          <p className="mt-6 max-w-2xl text-base leading-7 text-neutral-300 sm:text-lg sm:leading-8">
            Reserve seu horário, corra e acompanhe seus tempos no ranking oficial da pista.
          </p>
        </div>

        {/* `mt-auto` empurra os botoes para o rodape no celular; em sm nao ha
            espaco livre para distribuir e a margem fixa assume. */}
        <div className="mt-auto flex max-w-3xl flex-col gap-3 pt-10 sm:mt-0 sm:flex-row sm:pt-8">
          <Link
            href="/agendar"
            className="botao-acao inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-acelera)] px-6 text-sm font-extrabold text-white transition hover:bg-[var(--color-acelera-forte)]"
          >
            Agendar corrida
            <SetaDireita />
          </Link>
          <Link
            href="/ranking"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-black/20 px-6 text-sm font-bold text-white backdrop-blur-sm transition hover:border-white/35 hover:bg-white/10"
          >
            Ver ranking
          </Link>
        </div>
      </div>
    </section>
  );
}

function SetaDireita() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none">
      <path d="M4 10h12m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}
