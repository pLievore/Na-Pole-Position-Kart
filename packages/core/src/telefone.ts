/**
 * Telefone brasileiro: guardado so em digitos, exibido com mascara.
 *
 * Mesma logica de borda do tempo de volta — o banco e a validacao recebem o
 * valor cru (`digitosTelefone`), a tela mostra o valor formatado
 * (`formatarTelefone`). A mascara e aplicada enquanto a pessoa digita, entao
 * ela precisa aceitar valor incompleto sem "brigar" com o cursor.
 */

/** Quantidade de digitos aceita: 10 (fixo) ou 11 (celular com o 9). */
export const TELEFONE_DIGITOS_MINIMO = 10;
export const TELEFONE_DIGITOS_MAXIMO = 11;

/** Remove tudo que nao for digito e corta no maximo aceito. */
export function digitosTelefone(valor: string): string {
  return valor.replace(/\D/g, "").slice(0, TELEFONE_DIGITOS_MAXIMO);
}

/**
 * Aplica a mascara "(11) 99999-0000" — ou "(11) 9999-0000" no fixo.
 *
 * Formata tambem o valor parcial, para servir de mascara de digitacao: o
 * separador so aparece depois que a pessoa digitou o digito que o justifica,
 * senao apagar o ultimo caractere reinseriria a pontuacao e travaria o campo.
 */
export function formatarTelefone(valor: string): string {
  const digitos = digitosTelefone(valor);
  if (digitos.length === 0) return "";
  if (digitos.length <= 2) return `(${digitos}`;

  const ddd = digitos.slice(0, 2);
  const assinante = digitos.slice(2);
  if (assinante.length <= 4) return `(${ddd}) ${assinante}`;

  // Ate 8 digitos e fixo (4+4); acima disso e celular (5+4).
  const corte = assinante.length <= 8 ? 4 : 5;
  return `(${ddd}) ${assinante.slice(0, corte)}-${assinante.slice(corte)}`;
}

/** true quando o valor tem DDD e numero completos. */
export function telefoneCompleto(valor: string): boolean {
  const digitos = digitosTelefone(valor);
  return digitos.length >= TELEFONE_DIGITOS_MINIMO;
}
