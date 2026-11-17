/**
 * Parâmetros legais usados pelo Páreo (ano-base 2026).
 * Fontes em docs/06-parametros-2026.md. É o primeiro arquivo a mudar na virada do ano:
 * veja o passo a passo em docs/09-arquitetura.md.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PAREO_PARAMS = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  return {
    ano: 2026,
    atualizadoEm: '2026-11-17',

    salarioMinimo: 1621.0,

    // INSS empregado CLT — tabela progressiva (Portaria Interministerial MPS/MF nº 13/2026)
    inss: {
      faixas: [
        { ate: 1621.0, aliquota: 0.075 },
        { ate: 2902.84, aliquota: 0.09 },
        { ate: 4354.27, aliquota: 0.12 },
        { ate: 8475.55, aliquota: 0.14 },
      ],
      teto: 8475.55,
      // Sócio (contribuinte individual) com retenção pela empresa: 11% até o teto
      contribuinteIndividual: 0.11,
    },

    // IRRF mensal — tabela progressiva (inalterada desde maio/2025)
    irrf: {
      faixas: [
        { ate: 2428.8, aliquota: 0, deduzir: 0 },
        { ate: 2826.65, aliquota: 0.075, deduzir: 182.16 },
        { ate: 3751.05, aliquota: 0.15, deduzir: 394.16 },
        { ate: 4664.68, aliquota: 0.225, deduzir: 675.49 },
        { ate: Infinity, aliquota: 0.275, deduzir: 908.73 },
      ],
      deducaoDependente: 189.59,
      descontoSimplificado: 607.2,
      // Redução mensal da Lei 15.270/2025 (vigente desde jan/2026)
      redutor: {
        isencaoAte: 5000.0,
        reducaoMaxima: 312.89,
        faixaParcialAte: 7350.0,
        constante: 978.62,
        fator: 0.133145,
      },
    },

    fgts: { aliquota: 0.08, multaRescisoria: 0.4 },

    // Encargos patronais típicos de empresa no Lucro Presumido/Real (informativo)
    encargosPatronais: { cpp: 0.2, rat: 0.02, terceiros: 0.058 },

    // Lei 15.270/2025 — lucros e dividendos
    dividendos: {
      limiteMensalSemRetencao: 50000.0,
      aliquotaRetencao: 0.1,
    },
    irpfm: { rendaMinima: 600000.0, rendaTeto: 1200000.0, aliquotaMaxima: 0.1 },

    // Simples Nacional — LC 123/2006 com redação da LC 155/2016
    // reparticao: percentuais do DAS destinados a cada tributo em cada faixa
    simples: {
      limiteAnual: 4800000.0,
      fatorRMinimo: 0.28,
      anexos: {
        III: [
          { ate: 180000, nominal: 0.06, deduzir: 0, rep: { irpj: 0.04, csll: 0.035, cofins: 0.1282, pis: 0.0278, cpp: 0.434, iss: 0.335 } },
          { ate: 360000, nominal: 0.112, deduzir: 9360, rep: { irpj: 0.04, csll: 0.035, cofins: 0.1405, pis: 0.0305, cpp: 0.434, iss: 0.32 } },
          { ate: 720000, nominal: 0.135, deduzir: 17640, rep: { irpj: 0.04, csll: 0.035, cofins: 0.1364, pis: 0.0296, cpp: 0.434, iss: 0.325 } },
          { ate: 1800000, nominal: 0.16, deduzir: 35640, rep: { irpj: 0.04, csll: 0.035, cofins: 0.1364, pis: 0.0296, cpp: 0.434, iss: 0.325 } },
          { ate: 3600000, nominal: 0.21, deduzir: 125640, rep: { irpj: 0.04, csll: 0.035, cofins: 0.1282, pis: 0.0278, cpp: 0.434, iss: 0.335 } },
          { ate: 4800000, nominal: 0.33, deduzir: 648000, rep: { irpj: 0.35, csll: 0.15, cofins: 0.1603, pis: 0.0347, cpp: 0.305, iss: 0 } },
        ],
        V: [
          { ate: 180000, nominal: 0.155, deduzir: 0, rep: { irpj: 0.25, csll: 0.15, cofins: 0.141, pis: 0.0305, cpp: 0.2885, iss: 0.14 } },
          { ate: 360000, nominal: 0.18, deduzir: 4500, rep: { irpj: 0.23, csll: 0.15, cofins: 0.141, pis: 0.0305, cpp: 0.2785, iss: 0.17 } },
          { ate: 720000, nominal: 0.195, deduzir: 9900, rep: { irpj: 0.24, csll: 0.15, cofins: 0.1492, pis: 0.0323, cpp: 0.2385, iss: 0.19 } },
          { ate: 1800000, nominal: 0.205, deduzir: 17100, rep: { irpj: 0.21, csll: 0.15, cofins: 0.1574, pis: 0.0341, cpp: 0.2385, iss: 0.21 } },
          { ate: 3600000, nominal: 0.23, deduzir: 62100, rep: { irpj: 0.23, csll: 0.125, cofins: 0.141, pis: 0.0305, cpp: 0.2385, iss: 0.235 } },
          { ate: 4800000, nominal: 0.305, deduzir: 540000, rep: { irpj: 0.35, csll: 0.155, cofins: 0.1644, pis: 0.0356, cpp: 0.295, iss: 0 } },
        ],
      },
    },
  };
});
