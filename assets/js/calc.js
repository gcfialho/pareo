/**
 * Motor de cálculo CLT × PJ (Simples Nacional, serviços de TI).
 * Funções puras, sem DOM, testadas em tests/calc.test.js (npm test).
 * Cada fórmula está explicada em docs/05-modelo-de-calculo.md.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./params.js'));
  else root.PAREO_CALC = factory(root.PAREO_PARAMS);
})(typeof self !== 'undefined' ? self : this, function (P) {
  'use strict';

  const r2 = (x) => Math.round((x + 1e-9) * 100) / 100;
  const num = (x, d = 0) => (x === '' || x == null || !Number.isFinite(+x) ? d : +x);
  const brl = (x) => 'R$ ' + Math.round(x).toLocaleString('pt-BR');

  /* ───────────── Tributos sobre a pessoa física ───────────── */

  /** INSS do empregado CLT: progressivo por faixa, limitado ao teto. */
  function inssEmpregado(bruto) {
    let total = 0;
    let anterior = 0;
    for (const f of P.inss.faixas) {
      if (bruto <= anterior) break;
      total += (Math.min(bruto, f.ate) - anterior) * f.aliquota;
      anterior = f.ate;
    }
    return r2(total);
  }

  /** INSS do sócio sobre o pró-labore: 11% limitado ao teto. */
  function inssSocio(proLabore) {
    return r2(Math.min(proLabore, P.inss.teto) * P.inss.contribuinteIndividual);
  }

  function irrfTabela(base) {
    const f = P.irrf.faixas.find((x) => base <= x.ate);
    return Math.max(0, base * f.aliquota - f.deduzir);
  }

  /** Redução da Lei 15.270/2025: calculada sobre o rendimento tributável BRUTO do mês. */
  function redutorIR(bruto) {
    const R = P.irrf.redutor;
    if (bruto <= R.isencaoAte) return R.reducaoMaxima;
    if (bruto <= R.faixaParcialAte) return Math.max(0, R.constante - R.fator * bruto);
    return 0;
  }

  /**
   * IRRF mensal (salário, pró-labore, férias ou 13º).
   * Usa a dedução mais vantajosa entre (INSS + dependentes) e o desconto simplificado.
   */
  function irrf(bruto, inss, dependentes = 0) {
    const legais = inss + dependentes * P.irrf.deducaoDependente;
    const usouSimplificado = P.irrf.descontoSimplificado > legais;
    const deducao = Math.max(legais, P.irrf.descontoSimplificado);
    const base = Math.max(0, bruto - deducao);
    const tabela = irrfTabela(base);
    const reducao = Math.min(tabela, redutorIR(bruto));
    return { base: r2(base), tabela: r2(tabela), reducao: r2(reducao), valor: r2(tabela - reducao), usouSimplificado };
  }

  /* ───────────────────────── CLT ───────────────────────── */

  /**
   * @param {object} i
   *  salario, dependentes, vr (VR/VA mensal), saude (parte paga pela empresa),
   *  outrosBeneficios (mensal), descontos (mensal: coparticipação, desconto VR…),
   *  plrAnual (líquido), multaFgts (bool)
   */
  function calcCLT(i) {
    const S = Math.max(0, num(i.salario));
    const dep = num(i.dependentes);
    const beneficiosMensal = num(i.vr) + num(i.saude) + num(i.outrosBeneficios);
    const descontos = num(i.descontos);

    const mes = (bruto) => {
      const inss = inssEmpregado(bruto);
      const ir = irrf(bruto, inss, dep);
      return { bruto: r2(bruto), inss, irrf: ir.valor, ir, liquido: r2(bruto - inss - ir.valor) };
    };

    const normal = mes(S);
    const ferias = mes(S + S / 3); // mês de férias: salário + 1/3 constitucional
    const decimo = mes(S); // 13º: INSS e IR exclusivos na fonte

    const liquidoMensal = r2(normal.liquido - descontos);
    const salariosAnual = r2(11 * normal.liquido + ferias.liquido + decimo.liquido - 12 * descontos);
    const fgtsMensal = r2(S * P.fgts.aliquota);
    const fgtsAnual = r2(P.fgts.aliquota * (12 * S + S / 3 + S));
    const multaFgts = i.multaFgts ? r2(fgtsAnual * P.fgts.multaRescisoria) : 0;
    const beneficiosAnual = r2(beneficiosMensal * 12);
    const plr = num(i.plrAnual);
    const totalAnual = r2(salariosAnual + fgtsAnual + multaFgts + beneficiosAnual + plr);
    const impostosAnual = r2(11 * (normal.inss + normal.irrf) + ferias.inss + ferias.irrf + decimo.inss + decimo.irrf);

    // Custo estimado para o empregador (Lucro Presumido/Real) — informativo
    const enc = P.encargosPatronais.cpp + P.encargosPatronais.rat + P.encargosPatronais.terceiros;
    const remuneracaoAnual = 12 * S + S / 3 + S;
    const custoEmpresaAnual = r2(remuneracaoAnual * (1 + enc + P.fgts.aliquota) + beneficiosAnual);

    return {
      salario: S,
      mensal: { ...normal, descontos, liquidoMensal, beneficios: r2(beneficiosMensal), fgts: fgtsMensal },
      ferias,
      decimo,
      anual: {
        salarios: salariosAnual,
        fgts: fgtsAnual,
        multaFgts,
        beneficios: beneficiosAnual,
        plr,
        total: totalAnual,
        impostos: impostosAnual,
        bruto: r2(remuneracaoAnual),
      },
      equivalenteMensal: r2(totalAnual / 12),
      custoEmpresa: { anual: custoEmpresaAnual, mensal: r2(custoEmpresaAnual / 12) },
    };
  }

  /* ─────────────────── Simples Nacional ─────────────────── */

  /**
   * Alíquota efetiva do Simples: (RBT12 × nominal − parcela a deduzir) / RBT12.
   * Na exportação de serviços, desconsidera-se a parcela de PIS, COFINS e ISS
   * (LC 123/2006, art. 18, §§ 4º-A, IV, e 14).
   */
  function simplesAliquota(anexo, rbt12, exportacao) {
    const tabela = P.simples.anexos[anexo];
    const idx = tabela.findIndex((f) => rbt12 <= f.ate);
    const faixaIdx = idx === -1 ? tabela.length - 1 : idx;
    const f = tabela[faixaIdx];
    const efetiva = rbt12 > 0 ? Math.max(0, (rbt12 * f.nominal - f.deduzir) / rbt12) : f.nominal;
    const removido = exportacao ? f.rep.pis + f.rep.cofins + f.rep.iss : 0;
    return {
      anexo,
      faixa: faixaIdx + 1,
      nominal: f.nominal,
      deduzir: f.deduzir,
      efetiva,
      aplicada: efetiva * (1 - removido),
      reparticao: f.rep,
      foraDoSimples: rbt12 > P.simples.limiteAnual,
    };
  }

  /* ────────────────────────── PJ ────────────────────────── */

  /**
   * @param {object} i
   *  moeda ('USD'|'BRL'), faturamento (na moeda), cotacao,
   *  taxaCambio (%), iof (%), contabilidade, outrosCustos (mensal), abertura (único),
   *  mesesAtivos (meses faturados no ano), regime ('auto'|'III'|'V'),
   *  fatorR (alvo, ex. 0.28), proLaboreManual (opcional), exportacao (bool),
   *  dependentes, retencaoDividendos (bool), custosPessoais (mensal, ex. plano de saúde)
   */
  function calcPJ(i) {
    const regime = ['auto', 'III', 'V'].includes(i.regime) ? i.regime : 'auto';
    // "III" e "V" são estratégias de pró-labore (28% ou mínimo); o anexo real sai do Fator R
    const III = calcPJRegime(i, 'III');
    const V = calcPJRegime(i, 'V');
    const melhor = III.anual.liquido >= V.anual.liquido ? III : V;
    const escolhido = regime === 'auto' ? melhor : regime === 'III' ? III : V;
    return { ...escolhido, alternativas: { III, V }, escolhaAutomatica: regime === 'auto' };
  }

  function calcPJRegime(i, alvo) {
    const avisos = [];
    const emReais = i.moeda === 'BRL';
    const cot = num(i.cotacao, 1);
    const fat = Math.max(0, emReais ? num(i.faturamento) : num(i.faturamento) * cot);
    const meses = Math.min(12, Math.max(1, Math.round(num(i.mesesAtivos, 12))));
    const dep = num(i.dependentes);
    const exportacao = i.exportacao !== false;

    // Contrato em reais não passa por câmbio
    const custoCambio = emReais ? 0 : r2(fat * (num(i.taxaCambio) + num(i.iof)) / 100);
    const rbt12 = fat * meses;

    // Pró-labore: alvo III mira o Fator R (folha 12m / receita 12m ≥ 28%); alvo V usa o mínimo
    const manual = i.proLaboreManual != null && i.proLaboreManual !== '' ? num(i.proLaboreManual) : null;
    const fatorRAlvo = Math.min(1, Math.max(P.simples.fatorRMinimo, num(i.fatorR, P.simples.fatorRMinimo)));
    let proLabore;
    if (manual != null) proLabore = manual;
    else if (alvo === 'III') proLabore = Math.max(P.salarioMinimo, Math.ceil(fatorRAlvo * fat * 100) / 100);
    else proLabore = P.salarioMinimo;
    if (proLabore < P.salarioMinimo) {
      avisos.push(`O pró-labore mínimo é um salário mínimo (${brl(P.salarioMinimo)}). A conta usa esse valor.`);
      proLabore = P.salarioMinimo;
    }
    proLabore = r2(proLabore);

    // O anexo sai do Fator R, nos dois sentidos (LC 123/2006, art. 18, § 5º-J e § 5º-M)
    const fatorR = fat > 0 ? proLabore / fat : 0;
    const anexo = fat > 0 && fatorR >= P.simples.fatorRMinimo ? 'III' : 'V';
    const pctFatorR = (fatorR * 100).toFixed(1).replace('.', ',');
    if (fat <= 0) {
      avisos.push('Informe um faturamento maior que zero para simular a empresa.');
    } else if (alvo === 'III' && anexo === 'V') {
      avisos.push(`O pró-labore é ${pctFatorR}% do faturamento, abaixo dos 28% do Fator R, e a empresa cai no Anexo V. Para ficar no Anexo III, use pelo menos ${brl(Math.ceil(fat * P.simples.fatorRMinimo))} de pró-labore.`);
    } else if (alvo === 'V' && anexo === 'III') {
      avisos.push(`Com pró-labore de ${pctFatorR}% do faturamento, o Fator R passa de 28% e a empresa fica no Anexo III, que cobra menos imposto.`);
    }

    const aliq = simplesAliquota(anexo, rbt12, exportacao);
    if (aliq.foraDoSimples) avisos.push(`Acima de ${brl(P.simples.limiteAnual)} por ano a empresa sai do Simples Nacional, e esta calculadora não cobre Lucro Presumido nem Lucro Real. Simule com um faturamento menor.`);
    const das = r2(fat * aliq.aplicada);

    const inss = inssSocio(proLabore);
    const ir = irrf(proLabore, inss, dep);
    const proLaboreLiquido = r2(proLabore - inss - ir.valor);

    const contabilidade = num(i.contabilidade);
    const outros = num(i.outrosCustos);
    // Lucro pode ser negativo: se o faturamento não cobre pró-labore e custos, a diferença sai do bolso do sócio
    const lucro = r2(fat - custoCambio - das - proLabore - contabilidade - outros);
    const distribuido = Math.max(0, lucro);
    if (lucro < 0 && fat > 0) {
      avisos.push(`O faturamento não cobre o pró-labore e os custos da empresa. Faltam ${brl(-lucro)} por mês, que sairiam do seu bolso. Aumente o faturamento ou reduza os custos.`);
    }

    const lim = P.dividendos.limiteMensalSemRetencao;
    const retencao = i.retencaoDividendos !== false && distribuido > lim ? r2(distribuido * P.dividendos.aliquotaRetencao) : 0;
    if (retencao > 0) avisos.push('O lucro passa de R$ 50 mil no mês, então 10% ficam retidos na fonte (Lei 15.270/2025). O valor volta na declaração anual se você não dever o imposto mínimo. Distribuir em mais meses evita a retenção.');

    const liquidoMensal = r2(proLaboreLiquido + lucro - retencao);

    // Visão anual: meses inativos ainda pagam contabilidade e custos fixos
    const custoInativo = r2((contabilidade + outros) * (12 - meses));
    const rendaAnualSocio = (proLabore + distribuido) * meses; // base do IRPFM
    const irpfm = calcIRPFM(rendaAnualSocio, ir.valor * meses);
    const custosPessoaisAnual = r2(num(i.custosPessoais) * 12);
    const liquidoAnual = r2((proLaboreLiquido + lucro) * meses - custoInativo - irpfm.devido - custosPessoaisAnual);
    const impostosMensal = r2(das + inss + ir.valor);

    return {
      regime: anexo,
      faturamentoBRL: r2(fat),
      mensal: {
        faturamento: r2(fat),
        custoCambio,
        das,
        aliquota: aliq,
        proLabore,
        fatorR,
        inss,
        irrf: ir.valor,
        ir,
        proLaboreLiquido,
        contabilidade,
        outros,
        lucro,
        distribuido,
        retencao,
        liquido: liquidoMensal,
        impostos: impostosMensal,
        custosPessoais: num(i.custosPessoais),
      },
      anual: {
        meses,
        faturamento: r2(fat * meses),
        impostos: r2(impostosMensal * meses + irpfm.devido),
        custoInativo,
        irpfm,
        custosPessoais: custosPessoaisAnual,
        liquido: liquidoAnual,
        abertura: num(i.abertura),
        liquidoPrimeiroAno: r2(liquidoAnual - num(i.abertura)),
      },
      equivalenteMensal: r2(liquidoAnual / 12),
      avisos,
    };
  }

  /**
   * IRPFM (imposto mínimo, Lei 15.270/2025) — estimativa simplificada.
   * Alíquota linear de 0% (R$ 600 mil) a 10% (R$ 1,2 mi). Abate o IR já pago
   * sobre o pró-labore. Ignora o redutor por carga da PJ (irrelevante no Simples).
   */
  function calcIRPFM(rendaAnual, irPagoAnual) {
    const C = P.irpfm;
    if (rendaAnual <= C.rendaMinima) return { renda: r2(rendaAnual), aliquota: 0, devido: 0 };
    const aliquota = Math.min(C.aliquotaMaxima, (rendaAnual / 60000 - 10) / 100);
    const devido = Math.max(0, rendaAnual * aliquota - irPagoAnual);
    return { renda: r2(rendaAnual), aliquota, devido: r2(devido) };
  }

  /* ───────────────────── Equivalências ───────────────────── */

  function bissecao(f, alvo, lo, hi) {
    if (f(hi) < alvo) return null;
    for (let k = 0; k < 80; k++) {
      const mid = (lo + hi) / 2;
      if (f(mid) < alvo) lo = mid;
      else hi = mid;
    }
    return r2(hi);
  }

  /** Salário CLT bruto cujo pacote anual (mesmos benefícios) iguala o líquido anual do PJ. */
  function salarioCLTEquivalente(cltInput, alvoAnual) {
    return bissecao((s) => calcCLT({ ...cltInput, salario: s }).anual.total, alvoAnual, 0, 1e6);
  }

  /** Faturamento mensal (na moeda do PJ) cujo líquido anual iguala o pacote CLT. */
  function faturamentoPJEquivalente(pjInput, alvoAnual) {
    return bissecao((v) => calcPJ({ ...pjInput, faturamento: v }).anual.liquido, alvoAnual, 0, 1e6);
  }

  function comparar(cltInput, pjInput) {
    const clt = calcCLT(cltInput);
    const pj = calcPJ(pjInput);
    return {
      clt,
      pj,
      diferencaAnual: r2(pj.anual.liquido - clt.anual.total),
      diferencaMensal: r2(pj.equivalenteMensal - clt.equivalenteMensal),
      salarioCLTEquivalente: salarioCLTEquivalente(cltInput, pj.anual.liquido),
      faturamentoPJEquivalente: faturamentoPJEquivalente(pjInput, clt.anual.total),
    };
  }

  return {
    params: P,
    inssEmpregado,
    inssSocio,
    irrf,
    redutorIR,
    simplesAliquota,
    calcCLT,
    calcPJ,
    calcIRPFM,
    salarioCLTEquivalente,
    faturamentoPJEquivalente,
    comparar,
  };
});
