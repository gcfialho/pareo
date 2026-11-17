# Arquitetura e stack

O Páreo é um site estático de uma página. Não tem backend, banco de dados nem framework: o navegador faz todas as contas.

## Stack

| Camada | Tecnologia | Por quê |
|---|---|---|
| Página | HTML semântico | Uma página só; rádios, `details` e tabelas nativas dão acessibilidade de graça |
| Estilo | [Tailwind CSS 3.4](https://tailwindcss.com) com tokens semânticos e o plugin de tipografia | Gera um CSS estático só com as classes usadas |
| Guia | Markdown de `docs/` convertido em HTML no build com o [marked](https://marked.js.org) | Um texto só serve o GitHub e o site |
| Fonte | Inter, pelo Google Fonts | Números tabulares nítidos |
| Lógica | JavaScript puro (ES2020), sem bundler | Quatro arquivos pequenos, carregados em ordem |
| Testes | `node:test`, o executor nativo do Node (22 no CI) | Testa o motor de cálculo e os números citados nos docs, sem navegador |
| Cotação | AwesomeAPI → Banco Central (PTAX) → Frankfurter | APIs públicas, sem chave, com CORS liberado |
| CI | GitHub Actions | Testes e build em todo push e pull request |
| Hospedagem | GitHub Pages, publicado pelo Actions | Grátis, HTTPS, sem servidor |

Dependências de desenvolvimento: `tailwindcss`, `@tailwindcss/typography` e `marked`. Dependências em produção: nenhuma.

## Estrutura de pastas

```
pareo/
├── index.html                 a página
├── assets/
│   ├── js/
│   │   ├── params.js          tabelas legais de 2026 (INSS, IR, Simples, dividendos)
│   │   ├── calc.js            motor de cálculo: funções puras
│   │   ├── cotacao.js         cotação do dólar ao vivo
│   │   ├── formato.js         leitura e escrita de números no formato brasileiro
│   │   └── app.js             interface: formulário, modos e renderização
│   └── img/                   logo, favicon, foto do autor e imagem de compartilhamento (og.png)
├── src/
│   ├── styles.css             entrada do Tailwind: componentes (.card, .btn, .tbl…)
│   └── partials/rodape.html   rodapé compartilhado pela calculadora e pelo guia
├── scripts/
│   └── build.mjs              monta dist/: calculadora, guia, CSS, sitemap; serve em modo dev
├── tests/
│   └── calc.test.js           testes do motor
├── docs/                      regras, fontes e decisões
│   └── assets/                screenshot do README e modelo da imagem de compartilhamento
├── .github/workflows/
│   ├── ci.yml                 testes e build em todo push e pull request
│   └── pages.yml              build e publicação no GitHub Pages a partir da main
├── tailwind.config.js         tokens de cor, fonte e onde procurar classes
├── package.json               scripts: dev, build, test
└── dist/                      site pronto para publicar (gerado, fora do Git)
```

## Como os arquivos se conversam

```
params.js ──► calc.js ──► app.js ──► DOM
                            ▲
              cotacao.js ───┤
              formato.js ───┘
```

1. **`params.js`** exporta um objeto com os números da lei: faixas do INSS e do IR, redução da Lei 15.270, tabelas e repartição do Simples, limites de dividendos. É o primeiro lugar a mudar na virada do ano (ver [Atualizar para um novo ano](#atualizar-para-um-novo-ano)).
2. **`calc.js`** recebe entradas e devolve objetos com o resultado. Não toca no DOM. Funções principais: `calcCLT`, `calcPJ`, `comparar`, `faturamentoPJEquivalente` (busca por bisseção), `salarioCLTEquivalente`.
3. **`cotacao.js`** busca o dólar nas três fontes, em ordem, com tempo limite de 6 s, faixa de sanidade e cache de 15 min.
4. **`formato.js`** lê "12.000", "12.000,50" e "5,78" como número e escreve números no formato brasileiro. Os campos da página são de texto por causa disso.
5. **`app.js`** monta o formulário a partir de um esquema de campos, lê os valores, chama o motor e desenha as três camadas: resultado, "o que fica e o que sai" com o card "E se…?", e o cálculo completo.

`params.js` e `calc.js` usam o formato UMD: funcionam no navegador (como `window.PAREO_PARAMS` e `window.PAREO_CALC`) e no Node (com `require`), o que permite testar o motor sem navegador.

## Estado

- Os valores do formulário ficam no `localStorage` (chave `pareo:v1`). A cotação fica em cache na chave `pareo:cotacao`.
- O modo aparece no endereço (`#clt`, `#meta`, `#comparar`), então dá para compartilhar a página já aberta em um modo.
- Sem `localStorage` (aba anônima, bloqueio), a página funciona com os valores de exemplo.

## Comandos

| Comando | O que faz |
|---|---|
| `npm install` | Instala as dependências de build |
| `npm run dev` | Monta o site, observa mudanças e serve `dist/` em `localhost:8000` |
| `npm test` | Roda os testes do motor |
| `npm run build` | Monta o site em `dist/` |

## Build

`scripts/build.mjs` faz tudo em Node, sem comandos de shell, então roda igual em macOS, Linux e Windows:

1. Copia `assets/js` e `assets/img` para `dist/`.
2. Insere o rodapé de `src/partials/rodape.html` no lugar do marcador `<!-- @rodape -->` do `index.html`.
3. Gera as páginas do guia em `dist/guia/` a partir de `docs/*.md`. Links entre documentos viram links entre páginas; os documentos técnicos (08 e 09) apontam para o GitHub. A lista de páginas e a ordem ficam na constante `GUIA` do script.
4. Compila o CSS com o Tailwind, depois do HTML, para encontrar todas as classes.
5. Escreve `sitemap.xml` e `robots.txt`.

## Publicação

O workflow `pages.yml` roda a cada push na `main`:

1. `npm ci`
2. `npm test`
3. `npm run build`
4. Envia `dist/` como artefato e publica no GitHub Pages

Para ativar: no repositório, **Settings → Pages → Source: GitHub Actions**. O endereço fica `https://gcfialho.github.io/pareo/`.

## Convenções

- **Cores:** só tokens semânticos (`ink`, `surface`, `line`, `out`, `clt`, `pj`, `chart`). Nunca a paleta crua do Tailwind nos componentes. Contraste e regras de uso em [08-design-e-acessibilidade.md](08-design-e-acessibilidade.md).
- **Classes no JavaScript:** o `app.js` monta HTML em texto. Toda classe precisa aparecer escrita por inteiro no código (nada de `'bg-' + cor`), senão o Tailwind não a encontra na compilação.
- **Textos:** português, frases curtas, verbo no início dos botões, sem jargão onde der para evitar.
- **Números:** valores que mudam usam `tabular-nums`.

## Atualizar para um novo ano

1. Troque os valores em `assets/js/params.js` (INSS, IR, salário mínimo, Simples, dividendos) e o campo `atualizadoEm`.
2. Procure valores escritos em texto que dependem da lei: `grep -rn "5.000\|7.350\|600 mil\|2027" assets/js`. Os avisos de `calc.js` e as premissas de `app.js` citam alguns deles.
3. Atualize [06-parametros-2026.md](06-parametros-2026.md) com as fontes novas e os exemplos dos outros documentos.
4. Rode `npm test` e ajuste os testes que conferem valores da lei.

## Imagem de compartilhamento

`assets/img/og.png` (1200×630) é gerada a partir de `docs/assets/og-card.html`: abra o arquivo num navegador com janela de 1200×630 e capture a tela.
