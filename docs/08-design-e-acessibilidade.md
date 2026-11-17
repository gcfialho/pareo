# Design e acessibilidade

As regras visuais do Páreo e o motivo de cada uma. Leia antes de mudar cores, componentes ou interações.

## Princípios

1. **A resposta primeiro.** Cada modo abre com uma frase e um número. Os detalhes vêm depois, e o cálculo completo fica recolhido.
2. **A mesma unidade dos dois lados.** CLT e PJ sempre aparecem como "média mensal no ano", e o "no bolso, todo mês" fica como linha secundária.
3. **Cor nunca sozinha.** Todo número negativo tem sinal (−), toda aba marcada tem fundo e peso diferentes, e toda barra tem legenda com valor.
4. **Plataforma antes de código.** Rádios, `<details>`, `<table>` e `<label>` nativos, em vez de componentes refeitos à mão.

## Cores

As cores ficam em `tailwind.config.js` como **tokens semânticos**. Os componentes usam só esses nomes, nunca a paleta crua do Tailwind (`slate-500`, `rose-600`). Para trocar uma cor, mude o token.

### Texto e superfícies

Contraste WCAG medido sobre o fundo em que o texto aparece.

| Token | Cor | Uso | Contraste |
|---|---|---|---|
| `ink` | `#0f172a` | Texto principal, números | 17,9:1 no branco |
| `ink-muted` | `#475569` | Texto secundário, rótulos | 7,6:1 no branco; 6,9:1 ou mais nos fundos coloridos |
| `ink-subtle` | `#64748b` | Dicas e legendas, **só sobre branco ou `canvas`** | 4,8:1 no branco; 4,5:1 no `canvas` |
| `canvas` | `#f8fafc` | Fundo da página | |
| `surface` / `surface-sunken` | `#ffffff` / `#f1f5f9` | Cards / áreas internas, abas | |
| `line` | `#e2e8f0` | Separadores decorativos | |
| `line-control` | `#8391a5` | Borda de campos e botões | 3,2:1 no branco |
| `focus` | `#0f172a` | Contorno de foco | 17,9:1 no branco |

> `ink-subtle` sobre `clt-50` ou `pj-50` fica abaixo de 4,5:1. Nesses fundos, use `ink-muted`.

### Rodapé

O rodapé usa o azul-noite do logo e fecha todas as páginas com a identidade do Páreo.

| Token | Cor | Uso | Contraste sobre `noite` |
|---|---|---|---|
| `noite` | `#0f172a` | Fundo do rodapé | |
| `noite-texto` | `#e2e8f0` | Links | 14,5:1 |
| `noite-suave` | `#94a3b8` | Textos de apoio | 7,0:1 |
| `noite-linha` | `#334155` | Separador | |
| `noite-clt` / `noite-pj` | `#7aa2ff` / `#4fd69a` | "CLT" e "PJ" na frase da marca | 7,2:1 / 9,7:1 |

### Significado

| Token | Significado | Observação |
|---|---|---|
| `clt-*` | Tudo que é do lado CLT | `clt-700` sobre `clt-50`: 7,7:1 |
| `pj-*` | Tudo que é do lado PJ, e valores positivos | `pj-700` no branco: 6,7:1 |
| `out` | Dinheiro que sai: impostos, valores negativos | Texto `out` no branco: 6,3:1. `out-soft` e `out-mild` só em barras |
| `warn-*` | Avisos | `warn-fg` sobre `warn-bg`: 6,8:1 |
| `chart-*` | Segmentos de barra: benefícios, câmbio, custos, DAS, gastos pessoais | Sempre com legenda escrita |

Azul e verde identificam o **lado** (CLT ou PJ), não "bom" ou "ruim". Para ganho ou perda, use o sinal e o token `out`.

## Componentes

Definidos em `src/styles.css`.

| Classe | O que é | Regra |
|---|---|---|
| `.card`, `.card-title` | Bloco de conteúdo e seu título | Um assunto por card |
| `.field-label`, `.field-input`, `.field-hint` | Campo de formulário | Toda dica ligada ao campo por `aria-describedby` |
| `.affix` | "R$", "US$" ou "%" dentro do campo | `aria-hidden`; a unidade também vai no rótulo quando importa |
| `.btn`, `.btn-link` | Botão e botão com cara de link | Texto começando por verbo: "Atualizar", "Ver resultado" |
| `.seg` | Controle segmentado (modos e abas do "E se…?") | Rádios nativos escondidos; o rótulo é o alvo |
| `.tbl` | Tabela de números | `<caption>`, `<th scope="col">` e `<th scope="row">` |
| `.dot` | Marcador de cor do lado | Decorativo, sempre ao lado de um texto |
| `.nav-link` | Link do topo ("Calculadora", "Como funciona") | Página atual com `aria-current="page"` |
| `.rodape-link` | Link do rodapé escuro | Foco com contorno branco |
| `.guia-link`, `prose-pareo` | Menu lateral e textos do guia | O texto do guia vem dos Markdown; não escreva HTML neles |

**Classes montadas no JavaScript:** o `app.js` gera HTML em texto. Escreva cada classe por inteiro (`'bg-pj-500'`), nunca montada (`'bg-' + cor`), senão o Tailwind não a inclui no CSS.

## Tipografia

- Fonte Inter, de 400 a 700.
- Campos com **16px no celular** e 14px a partir de `sm`. Abaixo de 16px, o Safari no iPhone dá zoom ao focar o campo.
- Texto de interface com **no mínimo 12px**. O único texto menor são os selos "em uso" e "escolhido" (11px, em negrito).
- Números que mudam usam `tabular-nums`, para não pularem de largura.
- Títulos com `text-balance`; parágrafos com `text-pretty` e largura máxima de leitura (`max-w-prose`).

## Acessibilidade

| Decisão | Como | Por quê |
|---|---|---|
| Foco visível | Borda e anel de 1px em `focus` nos campos; anel de 2px nos itens `.seg` | Contorno de 2px a 17,9:1 |
| Resultado anunciado sem ruído | Região `role="status"` só com a frase do resultado, atualizada 700 ms depois da última tecla | O leitor de tela não repete o card inteiro a cada número |
| Abas sem perder o foco | As abas só são recriadas quando o conjunto muda; senão, só muda qual está marcada | Quem navega pelo teclado continua na aba depois de trocar |
| Tabelas legíveis por leitor de tela | `<caption>`, cabeçalhos de linha e coluna; "—" com texto oculto "não se aplica" | Cada valor é anunciado com o que ele significa |
| Alvos de toque | Itens `.seg` com 44px de altura; resumos e links com pelo menos 24px | WCAG 2.5.8 |
| Sem rolagem lateral | Contêineres de tabela com `relative overflow-x-auto` e `min-w-0` | A página cabe em 320px; só a tabela rola |
| Barra fixa no celular | Aparece quando o resultado sai da tela (`IntersectionObserver`) e usa `env(safe-area-inset-bottom)` | A resposta continua visível enquanto você edita |
| Movimento reduzido | A rolagem até o seletor de modo respeita `prefers-reduced-motion`; as transições duram 150 ms e mexem só em cor, borda, sombra e transformações (escala do botão, seta do "Cálculo completo") | Nada depende de animação para ser entendido |
| Avisos com saída | Toda mensagem de aviso ou erro diz o que fazer, por exemplo "Aumente o faturamento ou reduza os custos da empresa" | O usuário sabe como resolver |

## Antes de publicar uma mudança visual

- [ ] `npm run dev` sem erros ou avisos no console, na calculadora e no guia.
- [ ] 320px, 390px e 1280px nos três modos, sem rolagem horizontal (`document.documentElement.scrollWidth` igual à largura da janela).
- [ ] Tab por toda a página: o foco aparece em cada parada e as abas mantêm o foco.
- [ ] Cor nova? Meça o contraste sobre o fundo real: 4,5:1 para texto, 3:1 para bordas de campo e ícones.
- [ ] Classe nova no `app.js` escrita por inteiro.
- [ ] Textos novos: frases curtas, botão começando por verbo, aviso dizendo como resolver.

Ainda não verificado: leitor de tela real (VoiceOver, NVDA), modo de cores forçadas do Windows e zoom de 200%.
