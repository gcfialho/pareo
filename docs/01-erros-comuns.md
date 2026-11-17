# Erros comuns ao comparar CLT e PJ

O Páreo nasceu de uma planilha pessoal de comparação que tinha quase todos os erros abaixo. Eles aparecem em muitas contas de "quanto pedir como PJ", e quase sempre puxam o CLT para cima ou erram o imposto do PJ.

Os exemplos usam o [cenário B](README.md#cenários-dos-exemplos): salário CLT de **R$ 16.000**, VR de R$ 990 e plano de saúde de R$ 300; PJ faturando **US$ 5.300** com dólar a R$ 5,50 (R$ 29.150), exportando serviço, com contabilidade de R$ 150, taxa de câmbio de 1% e IOF de 0,38%. Tudo com as regras de 2026.

## Do lado CLT

### 1. Esquecer o imposto de renda

É o erro de maior impacto. Com R$ 16 mil, o IR retido é de **R$ 3.219,55 por mês**, mais R$ 4.686 no mês de férias e R$ 3.220 no 13º. São cerca de **R$ 43 mil por ano** que somem da conta.

**Certo:** IR sobre salário, férias e 13º, cada um com sua base (ver [02-clt.md](02-clt.md)).

### 2. INSS com alíquota fixa e sem teto

Usar 9% ou 11% do salário dá R$ 1.440 ou R$ 1.760. O INSS é progressivo e tem teto: em 2026, o desconto máximo é **R$ 988,09**. Também é comum o INSS entrar somando, como se fosse ganho.

**Certo:** tabela progressiva até o teto de R$ 8.475,55, sempre como desconto.

### 3. Contar as férias duas vezes

Somar "1/12 de férias" a cada mês, além dos 12 salários, dá 14,33 salários por ano. O mês de férias **já é um dos 12 salários**; o que vem a mais é só o 1/3.

**Certo:** 12 salários + 13º + 1/3 de férias = **13,33 salários por ano**, mais FGTS.

### 4. FGTS só sobre o salário

O FGTS de 8% também incide sobre o 13º e sobre as férias com 1/3. Com R$ 16 mil, são R$ 17.067 por ano, não R$ 15.360.

## Do lado PJ

### 5. Usar uma alíquota do Simples "de cabeça"

Valores como 6%, 10% ou 15,5% raramente são os certos. A alíquota efetiva depende do anexo, da faixa de receita dos últimos 12 meses e da exportação. Com receita anual de R$ 349.800:

| Cenário | Alíquota efetiva |
|---|---:|
| Anexo III, cliente no exterior | **4,34%** |
| Anexo III, cliente no Brasil | 8,52% |
| Anexo V, cliente no exterior | 11,01% |
| Anexo V, cliente no Brasil | 16,71% |

**Certo:** calcular pela fórmula do Simples e tirar PIS, COFINS e ISS na exportação (ver [03-pj-simples-nacional.md](03-pj-simples-nacional.md)).

### 6. Pró-labore de 28% e "Anexo V" ao mesmo tempo

Pró-labore de 28% do faturamento serve justamente para atingir o **Fator R** e cair no Anexo III. Usar esse pró-labore e a alíquota do Anexo V mistura dois regimes.

### 7. Esquecer o IR sobre o pró-labore

O pró-labore é renda da pessoa física: paga 11% de INSS e IR pela tabela. Com pró-labore de R$ 8.162, o IR é de **R$ 1.088,92 por mês**. O lucro distribuído é que é isento.

### 8. IOF sempre em 0,38%

Na exportação de serviços, o IOF do câmbio pode ser **zero**, se a operação for registrada como exportação. Vale conferir com a plataforma e o contador (ver [07-cotacao-do-dolar.md](07-cotacao-do-dolar.md) e [03](03-pj-simples-nacional.md)).

## Na comparação

### 9. Comparar o bruto do CLT com o faturamento do PJ

O CLT perde muito mais no caminho: com R$ 16 mil, **26% do salário bruto** fica em INSS e IR. Um PJ no Simples exportando serviço perde perto de 9%. Por isso o faturamento que empata pode ficar perto, ou até abaixo, do salário bruto CLT.

**Certo:** comparar o que **fica com você** no ano dos dois lados, como o Páreo faz no card "O que fica com você e o que sai".

### 10. Comparar 12 meses de PJ com 12 meses de CLT

Se o cliente não paga as férias, o PJ recebe 11 meses, e a contabilidade continua sendo paga no mês parado. O CLT recebe 13,33 salários no mesmo ano.

### 11. Esconder o lado de cada número

Usar `ABS()` na diferença final mostra "quanto" mas não "quem" ganha. Mostre o sinal ou diga qual lado rende mais.

## O tamanho do erro

Corrigindo tudo isso no exemplo:

| | Conta com os erros | Conta certa |
|---|---:|---:|
| CLT, total no ano | R$ 256.333 | **R$ 189.714** |
| PJ, total no ano (12 meses) | R$ 296.370 | **R$ 304.155** |
| Vantagem do PJ | R$ 40 mil | **R$ 114 mil** |

O lado CLT estava R$ 66 mil acima do real. Do lado PJ, os erros se compensaram em parte: o imposto do Simples estava alto demais e o IR do pró-labore foi esquecido.
