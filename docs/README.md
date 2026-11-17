# Documentação do Páreo

Como o Páreo calcula, de onde vêm as regras e por que o projeto é organizado assim.

## Regras e cálculo

| Arquivo | Conteúdo |
|---|---|
| [01-erros-comuns.md](01-erros-comuns.md) | Os erros mais comuns ao comparar CLT e PJ, e o tamanho de cada um |
| [02-clt.md](02-clt.md) | O que um CLT recebe de verdade: INSS, IR, férias, 13º, FGTS e benefícios |
| [03-pj-simples-nacional.md](03-pj-simples-nacional.md) | Empresa de TI no Simples: anexos, Fator R, exportação, pró-labore, lucros e câmbio |
| [04-mudancas-2026-e-reforma.md](04-mudancas-2026-e-reforma.md) | O que mudou em 2026: IR isento até R$ 5 mil, dividendos, IRPFM, LC 224/2025 e CBS/IBS |
| [05-modelo-de-calculo.md](05-modelo-de-calculo.md) | As fórmulas de `calc.js` e os três modos da página |
| [06-parametros-2026.md](06-parametros-2026.md) | As tabelas usadas e as fontes |
| [07-cotacao-do-dolar.md](07-cotacao-do-dolar.md) | Cotação ao vivo: qual taxa usar, as três fontes e o que acontece quando falham |

## Projeto

| Arquivo | Conteúdo |
|---|---|
| [08-design-e-acessibilidade.md](08-design-e-acessibilidade.md) | Princípios visuais, tokens de cor com contraste medido, componentes e decisões de acessibilidade |
| [09-arquitetura.md](09-arquitetura.md) | Stack, estrutura de pastas, comandos e publicação no GitHub Pages |

## Cenários dos exemplos

Os exemplos da documentação usam dois cenários, sempre com dólar fixo a R$ 5,50 para os números não mudarem (a página usa a cotação do dia). Nos dois, o PJ está no Simples, com cliente no exterior, taxa de câmbio de 1%, IOF de 0,38%, 12 meses faturados e regime automático.

| | Cenário A: exemplo da página | Cenário B: planilha de partida |
|---|---|---|
| Salário CLT | R$ 12.000 | R$ 16.000 |
| VR e VA | R$ 1.000 | R$ 990 |
| Plano de saúde | R$ 400 | R$ 300 |
| Faturamento PJ, quando informado | US$ 3.500 | US$ 5.300 |
| Contabilidade | R$ 200 | R$ 150 |
| Usado em | este índice, [05](05-modelo-de-calculo.md) | [01](01-erros-comuns.md), [02](02-clt.md), [03](03-pj-simples-nacional.md), [05](05-modelo-de-calculo.md) |

## O cenário A, em números

**CLT:**

| | |
|---|---:|
| No bolso, todo mês | R$ 8.892 |
| Média mensal no ano (com 13º, férias, FGTS e benefícios) | R$ 12.342 |
| Total no ano | R$ 148.101 |
| INSS e IR no ano | R$ 41.499 (26% do salário bruto) |
| Custo para uma empresa do Lucro Presumido ou Real | R$ 19.507 por mês |

**Quanto faturar como PJ para empatar** (Simples, Anexo III, cliente no exterior):

| Cenário | Faturamento por mês |
|---|---:|
| Com férias pagas (12 meses) | US$ 2.466 (R$ 13.561) |
| Sem férias pagas (11 meses) | US$ 2.690 |
| 20% acima do CLT | US$ 2.957 |
| 50% acima do CLT | US$ 3.769 |

**Comparando com um PJ de US$ 3.500 por mês:** o PJ rende R$ 60 mil a mais por ano (R$ 17.345 por mês na média, contra R$ 12.342 do CLT). Para empatar com esse PJ, a proposta CLT precisaria pagar R$ 17.594 de salário bruto.

> Estimativa para comparação. Regras com divergência (IOF na exportação, retenção de dividendos no Simples) estão sinalizadas. Confirme com um contador antes de decidir.
