# Cotação do dólar ao vivo

A calculadora busca a cotação USD → BRL ao abrir a página, direto do navegador, sem chave de API e sem servidor próprio. Código em `assets/js/cotacao.js`.

## Qual cotação usar

Quem recebe em dólar **vende** dólares. O preço que interessa é o de **compra** (`bid`): quanto o mercado paga pelos seus dólares. O de venda (`ask`) é um pouco maior e serve para quem compra dólar.

A cotação comercial ainda não é o que cai na conta. A plataforma de câmbio (Wise, Husky, Remessa Online, banco) cobra um spread e uma tarifa, que a calculadora trata à parte no campo **Taxa da plataforma de câmbio** (padrão de 1%). O IOF tem campo próprio.

## Fontes, em ordem de tentativa

Testadas em 17/11/2026. Todas respondem com CORS liberado, então funcionam até abrindo o `index.html` direto do disco.

| # | Fonte | Endpoint | Atualização | Campo usado |
|---|---|---|---|---|
| 1 | AwesomeAPI | `economia.awesomeapi.com.br/json/last/USD-BRL` | A cada poucos minutos, em dia útil | `bid` (compra), `timestamp`, `pctChange` |
| 2 | Banco Central, PTAX | `olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(...)` | Uma vez por dia útil, por volta das 13h | `cotacaoCompra` do último dia |
| 3 | Frankfurter (BCE) | `api.frankfurter.dev/v1/latest?base=USD&symbols=BRL` | Uma vez por dia útil | `rates.BRL` (taxa de referência) |

Medição no mesmo dia: AwesomeAPI R$ 5,7825, PTAX R$ 5,7845 (compra das 13h), Frankfurter R$ 5,7821. A diferença entre as fontes ficou abaixo de 0,05%.

**Por que essa ordem:** a AwesomeAPI é a mais atualizada durante o pregão. A PTAX é a taxa oficial, usada em contratos e na contabilidade, mas só sai uma vez por dia. O Frankfurter é o último recurso, com a referência do Banco Central Europeu.

## Comportamento na tela

| Situação | O que aparece abaixo do campo |
|---|---|
| Buscando | "Buscando a cotação de hoje…" |
| Cotação ao vivo em uso | Horário, variação do dia (quando a fonte informa) e a fonte, com o botão **Atualizar** |
| Você digitou outro valor | O valor de hoje e o botão **Usar a cotação de hoje** |
| Nenhuma fonte respondeu | Mensagem de erro e o botão **Tentar de novo**. A conta continua com o último valor do campo (R$ 5,50 se for a primeira visita) |

Regras:

- Digitar no campo marca a cotação como manual. A página não sobrescreve um valor que você escolheu.
- O resultado fica em cache por **15 minutos** (`localStorage`, chave `pareo:cotacao`). **Atualizar** ignora o cache.
- Cada fonte tem 6 segundos para responder antes de a página tentar a seguinte.
- **Restaurar o exemplo** volta aos valores de exemplo, com a cotação de hoje.
- A aba **Dólar** do card "E se…?" usa a cotação em uso como centro e simula ±10% e ±20%.

## Limites

- APIs gratuitas sem SLA. Se as três mudarem de formato, a página cai no estado de erro e pede o valor manual.
- A AwesomeAPI tem limite de requisições por IP. O cache de 15 minutos mantém o uso bem abaixo dele.
- Fora do horário de pregão (noite, fim de semana) a cotação é a do último fechamento.
