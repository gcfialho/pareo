# Como a conta é feita

O que `assets/js/calc.js` calcula e como a página usa isso. As tabelas legais vêm de `assets/js/params.js`. Os testes ficam em `tests/calc.test.js` (`npm test`).

Os exemplos usam os cenários definidos no [índice da documentação](README.md#cenários-dos-exemplos).

## Funções de base

```
inssEmpregado(b)  = Σ faixas (min(b, limite) − limite_anterior) × alíquota      // até o teto
inssSocio(pl)     = 11% × min(pl, teto)
redutorIR(b)      = b ≤ 5000 ? 312,89 : b ≤ 7350 ? 978,62 − 0,133145 × b : 0
irrf(b, inss, d)  = max(0, tabela(b − max(inss + 189,59 × d, 607,20)) − min(tabela, redutorIR(b)))
```

A redução da Lei 15.270/2025 usa o rendimento **bruto** do mês (`b`), não a base depois do INSS.

## CLT: `calcCLT(i)`

Entradas: `salario`, `dependentes`, `vr`, `saude`, `outrosBeneficios`, `descontos`, `plrAnual`, `multaFgts`.

```
normal = mês(S)          ferias = mês(S + S/3)          decimo = mês(S)
mês(x).liquido = x − inssEmpregado(x) − irrf(x, …)

mensal.liquidoMensal = normal.liquido − descontos
anual.salarios       = 11 × normal.liquido + ferias.liquido + decimo.liquido − 12 × descontos
anual.fgts           = 8% × (12S + S/3 + S)
anual.multaFgts      = multaFgts ? 40% × anual.fgts : 0
anual.beneficios     = 12 × (vr + saude + outrosBeneficios)
anual.total          = anual.salarios + anual.fgts + anual.multaFgts + anual.beneficios + plrAnual
equivalenteMensal    = anual.total / 12
custoEmpresa.anual   = 13,33S × (1 + 20% + 2% + 5,8% + 8%) + anual.beneficios     // informativo
```

## PJ: `calcPJ(i)`

Entradas: `moeda`, `faturamento`, `cotacao`, `taxaCambio` (%), `iof` (%), `contabilidade`, `outrosCustos`, `mesesAtivos`, `regime` (`auto`, `III` ou `V`), `fatorR`, `proLaboreManual`, `exportacao`, `dependentes`, `retencaoDividendos`, `custosPessoais`, `abertura`.

`regime` escolhe a **estratégia de pró-labore**. O anexo de verdade sai do Fator R:

- `III`: pró-labore de `fatorR` (no mínimo 28%) do faturamento, para ficar no Anexo III.
- `V`: pró-labore de um salário mínimo.
- `auto`: calcula as duas e fica com a que deixa mais no bolso no ano. As duas ficam em `alternativas`.

```
fat         = moeda == USD ? faturamento × cotacao : faturamento
custoCambio = moeda == BRL ? 0 : fat × (taxaCambio + iof)
RBT12       = fat × mesesAtivos

proLabore   = proLaboreManual ?? (estratégia III ? max(mínimo, fatorR × fat) : mínimo)
anexo       = fat > 0 e proLabore / fat ≥ 28% ? III : V          // vale nos dois sentidos

efetiva     = (RBT12 × nominal − deduzir) / RBT12
aplicada    = exportacao ? efetiva × (1 − pis − cofins − iss da faixa) : efetiva
DAS         = fat × aplicada

inss        = inssSocio(proLabore)
ir          = irrf(proLabore, inss, dependentes)
lucro       = fat − custoCambio − DAS − proLabore − contabilidade − outrosCustos
distribuido = max(0, lucro)
retencao    = retencaoDividendos e distribuido > 50.000 ? 10% × distribuido : 0

mensal.liquido = (proLabore − inss − ir) + lucro − retencao

custoInativo   = (contabilidade + outrosCustos) × (12 − mesesAtivos)
renda          = (proLabore + distribuido) × mesesAtivos
IRPFM          = renda > 600.000 ? max(0, renda × min(10%, (renda / 60.000 − 10) / 100) − ir × mesesAtivos) : 0
anual.liquido  = (proLabore − inss − ir + lucro) × mesesAtivos − custoInativo − IRPFM − 12 × custosPessoais
```

- **O lucro pode ser negativo.** Se o faturamento não cobre o pró-labore e os custos, a diferença sai do bolso do sócio e reduz o resultado. Sem faturamento, o resultado do PJ é negativo.
- **A retenção de 10% não entra no ano.** Ela é antecipação do IRPFM e volta, ou é compensada, na declaração. No mês, aparece como efeito de caixa.

## Comparação: `comparar(clt, pj)`

```
diferencaAnual           = pj.anual.liquido − clt.anual.total
salarioCLTEquivalente    = S tal que calcCLT(S).anual.total = pj.anual.liquido        (bisseção)
faturamentoPJEquivalente = F tal que calcPJ(F).anual.liquido = clt.anual.total        (bisseção)
```

A busca vai até 1 milhão por mês, na moeda do contrato.

## Os três modos da página

O modo fica no link (`#clt`, `#meta`, `#comparar`), então dá para compartilhar a página já aberta em um deles. O padrão é **Quanto faturar como PJ**.

| Modo | Campos | O que a página mostra |
|---|---|---|
| **Só CLT** (`#clt`) | Proposta CLT | Média mensal no ano, no bolso, total no ano e custo para a empresa. Também o faturamento PJ que empataria, com as premissas padrão, e um atalho para o modo de meta |
| **Quanto faturar como PJ** (`#meta`) | Proposta CLT e Empresa PJ, sem o faturamento | O faturamento de empate (`faturamentoPJEquivalente`) e esse PJ em detalhe |
| **Comparar CLT e PJ** (`#comparar`) | Proposta CLT e Empresa PJ | `comparar(clt, pj)`: qual rende mais no ano |

O resultado vem em três camadas:

1. **Resultado:** uma frase com a resposta e CLT e PJ lado a lado, os dois na média mensal do ano. No celular, a resposta aparece também numa barra fixa enquanto o resultado está fora da tela.
2. **O que fica com você e o que sai, em um ano,** e, nos modos de meta e de comparação, o card **E se…?** com abas:
   - modo de meta: **Ganhar mais que o CLT**, **Férias** e **Dólar**;
   - modo de comparação: **Empate**, **Férias** e **Dólar**;
   - a aba **Dólar** só aparece em contratos em dólar.
3. **Cálculo completo** (recolhido): tabelas de CLT e PJ mês a mês, as duas estratégias de pró-labore e as premissas.

### Por que o empate fica perto, ou abaixo, do salário CLT

O modo de meta procura o faturamento em que o PJ deixa no bolso o mesmo total anual do CLT. Esse faturamento costuma ficar **perto do salário bruto CLT, às vezes abaixo**, porque a carga de cada lado é muito diferente:

| | Cenário A | Cenário B |
|---|---:|---:|
| Salário bruto CLT no ano | R$ 160.000 | R$ 213.333 |
| INSS e IR do CLT no ano | R$ 41.499 (26%) | R$ 56.166 (26%) |
| Faturamento PJ de empate no ano | R$ 162.728 | R$ 207.871 |
| Impostos e custos do PJ no ano | R$ 14.627 (9%) | R$ 18.157 (9%) |

A página mostra essa conta no resultado do modo de meta.

O que **não** entra no empate, e pode justificar pedir mais:

- **Aposentadoria:** o INSS do CLT incide sobre o salário até o teto; o do PJ, só sobre o pró-labore.
- **Plano de saúde:** o valor CLT é o custo de um plano coletivo. Um individual costuma custar mais; o campo "Gastos a mais por conta própria" cobre a diferença.
- **Risco:** estabilidade, seguro-desemprego e multa do FGTS. A aba "Ganhar mais que o CLT" mostra metas acima do empate.

### Metas de faturamento (aba "Ganhar mais que o CLT")

```
para cada margem em [0%, 20%, 35%, 50%]:
  alvo = clt.anual.total × (1 + margem)
  fat  = faturamentoPJEquivalente(pj, alvo)
```

Os 20% a 50% são uma referência de mercado para cobrir o risco, não uma regra legal.

### Férias: 12, 11 ou 10 meses recebidos (aba "Férias")

O CLT recebe **13,33 salários brutos por ano**: 12 salários (um deles pago durante as férias), o 13º e 1/3 de férias. Com o FGTS, o pacote chega a uns 14,4 salários.

O PJ recebe só pelos meses faturados. O campo **Férias no contrato PJ** define `mesesAtivos`:

| Opção | `mesesAtivos` | Quando usar |
|---|---|---|
| Pagas: recebo 12 meses no ano | 12 | O cliente paga as férias, ou você não tira folga |
| Não pagas: recebo 11 meses e folgo 1 | 11 | Um mês de folga por ano sem faturar |
| Recebo 10 meses | 10 | Folgas maiores ou intervalo entre contratos |

Nos meses sem faturamento, a empresa continua pagando contabilidade e custos fixos (`custoInativo`), e a receita anual usada no Simples cai junto.

| Faturamento para empatar | Cenário A | Cenário B |
|---|---:|---:|
| Com férias pagas (12 meses) | US$ 2.466 | US$ 3.150 |
| Sem férias pagas (11 meses) | US$ 2.690 (+9%) | US$ 3.460 (+10%) |

### Dólar (aba "Dólar")

- **Modo de meta:** para cada cotação de −20% a +20%, recalcula o faturamento de empate em dólar. O valor em reais para empatar não muda; a tabela mostra quantos dólares a mais ou a menos seriam necessários.
- **Modo de comparação:** mostra quanto o PJ deixa no bolso em cada cotação.

### Custo para a empresa (modo "Só CLT")

`clt.anual.total ÷ custoEmpresa.anual` responde: de cada R$ 100 que a empresa gasta com você, quanto chega até você. No cenário B, cerca de R$ 62.

## Simplificações conhecidas

| Simplificação | Efeito |
|---|---|
| Receita dos últimos 12 meses = faturamento × meses (receita estável) | No 1º ano a lei usa receita proporcional; a alíquota pode ser um pouco diferente |
| Fator R = pró-labore ÷ faturamento | Ignora encargos que também entram na folha; conservador |
| Teto de 5% de ISS dentro do DAS (Anexo III, 5ª faixa) ignorado | Só pesa com receita acima de cerca de R$ 2 milhões por ano |
| Acima de R$ 3,6 milhões por ano, o ISS sai do DAS | Não modelado; faixa rara para o público do Páreo |
| IR das férias calculado junto com o 1/3 num mês só | Igual a férias de 30 dias |
| Benefícios CLT pagos 12 meses | Algumas empresas não pagam VR nas férias |
| IRPFM sem o redutor de carga da PJ e sem outras rendas | Pode errar para mais ou para menos; só aparece acima de R$ 600 mil por ano |
| PLR informada já líquida | Não aplica a tabela de IR da PLR |
