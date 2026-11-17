# PJ de TI no Simples Nacional

## 1. Fluxo do dinheiro

```
Cliente (US$) ──câmbio (spread + IOF)──► Empresa (R$)
Empresa: faturamento − DAS − contabilidade − custos − pró-labore = lucro
Você:    pró-labore − INSS 11% − IRRF  +  lucro distribuído (sem IR até R$ 50 mil por mês)
```

## 2. Simples Nacional em uma página

- Regime para empresas com receita bruta de até **R$ 4,8 milhões/ano** (LC 123/2006).
- Um único boleto mensal, o **DAS**, que junta IRPJ, CSLL, PIS, COFINS, CPP (INSS patronal) e ISS.
- A alíquota depende do **anexo** (tipo de atividade) e da **receita dos últimos 12 meses (RBT12)**.

### Alíquota efetiva

`efetiva = (RBT12 × alíquota nominal − parcela a deduzir) ÷ RBT12`

A alíquota nominal da tabela nunca é a que você paga; a efetiva é sempre menor (exceto na 1ª faixa, em que são iguais).

### Anexo III (serviços com Fator R ≥ 28%)

| RBT12 até | Nominal | Deduzir | IRPJ | CSLL | COFINS | PIS | CPP | ISS |
|---|---|---|---|---|---|---|---|---|
| 180.000 | 6,00% | 0 | 4,00% | 3,50% | 12,82% | 2,78% | 43,40% | 33,50% |
| 360.000 | 11,20% | 9.360 | 4,00% | 3,50% | 14,05% | 3,05% | 43,40% | 32,00% |
| 720.000 | 13,50% | 17.640 | 4,00% | 3,50% | 13,64% | 2,96% | 43,40% | 32,50% |
| 1.800.000 | 16,00% | 35.640 | 4,00% | 3,50% | 13,64% | 2,96% | 43,40% | 32,50% |
| 3.600.000 | 21,00% | 125.640 | 4,00% | 3,50% | 12,82% | 2,78% | 43,40% | 33,50% |
| 4.800.000 | 33,00% | 648.000 | 35,00% | 15,00% | 16,03% | 3,47% | 30,50% | — |

### Anexo V (serviços com Fator R < 28%)

| RBT12 até | Nominal | Deduzir | IRPJ | CSLL | COFINS | PIS | CPP | ISS |
|---|---|---|---|---|---|---|---|---|
| 180.000 | 15,50% | 0 | 25,00% | 15,00% | 14,10% | 3,05% | 28,85% | 14,00% |
| 360.000 | 18,00% | 4.500 | 23,00% | 15,00% | 14,10% | 3,05% | 27,85% | 17,00% |
| 720.000 | 19,50% | 9.900 | 24,00% | 15,00% | 14,92% | 3,23% | 23,85% | 19,00% |
| 1.800.000 | 20,50% | 17.100 | 21,00% | 15,00% | 15,74% | 3,41% | 23,85% | 21,00% |
| 3.600.000 | 23,00% | 62.100 | 23,00% | 12,50% | 14,10% | 3,05% | 23,85% | 23,50% |
| 4.800.000 | 30,50% | 540.000 | 35,00% | 15,50% | 16,44% | 3,56% | 29,50% | — |

As colunas de tributos são a **repartição** do DAS: que fatia da alíquota efetiva vai para cada tributo. Elas importam na exportação.

## 3. Fator R

Desenvolvimento de software, consultoria e suporte de TI (CNAEs 6201-5/01, 6202-3/00, 6204-0/00, 6209-1/00 etc.) estão sujeitos ao Fator R:

`Fator R = folha de salários dos últimos 12 meses ÷ receita bruta dos últimos 12 meses`

- **≥ 28% → Anexo III** (a partir de 6%)
- **< 28% → Anexo V** (a partir de 15,5%)

Para quem trabalha sozinho, a "folha" é o **pró-labore**. Por isso a regra prática é pró-labore ≥ 28% do faturamento.

### O custo escondido do Fator R

O pró-labore é renda da pessoa física: paga **11% de INSS** (até o teto) e **IR pela tabela progressiva**. Acima de R$ 7.350, o IR marginal é 27,5%. Então subir o pró-labore para alcançar o Anexo III economiza DAS, mas aumenta INSS e IR.

| [Cenário B](README.md#cenários-dos-exemplos): R$ 29.150 por mês, exportação | Pró-labore de 28% (Anexo III) | Pró-labore mínimo (Anexo V) |
|---|---:|---:|
| Pró-labore | R$ 8.162 | R$ 1.621 |
| DAS | R$ 1.265 (4,34%) | R$ 3.208 (11,01%) |
| INSS + IR do pró-labore | R$ 1.987 | R$ 178 |
| Total de impostos | R$ 3.252 | R$ 3.387 |
| No bolso | R$ 25.346 | R$ 25.211 |

Com cliente no Brasil a diferença cresce muito a favor do Anexo III (DAS de 8,52% contra 16,71%). A calculadora sempre compara os dois.

## 4. Exportação de serviços

Quando o cliente está no exterior e o pagamento entra no Brasil como divisa:

- **PIS e COFINS:** a receita de exportação é isenta.
- **ISS:** não incide sobre exportação de serviços (LC 116/2003, art. 2º, I), salvo se o resultado do serviço se verificar no Brasil.
- **No Simples**, o efeito é tirar do DAS as fatias de PIS, COFINS e ISS daquela faixa (LC 123/2006, art. 18, § 4º-A, IV, e § 14). A receita de exportação deve ser segregada no PGDAS-D.

`alíquota aplicada = efetiva × (1 − %PIS − %COFINS − %ISS da faixa)`

Exemplo, Anexo III, 2ª faixa: 8,52% × (1 − 3,05% − 14,05% − 32%) = **4,34%**.

Cuidados práticos:

- Contrato e invoice em nome da empresa, com cliente no exterior.
- O serviço não pode ter seu resultado no Brasil (ex.: atender o mercado brasileiro da empresa estrangeira pode descaracterizar).
- Guarde contratos de câmbio e invoices; a exportação é segregada na apuração.

## 5. Câmbio e IOF

- **Spread e tarifa** da plataforma (Wise, Husky, Remessa Online, banco): em geral 0,5% a 2%. O Páreo usa 1% como padrão.
- **IOF:** o Decreto 6.306/2007, art. 15-B, I, prevê **alíquota zero** no ingresso de receitas de exportação de bens e serviços. Na prática, o que vale é a **natureza da operação** informada no fechamento do câmbio. Registrada com outra natureza, a operação pode pagar 0,38%. Há fontes de 2026 que divergem, então o Páreo mantém o campo editável, com 0,38% como padrão conservador.

## 6. Pró-labore

- Mínimo: 1 salário mínimo (R$ 1.621 em 2026).
- INSS do sócio: **11%** retido pela empresa, limitado ao teto (máximo R$ 932,31/mês). Nos Anexos III e V os 20% patronais já estão dentro do DAS. No Anexo IV seriam pagos à parte, mas TI não cai no IV.
- IRRF: mesma tabela e redução do CLT (ver [02-clt.md](02-clt.md)).
- Conta para a aposentadoria pelo INSS.

## 7. Distribuição de lucros

- Lucros distribuídos ao sócio são **isentos de IR** (LC 123/2006, art. 14; Lei 9.249/1995, art. 10).
- **Sem** contabilidade completa, a parte isenta se limita à presunção do lucro (32% da receita para serviços) menos o IRPJ do DAS. **Com** escrituração contábil, pode-se distribuir todo o lucro apurado. Muitas contabilidades online incluem a escrituração no plano; confirme com a sua.
- **Novo em 2026:** acima de R$ 50 mil por mês da mesma empresa para a mesma pessoa, retenção de 10% sobre o valor inteiro (ver [04-mudancas-2026-e-reforma.md](04-mudancas-2026-e-reforma.md)).

## 8. Custos da empresa

| Item | Faixa típica |
|---|---|
| Abertura | R$ 0 a R$ 3.500 (muitas contabilidades online isentam com contrato anual) |
| Contabilidade | R$ 150 a R$ 500/mês |
| Certificado digital e-CNPJ | ~R$ 200/ano |
| Taxas municipais (alvará, TFE) | depende da cidade |
| Conta PJ | em geral gratuita |

## 9. O que o PJ precisa bancar sozinho

Não há 13º, férias pagas, FGTS, multa rescisória, seguro-desemprego, plano de saúde nem VR. No Páreo, o campo **"Gastos a mais por conta própria"** desconta o que você passaria a pagar (um plano de saúde individual, por exemplo), e **"Férias no contrato PJ"** simula receber 11 ou 10 meses no ano.

Regra prática comum: guardar o equivalente a 1/12 por mês para "13º" e para "férias".
