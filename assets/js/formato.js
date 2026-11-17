/**
 * Leitura e escrita de números no formato brasileiro.
 * Os campos da página são de texto: "12.000", "12.000,50", "5,7744" e "0,38" precisam virar número.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PAREO_FORMATO = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Converte o texto digitado em número.
   * @param {string} texto
   * @param {{ milhar?: boolean }} [opcoes] milhar: aceita ponto como separador de milhar ("12.000").
   *   Use false em campos com casas decimais curtas, como cotação ("5.78") e percentuais ("0.38").
   * @returns {number|null|undefined} número; null se vazio; undefined se inválido.
   */
  function lerNumero(texto, { milhar = true } = {}) {
    let t = String(texto ?? '').replace(/R\$|US\$|%|\s/g, '');
    if (t === '') return null;
    if (!/^[\d.,]+$/.test(t)) return undefined; // letras, sinal de menos etc.
    if (t.includes(',')) {
      // Vírgula é o decimal; pontos são milhar
      if ((t.match(/,/g) || []).length > 1) return undefined;
      t = t.replace(/\./g, '').replace(',', '.');
    } else if (milhar && /^\d{1,3}(\.\d{3})+$/.test(t)) {
      t = t.replace(/\./g, ''); // "12.000" → 12000
    } else if ((t.match(/\./g) || []).length > 1) {
      return undefined;
    }
    const n = Number(t);
    return Number.isFinite(n) ? n : undefined;
  }

  /**
   * Escreve um número para exibir num campo: "12.000", "12.000,50", "5,7744", "0,38".
   * @param {number} n
   * @param {number} [casas] máximo de casas decimais.
   * @param {boolean} [centavos] valores em dinheiro: se houver decimais, mostra sempre duas.
   */
  function escreverNumero(n, casas = 2, centavos = false) {
    if (n === '' || n == null || !Number.isFinite(+n)) return '';
    const minimo = centavos && !Number.isInteger(+n) ? 2 : 0;
    return (+n).toLocaleString('pt-BR', { minimumFractionDigits: minimo, maximumFractionDigits: Math.max(casas, minimo), useGrouping: true });
  }

  return { lerNumero, escreverNumero };
});
