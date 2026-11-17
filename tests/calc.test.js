/**
 * Testes do motor de cálculo e do formato de números.
 * Rodar: npm test (usa o executor nativo do Node, node:test).
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../assets/js/calc.js');
const { lerNumero, escreverNumero } = require('../assets/js/formato.js');

const perto = (obtido, esperado, tolerancia, msg = '') =>
  assert.ok(Math.abs(obtido - esperado) <= tolerancia, `${msg} esperado ${esperado}, obtido ${obtido}`);

// Cenário B da documentação (docs/README.md): a planilha de partida
const cltB = { salario: 16000, vr: 990, saude: 300, dependentes: 0 };
const pjB = { moeda: 'USD', faturamento: 5300, cotacao: 5.5, taxaCambio: 1, iof: 0.38, contabilidade: 150, mesesAtivos: 12, regime: 'auto', exportacao: true };
// Cenário A: o exemplo da página
const cltA = { salario: 12000, vr: 1000, saude: 400 };
const pjA = { ...pjB, faturamento: 3500, contabilidade: 200 };

describe('INSS e IR de 2026', () => {
  it('INSS do empregado vai de R$ 121,58 a R$ 988,09 (teto)', () => {
    perto(C.inssEmpregado(1621), 121.58, 0.01);
    perto(C.inssEmpregado(20000), 988.09, 0.02);
  });

  it('IR é zero até R$ 5 mil (Lei 15.270/2025)', () => {
    assert.equal(C.irrf(5000, C.inssEmpregado(5000)).valor, 0);
  });

  it('a redução do IR bate com os exemplos da Receita e zera acima de R$ 7.350', () => {
    perto(C.redutorIR(5900), 193.06, 0.01);
    perto(C.redutorIR(6000), 179.75, 0.01);
    assert.equal(C.redutorIR(7350.01), 0);
  });

  it('IRRF de um salário de R$ 16 mil usa a faixa de 27,5%', () => {
    perto(C.calcCLT(cltB).mensal.irrf, 15011.91 * 0.275 - 908.73, 0.02);
  });
});

describe('CLT', () => {
  it('paga 13,33 salários brutos por ano (12 + 13º + 1/3 de férias)', () => {
    perto(C.calcCLT({ salario: 9000 }).anual.bruto / 9000, 13 + 1 / 3, 1e-6);
  });
});

describe('Simples Nacional', () => {
  it('alíquota efetiva do Anexo III na 2ª faixa', () => {
    const a = C.simplesAliquota('III', 349800, false);
    perto(a.efetiva, (349800 * 0.112 - 9360) / 349800, 1e-9);
  });

  it('exportação tira PIS, COFINS e ISS do DAS', () => {
    const a = C.simplesAliquota('III', 349800, false);
    const x = C.simplesAliquota('III', 349800, true);
    perto(x.aplicada, a.efetiva * (1 - 0.0305 - 0.1405 - 0.32), 1e-9);
  });

  it('a repartição de cada faixa soma 100%', () => {
    for (const anexo of ['III', 'V']) {
      for (const f of C.params.simples.anexos[anexo]) {
        perto(Object.values(f.rep).reduce((a, b) => a + b, 0), 1, 1e-9, `${anexo} até ${f.ate}`);
      }
    }
  });

  it('o anexo sai do Fator R nos dois sentidos', () => {
    assert.equal(C.calcPJ({ ...pjB, moeda: 'BRL', faturamento: 5000, regime: 'V' }).regime, 'III');
    assert.equal(C.calcPJ({ ...pjB, moeda: 'BRL', faturamento: 20000, regime: 'III', proLaboreManual: 2000 }).regime, 'V');
  });
});

describe('PJ', () => {
  it('contrato em reais não paga câmbio nem IOF', () => {
    assert.equal(C.calcPJ({ ...pjB, moeda: 'BRL', faturamento: 20000 }).mensal.custoCambio, 0);
  });

  it('retém 10% quando o lucro do mês passa de R$ 50 mil', () => {
    assert.ok(C.calcPJ({ ...pjB, faturamento: 20000, regime: 'V' }).mensal.retencao > 0);
  });

  it('imposto mínimo (IRPFM): 0% em R$ 600 mil e 5% em R$ 900 mil', () => {
    assert.equal(C.calcIRPFM(600000, 0).devido, 0);
    perto(C.calcIRPFM(900000, 0).aliquota, 0.05, 1e-9);
  });

  it('mês sem faturamento ainda paga a contabilidade', () => {
    assert.equal(C.calcPJ({ ...pjB, mesesAtivos: 11 }).anual.custoInativo, 150);
  });
});

describe('Robustez', () => {
  it('sem faturamento o resultado do PJ é negativo, com aviso', () => {
    const zero = C.calcPJ({ ...pjB, faturamento: 0 });
    assert.ok(zero.anual.liquido < 0);
    assert.ok(zero.avisos.some((a) => a.includes('maior que zero')));
  });

  it('o PJ nunca deixa no bolso mais do que faturou', () => {
    for (const faturamento of [0, 300, 1000, 3000, 10000, 40000]) {
      for (const extra of [{}, { proLaboreManual: 100000 }, { fatorR: 5 }, { regime: 'V' }]) {
        const r = C.calcPJ({ ...pjB, faturamento, ...extra });
        assert.ok(r.anual.liquido <= r.anual.faturamento + 0.01, `${faturamento} ${JSON.stringify(extra)}`);
      }
    }
  });

  it('pró-labore maior que o faturamento gera aviso de falta de caixa', () => {
    const r = C.calcPJ({ ...pjB, moeda: 'BRL', faturamento: 20000, proLaboreManual: 100000 });
    assert.ok(r.mensal.lucro < 0 && r.avisos.some((a) => a.includes('não cobre')));
  });

  it('regime inválido vira automático e entrada vazia usa o padrão', () => {
    assert.doesNotThrow(() => C.calcPJ({ ...pjB, regime: 'IV' }));
    assert.equal(C.calcPJ({ ...pjB, mesesAtivos: '' }).anual.meses, 12);
  });
});

describe('Equivalências', () => {
  it('fecham o ciclo nos dois sentidos', () => {
    const r = C.comparar(cltB, pjB);
    perto(C.calcCLT({ ...cltB, salario: r.salarioCLTEquivalente }).anual.total, r.pj.anual.liquido, 1);
    perto(C.calcPJ({ ...pjB, faturamento: r.faturamentoPJEquivalente }).anual.liquido, r.clt.anual.total, 1);
  });

  it('sem férias pagas (11 meses) o empate exige cerca de 10% a mais', () => {
    const alvo = C.calcCLT(cltB).anual.total;
    const f12 = C.faturamentoPJEquivalente({ ...pjB, mesesAtivos: 12 }, alvo);
    const f11 = C.faturamentoPJEquivalente({ ...pjB, mesesAtivos: 11 }, alvo);
    assert.ok(f11 > f12 * 1.08);
  });
});

// Os números abaixo aparecem na documentação; se mudarem, atualize os docs junto
describe('Números citados na documentação', () => {
  it('cenário A: CLT e faturamento de empate', () => {
    const clt = C.calcCLT(cltA);
    assert.equal(Math.round(clt.equivalenteMensal), 12342);
    assert.equal(Math.round(clt.anual.total), 148101);
    assert.equal(Math.round(C.faturamentoPJEquivalente(pjA, clt.anual.total)), 2466);
    assert.equal(Math.round(C.faturamentoPJEquivalente({ ...pjA, mesesAtivos: 11 }, clt.anual.total)), 2690);
  });

  it('cenário B: CLT, PJ e empate', () => {
    const r = C.comparar(cltB, pjB);
    assert.equal(Math.round(r.clt.anual.total), 189714);
    assert.equal(Math.round(r.pj.mensal.liquido), 25346);
    assert.equal(Math.round(r.pj.anual.liquido), 304155);
    assert.equal(Math.round(r.faturamentoPJEquivalente), 3150);
  });
});

describe('Números no formato brasileiro', () => {
  it('lê milhar com ponto e decimal com vírgula', () => {
    const casos = [
      ['12.000', true, 12000], ['12.000,50', true, 12000.5], ['12000', true, 12000], ['1.234.567', true, 1234567],
      ['R$ 16.000', true, 16000], ['5,7744', false, 5.7744], ['5.7744', false, 5.7744], ['0,38', false, 0.38],
      ['0.38', false, 0.38], ['1', true, 1], ['', true, null], ['  ', true, null],
    ];
    for (const [texto, milhar, esperado] of casos) assert.equal(lerNumero(texto, { milhar }), esperado, texto);
  });

  it('recusa texto, sinal de menos e separadores repetidos', () => {
    for (const [texto, milhar] of [['-500', true], ['abc', true], ['1,2,3', true], ['1.2.3', false]]) {
      assert.equal(lerNumero(texto, { milhar }), undefined, texto);
    }
  });

  it('escreve números para os campos', () => {
    assert.equal(escreverNumero(12000), '12.000');
    assert.equal(escreverNumero(5.7744, 4), '5,7744');
    assert.equal(escreverNumero(''), '');
    assert.equal(escreverNumero(12000.5, 2, true), '12.000,50');
    assert.equal(escreverNumero(12000, 2, true), '12.000');
  });
});
