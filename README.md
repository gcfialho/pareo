<p align="center">
  <img src="assets/img/logo.svg" width="64" height="64" alt="" />
</p>

<h1 align="center">Páreo</h1>

<p align="center"><strong>CLT × PJ na ponta do lápis.</strong><br />
Quanto o CLT vale de verdade, quanto faturar como PJ para ser páreo e qual rende mais.</p>

<p align="center">
  <a href="https://gcfialho.github.io/pareo/"><strong>Abrir o Páreo</strong></a>
  &nbsp;&nbsp;
  <a href="https://gcfialho.github.io/pareo/guia/">Como a conta é feita</a>
</p>

<p align="center">
  <a href="https://github.com/gcfialho/pareo/actions/workflows/ci.yml"><img src="https://github.com/gcfialho/pareo/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <img src="https://img.shields.io/badge/regras-2026-0f172a" alt="Regras de 2026" />
  <img src="https://img.shields.io/badge/licen%C3%A7a-MIT-16a067" alt="Licença MIT" />
</p>

![Tela do Páreo no modo "Quanto faturar como PJ"](docs/assets/screenshot.png)

> **English:** Páreo compares a Brazilian salaried job (CLT) with working as a contractor through your own company (PJ, Simples Nacional), using 2026 tax rules and today's USD/BRL rate. The site and docs are in Portuguese.

## Por que existe

Comparar CLT e PJ costuma acabar numa planilha que esquece o imposto de renda, conta as férias duas vezes ou usa uma alíquota do Simples que não existe ([os erros mais comuns](docs/01-erros-comuns.md)). O Páreo faz a conta inteira com as regras de 2026, para quem trabalha com tecnologia e fatura pelo Simples Nacional, inclusive para clientes no exterior.

## O que ele responde

| Modo | Link | Pergunta |
|---|---|---|
| **Só CLT** | `#clt` | Quanto o meu salário e os benefícios valem de verdade, contando 13º, férias e FGTS? |
| **Quanto faturar como PJ** | `#meta` (padrão) | Quanto preciso faturar como PJ para ter no bolso o mesmo que tenho no CLT? E para ganhar 20% a 50% a mais? |
| **Comparar CLT e PJ** | `#comparar` | Tenho uma proposta de cada. Qual rende mais no ano? |

Em todos os modos:

- **O que fica com você e o que sai:** quanto vira dinheiro seu e quanto vai para impostos e custos, em cada lado.
- **Cálculo completo:** INSS, IR, DAS, Fator R e Anexo III ou V, mês a mês e no ano.

Nos modos de meta e de comparação:

- **E se…?** Férias pagas ou não (12, 11 ou 10 meses recebidos), variação do dólar e metas acima do empate.
- **Dólar de hoje:** em contratos em dólar, a cotação é buscada ao abrir a página (AwesomeAPI, Banco Central ou BCE).

## O que a conta considera

- INSS e IR de 2026, com a isenção até R$ 5 mil da Lei 15.270/2025.
- Férias com 1/3, 13º e FGTS no CLT. Benefícios pelo valor que a empresa paga.
- Simples Nacional: Anexos III e V, Fator R, e PIS, COFINS e ISS fora do DAS na exportação de serviços.
- Pró-labore com INSS e IR, lucro distribuído sem IR, retenção de 10% quando o lucro do mês passa de R$ 50 mil e imposto mínimo para rendas acima de R$ 600 mil por ano (IRPFM).
- Câmbio, IOF, contabilidade e meses sem faturamento.

As regras, as fontes e os limites de cada simplificação estão no [guia do site](https://gcfialho.github.io/pareo/guia/), gerado a partir de [`docs/`](docs/README.md).

## Stack

Site estático, sem backend e sem framework. O navegador faz todas as contas.

- **HTML** semântico e **JavaScript** puro, sem bundler
- **Tailwind CSS 3.4**, com tokens de cor semânticos e o plugin de tipografia para o guia
- **Build em Node** (`scripts/build.mjs`): gera o guia a partir dos Markdown com o `marked` e serve o site localmente
- **Node.js** para os testes do motor de cálculo
- **GitHub Actions** para testes, build e publicação no **GitHub Pages**

Detalhes em [docs/09-arquitetura.md](docs/09-arquitetura.md).

## Rodar localmente

Requer Node.js 20 ou mais novo, em macOS, Linux ou Windows.

```sh
npm install      # instala as dependências de build (Tailwind e marked)
npm run dev      # monta o site, observa mudanças e serve em http://localhost:8000
npm test         # testes do motor de cálculo
npm run build    # site pronto para publicar em dist/
```

## Estrutura

```
index.html             a calculadora
assets/js/params.js    tabelas legais de 2026: INSS, IR, Simples, dividendos
assets/js/calc.js      motor de cálculo: funções puras e testáveis
assets/js/cotacao.js   cotação do dólar ao vivo, com três fontes
assets/js/formato.js   números no formato brasileiro ("12.000,50")
assets/js/app.js       formulário, modos e renderização
assets/img/            logo, favicon, foto do autor e imagem de compartilhamento
src/styles.css         componentes do Tailwind
src/partials/          rodapé compartilhado pela calculadora e pelo guia
scripts/build.mjs      build: calculadora, guia, CSS, sitemap e servidor local
tailwind.config.js     tokens de cor, fonte e estilo dos textos do guia
tests/calc.test.js     testes do motor
docs/                  regras e fontes (viram o guia do site), arquitetura e design
```

Para atualizar o ano, comece por `assets/js/params.js` e siga o [passo a passo](docs/09-arquitetura.md#atualizar-para-um-novo-ano).

## Privacidade

Os valores que você digita ficam no seu navegador (`localStorage`) e não são enviados para nenhum servidor. A página só faz pedidos externos para buscar a cotação do dólar (AwesomeAPI, Banco Central, Frankfurter) e a fonte Inter (Google Fonts).

## Encontrou uma regra errada?

[Abra uma issue](https://github.com/gcfialho/pareo/issues/new) com o valor esperado e a fonte (lei, portaria ou página da Receita). Correções nas tabelas ficam em `assets/js/params.js`, e todo pull request roda os testes.

## Aviso

O Páreo é uma estimativa para comparação, não consultoria contábil ou jurídica. Regras com divergência (IOF na exportação, retenção de dividendos no Simples) estão sinalizadas na página e na documentação. Confirme com um contador antes de decidir.

## Autor

Feito por **Guilherme Fialho** ([@gcfialho](https://github.com/gcfialho)), engenheiro de dados e de machine learning, com foco em GenAI e LLMs.

[Portfólio](https://gcfialho.github.io) · [LinkedIn](https://www.linkedin.com/in/guilherme-cagide-fialho/)

Licença [MIT](LICENSE).
