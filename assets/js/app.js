/**
 * Interface da calculadora.
 * A página tem três camadas: 1) a resposta, 2) entender e testar cenários, 3) o cálculo completo (recolhido).
 * Três modos mudam a pergunta: Só CLT, Quanto faturar como PJ e Comparar CLT e PJ.
 * Depende de params.js, calc.js, cotacao.js e formato.js, carregados antes como globais PAREO_*.
 */
(function () {
  'use strict';
  const C = window.PAREO_CALC;
  const Q = window.PAREO_COTACAO;
  const F = window.PAREO_FORMATO;
  const P = C.params;
  const STORAGE_KEY = 'pareo:v1';
  const COTACAO_PADRAO = 5.5; // usada só se nenhuma fonte responder

  const MODOS = {
    clt: { descricao: 'Quanto o salário e os benefícios valem de verdade, contando 13º, férias e FGTS.' },
    meta: { descricao: 'Quanto você precisa faturar como PJ para empatar com uma proposta CLT.' },
    comparar: { descricao: 'Uma proposta CLT e uma PJ lado a lado: qual rende mais no ano.' },
  };

  /* ───────────── Campos (valores de exemplo: um dev pleno, números redondos) ───────────── */
  const FIELDS = {
    clt: [
      { id: 'salario', label: 'Salário bruto por mês', def: 12000, prefix: 'R$', span: 2 },
      { id: 'vr', label: 'VR e VA por mês', def: 1000, prefix: 'R$' },
      { id: 'saude', label: 'Plano de saúde pago pela empresa', def: 400, prefix: 'R$' },
    ],
    cltAdv: [
      { id: 'dependentes', label: 'Dependentes no IR', def: 0, inteiro: true, hint: 'Vale também para o pró-labore do PJ.' },
      { id: 'outrosBeneficios', label: 'Outros benefícios por mês', def: 0, prefix: 'R$', hint: 'Home office, Gympass, previdência.' },
      { id: 'descontos', label: 'Descontos em folha por mês', def: 0, prefix: 'R$', hint: 'Coparticipação, parte do VR.' },
      { id: 'plrAnual', label: 'PLR ou bônus líquido no ano', def: 0, prefix: 'R$' },
      { id: 'multaFgts', label: 'Contar a multa de 40% do FGTS', hint: 'Só se você espera ser demitido sem justa causa.', def: false, type: 'checkbox', span: 2 },
    ],
    pj: [
      { id: 'moeda', label: 'Moeda do contrato', def: 'USD', type: 'select', options: [['USD', 'Dólar (US$)'], ['BRL', 'Real (R$)']] },
      { id: 'cotacao', label: 'Cotação do dólar', def: COTACAO_PADRAO, prefix: 'R$', casas: 4, milhar: false, showIf: (v) => v.moeda === 'USD' },
      { id: 'cotacaoStatus', type: 'slot', span: 2, showIf: (v) => v.moeda === 'USD' },
      { id: 'faturamento', label: 'Faturamento por mês', def: 3500, prefixFn: (v) => (v.moeda === 'USD' ? 'US$' : 'R$'), span: 2, showIf: (v) => v.modo !== 'meta' },
      { id: 'mesesAtivos', label: 'Férias no contrato PJ', def: '12', type: 'select', span: 2, hint: 'No CLT você recebe 12 salários, o 13º e mais 1/3 de férias.', options: [['12', 'Pagas: recebo 12 meses no ano'], ['11', 'Não pagas: recebo 11 meses e folgo 1'], ['10', 'Recebo 10 meses: folgas ou intervalo entre contratos']] },
      { id: 'custosPessoais', label: 'Gastos a mais por conta própria', def: 0, prefix: 'R$', span: 2, hint: 'Quanto um plano de saúde individual e outros benefícios custariam além do que a empresa CLT paga, por mês.' },
      { id: 'exportacao', label: 'Cliente no exterior', hint: 'Exportação de serviço: o DAS fica sem PIS, COFINS e ISS.', def: true, type: 'checkbox', span: 2 },
    ],
    pjAdv: [
      { id: 'regime', label: 'Pró-labore e anexo do Simples', def: 'auto', type: 'select', span: 2, hint: 'O anexo sai do Fator R: com pró-labore de 28% ou mais do faturamento, Anexo III; abaixo disso, Anexo V.', options: [['auto', 'Automático: o que render mais'], ['III', 'Pró-labore de 28%, para ficar no Anexo III'], ['V', 'Pró-labore de um salário mínimo']] },
      { id: 'taxaCambio', label: 'Taxa da plataforma de câmbio', def: 1, suffix: '%', casas: 2, milhar: false, showIf: (v) => v.moeda === 'USD', hint: 'Spread e tarifa da Wise, Husky, banco.' },
      { id: 'iof', label: 'IOF no câmbio', def: 0.38, suffix: '%', casas: 2, milhar: false, showIf: (v) => v.moeda === 'USD', hint: 'Pode ser 0% se o câmbio for registrado como exportação.' },
      { id: 'contabilidade', label: 'Contabilidade por mês', def: 200, prefix: 'R$' },
      { id: 'outrosCustos', label: 'Outros custos da empresa por mês', def: 0, prefix: 'R$', hint: 'Certificado digital, taxas da prefeitura.' },
      { id: 'abertura', label: 'Custo de abertura da empresa', def: 1000, prefix: 'R$', hint: 'Pago uma vez. Entra só no 1º ano.' },
      { id: 'fatorR', label: 'Fator R desejado', def: 28, suffix: '%', casas: 1, milhar: false, max: 100, hint: 'Entre 28% e 100%. O mínimo para o Anexo III é 28%.' },
      { id: 'proLaboreManual', label: 'Pró-labore fixo', def: '', prefix: 'R$', hint: 'Em branco: calculado pelo regime.' },
      { id: 'retencaoDividendos', label: 'Reter 10% do lucro acima de R$ 50 mil por mês', hint: 'Entendimento da Receita Federal para o Simples, em discussão no STF.', def: true, type: 'checkbox', span: 2 },
    ],
  };
  const ALL = Object.values(FIELDS).flat().filter((f) => f.type !== 'slot');

  /* ───────────── Formatação ───────────── */
  const fmtBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  const fmtBRLc = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtCot = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 4 });
  const fmtUSD = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const brl = (x) => fmtBRL.format(x || 0);
  const brlc = (x) => fmtBRLc.format(x || 0);
  const pct = (x, d = 1) => `${(x * 100).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })}%`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const NA = '<span aria-hidden="true" class="text-ink-subtle">—</span><span class="sr-only">não se aplica</span>';
  const moedaFmt = (usd) => (v) => (usd ? fmtUSD.format(v) : brl(v));
  const rotuloMeses = (m) => (m === 12 ? 'com férias pagas (12 meses)' : m === 11 ? 'sem férias pagas (11 meses)' : `recebendo ${m} meses`);

  /* ───────────── Estado ───────────── */
  const modoDoLink = () => (MODOS[location.hash.slice(1)] ? location.hash.slice(1) : null);
  const defaults = () => ({ ...Object.fromEntries(ALL.map((f) => [f.id, f.def])), cotacaoManual: false, modo: 'meta', aba: '' });
  /** Aceita do armazenamento só valores válidos para cada campo; o resto volta ao padrão. */
  function sanitizar(salvo) {
    const v = defaults();
    if (!salvo || typeof salvo !== 'object') return v;
    for (const f of ALL) {
      if (!(f.id in salvo)) continue;
      const x = salvo[f.id];
      if (f.type === 'checkbox') { if (typeof x === 'boolean') v[f.id] = x; }
      else if (f.type === 'select') { if (f.options.some(([o]) => o === String(x))) v[f.id] = String(x); }
      else if (x === '' && f.def === '') v[f.id] = '';
      else if (typeof x === 'number' && Number.isFinite(x) && x >= 0 && (f.max == null || x <= f.max)) v[f.id] = x;
    }
    if (typeof salvo.cotacaoManual === 'boolean') v.cotacaoManual = salvo.cotacaoManual;
    if (MODOS[salvo.modo]) v.modo = salvo.modo;
    if (typeof salvo.aba === 'string') v.aba = salvo.aba;
    return v;
  }

  function load() {
    let salvo = null;
    try { salvo = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (_) { /* armazenamento indisponível ou corrompido */ }
    const v = sanitizar(salvo);
    if (modoDoLink()) v.modo = modoDoLink(); // o link (#clt, #meta, #comparar) vence o que foi salvo
    return v;
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(values)); } catch (_) { /* ignora */ }
  }

  let values = load();
  let cotacaoAoVivo = { status: 'idle', dados: null };

  /* ───────────── Formulário ───────────── */
  function fieldHTML(f) {
    const span = f.span === 2 ? 'col-span-2' : '';
    const id = `f-${f.id}`;
    const hintId = f.hint ? `${id}-hint` : '';
    const hint = f.hint ? `<span id="${hintId}" class="field-hint">${esc(f.hint)}</span>` : '';
    const desc = hintId ? `aria-describedby="${hintId}"` : '';

    if (f.type === 'slot') return `<div class="${span}" data-wrap="${f.id}" id="${id}" role="status"></div>`;
    if (f.type === 'checkbox') {
      return `<div class="${span} rounded-lg bg-surface-sunken px-3 py-2.5" data-wrap="${f.id}">
        <label class="flex cursor-pointer items-start gap-2.5 text-sm font-medium text-ink">
          <input id="${id}" name="${f.id}" type="checkbox" ${desc} class="mt-0.5 h-4 w-4 shrink-0 accent-[#0f172a]" />
          <span>${esc(f.label)}</span></label>
        ${f.hint ? `<span id="${hintId}" class="field-hint ml-[26px]">${esc(f.hint)}</span>` : ''}</div>`;
    }
    if (f.type === 'select') {
      const opts = f.options.map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join('');
      return `<div class="${span}" data-wrap="${f.id}"><label for="${id}" class="field-label">${esc(f.label)}</label>
        <select id="${id}" name="${f.id}" ${desc} class="field-input">${opts}</select>${hint}</div>`;
    }
    // Campos numéricos são de texto, para aceitar "12.000" e "5,78" do jeito brasileiro
    const hasPre = f.prefix || f.prefixFn;
    const pre = hasPre ? `<span class="affix left-3" data-prefix="${f.id}" aria-hidden="true">${f.prefix || ''}</span>` : '';
    const suf = f.suffix ? `<span class="affix right-3" aria-hidden="true">${f.suffix}</span>` : '';
    const erroId = `${id}-erro`;
    const descNum = `aria-describedby="${[hintId, erroId].filter(Boolean).join(' ')}"`;
    return `<div class="${span} flex flex-col" data-wrap="${f.id}"><label for="${id}" class="field-label">${esc(f.label)}${f.suffix ? ` <span class="sr-only">(${f.suffix === '%' ? 'percentual' : f.suffix})</span>` : ''}</label>
      <div class="relative mt-auto">${pre}<input id="${id}" name="${f.id}" type="text" inputmode="${f.inteiro ? 'numeric' : 'decimal'}" autocomplete="off" spellcheck="false"
        ${descNum} class="field-input ${hasPre ? 'pl-11' : ''} ${f.suffix ? 'pr-8' : ''}" />${suf}</div>
      <span id="${erroId}" class="field-erro" hidden>${esc(exemploErro(f))}</span>
      ${hint}</div>`;
  }

  function buildForm() {
    const map = { clt: 'fields-clt', cltAdv: 'fields-clt-adv', pj: 'fields-pj', pjAdv: 'fields-pj-adv' };
    for (const [k, el] of Object.entries(map)) document.getElementById(el).innerHTML = FIELDS[k].map(fieldHTML).join('');
    fillForm();
    const form = document.getElementById('form');
    form.addEventListener('submit', (e) => e.preventDefault());
    form.addEventListener('input', onInput);
    form.addEventListener('change', onInput);
    document.addEventListener('click', onClick);
    document.getElementById('modos').addEventListener('change', (e) => trocarModo(e.target.value));
    document.getElementById('abas').addEventListener('change', (e) => { values.aba = e.target.value; save(); render(); });
    window.addEventListener('hashchange', () => modoDoLink() && trocarModo(modoDoLink()));
    document.getElementById('btn-reset').addEventListener('click', () => {
      values = { ...defaults(), modo: values.modo };
      aplicarCotacaoAoVivo();
      fillForm();
      save();
      render();
    });
  }

  const campo = (id) => ALL.find((x) => x.id === id);
  const ehNumero = (f) => f.type !== 'checkbox' && f.type !== 'select';
  const casasDe = (f) => (f.inteiro ? 0 : f.casas ?? 2);

  function exemploErro(f) {
    if (f.inteiro) return 'Use um número inteiro, como 2.';
    if (f.suffix === '%') return f.max != null ? `Use um número entre 0 e ${f.max}, como 28.` : 'Use um número como 0,38.';
    if (f.id === 'cotacao') return 'Use um número como 5,78.';
    return 'Use só números, como 12.000 ou 12.000,50.';
  }

  function marcarErro(f, invalido) {
    const el = document.getElementById(`f-${f.id}`);
    el.setAttribute('aria-invalid', invalido ? 'true' : 'false');
    document.getElementById(`f-${f.id}-erro`).hidden = !invalido;
  }

  /** Escreve o valor do estado no campo, já formatado ("12.000", "5,7744"). */
  function preencherCampo(f) {
    const el = document.getElementById(`f-${f.id}`);
    if (f.type === 'checkbox') el.checked = !!values[f.id];
    else if (f.type === 'select') el.value = String(values[f.id]);
    else {
      el.value = values[f.id] === '' ? '' : F.escreverNumero(values[f.id], casasDe(f), Boolean(f.prefix || f.prefixFn) && f.milhar !== false);
      marcarErro(f, false);
    }
  }

  function fillForm() {
    for (const f of ALL) preencherCampo(f);
    syncVisibility();
  }

  function onInput(e) {
    const f = ALL.find((x) => x.id === e.target.name);
    if (!f) return;
    if (ehNumero(f)) {
      const lido = F.lerNumero(e.target.value, { milhar: f.milhar !== false && !f.inteiro });
      const invalido = lido === undefined || (lido !== null && f.max != null && lido > f.max);
      marcarErro(f, invalido);
      if (invalido) return; // mantém a conta com o último valor válido
      values[f.id] = lido === null ? '' : f.inteiro ? Math.round(lido) : lido;
      if (e.type === 'change') preencherCampo(f); // ao sair do campo, mostra o número formatado
    } else {
      values[f.id] = f.type === 'checkbox' ? e.target.checked : e.target.value;
    }
    if (f.id === 'cotacao') values.cotacaoManual = true;
    if (f.id === 'moeda' && values.moeda === 'USD' && cotacaoAoVivo.status === 'idle') atualizarCotacao();
    syncVisibility();
    save();
    render();
  }

  function trocarModo(modo) {
    if (!MODOS[modo]) return;
    values.modo = modo;
    try { history.replaceState(null, '', `#${modo}`); } catch (_) { /* file:// em alguns navegadores */ }
    syncVisibility();
    save();
    render();
  }

  function onClick(e) {
    const acao = e.target.closest('[data-acao]')?.dataset.acao;
    if (!acao) return;
    if (acao.startsWith('modo-')) {
      trocarModo(acao.slice(5));
      const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;
      document.getElementById('modos').scrollIntoView({ behavior: reduzir ? 'auto' : 'smooth', block: 'start' });
    } else if (acao === 'usar-cotacao') {
      values.cotacaoManual = false;
      aplicarCotacaoAoVivo();
      preencherCampo(campo('cotacao'));
      save();
      render();
    } else if (acao === 'atualizar-cotacao') {
      atualizarCotacao({ ignorarCache: true });
    }
  }

  function syncVisibility() {
    const modo = values.modo;
    document.querySelectorAll('input[name="modo"]').forEach((r) => (r.checked = r.value === modo));
    document.getElementById('modo-descricao').textContent = MODOS[modo].descricao;
    document.querySelectorAll('[data-modos]').forEach((el) => el.classList.toggle('hidden', !el.dataset.modos.split(' ').includes(modo)));
    document.getElementById('sec-detalhe').classList.toggle('xl:grid-cols-2', modo !== 'clt');
    for (const f of Object.values(FIELDS).flat()) {
      if (f.showIf) document.querySelector(`[data-wrap="${f.id}"]`).classList.toggle('hidden', !f.showIf(values));
      if (f.prefixFn) document.querySelector(`[data-prefix="${f.id}"]`).textContent = f.prefixFn(values);
    }
  }

  /* ───────────── Cotação ao vivo ───────────── */
  function aplicarCotacaoAoVivo() {
    if (cotacaoAoVivo.status === 'ok' && !values.cotacaoManual) {
      values.cotacao = Math.round(cotacaoAoVivo.dados.valor * 10000) / 10000;
    }
  }

  async function atualizarCotacao(opts) {
    cotacaoAoVivo = { ...cotacaoAoVivo, status: 'loading' };
    renderCotacaoStatus();
    try {
      cotacaoAoVivo = { status: 'ok', dados: await Q.buscarCotacao(opts) };
      aplicarCotacaoAoVivo();
      preencherCampo(campo('cotacao')); // só o campo da cotação, para não atrapalhar quem está digitando
      save();
      render();
    } catch (err) {
      console.warn('[cotação]', err.message);
      cotacaoAoVivo = { status: 'erro', dados: cotacaoAoVivo.dados };
      renderCotacaoStatus();
    }
  }

  function quando(d, apenasData) {
    const hoje = new Date();
    const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === hoje.toDateString()) return apenasData ? 'de hoje' : `hoje às ${hora}`;
    return `em ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
  }

  function renderCotacaoStatus() {
    const alvo = document.getElementById('f-cotacaoStatus');
    if (!alvo) return;
    // Só reescreve quando o conteúdo muda: a região é role="status" e seria relida a cada tecla
    const el = {
      set innerHTML(html) {
        if (alvo.dataset.html === html) return;
        alvo.dataset.html = html;
        alvo.innerHTML = html;
      },
    };
    const { status, dados } = cotacaoAoVivo;
    const box = (conteudo, acao) => `<div class="-mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs leading-snug text-ink-muted">
      <span class="text-pretty">${conteudo}</span>${acao || ''}</div>`;
    const btn = (acao, texto) => `<button type="button" data-acao="${acao}" class="btn-link text-xs">${texto}</button>`;

    if (status === 'loading') { el.innerHTML = box('Buscando a cotação de hoje…'); return; }
    if (status === 'erro') {
      el.innerHTML = box('<span class="font-medium text-warn-fg">Não foi possível buscar a cotação agora.</span> Digite o valor no campo acima ou tente de novo.', btn('atualizar-cotacao', 'Tentar de novo'));
      return;
    }
    if (status !== 'ok') { el.innerHTML = ''; return; }
    const variacao = Number.isFinite(dados.variacao) ? ` · ${dados.variacao >= 0 ? '+' : '−'}${pct(Math.abs(dados.variacao), 2)} no dia` : '';
    if (values.cotacaoManual && Math.abs(values.cotacao - dados.valor) > 0.00005) {
      el.innerHTML = box(`Você digitou a cotação. Hoje o dólar está em <strong class="font-semibold text-ink tabular-nums">${fmtCot.format(dados.valor)}</strong>.`, btn('usar-cotacao', 'Usar a cotação de hoje'));
    } else {
      el.innerHTML = box(`${esc(dados.rotulo || 'Cotação de compra')}, ${quando(dados.data, dados.apenasData)}${variacao}. Fonte: <span title="${esc(dados.descricao)}">${esc(dados.fonte)}</span>.`, btn('atualizar-cotacao', 'Atualizar'));
    }
  }

  /* ───────────── Entradas para o motor ───────────── */
  const n = (x) => (x === '' || x == null || !Number.isFinite(+x) ? 0 : +x);
  function inputs() {
    const v = values;
    const clt = {
      salario: n(v.salario), vr: n(v.vr), saude: n(v.saude), outrosBeneficios: n(v.outrosBeneficios),
      descontos: n(v.descontos), plrAnual: n(v.plrAnual), multaFgts: !!v.multaFgts, dependentes: n(v.dependentes),
    };
    const pj = {
      moeda: v.moeda, faturamento: n(v.faturamento), cotacao: n(v.cotacao) || cotacaoAoVivo.dados?.valor || COTACAO_PADRAO,
      taxaCambio: n(v.taxaCambio), iof: n(v.iof), contabilidade: n(v.contabilidade), outrosCustos: n(v.outrosCustos),
      mesesAtivos: Math.min(12, Math.max(1, Math.round(n(v.mesesAtivos) || 12))), regime: v.regime,
      fatorR: Math.min(1, Math.max(P.simples.fatorRMinimo, n(v.fatorR) / 100)), proLaboreManual: v.proLaboreManual === '' ? null : n(v.proLaboreManual),
      exportacao: !!v.exportacao, dependentes: n(v.dependentes), retencaoDividendos: !!v.retencaoDividendos,
      custosPessoais: n(v.custosPessoais), abertura: n(v.abertura),
    };
    return { clt, pj };
  }

  /** Faz as contas do modo atual e devolve tudo que as camadas precisam. */
  function calcular(modo, ci, base) {
    const usd = base.moeda === 'USD';
    if (modo === 'clt') {
      const clt = C.calcCLT(ci);
      return { modo, usd, ci, base, clt, fatEq: C.faturamentoPJEquivalente(base, clt.anual.total) };
    }
    let pi = base;
    let fatEq = null;
    if (modo === 'meta') {
      const clt = C.calcCLT(ci);
      fatEq = C.faturamentoPJEquivalente(base, clt.anual.total);
      pi = { ...base, faturamento: fatEq ?? 0 }; // no modo de meta o faturamento sai da conta
    }
    const r = C.comparar(ci, pi);
    return { modo, usd, ci, base, pi, r, clt: r.clt, pj: r.pj, fatEq: modo === 'meta' ? fatEq : r.faturamentoPJEquivalente };
  }

  /* ───────────── Renderização ───────────── */
  function render() {
    const { clt: ci, pj: base } = inputs();
    const x = calcular(values.modo, ci, base);
    renderCotacaoStatus();
    renderResultado(x);
    renderBarras(x);
    if (x.modo !== 'clt') renderCenarios(x);
    renderDetalhes(x);
    renderBarraFixa(x);
  }

  /* ── Camada 1: a resposta ── */

  function lado(tom, nome, valor, rotulo, linhas) {
    const bg = tom === 'clt' ? 'bg-clt-50' : 'bg-pj-50';
    const dot = tom === 'clt' ? 'bg-clt-500' : 'bg-pj-500';
    return `<div class="rounded-xl ${bg} p-4">
      <h3 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted"><span class="dot ${dot}" aria-hidden="true"></span>${nome}</h3>
      <p class="mt-2 text-3xl font-bold tracking-tight tabular-nums">${brl(valor)}<span class="text-sm font-medium tracking-normal text-ink-muted"> por mês</span></p>
      <p class="mt-0.5 text-xs text-ink-muted text-pretty">${rotulo}</p>
      <dl class="mt-3 space-y-1.5 border-t border-ink/10 pt-3 text-sm">${linhas
        .map(([k, v]) => `<div class="flex items-baseline justify-between gap-3"><dt class="text-ink-muted">${k}</dt><dd class="font-medium tabular-nums">${v}</dd></div>`)
        .join('')}</dl></div>`;
  }

  const ladoCLT = (c) => lado('clt', 'CLT', c.equivalenteMensal, 'Média do ano, com 13º, férias, FGTS e benefícios.', [
    ['No bolso, todo mês', brl(c.mensal.liquidoMensal)],
    ['Total no ano', brl(c.anual.total)],
  ]);
  const ladoPJ = (p) => lado('pj', 'PJ', p.equivalenteMensal, `Média do ano, ${rotuloMeses(p.anual.meses)}.`, [
    [p.anual.meses < 12 ? 'No bolso, por mês faturado' : 'No bolso, todo mês', brl(p.mensal.liquido - p.mensal.custosPessoais)],
    ['Total no ano', brl(p.anual.liquido)],
  ]);

  let anuncioTimer;
  function renderResultado(x) {
    let frase;
    let sub;
    let corpo;
    let avisos = [];
    const fmt = moedaFmt(x.usd);

    if (x.modo === 'clt') {
      const c = x.clt;
      const aproveitamento = c.custoEmpresa.anual > 0 ? c.anual.total / c.custoEmpresa.anual : 0;
      frase = `Seu CLT vale <span class="text-clt-700 tabular-nums">${brl(c.equivalenteMensal)}</span> por mês`;
      sub = 'Na média do ano, contando 13º, férias, FGTS e benefícios.';
      const stat = (k, v, h) => `<div class="rounded-xl bg-surface-sunken p-4"><dt class="text-xs font-medium text-ink-muted">${k}</dt><dd class="mt-1 text-xl font-bold tabular-nums">${v}</dd><dd class="mt-0.5 text-xs text-ink-subtle text-pretty">${h}</dd></div>`;
      corpo = `<dl class="mt-5 grid gap-3 sm:grid-cols-3">
          ${stat('No bolso, todo mês', brl(c.mensal.liquidoMensal), 'Salário líquido de um mês comum.')}
          ${stat('Total no ano', brl(c.anual.total), `Inclui ${brl(c.anual.fgts)} de FGTS, que fica retido.`)}
          ${stat('Custo para a empresa', `${brl(c.custoEmpresa.mensal)}<span class="text-xs font-medium text-ink-muted"> por mês</span>`, `De cada R$ 100, cerca de R$ ${Math.round(aproveitamento * 100)} chegam até você.`)}
        </dl>
        <div class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-line-control p-4">
          <p class="text-sm text-ink-muted text-pretty">Como PJ no Simples, você precisaria faturar cerca de
            <strong class="tabular-nums text-ink">${x.fatEq == null ? 'mais de 1 milhão' : fmt(x.fatEq)} por mês</strong> para empatar.</p>
          <button type="button" data-acao="modo-meta" class="btn">Ver quanto faturar como PJ</button>
        </div>`;
    } else if (x.modo === 'meta') {
      avisos = x.pj.avisos;
      if (x.fatEq == null) {
        frase = 'O empate passa de 1 milhão por mês';
        sub = 'Revise o salário e os benefícios informados.';
        corpo = '';
      } else {
        const meses = x.pj.anual.meses;
        const alt = meses === 12 ? 11 : 12;
        const fatAlt = C.faturamentoPJEquivalente({ ...x.base, mesesAtivos: alt }, x.clt.anual.total);
        const proporcao = x.clt.salario > 0 ? ` É ${pct(x.pj.faturamentoBRL / x.clt.salario, 0)} do salário bruto CLT.` : '';
        frase = `Para empatar, fature <span class="text-pj-700 tabular-nums">${fmt(x.fatEq)}</span> por mês como PJ`;
        sub = `${x.usd ? `Cerca de ${brl(x.pj.faturamentoBRL)}, ` : ''}${rotuloMeses(meses)}.${proporcao}`;
        // Por que o faturamento pode ficar abaixo do salário bruto CLT: a carga de cada lado
        const cltRetido = x.clt.anual.impostos;
        const pjFatAno = x.pj.anual.faturamento;
        const pjRetido = pjFatAno - x.pj.anual.liquido - x.pj.anual.custosPessoais;
        // Três situações: faturamento anual abaixo, perto (até 15% acima) ou bem acima do salário bruto anual CLT
        const razao = pjFatAno / Math.max(1, x.clt.anual.bruto);
        const [pergunta, fecho] = razao < 1
          ? ['Por que dá para faturar menos que o salário CLT?', 'Com menos imposto no caminho, um faturamento menor deixa o mesmo dinheiro no seu bolso.']
          : razao <= 1.15
            ? ['Por que o faturamento fica tão perto do salário CLT?', 'O PJ não tem 13º, férias pagas nem FGTS, mas a carga menor compensa quase tudo isso.']
            : ['Por que o PJ precisa faturar mais que o salário CLT?', 'O PJ não tem 13º, férias pagas nem FGTS, e paga por conta própria o que o CLT cobria.'];
        const porque = `<div class="mt-4 rounded-xl bg-surface-sunken p-4 text-sm text-ink-muted text-pretty">
            <p class="font-semibold text-ink">${pergunta}</p>
            <p class="mt-1">No CLT, <strong class="tabular-nums text-ink">${brl(cltRetido)}</strong> por ano (${pct(cltRetido / Math.max(1, x.clt.anual.bruto), 0)} do salário bruto) ficam em INSS e IR.
            No PJ, impostos, câmbio e contabilidade levam <strong class="tabular-nums text-ink">${brl(pjRetido)}</strong> (${pct(pjRetido / Math.max(1, pjFatAno), 0)} do faturamento).
            ${fecho}</p></div>`;
        corpo = `<div class="mt-5 grid gap-3 sm:grid-cols-2">${ladoCLT(x.clt)}${ladoPJ(x.pj)}</div>
          ${porque}
          <p class="mt-4 text-sm text-ink-muted text-pretty">O CLT paga 13,33 salários por ano (12 salários, o 13º e 1/3 de férias), mais FGTS. O PJ recebe só pelos meses faturados.${fatAlt != null ? ` ${alt === 11 ? 'Sem férias pagas' : 'Com férias pagas'}, o empate seria <strong class="tabular-nums text-ink">${fmt(fatAlt)}</strong>.` : ''}
          Empatar no dinheiro não cobre o risco: veja a aba “Ganhar mais que o CLT” logo abaixo.</p>`;
      }
    } else {
      avisos = x.pj.avisos;
      const d = x.r.diferencaAnual;
      const menor = Math.max(1, Math.min(x.pj.anual.liquido, x.clt.anual.total));
      const empate = Math.abs(d) / menor < 0.01;
      const cor = d >= 0 ? 'text-pj-700' : 'text-clt-700';
      frase = empate ? 'CLT e PJ praticamente empatam' : `O <span class="${cor}">${d >= 0 ? 'PJ' : 'CLT'}</span> rende <span class="${cor} tabular-nums">${brl(Math.abs(d))}</span> a mais por ano`;
      sub = empate ? 'A diferença é menor que 1% do total do ano.' : `${brl(Math.abs(d) / 12)} por mês, ${pct(Math.abs(d) / menor, 0)} acima do ${d >= 0 ? 'CLT' : 'PJ'}.`;
      corpo = `<div class="mt-5 grid gap-3 sm:grid-cols-2">${ladoCLT(x.clt)}${ladoPJ(x.pj)}</div>`;
    }

    const lista = avisos.map((a) => `<li>${esc(a)}</li>`).join('');
    const el = document.getElementById('resultado');
    el.innerHTML = `
      <h2 id="t-resultado" class="card-title">Resultado</h2>
      <p data-frase class="text-2xl font-bold tracking-tight text-balance sm:text-3xl">${frase}</p>
      <p data-sub class="mt-1 text-base font-medium text-ink-muted text-pretty">${sub}</p>
      ${corpo}
      ${lista ? `<div class="mt-4 rounded-lg border border-warn-line bg-warn-bg px-4 py-3 text-sm text-warn-fg">
        <p class="font-semibold">Atenção</p><ul class="mt-1 list-disc space-y-1 pl-5 text-pretty">${lista}</ul></div>` : ''}`;

    // Anúncio curto para leitores de tela, sem repetir o card inteiro a cada tecla
    clearTimeout(anuncioTimer);
    const texto = `${el.querySelector('[data-frase]').textContent.trim()}. ${el.querySelector('[data-sub]').textContent.trim()}`;
    anuncioTimer = setTimeout(() => (document.getElementById('anuncio').textContent = texto), 700);
  }

  /** Resumo fixo no rodapé do celular, visível só quando o resultado sai da tela. */
  function renderBarraFixa(x) {
    const fmt = moedaFmt(x.usd);
    let rotulo;
    let valor;
    if (x.modo === 'clt') { rotulo = 'Seu CLT vale'; valor = `${brl(x.clt.equivalenteMensal)}/mês`; }
    else if (x.modo === 'meta') { rotulo = 'Para empatar, fature'; valor = x.fatEq == null ? 'mais de 1 milhão' : `${fmt(x.fatEq)}/mês`; }
    else {
      const d = x.r.diferencaAnual;
      rotulo = `${d >= 0 ? 'PJ' : 'CLT'} rende a mais`;
      valor = `${brl(Math.abs(d))}/ano`;
    }
    document.getElementById('barra-fixa').innerHTML = `<div class="mx-auto flex max-w-7xl items-center justify-between gap-3">
      <p class="min-w-0"><span class="block text-xs text-ink-muted">${rotulo}</span><span class="block truncate text-lg font-bold tabular-nums">${valor}</span></p>
      <a href="#resultado" class="btn shrink-0">Ver resultado</a></div>`;
  }

  /* ── Camada 2: entender e testar cenários ── */

  /**
   * "Ganhou e pagou": cada lado vira uma barra em dois blocos, o que fica com você e o que sai no caminho.
   * As barras usam a mesma escala, então o bloco "fica com você" de CLT e PJ pode ser comparado a olho.
   */
  function blocoLado(cfg, escala) {
    const fica = cfg.fica.filter((s) => s.v > 0.5);
    const sai = cfg.sai.filter((s) => s.v > 0.5);
    const tf = fica.reduce((a, s) => a + s.v, 0);
    const ts = sai.reduce((a, s) => a + s.v, 0);
    const total = tf + ts;
    const larg = (v) => `${(v / escala) * 100}%`;
    const zona = (itens, soma) => itens.map((s) => `<div class="${s.c} h-full" style="width:${(s.v / (soma || 1)) * 100}%"></div>`).join('');
    const lista = (itens) => itens.map((s) => `<li class="flex items-baseline gap-2"><span class="h-2.5 w-2.5 shrink-0 translate-y-px rounded-sm ${s.c}" aria-hidden="true"></span><span class="text-ink-muted">${esc(s.l)}</span><span class="ml-auto font-medium tabular-nums">${brl(s.v)}</span></li>`).join('');
    const corLado = cfg.tom === 'clt' ? 'bg-clt-500' : 'bg-pj-500';
    return `<div>
      <div class="mb-2 flex items-baseline justify-between gap-2">
        <h3 class="flex items-center gap-2 text-sm font-semibold"><span class="dot ${corLado}" aria-hidden="true"></span>${cfg.titulo}</h3>
        <span class="text-xs tabular-nums text-ink-muted">${brl(total)} no ano</span>
      </div>
      <div class="flex h-8 w-full overflow-hidden rounded-md bg-surface-sunken" aria-hidden="true">
        <div class="flex h-full gap-px" style="width:${larg(tf)}">${zona(fica, tf)}</div>
        ${ts > 0.5 ? `<div class="flex h-full gap-px border-l-2 border-surface" style="width:${larg(ts)}">${zona(sai, ts)}</div>` : ''}
      </div>
      <div class="mt-1 flex w-full gap-0.5" aria-hidden="true">
        <div class="h-1 rounded-full ${corLado}" style="width:${larg(tf)}"></div>
        ${ts > 0.5 ? `<div class="h-1 rounded-full bg-out" style="width:${larg(ts)}"></div>` : ''}
      </div>
      <div class="mt-3 grid gap-x-8 gap-y-4 text-xs sm:grid-cols-2">
        <div>
          <p class="flex items-baseline justify-between gap-2 border-b border-line pb-1.5 text-sm"><span class="font-semibold">Fica com você</span><span class="font-bold tabular-nums">${brl(tf)} <span class="text-xs font-medium text-ink-muted">${pct(tf / (total || 1), 0)}</span></span></p>
          <ul class="mt-2 space-y-1.5">${lista(fica)}</ul>
        </div>
        <div>
          <p class="flex items-baseline justify-between gap-2 border-b border-line pb-1.5 text-sm"><span class="font-semibold">Sai no caminho</span><span class="font-bold tabular-nums text-out">${brl(ts)} <span class="text-xs font-medium text-ink-muted">${pct(ts / (total || 1), 0)}</span></span></p>
          <ul class="mt-2 space-y-1.5">${lista(sai)}</ul>
        </div>
      </div></div>`;
  }

  function ladosGanhoPerda(x) {
    const c = x.clt;
    const inssA = 11 * c.mensal.inss + c.ferias.inss + c.decimo.inss;
    const irA = 11 * c.mensal.irrf + c.ferias.irrf + c.decimo.irrf;
    const clt = {
      tom: 'clt', titulo: 'CLT: tudo que a empresa paga para você',
      fica: [
        { l: 'Salário líquido, com férias e 13º', v: c.anual.salarios, c: 'bg-clt-500' },
        { l: 'Benefícios e PLR', v: c.anual.beneficios + c.anual.plr, c: 'bg-chart-beneficios' },
        { l: c.anual.multaFgts ? 'FGTS e multa de 40%' : 'FGTS depositado', v: c.anual.fgts + c.anual.multaFgts, c: 'bg-clt-100' },
      ],
      sai: [
        { l: 'Imposto de renda', v: irA, c: 'bg-out-soft' },
        { l: 'INSS', v: inssA, c: 'bg-out-mild' },
        { l: 'Descontos em folha', v: c.mensal.descontos * 12, c: 'bg-chart-pessoal' },
      ],
    };
    if (!x.pj) return { clt };
    const pm = x.pj.mensal;
    const pa = x.pj.anual;
    const k = pa.meses;
    const proLabore = pm.proLaboreLiquido * k;
    const pj = {
      tom: 'pj', titulo: 'PJ: tudo que o cliente paga para a empresa',
      // Com prejuízo, o sócio cobre a diferença: o que fica é o pró-labore líquido menos esse aporte
      fica: pa.liquido - proLabore >= 0
        ? [
          { l: 'Lucro distribuído', v: pa.liquido - proLabore, c: 'bg-pj-500' },
          { l: 'Pró-labore líquido', v: proLabore, c: 'bg-pj-700' },
        ]
        : [{ l: 'Pró-labore líquido, menos o prejuízo que você cobre', v: Math.max(0, pa.liquido), c: 'bg-pj-700' }],
      sai: [
        { l: 'DAS do Simples', v: pm.das * k, c: 'bg-chart-das' },
        { l: pa.irpfm.devido ? 'Imposto de renda e IRPFM' : 'Imposto de renda', v: pm.irrf * k + pa.irpfm.devido, c: 'bg-out-soft' },
        { l: 'INSS do pró-labore', v: pm.inss * k, c: 'bg-out-mild' },
        { l: 'Câmbio e IOF', v: pm.custoCambio * k, c: 'bg-chart-cambio' },
        { l: k < 12 ? 'Contabilidade e custos (12 meses)' : 'Contabilidade e outros custos', v: (pm.contabilidade + pm.outros) * k + pa.custoInativo, c: 'bg-chart-custo' },
        { l: 'Gastos a mais por conta própria', v: pa.custosPessoais, c: 'bg-chart-pessoal' },
      ],
    };
    return { clt, pj };
  }

  function renderBarras(x) {
    const { clt, pj } = ladosGanhoPerda(x);
    const soma = (arr) => arr.reduce((a, s) => a + Math.max(0, s.v), 0);
    const fC = soma(clt.fica);
    const sC = soma(clt.sai);
    if (!pj) {
      document.getElementById('barras').innerHTML = blocoLado(clt, Math.max(fC + sC, 1));
      return;
    }
    if (x.pj.anual.liquido <= 0) {
      document.getElementById('barras').innerHTML = blocoLado(clt, Math.max(fC + sC, 1)) +
        `<div class="rounded-xl border border-warn-line bg-warn-bg p-4 text-sm text-warn-fg text-pretty">
          <p class="font-semibold">PJ: a empresa não se paga com esse faturamento</p>
          <p class="mt-1">Impostos, pró-labore e custos passam do que o cliente paga. Você colocaria <strong class="tabular-nums">${brl(-x.pj.anual.liquido)}</strong> do próprio bolso no ano.</p></div>`;
      return;
    }
    const fP = soma(pj.fica);
    const sP = soma(pj.sai);
    const escala = Math.max(fC + sC, fP + sP, 1);
    const d = fP - fC;
    const empate = Math.abs(d) < Math.max(1, fC) * 0.005;
    const conclusao = empate
      ? `Os dois deixam <strong class="tabular-nums text-ink">${brl(fC)}</strong> com você no ano. É isso que significa empatar.`
      : `O ${d > 0 ? 'PJ' : 'CLT'} deixa <strong class="tabular-nums text-ink">${brl(Math.abs(d))}</strong> a mais com você no ano.`;
    const linha = (rotulo, a, b, cls = '') => `<tr class="${cls}"><th scope="row">${rotulo}</th><td class="v">${a}</td><td class="v">${b}</td></tr>`;
    const resumo = `<div class="rounded-xl bg-surface-sunken p-4">
      <div class="relative overflow-x-auto"><table class="tbl min-w-[300px]"><caption class="sr-only">Quanto fica com você e quanto sai em cada lado</caption>
        <thead><tr><th scope="col"><span class="sr-only">Item</span></th><th scope="col" class="v">CLT</th><th scope="col" class="v">PJ</th></tr></thead>
        <tbody>
          ${linha('Total pago no ano', brl(fC + sC), brl(fP + sP))}
          ${linha('Sai no caminho', `<span class="text-out">−${brl(sC)}</span> <span class="text-xs text-ink-subtle">${pct(sC / (fC + sC || 1), 0)}</span>`, `<span class="text-out">−${brl(sP)}</span> <span class="text-xs text-ink-subtle">${pct(sP / (fP + sP || 1), 0)}</span>`)}
          ${linha('Fica com você', brl(fC), brl(fP), 'font-bold')}
        </tbody></table></div>
      <p class="mt-3 text-sm text-ink-muted text-pretty">${conclusao}</p></div>`;
    document.getElementById('barras').innerHTML = blocoLado(clt, escala) + blocoLado(pj, escala) + resumo +
      '<p class="text-xs text-ink-subtle">As barras usam a mesma escala: o tamanho do bloco "fica com você" pode ser comparado direto.</p>';
  }

  /** Card "E se…?": um cenário por vez, escolhido em abas (rádios nativos). */
  function renderCenarios(x) {
    const abas = x.modo === 'meta'
      ? [['metas', 'Ganhar mais que o CLT'], ['ferias', 'Férias'], ['dolar', 'Dólar']]
      : [['empate', 'Empate'], ['ferias', 'Férias'], ['dolar', 'Dólar']];
    const disponiveis = abas.filter(([k]) => k !== 'dolar' || x.usd);
    const atual = disponiveis.some(([k]) => k === values.aba) ? values.aba : disponiveis[0][0];
    // Recria as abas só quando o conjunto muda; senão só marca a atual, para não perder o foco do teclado
    const el = document.getElementById('abas');
    const chave = disponiveis.map(([k, l]) => `${k}:${l}`).join('|');
    if (el.dataset.chave !== chave) {
      el.dataset.chave = chave;
      el.innerHTML = disponiveis
        .map(([k, l]) => `<label class="seg"><input type="radio" name="aba" value="${k}" class="sr-only" />${l}</label>`)
        .join('');
    }
    el.querySelectorAll('input').forEach((r) => (r.checked = r.value === atual));
    const conteudo = {
      metas: cenarioMetas, empate: cenarioEmpate, ferias: cenarioFerias,
      dolar: x.modo === 'meta' ? cenarioDolarMeta : cenarioDolarComparar,
    }[atual](x);
    document.getElementById('cenario').innerHTML = conteudo;
  }

  const intro = (t) => `<p class="mb-4 max-w-prose text-sm text-ink-muted text-pretty">${t}</p>`;
  const tabelaWrap = (caption, minW, head, body) => `<div class="relative overflow-x-auto"><table class="tbl ${minW}"><caption class="sr-only">${esc(caption)}</caption>
    <thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  const linhaDestaque = (on) => (on ? 'bg-surface-sunken font-semibold' : '');
  const thLinha = (on, html) => `<th scope="row" class="pl-2 ${on ? '!font-semibold' : ''}">${html}</th>`;
  const tagEmUso = ' <span class="ml-1 inline-block whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[11px] font-semibold text-surface">em uso</span>';

  function cenarioMetas(x) {
    const fmt = moedaFmt(x.usd);
    const body = [0, 0.2, 0.35, 0.5].map((mg) => {
      const alvo = x.clt.anual.total * (1 + mg);
      const fat = C.faturamentoPJEquivalente(x.base, alvo);
      const nome = mg ? `${Math.round(mg * 100)}% acima do CLT` : 'Empate';
      if (fat == null) return `<tr>${thLinha(false, nome)}<td class="v pr-2" colspan="${x.usd ? 4 : 3}">Acima de 1 milhão por mês</td></tr>`;
      const pj = C.calcPJ({ ...x.base, faturamento: fat });
      const extra = pj.anual.liquido - x.clt.anual.total;
      return `<tr class="${linhaDestaque(mg === 0)}">${thLinha(mg === 0, nome)}
        <td class="v">${fmt(fat)}</td>${x.usd ? `<td class="v">${brl(pj.faturamentoBRL)}</td>` : ''}
        <td class="v">${brl(pj.equivalenteMensal)}</td>
        <td class="v pr-2 ${extra > 0.5 ? 'pos' : ''}">${extra > 0.5 ? '+' + brl(extra) : NA}</td></tr>`;
    }).join('');
    return intro('Empatar no papel não paga o risco. O PJ não tem estabilidade, seguro-desemprego, multa do FGTS nem férias pagas garantidas. Uma margem de 20% a 50% acima do empate é uma referência comum para cobrir isso.') +
      tabelaWrap('Faturamento PJ necessário para cada meta', 'min-w-[520px]',
        `<th scope="col" class="pl-2">Meta</th><th scope="col" class="v">Faturamento por mês</th>${x.usd ? '<th scope="col" class="v">Em reais</th>' : ''}<th scope="col" class="v">PJ por mês, na média</th><th scope="col" class="v pr-2">A mais que o CLT no ano</th>`,
        body);
  }

  function cenarioEmpate(x) {
    const salEq = x.r.salarioCLTEquivalente;
    const fatEq = x.r.faturamentoPJEquivalente;
    const fmt = moedaFmt(x.usd);
    const unidade = (t) => `<span class="text-sm font-medium text-ink-muted"> ${t}</span>`;
    const box = (titulo, valor, sub, tom) => `<div class="rounded-xl ${tom} p-4">
      <h3 class="text-sm text-ink-muted">${titulo}</h3><p class="mt-1 text-2xl font-bold tabular-nums">${valor}</p><p class="mt-1 text-xs text-ink-muted text-pretty">${sub}</p></div>`;
    const fora = 'Acima de 1 milhão';
    return `<div class="grid gap-4 sm:grid-cols-2">
      ${box('Salário CLT para empatar com este PJ', salEq == null ? fora : `${brl(salEq)}${unidade('bruto por mês')}`, 'Com os mesmos benefícios. Use como referência para negociar uma proposta CLT.', 'bg-clt-50')}
      ${box('Faturamento PJ para empatar com este CLT', fatEq == null ? fora : `${fmt(fatEq)}${unidade('por mês')}`, `${x.usd && fatEq != null ? `Cerca de ${brl(fatEq * x.pi.cotacao)}. ` : ''}Abaixo disso, o CLT rende mais.`, 'bg-pj-50')}
      <p class="rounded-xl border border-dashed border-line-control p-4 text-sm text-ink-muted text-pretty sm:col-span-2">
        Uma empresa no Lucro Presumido ou no Lucro Real gasta cerca de <strong class="tabular-nums text-ink">${brl(x.clt.custoEmpresa.mensal)} por mês</strong>
        com você no CLT, somando salário, 13º, férias, encargos, FGTS e benefícios. É um teto razoável para negociar um contrato PJ.</p></div>`;
  }

  function cenarioFerias(x) {
    const atual = x.pj.anual.meses;
    const cenarios = [...new Set([12, 11, atual])].sort((a, b) => b - a);
    const nome = (m) => `PJ ${rotuloMeses(m)}${m === atual ? tagEmUso : ''}`;
    const texto = 'No CLT você recebe 13,33 salários por ano: 12 salários (um deles durante as férias), o 13º e mais 1/3 de férias, fora o FGTS. No PJ você recebe só pelos meses faturados. Se o cliente não paga as férias, um mês de folga custa um mês inteiro de faturamento, e a contabilidade continua sendo paga.';

    if (x.modo === 'meta') {
      const fmt = moedaFmt(x.usd);
      const fats = Object.fromEntries(cenarios.map((m) => [m, C.faturamentoPJEquivalente({ ...x.base, mesesAtivos: m }, x.clt.anual.total)]));
      const body = cenarios.map((m) => {
        const f = fats[m];
        const extra = f != null && fats[12] != null && m !== 12 ? `+${pct(f / fats[12] - 1, 0)}` : null;
        return `<tr class="${linhaDestaque(m === atual)}">${thLinha(m === atual, nome(m))}
          <td class="v">${f == null ? NA : fmt(f)}</td>${x.usd ? `<td class="v">${f == null ? NA : brl(f * x.base.cotacao)}</td>` : ''}
          <td class="v pr-2">${extra ?? NA}</td></tr>`;
      }).join('');
      return intro(texto) + tabelaWrap('Faturamento para empatar com 12 ou 11 meses recebidos', 'min-w-[480px]',
        `<th scope="col" class="pl-2">Cenário</th><th scope="col" class="v">Faturamento para empatar</th>${x.usd ? '<th scope="col" class="v">Em reais</th>' : ''}<th scope="col" class="v pr-2">A mais que com 12 meses</th>`,
        body);
    }

    const c = x.clt;
    const cltRow = `<tr>${thLinha(false, 'CLT: 13,33 salários, mais FGTS e benefícios')}<td class="v">${brl(c.anual.total)}</td><td class="v">${brl(c.equivalenteMensal)}</td><td class="v pr-2">${NA}</td></tr>`;
    const body = cltRow + cenarios.map((m) => {
      const pj = m === atual ? x.pj : C.calcPJ({ ...x.pi, mesesAtivos: m });
      const diff = pj.anual.liquido - c.anual.total;
      return `<tr class="${linhaDestaque(m === atual)}">${thLinha(m === atual, nome(m))}
        <td class="v">${brl(pj.anual.liquido)}</td><td class="v">${brl(pj.equivalenteMensal)}</td>
        <td class="v pr-2 ${diff >= 0 ? 'pos' : 'neg'}">${diff >= 0 ? '+' : '−'}${brl(Math.abs(diff))}</td></tr>`;
    }).join('');
    return intro(texto) + tabelaWrap('Comparação entre receber 12 ou 11 meses no PJ', 'min-w-[520px]',
      '<th scope="col" class="pl-2">Cenário</th><th scope="col" class="v">Total no ano</th><th scope="col" class="v">Média por mês</th><th scope="col" class="v pr-2">Diferença para o CLT</th>',
      body);
  }

  const variacoes = [0.8, 0.9, 1, 1.1, 1.2];
  const rotuloCot = (f) => {
    const aoVivo = cotacaoAoVivo.status === 'ok' && !values.cotacaoManual;
    return f === 1 ? (aoVivo ? 'hoje' : 'atual') : `${f > 1 ? '+' : '−'}${Math.round(Math.abs(f - 1) * 100)}%`;
  };

  function cenarioDolarMeta(x) {
    const fatHoje = x.fatEq;
    const body = variacoes.map((f) => {
      const cot = x.base.cotacao * f;
      const fat = C.faturamentoPJEquivalente({ ...x.base, cotacao: cot }, x.clt.anual.total);
      const delta = fat != null && fatHoje != null ? fat - fatHoje : null;
      return `<tr class="${linhaDestaque(f === 1)}">${thLinha(f === 1, `${fmtCot.format(cot)} <span class="text-xs font-normal text-ink-subtle">${rotuloCot(f)}</span>`)}
        <td class="v">${fat == null ? NA : fmtUSD.format(fat)}</td><td class="v pr-2">${delta == null || Math.abs(delta) < 0.5 ? NA : `${delta > 0 ? '+' : '−'}${fmtUSD.format(Math.abs(delta))}`}</td></tr>`;
    }).join('');
    return intro('O valor em reais para empatar não muda. O que muda é quantos dólares você precisa faturar: com o dólar mais barato, são mais dólares.') +
      tabelaWrap('Faturamento para empatar com cotações diferentes', 'min-w-[400px]',
        '<th scope="col" class="pl-2">Cotação</th><th scope="col" class="v">Faturamento para empatar</th><th scope="col" class="v pr-2">Diferença para hoje</th>',
        body);
  }

  function cenarioDolarComparar(x) {
    const body = variacoes.map((f) => {
      const cot = x.pi.cotacao * f;
      const pj = C.calcPJ({ ...x.pi, cotacao: cot });
      const diff = pj.anual.liquido - x.clt.anual.total;
      return `<tr class="${linhaDestaque(f === 1)}">${thLinha(f === 1, `${fmtCot.format(cot)} <span class="text-xs font-normal text-ink-subtle">${rotuloCot(f)}</span>`)}
        <td class="v">${brl(pj.equivalenteMensal)}</td><td class="v">${brl(pj.anual.liquido)}</td>
        <td class="v pr-2 ${diff >= 0 ? 'pos' : 'neg'}">${diff >= 0 ? '+' : '−'}${brl(Math.abs(diff))}</td></tr>`;
    }).join('');
    return intro('Quem fatura em dólar sente a cotação direto no bolso. O lado CLT não muda.') +
      tabelaWrap('Resultado do PJ com cotações diferentes', 'min-w-[480px]',
        '<th scope="col" class="pl-2">Cotação</th><th scope="col" class="v">PJ por mês, na média</th><th scope="col" class="v">PJ no ano</th><th scope="col" class="v pr-2">Diferença para o CLT</th>',
        body);
  }

  /* ── Camada 3: o cálculo completo ── */

  function renderDetalhes(x) {
    document.getElementById('detalhes-resumo').textContent = x.modo === 'clt'
      ? 'INSS, IR, férias, 13º e FGTS, mês a mês e no ano. Premissas.'
      : 'CLT e PJ mês a mês e no ano, Anexo III ou V, e as premissas.';
    renderDetalheCLT(x.clt);
    if (x.pj) {
      renderDetalhePJ(x.pj, x.pi);
      renderRegimes(x.pj, x.pi);
    }
    renderPremissas(x.pi || x.base, x.modo);
  }

  function tabela(caption, rows) {
    const val = (x) => (x == null ? NA : `<span class="${x < 0 ? 'neg' : ''}">${x < 0 ? '−' : ''}${brl(Math.abs(x))}</span>`);
    const body = rows.map((r) => {
      if (r.sep) return `<tr><th scope="rowgroup" colspan="3" class="!border-t-0 !pt-5 !text-xs !font-semibold !uppercase !tracking-wide !text-ink-muted">${esc(r.sep)}</th></tr>`;
      return `<tr class="${r.total ? 'font-semibold' : ''}"><th scope="row" class="${r.total ? '!font-semibold' : ''}">${r.l}${r.h ? `<span class="block text-xs font-normal text-ink-subtle">${r.h}</span>` : ''}</th><td class="v">${val(r.m)}</td><td class="v">${val(r.a)}</td></tr>`;
    }).join('');
    return `<table class="tbl min-w-[340px]"><caption class="sr-only">${esc(caption)}</caption>
      <thead><tr><th scope="col"><span class="sr-only">Item</span></th><th scope="col" class="v">Mês</th><th scope="col" class="v">Ano</th></tr></thead><tbody>${body}</tbody></table>`;
  }

  function renderDetalheCLT(c) {
    const inssA = 11 * c.mensal.inss + c.ferias.inss + c.decimo.inss;
    const irA = 11 * c.mensal.irrf + c.ferias.irrf + c.decimo.irrf;
    const red = c.mensal.ir.reducao;
    document.getElementById('detalhe-clt').innerHTML = tabela('CLT por mês e por ano', [
      { l: 'Salário bruto', h: 'No ano: 12 salários, 1/3 de férias e 13º', m: c.mensal.bruto, a: c.anual.bruto },
      { l: 'INSS', h: 'Progressivo, até o teto', m: -c.mensal.inss, a: -inssA },
      { l: 'Imposto de renda', h: red > 0 ? `Já com a redução da Lei 15.270: ${brlc(red)}` : c.mensal.ir.usouSimplificado ? 'Com o desconto simplificado' : '', m: -c.mensal.irrf, a: -irA },
      { l: 'Descontos em folha', m: c.mensal.descontos ? -c.mensal.descontos : null, a: c.mensal.descontos ? -c.mensal.descontos * 12 : null },
      { l: 'Salário líquido', total: true, m: c.mensal.liquidoMensal, a: c.anual.salarios },
      { sep: 'Além do salário' },
      { l: 'FGTS (8%)', h: 'Inclui 13º e férias. Fica retido até a demissão, a compra de um imóvel ou outro saque permitido.', m: c.mensal.fgts, a: c.anual.fgts },
      { l: 'Multa de 40% do FGTS', m: null, a: c.anual.multaFgts || null },
      { l: 'Benefícios', m: c.mensal.beneficios, a: c.anual.beneficios },
      { l: 'PLR ou bônus', m: null, a: c.anual.plr || null },
      { l: 'Total', total: true, h: 'No mês: média do ano ÷ 12', m: c.equivalenteMensal, a: c.anual.total },
    ]) + `<p class="mt-3 text-xs text-ink-subtle">Mês de férias: ${brl(c.ferias.liquido)} líquido, com o 1/3. 13º: ${brl(c.decimo.liquido)} líquido.</p>`;
  }

  function renderDetalhePJ(p, pi) {
    const m = p.mensal;
    const a = p.anual;
    const k = a.meses;
    const al = m.aliquota;
    const fatH = pi.moeda === 'USD' ? `${fmtUSD.format(pi.faturamento)} × ${fmtCot.format(pi.cotacao)}` : '';
    const pctTxt = (v) => `${String(v).replace('.', ',')}%`;
    document.getElementById('detalhe-pj').innerHTML = tabela('PJ por mês e por ano', [
      { sep: 'Na empresa' },
      { l: 'Faturamento', h: fatH, m: m.faturamento, a: m.faturamento * k },
      { l: 'Câmbio e IOF', h: `${pctTxt(pi.taxaCambio)} de taxa e ${pctTxt(pi.iof)} de IOF`, m: -m.custoCambio, a: -m.custoCambio * k },
      { l: `DAS: Anexo ${p.regime}, faixa ${al.faixa}`, h: `Alíquota efetiva de ${pct(al.efetiva, 2)}${pi.exportacao ? `, ou ${pct(al.aplicada, 2)} sem PIS, COFINS e ISS` : ''}`, m: -m.das, a: -m.das * k },
      { l: 'Contabilidade e outros custos', h: k < 12 ? 'No ano, inclui os meses sem faturamento' : '', m: -(m.contabilidade + m.outros), a: -((m.contabilidade + m.outros) * k + a.custoInativo) },
      { l: 'Pró-labore bruto', h: `Fator R de ${pct(m.fatorR)}`, m: -m.proLabore, a: -m.proLabore * k },
      m.lucro >= 0
        ? { l: 'Lucro para distribuir', total: true, h: 'Sem IR na distribuição até R$ 50 mil por mês', m: m.lucro, a: m.lucro * k - a.custoInativo }
        : { l: 'Prejuízo da empresa', total: true, h: 'O faturamento não cobre pró-labore e custos', m: m.lucro, a: m.lucro * k - a.custoInativo },
      { sep: 'Na pessoa física' },
      { l: 'Pró-labore bruto', m: m.proLabore, a: m.proLabore * k },
      { l: 'INSS do sócio (11%)', m: -m.inss, a: -m.inss * k },
      { l: 'IR sobre o pró-labore', h: m.ir.reducao > 0 ? `Já com a redução da Lei 15.270: ${brlc(m.ir.reducao)}` : '', m: -m.irrf, a: -m.irrf * k },
      { l: m.lucro >= 0 ? 'Lucro distribuído' : 'Prejuízo coberto por você', m: m.lucro, a: m.lucro * k - a.custoInativo },
      { l: 'Retenção de 10% no lucro', h: 'Adiantamento, acertado na declaração anual', m: m.retencao ? -m.retencao : null, a: null },
      { l: 'Imposto mínimo (IRPFM)', h: a.irpfm.aliquota > 0 ? `Renda de ${brl(a.irpfm.renda)}, alíquota de ${pct(a.irpfm.aliquota, 2)}` : 'Só para renda acima de R$ 600 mil no ano', m: null, a: a.irpfm.devido ? -a.irpfm.devido : null },
      { l: 'Gastos a mais por conta própria', m: m.custosPessoais ? -m.custosPessoais : null, a: a.custosPessoais ? -a.custosPessoais : null },
      { l: 'No bolso', total: true, h: 'O ano já desconta o imposto mínimo. A retenção de 10% volta na declaração.', m: m.liquido - m.custosPessoais, a: a.liquido },
    ]) + (a.abertura ? `<p class="mt-3 text-xs text-ink-subtle">No 1º ano, descontando ${brl(a.abertura)} de abertura da empresa: ${brl(a.liquidoPrimeiroAno)}.</p>` : '');
  }

  function renderRegimes(p, pi) {
    const { III, V } = p.alternativas;
    const best = III.anual.liquido >= V.anual.liquido ? 'III' : 'V';
    const usado = pi.regime === 'auto' ? best : pi.regime;
    const distintos = III.regime !== V.regime;
    const badge = (texto, tom) => `<span class="ml-1.5 inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-semibold normal-case tracking-normal ${tom}">${texto}</span>`;
    const head = (label, key) => {
      let b = '';
      if (distintos && usado === key) b += badge(pi.regime === 'auto' ? 'escolhido' : 'em uso', 'bg-ink text-surface');
      if (distintos && best === key && usado !== key) b += badge('rende mais', 'bg-pj-100 text-pj-700');
      return `<th scope="col" class="v">${label}${b}</th>`;
    };
    const rows = [
      ['Anexo aplicado', (o) => `Anexo ${o.regime}`],
      ['Pró-labore', (o) => brl(o.mensal.proLabore)],
      ['Fator R', (o) => pct(o.mensal.fatorR)],
      ['Alíquota do DAS', (o) => pct(o.mensal.aliquota.aplicada, 2)],
      ['DAS por mês', (o) => brl(o.mensal.das)],
      ['INSS e IR do pró-labore', (o) => brl(o.mensal.inss + o.mensal.irrf)],
      ['Impostos por mês', (o) => brl(o.mensal.impostos)],
      ['No bolso por mês', (o) => brl(o.mensal.liquido - o.mensal.custosPessoais), true],
      ['Total no ano', (o) => brl(o.anual.liquido), true],
    ];
    document.getElementById('regimes').innerHTML = `<table class="tbl min-w-[440px]"><caption class="sr-only">Comparação entre Anexo III e Anexo V</caption>
      <thead><tr><th scope="col"><span class="sr-only">Item</span></th>${head('Pró-labore de 28%', 'III')}${head('Pró-labore mínimo', 'V')}</tr></thead>
      <tbody>${rows.map(([l, f, forte]) => `<tr class="${forte ? 'font-semibold' : ''}"><th scope="row" class="${forte ? '!font-semibold' : ''}">${l}</th><td class="v">${f(III)}</td><td class="v">${f(V)}</td></tr>`).join('')}</tbody></table>
      ${!distintos ? `<p class="mt-3 text-xs text-ink-subtle">Nas duas estratégias o Fator R ${III.regime === 'III' ? 'fica em 28% ou mais, e a empresa fica no Anexo III' : 'fica abaixo de 28%, e a empresa cai no Anexo V'}.</p>` : ''}`;
  }

  function renderPremissas(pi, modo) {
    const d = cotacaoAoVivo.dados;
    const comuns = [
      `Tabelas de ${P.ano}: INSS com teto de ${brlc(P.inss.teto)}, IR isento até R$ 5.000 e com redução parcial até R$ 7.350 (Lei 15.270/2025), salário mínimo de ${brlc(P.salarioMinimo)}.`,
      'CLT: 11 meses de salário, 1 mês de férias com 1/3 e o 13º, cada um com INSS e IR próprios. O FGTS conta como seu dinheiro, mas fica retido.',
      'Os benefícios valem o que a empresa paga por eles. Se você não usaria algum, diminua o valor.',
    ];
    const pj = [
      pi.moeda === 'USD'
        ? `Cotação: compra do dólar comercial${d ? ` (${d.fonte})` : ''}. É o preço pelo qual o mercado compra os seus dólares. O ganho da plataforma de câmbio fica no campo de taxa.`
        : 'Contrato em reais: sem custo de câmbio, a menos que você informe uma taxa.',
      `PJ: a receita dos últimos 12 meses é o faturamento mensal × ${pi.mesesAtivos}. No 1º ano de empresa, a lei usa uma receita proporcional.`,
      'Todo o lucro é distribuído, e a empresa tem escrituração contábil. Sem ela, a parte isenta fica limitada a 32% da receita.',
      pi.exportacao
        ? 'Exportação de serviço: o DAS fica sem PIS, COFINS e ISS (LC 123/2006, art. 18, § 14). Para isso, o cliente precisa estar no exterior e o dinheiro precisa entrar no Brasil.'
        : 'Cliente no Brasil: DAS cheio, com ISS, PIS e COFINS.',
      'A retenção de 10% sobre lucro acima de R$ 50 mil por mês segue o entendimento da Receita para o Simples. O tema está no STF (ADI 7.917).',
      'O imposto mínimo (IRPFM) é estimado de forma simplificada e só aparece com renda acima de R$ 600 mil no ano.',
      `Aposentadoria: no CLT o INSS incide sobre o salário até o teto (${brlc(P.inss.teto)}); no PJ, só sobre o pró-labore. Com pró-labore baixo, a aposentadoria futura pelo INSS também fica menor. A conta trata o INSS como custo nos dois lados.`,
      'Plano de saúde: o valor do CLT é o que a empresa paga num plano coletivo. Um plano individual costuma custar mais; informe a diferença em “Gastos a mais por conta própria”.',
      'A partir de 2027, CBS e IBS substituem PIS e COFINS dentro do DAS. A exportação de serviços continua imune, então o efeito aqui deve ser pequeno.',
    ];
    const itens = modo === 'clt'
      ? [...comuns, 'O custo para a empresa considera 20% de INSS patronal, cerca de 2% de RAT, 5,8% de terceiros e 8% de FGTS sobre salário, férias e 13º. Empresas do Simples pagam menos.']
      : [...comuns, ...pj, ...(modo === 'meta' ? ['O faturamento para empatar é encontrado por busca numérica: é o menor valor em que o total do PJ no ano iguala o total do CLT no ano.'] : [])];
    document.getElementById('premissas').innerHTML = itens.map((t) => `<li>${esc(t)}</li>`).join('');
  }

  /* ───────────── Inicialização ───────────── */
  document.querySelectorAll('[data-ano]').forEach((el) => (el.textContent = P.ano));
  document.querySelectorAll('[data-atualizado]').forEach((el) => (el.textContent = new Date(`${P.atualizadoEm}T12:00:00`).toLocaleDateString('pt-BR')));
  buildForm();
  render();
  if (values.moeda === 'USD') atualizarCotacao();

  // A barra fixa aparece no celular só quando nem o resultado nem o rodapé estão na tela
  const barraFixa = document.getElementById('barra-fixa');
  if ('IntersectionObserver' in window) {
    const visiveis = new Set();
    const observador = new IntersectionObserver((entradas) => {
      for (const e of entradas) e.isIntersecting ? visiveis.add(e.target) : visiveis.delete(e.target);
      barraFixa.hidden = visiveis.size > 0;
    });
    [document.getElementById('resultado'), document.querySelector('footer')].filter(Boolean).forEach((el) => observador.observe(el));
  }
})();
