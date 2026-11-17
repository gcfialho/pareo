/**
 * Tailwind do Páreo.
 * Tokens semânticos: os componentes usam só estes nomes, nunca a paleta crua.
 * Contraste medido (WCAG) e regras de uso em docs/08-design-e-acessibilidade.md.
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  // O app.js e o build montam HTML em strings, então esses arquivos também são varridos atrás de classes
  content: ['./index.html', './assets/js/**/*.js', './scripts/**/*.mjs', './src/partials/**/*.html'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        canvas: '#f8fafc', // fundo da página
        surface: { DEFAULT: '#ffffff', sunken: '#f1f5f9' },
        ink: { DEFAULT: '#0f172a', muted: '#475569', subtle: '#64748b' }, // 17,9 / 7,6 / 4,8 : 1 no branco
        line: { DEFAULT: '#e2e8f0', control: '#8391a5' }, // separador decorativo / borda de campo (3,2 : 1)
        focus: '#0f172a',
        out: { DEFAULT: '#be123c', soft: '#fda4af', mild: '#fecdd3' }, // dinheiro que sai: texto 6,3 : 1 / barras
        warn: { bg: '#fffbeb', fg: '#92400e', line: '#fde68a' },
        clt: { 50: '#eef4ff', 100: '#c7d7fb', 500: '#3b6fe0', 600: '#2c58c4', 700: '#24479e' },
        pj: { 50: '#ecfbf3', 100: '#bbf0d2', 500: '#16a067', 600: '#0f8455', 700: '#0d6946' },
        chart: { beneficios: '#7dd3fc', cambio: '#fcd34d', custo: '#cbd5e1', das: '#fb7185', pessoal: '#94a3b8' },
        // Rodapé escuro, o mesmo azul-noite do logo. Contraste sobre #0f172a: texto 14,5 : 1, suave 6,9 : 1
        noite: {
          DEFAULT: '#0f172a',
          linha: '#334155',
          texto: '#e2e8f0',
          suave: '#94a3b8',
          clt: '#7aa2ff', // 7,2 : 1
          pj: '#4fd69a', // 9,7 : 1
        },
      },
      typography: ({ theme }) => ({
        // Textos do guia (páginas geradas a partir de docs/*.md)
        pareo: {
          css: {
            '--tw-prose-body': theme('colors.slate.700'),
            '--tw-prose-headings': theme('colors.ink.DEFAULT'),
            '--tw-prose-links': theme('colors.clt.700'),
            '--tw-prose-bold': theme('colors.ink.DEFAULT'),
            '--tw-prose-counters': theme('colors.ink.muted'),
            '--tw-prose-bullets': theme('colors.ink.subtle'),
            '--tw-prose-hr': theme('colors.line.DEFAULT'),
            '--tw-prose-quotes': theme('colors.ink.muted'),
            '--tw-prose-quote-borders': theme('colors.line.control'),
            '--tw-prose-code': theme('colors.ink.DEFAULT'),
            '--tw-prose-pre-code': theme('colors.ink.DEFAULT'),
            '--tw-prose-pre-bg': theme('colors.surface.sunken'),
            '--tw-prose-th-borders': theme('colors.line.control'),
            '--tw-prose-td-borders': theme('colors.line.DEFAULT'),
            a: { textUnderlineOffset: '2px', textDecorationColor: 'rgb(36 71 158 / 0.4)', fontWeight: '500' },
            'a:hover': { textDecorationColor: theme('colors.clt.700') },
            blockquote: { fontStyle: 'normal', fontWeight: '400' },
            'blockquote p:first-of-type::before': { content: 'none' },
            'blockquote p:last-of-type::after': { content: 'none' },
            code: { fontWeight: '500' },
            'code::before': { content: 'none' },
            'code::after': { content: 'none' },
            pre: { border: `1px solid ${theme('colors.line.DEFAULT')}`, fontSize: '0.8125rem', lineHeight: '1.6' },
            table: { fontVariantNumeric: 'tabular-nums', fontSize: '0.875rem' },
            'thead th': { verticalAlign: 'bottom' },
            h2: { scrollMarginTop: '1.5rem' },
            h3: { scrollMarginTop: '1.5rem' },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
