/**
 * Build do Páreo: monta o site estático em dist/.
 *
 *   node scripts/build.mjs           monta o site
 *   node scripts/build.mjs --serve   monta, observa mudanças e serve em http://localhost:8000
 *
 * Etapas: copia a calculadora, insere o rodapé compartilhado, gera as páginas do guia
 * a partir de docs/*.md, compila o CSS com o Tailwind e escreve o sitemap.
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { Marked } from 'marked';

const require = createRequire(import.meta.url);
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(RAIZ, 'dist');
const REPO = 'https://github.com/gcfialho/pareo';
const SITE = 'https://gcfialho.github.io/pareo/';
const PORTA = 8000;

// Páginas do guia, na ordem de leitura. Os documentos técnicos (08 e 09) ficam só no GitHub.
const GUIA = [
  { md: 'README.md', slug: 'index', menu: 'Visão geral' },
  { md: '05-modelo-de-calculo.md', slug: 'como-a-conta-e-feita', menu: 'Como a conta é feita', resumo: 'As fórmulas do CLT e do PJ, os três modos da calculadora e o que fica de fora da conta.' },
  { md: '02-clt.md', slug: 'clt', menu: 'CLT na prática', resumo: 'INSS, IR, férias, 13º, FGTS e benefícios: o que chega ao seu bolso e o que fica retido.' },
  { md: '03-pj-simples-nacional.md', slug: 'pj-simples', menu: 'PJ no Simples Nacional', resumo: 'Anexos III e V, Fator R, exportação de serviços, pró-labore, lucros e câmbio.' },
  { md: '04-mudancas-2026-e-reforma.md', slug: 'mudancas-2026', menu: 'O que mudou em 2026', resumo: 'IR isento até R$ 5 mil, tributação de dividendos, imposto mínimo e reforma tributária.' },
  { md: '01-erros-comuns.md', slug: 'erros-comuns', menu: 'Erros comuns', resumo: 'Os enganos que mais distorcem uma comparação entre CLT e PJ, com o tamanho de cada um.' },
  { md: '07-cotacao-do-dolar.md', slug: 'cotacao-do-dolar', menu: 'Cotação do dólar', resumo: 'De onde vem a cotação, qual taxa usar e o que acontece quando uma fonte falha.' },
  { md: '06-parametros-2026.md', slug: 'fontes', menu: 'Tabelas e fontes', resumo: 'Os valores de 2026 usados na conta e a fonte de cada um.' },
];
const slugDoMd = Object.fromEntries(GUIA.map((g) => [g.md, g.slug]));

const ler = (...p) => fs.readFileSync(path.join(RAIZ, ...p), 'utf8');
const escrever = (destino, conteudo) => {
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, conteudo);
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/* ───────────── Peças compartilhadas ───────────── */

function parametros() {
  delete require.cache[require.resolve('../assets/js/params.js')];
  const P = require('../assets/js/params.js');
  return { ano: P.ano, atualizado: new Date(`${P.atualizadoEm}T12:00:00`).toLocaleDateString('pt-BR') };
}

/** Rodapé de src/partials/rodape.html, com o caminho até a raiz e as datas. */
function rodape(base, espacoInferior = '') {
  const { ano, atualizado } = parametros();
  return ler('src', 'partials', 'rodape.html')
    .replace(/^<!--[\s\S]*?-->\s*/, '')
    .replaceAll('{{base}}', base)
    .replaceAll('{{ano}}', String(ano))
    .replaceAll('{{atualizado}}', atualizado)
    .replaceAll('{{espacoInferior}}', espacoInferior);
}

const LOGO = '<svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#0f172a"/><rect x="7" y="7.5" width="18" height="2" rx="1" fill="#ffffff"/><rect x="8.5" y="12" width="6" height="12.5" rx="2" fill="#3b6fe0"/><rect x="17.5" y="12" width="6" height="12.5" rx="2" fill="#16a067"/></svg>';
const ICONE_GITHUB = '<svg class="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';

/** Topo das páginas do guia: marca, volta para a calculadora e GitHub. */
function topoGuia(ehIndice) {
  return `<header class="border-b border-line bg-surface">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
      <a href="../" class="-m-1 flex shrink-0 items-center gap-2.5 rounded-lg p-1" aria-label="Páreo, voltar à calculadora">${LOGO}<span class="hidden text-lg font-bold tracking-tight min-[360px]:inline">Páreo</span></a>
      <nav aria-label="Principal" class="flex items-center gap-1">
        <a class="nav-link" href="../">Calculadora</a>
        <a class="nav-link bg-surface-sunken text-ink" href="./"${ehIndice ? ' aria-current="page"' : ''}>Como funciona</a>
        <a class="nav-link hidden sm:inline-flex" href="${REPO}" rel="noopener">${ICONE_GITHUB}GitHub</a>
      </nav>
    </div>
  </header>`;
}

/* ───────────── Markdown → HTML ───────────── */

/** Mesmo formato de âncora do GitHub, para os links "#secao" funcionarem nos dois lugares. */
const slugTitulo = (texto) =>
  texto.toLowerCase().trim()
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s/g, '-');

/** Links entre documentos viram links entre páginas; documentos que não estão no guia apontam para o GitHub. */
function reescreverLink(href) {
  if (/^(https?:|mailto:|#)/.test(href)) return href;
  const [arquivo, ancora] = href.split('#');
  const sufixo = ancora ? `#${ancora}` : '';
  const nome = path.basename(arquivo);
  if (nome in slugDoMd) return `${slugDoMd[nome]}.html${sufixo}`;
  return `${REPO}/blob/main/docs/${arquivo}${sufixo}`;
}

const marked = new Marked({
  gfm: true,
  renderer: {
    heading({ tokens, depth, text }) {
      return `<h${depth} id="${esc(slugTitulo(text))}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
    },
    link({ href, title, tokens }) {
      const destino = reescreverLink(href);
      const externo = /^https?:/.test(destino) ? ' rel="noopener"' : '';
      return `<a href="${esc(destino)}"${title ? ` title="${esc(title)}"` : ''}${externo}>${this.parser.parseInline(tokens)}</a>`;
    },
  },
});

/**
 * A visão geral do site não é o índice de arquivos do GitHub (docs/README.md):
 * mostra as páginas do guia e reaproveita a parte dos cenários, que outras páginas citam.
 */
function visaoGeral() {
  const readme = ler('docs', 'README.md');
  const cenarios = readme.slice(readme.indexOf('## Cenários dos exemplos'));
  const cartoes = GUIA.filter((g) => g.resumo).map((g) => `<li><a href="${g.slug}.html" class="block h-full rounded-xl border border-line bg-surface p-4 hover:border-line-control">
      <span class="block font-semibold text-ink">${esc(g.menu)}</span>
      <span class="mt-1 block text-sm leading-relaxed text-ink-muted">${esc(g.resumo)}</span></a></li>`).join('\n');
  const titulo = 'Como o Páreo calcula';
  const descricao = 'As regras de 2026 para CLT e para PJ no Simples Nacional, como a conta é montada e de onde vêm as tabelas.';
  const html = `<h1 id="como-o-páreo-calcula">${titulo}</h1>
    <p class="lead">Cada número da calculadora vem de uma regra com fonte. Este guia explica ${descricao.charAt(0).toLowerCase() + descricao.slice(1)}</p>
    <ul class="not-prose my-8 grid gap-3 sm:grid-cols-2">${cartoes}</ul>
    ${marked.parse(cenarios).replace(/<table>/g, '<div class="tabela"><table>').replace(/<\/table>/g, '</table></div>')}`;
  return { titulo, descricao, html };
}

function renderizarDoc(md) {
  if (md === 'README.md') return visaoGeral();
  const texto = ler('docs', md);
  const titulo = (texto.match(/^#\s+(.+)$/m) || [, 'Páreo'])[1].trim();
  const paragrafo = texto.split(/\n{2,}/).find((b) => b.trim() && !/^[#|>`!-]/.test(b.trim())) || '';
  const descricao = paragrafo.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*`_]/g, '').replace(/\s+/g, ' ').trim().slice(0, 160);
  const html = marked.parse(texto)
    .replace(/<table>/g, '<div class="tabela"><table>')
    .replace(/<\/table>/g, '</table></div>');
  return { titulo, descricao, html };
}

/* ───────────── Páginas ───────────── */

function paginaGuia(g, i) {
  const { titulo, descricao, html } = renderizarDoc(g.md);
  const anterior = GUIA[i - 1];
  const proxima = GUIA[i + 1];
  const itens = GUIA.map((x) => `<li><a class="guia-link" href="${x.slug === 'index' ? './' : `${x.slug}.html`}"${x === g ? ' aria-current="page"' : ''}>${esc(x.menu)}</a></li>`).join('\n');
  const url = `${SITE}guia/${g.slug === 'index' ? '' : `${g.slug}.html`}`;
  const cartao = (pagina, rotulo, alinhamento) => pagina
    ? `<a href="${pagina.slug === 'index' ? './' : `${pagina.slug}.html`}" class="rounded-xl border border-line bg-surface p-4 hover:border-line-control ${alinhamento}">
        <span class="block text-xs text-ink-subtle">${rotulo}</span><span class="mt-1 block font-semibold text-ink">${esc(pagina.menu)}</span></a>`
    : '<span aria-hidden="true"></span>';

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${esc(titulo)} | Páreo</title>
  <meta name="description" content="${esc(descricao)}" />
  <meta name="theme-color" content="#0f172a" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${esc(titulo)} | Páreo" />
  <meta property="og:description" content="${esc(descricao)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${SITE}assets/img/og.png" />
  <meta property="og:locale" content="pt_BR" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="canonical" href="${url}" />
  <link rel="icon" type="image/svg+xml" href="../assets/img/favicon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../assets/css/pareo.css" />
</head>
<body class="flex min-h-screen flex-col bg-canvas font-sans text-ink antialiased">
  <a href="#conteudo" class="sr-only z-30 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Pular para o conteúdo</a>
  ${topoGuia(g.slug === 'index')}

  <div class="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-12 lg:py-12">
    <nav aria-label="Páginas do guia" class="hidden lg:sticky lg:top-6 lg:block lg:self-start">
      <p class="mb-2 px-3 text-sm font-semibold">Como funciona</p>
      <ul class="space-y-0.5">${itens}</ul>
    </nav>

    <details class="group rounded-xl border border-line bg-surface lg:hidden">
      <summary class="flex min-h-[44px] cursor-pointer select-none items-center justify-between gap-3 rounded-xl px-4 py-2 text-sm">
        <span class="font-semibold">Páginas do guia</span>
        <span class="truncate text-ink-muted">${esc(g.menu)}</span>
      </summary>
      <nav aria-label="Páginas do guia" class="border-t border-line p-2"><ul class="space-y-0.5">${itens}</ul></nav>
    </details>

    <main id="conteudo" class="min-w-0">
      <article class="prose prose-pareo max-w-[72ch]">
        ${html}
      </article>

      <nav aria-label="Página anterior e próxima" class="mt-12 grid max-w-[72ch] gap-3 border-t border-line pt-6 sm:grid-cols-2">
        ${cartao(anterior, 'Anterior', '')}
        ${cartao(proxima, 'Próxima', 'sm:text-right')}
      </nav>
      <p class="mt-6 max-w-[72ch] text-sm text-ink-muted">
        Encontrou algo errado nesta página? <a class="font-medium text-clt-700 underline decoration-clt-700/40 underline-offset-2 hover:decoration-clt-700" href="${REPO}/edit/main/docs/${g.md}" rel="noopener">Sugerir uma correção no GitHub</a>
      </p>
    </main>
  </div>

  ${rodape('../')}
</body>
</html>
`;
}

/* ───────────── Build ───────────── */

function build() {
  const inicio = Date.now();
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  // Calculadora
  for (const pasta of ['js', 'img']) fs.cpSync(path.join(RAIZ, 'assets', pasta), path.join(DIST, 'assets', pasta), { recursive: true });
  const indice = ler('index.html');
  if (!indice.includes('<!-- @rodape -->')) throw new Error('index.html precisa do marcador <!-- @rodape -->');
  escrever(path.join(DIST, 'index.html'), indice.replace('<!-- @rodape -->', rodape('')));

  // Guia
  GUIA.forEach((g, i) => escrever(path.join(DIST, 'guia', `${g.slug === 'index' ? 'index' : g.slug}.html`), paginaGuia(g, i)));

  // CSS: depois do HTML, para o Tailwind encontrar todas as classes
  execFileSync(process.execPath, [require.resolve('tailwindcss/lib/cli.js'), '-i', 'src/styles.css', '-o', 'dist/assets/css/pareo.css', '--minify'], { cwd: RAIZ, stdio: 'pipe' });

  // SEO
  const urls = ['', 'guia/', ...GUIA.filter((g) => g.slug !== 'index').map((g) => `guia/${g.slug}.html`)];
  escrever(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
  escrever(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}sitemap.xml\n`);

  console.log(`Site montado em dist/ (${GUIA.length} páginas do guia) em ${Date.now() - inicio} ms`);
}

/* ───────────── Servidor local ───────────── */

const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain' };

function servir() {
  http.createServer((req, res) => {
    const caminho = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let arquivo = path.normalize(path.join(DIST, caminho));
    if (!arquivo.startsWith(DIST)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(arquivo) && fs.statSync(arquivo).isDirectory()) arquivo = path.join(arquivo, 'index.html');
    if (!fs.existsSync(arquivo)) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Página não encontrada'); return; }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(arquivo).pipe(res);
  }).listen(PORTA, () => console.log(`Páreo em http://localhost:${PORTA} (Ctrl+C para sair)`));

  let espera;
  const observar = (alvo) => fs.watch(path.join(RAIZ, alvo), { recursive: true }, () => {
    clearTimeout(espera);
    espera = setTimeout(() => { try { build(); } catch (e) { console.error(e.message); } }, 150);
  });
  ['index.html', 'assets/js', 'assets/img', 'src', 'docs', 'tailwind.config.js'].forEach(observar);
}

build();
if (process.argv.includes('--serve')) servir();
