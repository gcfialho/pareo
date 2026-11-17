# O que mudou em 2026 (e o que vem em 2027)

## 1. Lei 15.270/2025: isenção do IR até R$ 5 mil

Sancionada em novembro de 2025, vale desde **janeiro de 2026**.

- A tabela mensal não mudou. Foi criada uma **redução** aplicada depois da tabela.
- Rendimento tributável até **R$ 5.000/mês**: imposto zerado (redução de até R$ 312,89).
- De **R$ 5.000,01 a R$ 7.350**: redução decrescente, `978,62 − 0,133145 × rendimento bruto`.
- Acima de **R$ 7.350**: nada muda.
- Vale para salário, pró-labore e 13º. Na declaração anual há uma redução equivalente (isenção até R$ 60 mil/ano, parcial até R$ 88,2 mil).

**Efeito na comparação:** quase nenhum para salários de dev sênior (acima de R$ 7.350). Mas ajuda quem usa **pró-labore baixo**: um pró-labore de 1 salário mínimo já era isento, e agora até R$ 5 mil também é.

## 2. Tributação de lucros e dividendos

A mesma lei acabou com a isenção total de dividendos acima de certo valor.

### Retenção de 10% na fonte

- Quando **uma mesma empresa** paga **mais de R$ 50 mil no mês** a **uma mesma pessoa física** residente.
- A alíquota incide sobre o **valor total**, não só sobre o que passa de R$ 50 mil. R$ 50.000 não retém nada; R$ 50.000,01 retém R$ 5.000.
- Para sócio no exterior, 10% sobre qualquer valor.
- A retenção é **antecipação**: ela é abatida do IRPFM na declaração anual e pode ser devolvida.
- Lucros apurados até 2025, com distribuição aprovada até 31/01/2026 (prazo prorrogado pelo STF), seguem isentos.

### E no Simples Nacional?

**Há divergência:**

- A **Receita Federal** (Perguntas e Respostas sobre Altas Rendas, atualizado em 19/12/2025, pergunta 10) diz que a retenção **vale para optantes do Simples**.
- Parte da doutrina diz que não, porque o art. 14 da LC 123/2006 (lei complementar) garante a isenção e a Lei 15.270 é ordinária.
- A OAB entrou com a **ADI 7.917** no STF. A liminar foi negada; até novembro de 2026 não há julgamento de mérito. Há decisão de primeira instância (SP) afastando a retenção para um escritório do Simples, com recurso da União.

A calculadora aplica a retenção por padrão (posição da Receita), com opção para desligar.

**Efeito prático:** só pesa se o lucro mensal passar de R$ 50 mil, o que exige faturar a partir de uns R$ 58 mil por mês. Quem fatura de forma irregular (ex.: vários meses acumulados num só pagamento) pode cair na retenção sem querer. Distribuir mensalmente evita isso.

### IRPFM: imposto mínimo para altas rendas

- Para quem tem renda total acima de **R$ 600 mil/ano** (somando salário, pró-labore, dividendos, aluguéis etc., com algumas exclusões como poupança e LCI/LCA).
- Alíquota cresce linearmente de **0% (R$ 600 mil)** a **10% (R$ 1,2 milhão)**: `alíquota = renda ÷ 60.000 − 10` (em %).
- Abate o IR já pago no ano (tabela progressiva, retenções sobre dividendos).
- Há um redutor quando a carga da empresa (IRPJ + CSLL efetivos) somada ao IRPFM passa de 34%. No Simples, o IRPJ + CSLL dentro do DAS é baixo, então o redutor raramente se aplica.
- Primeira apuração na declaração de 2027 (ano-base 2026).

A calculadora estima o IRPFM de forma simplificada: considera só pró-labore + lucros da empresa e abate o IR do pró-labore.

## 3. LC 224/2025: corte de benefícios fiscais

Publicada em 26/12/2025. Aumenta em 10% os percentuais de presunção do **Lucro Presumido** (ex.: serviços de 32% para 35,2%) na parcela de receita acima de R$ 5 milhões, e corta outros benefícios. **O Simples Nacional ficou fora.** Para um dev PJ no Simples, não muda nada, e a distância para o Lucro Presumido aumenta.

## 4. Reforma tributária do consumo (CBS e IBS)

EC 132/2023 e LC 214/2025.

| Ano | O que acontece |
|---|---|
| 2026 | Ano de teste: CBS 0,9% e IBS 0,1% destacados na nota, compensáveis. **Optantes do Simples não recolhem.** NFS-e nacional passa a ser exigida |
| 2027 | **CBS substitui PIS e COFINS.** No Simples, CBS e IBS entram no DAS no lugar deles, pelos novos Anexos I a V (Anexos XVIII a XXII da LC 214). As alíquotas nominais das faixas 1 a 5 não mudam |
| 2027 | Opção do **Simples híbrido**: pagar CBS/IBS fora do DAS, pelo regime regular, para gerar crédito integral a clientes empresa. Opção semestral |
| 2029–2032 | ICMS e ISS caem gradualmente, IBS sobe |
| 2033 | Sistema novo completo |

**Exportação de serviços:** CBS e IBS são **imunes** na exportação (LC 214/2025, arts. 12 e 41), em qualquer regime. Para o dev que atende cliente no exterior, a troca de PIS/COFINS/ISS por CBS/IBS não deve mudar a conta, porque essas fatias já são retiradas do DAS hoje. O CGSN ainda discute como provar a exportação nesse novo modelo.

**Para quem atende cliente no Brasil:** em 2027 vale avaliar o Simples híbrido se o cliente for empresa do Lucro Real que queira crédito integral.

## 5. Outras atualizações de 2026

- Salário mínimo: **R$ 1.621**.
- Teto do INSS: **R$ 8.475,55** (era R$ 8.157,41). Desconto máximo do CLT: R$ 988,09. INSS máximo do sócio: R$ 932,31.
- Simples Nacional: tabelas sem mudança desde 2018.
