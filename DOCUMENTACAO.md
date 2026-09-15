# Portal 3ADS EDU — Documentação

Versão documentada: protótipo front-end de 15 de setembro de 2026.

## Objetivo

O Portal 3ADS EDU centraliza a operação de projetos educacionais da 3ADS para três públicos:

- equipe administrativa e operacional;
- professores e trainers parceiros;
- clientes e alunos vinculados aos projetos.

O produto deve reunir projetos, pessoas, atividades, horas, materiais, atualizações, recados e avaliações em um ambiente simples, responsivo e orientado à ação.

## Estado atual

O repositório contém um protótipo navegável em HTML, CSS e JavaScript. Ele demonstra telas, fluxos, formulários, filtros, downloads simulados, timer e persistência local. Ainda não possui backend, banco de dados, autenticação, autorização real, armazenamento de arquivos ou integrações externas.

| Área | Arquivo inicial | Finalidade |
|---|---|---|
| Admin | [`outputs/admin.html`](outputs/admin.html) | Operação interna e gestão integral |
| Professor | [`outputs/trainer.html`](outputs/trainer.html) | Projetos, tarefas, horas e suporte ao trainer |
| Cliente | [`outputs/index.html`](outputs/index.html) | Acompanhamento do projeto e materiais |

## Índice da documentação

### Produto e requisitos

1. [Visão do produto](docs/01-visao-do-produto.md)
2. [Perfis e permissões](docs/02-perfis-e-permissoes.md)
3. [Requisitos e fluxos funcionais](docs/03-requisitos-e-fluxos.md)

### Técnico

4. [Arquitetura técnica atual](docs/04-arquitetura-tecnica.md)
5. [Modelo de dados proposto](docs/05-modelo-de-dados.md)
10. [Contrato inicial de API](docs/10-contrato-de-api.md)

### Design e qualidade

6. [Design system e UX](docs/06-design-system-e-ux.md)
7. [Plano de testes e critérios de aceite](docs/07-testes-e-aceite.md)
11. [Tokens de design e auditoria de acessibilidade](docs/11-tokens-de-design.md)

### Fase 0 — consolidação

12. [Decisões técnicas](docs/12-decisoes-tecnicas.md)
13. [Escopo da primeira versão produtiva](docs/13-escopo-v1.md)
14. [Matriz de permissões validada](docs/14-matriz-permissoes.md)
15. [Retenção, privacidade e auditoria](docs/15-retencao-e-privacidade.md)
16. [Roteiro de validação do protótipo](docs/16-roteiro-de-validacao.md)

### Fase 1 — construção

17. [Aplicação](docs/17-aplicacao.md)

### Operação

8. [Roadmap para produção](docs/08-roadmap-para-producao.md)
9. [Guia de uso](docs/09-guia-de-uso.md)
&nbsp;&nbsp;&nbsp;[Registro de mudanças](CHANGELOG.md)

## Estado da Fase 0

| Item da Fase 0 | Situação |
|---|---|
| Fechar escopo da primeira versão | Concluído — [doc 13](docs/13-escopo-v1.md) |
| Validar matriz de permissões | Concluído — [doc 14](docs/14-matriz-permissoes.md) |
| Definir regras de retenção e privacidade | Concluído, pendente de revisão jurídica — [doc 15](docs/15-retencao-e-privacidade.md) |
| Transformar identidade visual em tokens | Concluído — [doc 11](docs/11-tokens-de-design.md), `design/` |
| Revisar protótipo com os três perfis | Roteiro pronto, sessões a realizar — [doc 16](docs/16-roteiro-de-validacao.md) |

Cinco decisões continuam marcadas como “Proposto” no [doc 12](docs/12-decisoes-tecnicas.md) e dependem de confirmação da 3ADS.

## Estado da Fase 1

| Etapa | Situação |
|---|---|
| E1 · Acesso e identidade | Concluída — [doc 17](docs/17-aplicacao.md) |
| E2 · Projetos | Concluída — [doc 17](docs/17-aplicacao.md) |
| E3 a E12 | A construir, na ordem do [doc 13](docs/13-escopo-v1.md) |

## Execução local

Abra diretamente um dos três arquivos HTML listados acima, ou sirva a pasta:

```
npm run serve
```

Os logotipos e fotos ainda não estão versionados — ver [`outputs/assets/README.md`](outputs/assets/README.md). Sem eles o protótipo continua navegável, exibindo o texto alternativo no lugar das imagens.

## Verificação automatizada

```
npm install      # Playwright, usado nos testes de navegador
npm run verify   # tokens + protótipo
```

- `npm run verify:tokens` — confere 46 pares de contraste contra WCAG AA e a sincronia entre `design/tokens.css` e `design/tokens.json`;
- `npm run test:prototype` — 44 verificações nas três telas: carregamento, tokens, Escape nos diálogos, foco, teclado, alvos de toque e ausência de rolagem horizontal em 1440, 1024, 768, 390 e 320 px.

## Convenções

- “Projeto” é o agrupador principal de cliente, escopo, pessoas, atividades, materiais e horas.
- “Professor” e “trainer” representam o mesmo perfil funcional.
- “Cliente” pode representar o ponto focal da empresa ou um aluno autorizado.
- “Backoffice” é toda dedicação operacional que não corresponde diretamente a hora-aula.
- Informações marcadas como “simuladas” existem somente para demonstrar a experiência.
