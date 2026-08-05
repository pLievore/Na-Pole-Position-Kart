/**
 * Endereco da pista, num lugar so.
 *
 * Aparece no mapa, no rodape e na secao "Onde estamos". Repetir a string em
 * cada lugar garantiria que um dia eles ficassem diferentes entre si.
 */
export const ENDERECO = {
  rua: "Av. Monteiro Lobato, 2350",
  bairro: "Jardim Carvalho",
  cidade: "Ponta Grossa",
  estado: "PR",
  cep: "84016-210",

  /** Como a cidade aparece na tela. */
  get cidadeEstado() {
    return `${this.cidade} — ${this.estado}`;
  },

  /**
   * Como o endereco vai para o Google Maps.
   *
   * Separado do texto de exibicao de proposito: o travessao usado na tela
   * atrapalha a geocodificacao, que espera a pontuacao comum de endereco.
   */
  get busca() {
    return `${this.rua} - ${this.bairro}, ${this.cidade} - ${this.estado}, ${this.cep}`;
  },
} as const;
