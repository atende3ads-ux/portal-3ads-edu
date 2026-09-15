# Escopo da primeira versão produtiva

> Entregável da Fase 0: “fechar escopo da primeira versão”.

## Critério de corte

A v1 entrega **o ciclo completo de um projeto real**, do cadastro ao encerramento, para os três perfis. O teste é o fluxo integrado do doc 01: se os dez passos rodam de ponta a ponta com dados reais, a v1 cumpriu o seu papel.

Recurso que não participa desse ciclo fica fora, por melhor que seja. O risco da v1 não é faltar funcionalidade — é entregar muita coisa pela metade e a equipe continuar usando planilha.

## O que entra

### E1 · Acesso e identidade

Autenticação (SSO interno e link mágico externo), convite por e-mail com definição de perfil e projetos, sessão segura, perfil do usuário e autorização verificada **no servidor** em toda rota e endpoint.

**Pronto quando:** um professor autenticado que digitar a URL de um projeto alheio recebe 404 — não 403, para não confirmar a existência do projeto — e a tentativa fica registrada em `AuditLog`.

### E2 · Projetos

Cadastro com todos os campos do doc 03, listagem com filtros, detalhe com abas (resumo, atividades, materiais, pessoas, horas, histórico), etapas, gestão de membros e papéis, ciclo de vida completo do D-008 e a visualização do portal do cliente pelo Admin.

**Pronto quando:** um projeto criado do zero exibe corretamente escopo, pessoas, progresso e próximos passos nas três visões, sem nenhum dado inserido manualmente no banco.

### E3 · Atividades

Criação, atribuição, prazo, prioridade, os sete estados do doc 05, conclusão, histórico por atividade e filtros por status, responsável e etapa nos três portais.

**Pronto quando:** o cliente consegue identificar, sem ajuda, quais itens dependem dele — a necessidade central do portal do Cliente.

### E4 · Horas

Timer com trava de um por usuário no banco, lançamento manual, tipos de dedicação (hora-aula, preparação, reunião, produção de material, backoffice), observação opcional, correção de registro, aprovação assimétrica do D-004, totais por projeto e por pessoa e exportação CSV.

**Pronto quando:** dois timers simultâneos do mesmo usuário são impossíveis — bloqueados por restrição transacional, não por verificação na interface — e o total de horas do projeto bate com a soma dos registros aprovados.

### E5 · Materiais

Upload por URL assinada, validação de tipo e tamanho, varredura antivírus, ciclo `private` → `in_review` → `published` → `archived`, download com autorização verificada no momento do pedido, links externos e biblioteca filtrável.

**Pronto quando:** a URL de download de um material privado, copiada por alguém autorizado, não funciona para quem não tem acesso — e expira.

### E6 · Atualizações e histórico

Publicação de notas e relatos de aula, anexos, observação opcional, autor e data, visibilidade (interna ou publicada ao cliente) e linha do tempo por projeto.

**Pronto quando:** alguém que nunca participou do projeto entende o que aconteceu lendo apenas a linha do tempo — o critério do doc 01.

### E7 · Mural de recados

Recado por público (todos, professores, clientes, projeto específico), com texto, imagem, link, período de publicação e agendamento.

**Pronto quando:** um recado agendado aparece na data certa, apenas para o público certo.

### E8 · Avaliações e feedbacks

Envio por cliente e professor, NPS para projeto e para a 3ADS, comentário, anonimato conforme D-006, fila administrativa com classificação, responsável e encaminhamento, e encerramento com histórico preservado.

**Pronto quando:** um feedback enviado pelo cliente chega ao painel do Admin como pendência e pode ser encerrado com registro de quem tratou e como.

### E9 · Dashboards

Painel do Admin com projetos ativos, encerramentos próximos, pendências, atrasos, consumo de horas, materiais aguardando publicação e feedbacks novos. Início do Professor com projetos, atividades, materiais pendentes, próximas aulas, horas e recados. Visão geral do Cliente com progresso, etapa, itens aguardando ação, próximo encontro e materiais.

**Pronto quando:** todo alerta do painel abre o registro correspondente — o doc 06 é explícito: nada de card que só exibe um aviso dizendo “aberto”.

### E10 · Notificações

Notificação no portal para todos os eventos e e-mail para os eventos acionáveis do D-007, com preferência por usuário.

**Pronto quando:** publicar um material para o cliente gera notificação ao cliente, e apenas a ele.

### E11 · Base técnica

Trilha de auditoria das operações sensíveis, logs estruturados, backup automático com restauração testada, monitoramento e alertas, migrações versionadas e CI com lint, tipos, testes e verificação de tokens.

**Pronto quando:** existe um teste de restauração de backup executado com sucesso, documentado com data.

### E12 · Qualidade transversal

Conformidade com o design system do doc 06 e com [`11-tokens-de-design.md`](11-tokens-de-design.md): WCAG AA, navegação completa por teclado, foco visível, Escape em diálogos, `prefers-reduced-motion`, alvos de 40 × 40 px e responsividade verificada em 1440, 1024, 768, 390 e 320 px.

**Pronto quando:** o plano de testes do doc 07 passa integralmente.

## O que fica fora

| Item | Por quê | Quando |
|---|---|---|
| Relatórios financeiros e faturamento | Fora do escopo declarado do produto | Backlog |
| Emissão de certificados | Exige gestão acadêmica formal | Backlog |
| Calendário integrado (Google, Outlook) | Agenda própria resolve a v1 | Fase 5 |
| Notificação por WhatsApp | API oficial, templates e consentimento: escopo próprio | Fase 5 |
| Integração com Drive e Meet | Links manuais atendem a v1 | Fase 5 |
| Modelos reutilizáveis de projeto | Só faz sentido com padrão observado em uso real | Fase 5 |
| Previsão de capacidade e dashboards avançados | Depende de histórico de horas acumulado | Fase 5 |
| Aplicativo móvel | Web responsiva atende; só com uso que justifique | Indefinido |
| Segundo fator de autenticação | Recomendado para Admin logo após a v1 | Pós-v1 |
| Papel `client_learner` completo | Entra no primeiro projeto com turma aberta | Pós-v1 |
| Chat ou mensagens diretas | O portal não substitui WhatsApp; centraliza o registro | Fora |

## Ordem de construção

A sequência importa: cada etapa depende da anterior estar confiável.

| Etapa | Entrega | Depende de |
|---|---|---|
| 1 | E1 · Acesso e identidade | — |
| 2 | E2 · Projetos e membros | E1 |
| 3 | E3 · Atividades · E4 · Horas | E2 |
| 4 | E5 · Materiais · E6 · Atualizações | E2 |
| 5 | E9 · Dashboards · E7 · Mural · E8 · Feedbacks | E3, E4, E5, E6 |
| 6 | E10 · Notificações | E5, E8 |
| 7 | E11 e E12 · Base técnica e qualidade | tudo |

E1 vem primeiro e sozinho porque é o que separa os três públicos. Construir qualquer tela antes da autorização significa reescrevê-la depois.

## Critério de aceite da v1

Mantido o do doc 07, com as adições da Fase 0. A versão pode ser liberada quando:

- todos os fluxos críticos funcionam com dados reais;
- os testes de autorização do doc 07 passam integralmente;
- não há defeito crítico ou alto em aberto;
- backup, monitoramento e plano de suporte estão definidos e testados;
- `node design/verify-tokens.mjs` passa no CI;
- as decisões marcadas como “Proposto” no doc 12 foram confirmadas pela 3ADS;
- a validação com os três perfis do doc 16 foi realizada e os bloqueadores, resolvidos.
