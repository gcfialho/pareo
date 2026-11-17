/**
 * Cotação do dólar (USD → BRL) ao vivo, sem chave de API.
 * Tenta as fontes em ordem e guarda o resultado por 15 minutos.
 * Usa a cotação de COMPRA: é o preço pelo qual o mercado compra os seus dólares.
 * Detalhes: docs/07-cotacao-do-dolar.md
 */
(function (root) {
  'use strict';

  const CACHE_KEY = 'pareo:cotacao';
  const CACHE_MS = 15 * 60 * 1000;
  const TIMEOUT_MS = 6000;

  async function getJSON(url) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(t);
    }
  }

  const pad = (n) => String(n).padStart(2, '0');
  const mdY = (d) => `${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${d.getFullYear()}`;

  const FONTES = [
    {
      nome: 'AwesomeAPI',
      rotulo: 'Dólar comercial, compra',
      descricao: 'dólar comercial, atualizado a cada poucos minutos',
      url: 'https://economia.awesomeapi.com.br/json/last/USD-BRL',
      async buscar() {
        const j = await getJSON(this.url);
        const q = j.USDBRL;
        return { valor: +q.bid, data: new Date(+q.timestamp * 1000), variacao: +q.pctChange / 100 };
      },
    },
    {
      nome: 'Banco Central (PTAX)',
      rotulo: 'PTAX de compra do Banco Central',
      descricao: 'taxa oficial, publicada uma vez por dia útil',
      url: 'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/',
      async buscar() {
        const fim = new Date();
        const ini = new Date(fim.getTime() - 10 * 86400000);
        const u = `${this.url}CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)` +
          `?@dataInicial='${mdY(ini)}'&@dataFinalCotacao='${mdY(fim)}'&$format=json&$select=cotacaoCompra,dataHoraCotacao`;
        const j = await getJSON(u);
        const ult = j.value[j.value.length - 1];
        return { valor: +ult.cotacaoCompra, data: new Date(ult.dataHoraCotacao.replace(' ', 'T').slice(0, 19)) };
      },
    },
    {
      nome: 'Frankfurter (BCE)',
      rotulo: 'Taxa de referência do Banco Central Europeu',
      descricao: 'referência do Banco Central Europeu, uma vez por dia',
      url: 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=BRL',
      async buscar() {
        const j = await getJSON(this.url);
        return { valor: +j.rates.BRL, data: new Date(`${j.date}T12:00:00`), apenasData: true };
      },
    },
  ];

  function lerCache() {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (c && c.valor > 1 && c.valor < 20 && c.rotulo && Date.now() - c.buscadoEm < CACHE_MS) return { ...c, data: new Date(c.data) };
    } catch (_) { /* armazenamento indisponível */ }
    return null;
  }

  function salvarCache(c) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch (_) { /* ignora */ }
  }

  /** Devolve { valor, data, fonte, descricao, variacao? }. Lança erro se todas as fontes falharem. */
  async function buscarCotacao({ ignorarCache = false } = {}) {
    if (!ignorarCache) {
      const c = lerCache();
      if (c) return c;
    }
    const erros = [];
    for (const f of FONTES) {
      try {
        const r = await f.buscar();
        // Faixa de sanidade: protege contra resposta quebrada de uma API
        if (!(r.valor > 1 && r.valor < 20)) throw new Error(`valor fora da faixa: ${r.valor}`);
        const out = { ...r, fonte: f.nome, rotulo: f.rotulo, descricao: f.descricao, buscadoEm: Date.now() };
        salvarCache(out);
        return out;
      } catch (e) {
        erros.push(`${f.nome}: ${e.message}`);
      }
    }
    throw new Error(erros.join(' · '));
  }

  root.PAREO_COTACAO = { buscarCotacao, FONTES };
})(typeof self !== 'undefined' ? self : this);
