# CLT na prática: o que você recebe de verdade

Os exemplos usam o salário do [cenário B](README.md#cenários-dos-exemplos): R$ 16.000, com VR de R$ 990 e plano de saúde de R$ 300.

## 1. Componentes de um ano

| Item | Quanto | Tributos |
|---|---|---|
| Salário mensal | 12 × S (11 trabalhados + 1 de férias) | INSS e IRRF |
| Adicional de férias | S ÷ 3 (1/3 constitucional) | INSS e IRRF, junto com o mês de férias |
| 13º salário | S | INSS e IRRF **exclusivo na fonte**, separado do salário |
| FGTS | 8% sobre salário, férias + 1/3 e 13º | Depósito da empresa; não é descontado de você |
| Benefícios | VR/VA, plano de saúde, auxílios | Em geral sem INSS/IR (PAT, plano coletivo) |
| PLR | Variável | Tabela própria de IR, exclusiva na fonte |

Remuneração bruta anual = **13,33 × S**.

## 2. INSS do empregado (2026)

Progressivo por faixa: cada alíquota incide só sobre a parte do salário dentro da faixa.

| Faixa de salário | Alíquota |
|---|---|
| até R$ 1.621,00 | 7,5% |
| R$ 1.621,01 a R$ 2.902,84 | 9% |
| R$ 2.902,85 a R$ 4.354,27 | 12% |
| R$ 4.354,28 a R$ 8.475,55 (teto) | 14% |

Desconto máximo: **R$ 988,09** (salários a partir do teto).

## 3. Imposto de renda na fonte (2026)

A tabela mensal não mudou, mas a Lei 15.270/2025 criou uma **redução** aplicada depois da tabela.

**Passo 1. Base de cálculo**

`base = bruto − max(INSS + dependentes × 189,59 ; 607,20)`

O desconto simplificado (R$ 607,20) só vale a pena para salários baixos.

**Passo 2. Tabela progressiva**

| Base | Alíquota | Parcela a deduzir |
|---|---|---|
| até R$ 2.428,80 | 0 | 0 |
| até R$ 2.826,65 | 7,5% | R$ 182,16 |
| até R$ 3.751,05 | 15% | R$ 394,16 |
| até R$ 4.664,68 | 22,5% | R$ 675,49 |
| acima | 27,5% | R$ 908,73 |

**Passo 3. Redução da Lei 15.270/2025**, calculada sobre o rendimento **bruto** do mês:

- bruto até R$ 5.000: redução de até R$ 312,89 (zera o imposto)
- bruto de R$ 5.000,01 a R$ 7.350: redução = `978,62 − 0,133145 × bruto`
- acima de R$ 7.350: sem redução

`IRRF = max(0, tabela − redução)`. A redução também vale para o 13º.

### Exemplos (sem dependentes)

| Bruto | INSS | IRRF | Líquido |
|---:|---:|---:|---:|
| R$ 5.000 | R$ 501,51 | R$ 0 | R$ 4.498,49 |
| R$ 7.000 | R$ 781,51 | R$ 754,75 | R$ 5.463,74 |
| R$ 10.000 | R$ 988,09 | R$ 1.569,55 | R$ 7.442,36 |
| R$ 16.000 | R$ 988,09 | R$ 3.219,55 | R$ 11.792,36 |

## 4. Férias, 13º e FGTS

- **Mês de férias:** salário + 1/3 pagos juntos. Com S = R$ 16 mil: bruto R$ 21.333, INSS R$ 988 (teto), IR R$ 4.686, líquido R$ 15.659.
- **13º:** tributado à parte. Com S = R$ 16 mil: líquido R$ 11.792.
- **FGTS:** `8% × (12S + S/3 + S)`. Com S = R$ 16 mil: R$ 17.067/ano. É seu, mas só sai em demissão sem justa causa, compra de imóvel, aposentadoria, saque-aniversário etc. Na demissão sem justa causa a empresa paga multa de 40% sobre o saldo (a calculadora deixa ligar isso como valor esperado).

## 5. "No bolso" × "média mensal no ano"

A calculadora mostra dois números:

- **No bolso por mês:** salário líquido de um mês comum.
- **Média mensal no ano:** (salários líquidos + férias + 13º + FGTS + benefícios + PLR) ÷ 12.

O segundo é o que se compara com o PJ, porque o PJ não tem 13º, férias pagas nem FGTS.

Com S = R$ 16 mil, VR R$ 990 e saúde R$ 300: no bolso **R$ 11.792**, média mensal no ano **R$ 15.810**, total anual **R$ 189.714**.

## 6. Custo do CLT para a empresa

Útil para negociar uma proposta PJ. Numa empresa do Lucro Presumido/Real:

`custo ≈ 13,33S × (1 + 20% INSS patronal + ~2% RAT + 5,8% terceiros + 8% FGTS) + benefícios`

Com S = R$ 16 mil: cerca de **R$ 25.400/mês**. Empresas do Simples (Anexos I a III e V) não pagam os 20% à parte, então o custo delas é menor.

## 7. O que a calculadora não modela

- Tabela de IR da PLR (o campo pede o valor já líquido).
- Vale-transporte (6% de desconto), pensão alimentícia, previdência privada dedutível.
- Horas extras, adicionais, dissídio, abono pecuniário de férias.
