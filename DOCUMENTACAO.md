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

1. [Visão do produto](docs/01-visao-do-produto.md)
2. [Perfis e permissões](docs/02-perfis-e-permissoes.md)
3. [Requisitos e fluxos funcionais](docs/03-requisitos-e-fluxos.md)
4. [Arquitetura técnica atual](docs/04-arquitetura-tecnica.md)
5. [Modelo de dados proposto](docs/05-modelo-de-dados.md)
6. [Design system e UX](docs/06-design-system-e-ux.md)
7. [Plano de testes e critérios de aceite](docs/07-testes-e-aceite.md)
8. [Roadmap para produção](docs/08-roadmap-para-producao.md)
9. [Guia de uso](docs/09-guia-de-uso.md)
10. [Contrato inicial de API](docs/10-contrato-de-api.md)
11. [Registro de mudanças](CHANGELOG.md)

## Execução local

Abra diretamente um dos três arquivos HTML listados acima. Como o protótipo usa caminhos locais para os logotipos, ele foi preparado para execução no computador em que foi desenvolvido.

Para uma implantação real, os logotipos devem ser copiados para `outputs/assets/` e referenciados por caminhos relativos.

## Convenções

- “Projeto” é o agrupador principal de cliente, escopo, pessoas, atividades, materiais e horas.
- “Professor” e “trainer” representam o mesmo perfil funcional.
- “Cliente” pode representar o ponto focal da empresa ou um aluno autorizado.
- “Backoffice” é toda dedicação operacional que não corresponde diretamente a hora-aula.
- Informações marcadas como “simuladas” existem somente para demonstrar a experiência.
