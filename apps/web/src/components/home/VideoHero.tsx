"use client";

import { useEffect, useRef } from "react";

/**
 * Video de fundo do hero.
 *
 * Precisa ser componente de cliente por causa do autoplay no celular:
 *
 * 1. O React trata `muted` como propriedade, nao como atributo — no HTML vindo
 *    do servidor ele pode nao aparecer, e iOS e Android so liberam autoplay em
 *    video comprovadamente mudo. Forcamos `muted` no elemento antes de tocar.
 * 2. `play()` devolve uma promessa que os navegadores rejeitam em varias
 *    situacoes (economia de bateria, dados moveis). Sem tratar, a rejeicao vira
 *    erro nao capturado no console; com o tratamento, a pagina simplesmente
 *    fica com o poster, que ja esta atras.
 * 3. `preload="metadata"` atrasava o primeiro quadro o suficiente para alguns
 *    navegadores desistirem do autoplay; "auto" deixa o video pronto.
 */
export function VideoHero({ srcMobile, srcDesktop }: { srcMobile: string; srcDesktop: string }) {
  const referencia = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = referencia.current;
    if (!video) return;

    // Respeita quem pediu menos movimento: nesse caso o poster basta.
    const movimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (movimentoReduzido.matches) return;

    video.muted = true;
    video.defaultMuted = true;

    const tocar = () => {
      const promessa = video.play();
      if (promessa) promessa.catch(() => {});
    };

    tocar();

    // Alguns navegadores so aceitam depois que ha dados suficientes.
    video.addEventListener("loadeddata", tocar);
    // Voltar para a aba costuma pausar o video; retomar evita hero congelado.
    const aoVoltar = () => {
      if (document.visibilityState === "visible") tocar();
    };
    document.addEventListener("visibilitychange", aoVoltar);

    return () => {
      video.removeEventListener("loadeddata", tocar);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, []);

  return (
    <video
      ref={referencia}
      className="hero-video"
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      tabIndex={-1}
      aria-hidden="true"
    >
      <source src={srcMobile} type="video/mp4" media="(max-width: 767px)" />
      <source src={srcDesktop} type="video/mp4" media="(min-width: 768px)" />
    </video>
  );
}
