# Aplicação

> Estado da Fase 1. Cobre as etapas **E1 · Acesso e identidade** e **E2 · Projetos** de [`13-escopo-v1.md`](13-escopo-v1.md).

## Stack

Conforme [D-000](12-decisoes-tecnicas.md#d-000--stack-da-aplicação):

| Camada | Escolha |
|---|---|
| Aplicação | Next.js 15, App Router |
| API | Route Handlers em `/api/v1`, seguindo o [doc 10](10-contrato-de-api.md) |
| Dados | PostgreSQL 16 via Prisma 7 |
| Sessão | Auth.js v5, estratégia `database` |
| Validação | Zod nas fronteiras |

## Estrutura

```
prisma/
  schema.prisma          modelo do doc 05
  migrations/            inclui as regras de integridade em SQL
  seed.ts                massa de desenvolvimento
src/
  auth.ts                ponto de entrada do Auth.js
  app/
    api/v1/              rotas do contrato do doc 10
    (portal)/            áreas autenticadas
      projetos/          lista e detalhe nas três visões
    entrar/              tela de acesso
    styles/              tokens e base
  components/
    ui.tsx               componentes do inventário do doc 11
    shell.tsx            navegação lateral e cabeçalho
  server/
    db.ts                cliente Prisma
    audit.ts             trilha de auditoria
    api/handler.ts       envoltório das rotas
    auth/
      permissions.ts     catálogo e conjuntos por perfil
      authorize.ts       capacidade + escopo
      errors.ts          mapeamento para 401/403/404
      config.ts          Auth.js
      session.ts         sessão -> Actor
      invites.ts         convites
      mailer.ts          envio de e-mail
tests/server/            testes de autorização e de ponta a ponta
```

## Autorização

O modelo está em [`14-matriz-permissoes.md`](14-matriz-permissoes.md). Três decisões de implementação merecem registro.

**Uma camada só.** `src/server/auth/authorize.ts` é a única que decide acesso. Route Handlers e Server Components chamam as mesmas funções. Duas implementações da mesma regra divergem com o tempo, e a divergência em autorização é vazamento.

**404 para fora de escopo.** `resolveProjectAccess` não distingue projeto inexistente de projeto alheio: os dois lançam `out_of_scope`, que vira 404. A diferença entre as duas respostas é exatamente a informação que o doc 02 proíbe vazar — com 403, bastaria varrer identificadores para descobrir quais projetos existem. O 403 fica para quem está no escopo e não tem a capacidade.

**Permissões não entram na sessão.** A sessão carrega apenas `id`, `isSuperAdmin` e `isInternal`. As permissões por projeto são resolvidas a cada requisição, contra o banco. Guardá-las na sessão faria um vínculo revogado continuar valendo até a sessão expirar — até 30 dias depois.

### Recorte de leitura

Autorizar não é só permitir ou negar uma ação: é limitar o que uma listagem devolve. As funções `visible*Where` produzem cláusulas Prisma para que o recorte aconteça no banco.

| Função | Regra |
|---|---|
| `visibleProjectsWhere` | Só projetos com vínculo ativo; rascunho apenas para a equipe |
| `visibleUpdatesWhere` | Cliente vê apenas `published` |
| `visibleMaterialsWhere` | Cliente e professor veem apenas `published` |
| `visibleTimeEntriesWhere` | `time.read_own` filtra por autor |
| `visibleActivitiesWhere` | Exige `activity.read`, que o aluno não tem |

Filtrar em memória depois de ler tudo é como dado alheio vaza por engano — e foi assim que um defeito real apareceu durante a construção: a rota `/me` listava `ProjectMember` direto, sem passar pela regra de visibilidade, e devolvia ao professor um projeto em rascunho que ele não deveria enxergar. O teste de ponta a ponta pegou; o teste da camada, não. Os dois níveis se complementam.

## Regras no banco

Algumas regras do doc 05 não são expressáveis no schema Prisma e foram aplicadas por SQL, em `prisma/migrations/*_regras_de_integridade`. Elas valem mesmo para quem escrever fora da aplicação:

| Regra | Mecanismo |
|---|---|
| Um timer ativo por usuário | Índice único parcial em `status = 'running'` |
| `ended_at` posterior a `started_at` | `CHECK` |
| `planned_hours` não negativo | `CHECK` |
| NPS entre 0 e 10 | `CHECK` |
| Material com origem definida | `CHECK` sobre `storage_key` e `link_url` |
| Trilha de auditoria imutável | Gatilho que recusa `UPDATE` e `DELETE` |

O timer merece destaque: a exigência do doc 05 é "somente um timer ativo por usuário". Verificar na aplicação não resolve — duas requisições simultâneas passam pela verificação antes de qualquer uma gravar. O índice parcial resolve em transação.

## Autenticação

[D-001](12-decisoes-tecnicas.md#d-001--provedor-de-autenticação): sem senha no produto.

| Público | Entrada |
|---|---|
| Equipe 3ADS | SSO Google, restrito ao domínio de `INTERNAL_EMAIL_DOMAIN` |
| Professores e clientes | Link mágico, 15 minutos, uso único |

**Ninguém se cadastra sozinho.** O callback `signIn` recusa e-mail sem usuário previamente criado. O acesso nasce de um convite feito por quem já está dentro, e o convite guarda o perfil e os projetos — assim a autorização nasce correta, em vez de ser ajustada depois.

O envio de e-mail passa por uma interface (`mailer.ts`). Em desenvolvimento, o link aparece no terminal, o que permite exercitar o fluxo inteiro sem provedor configurado. O provedor real entra em E10.

## Auditoria

`audit()` grava em `AuditLog`. Nunca lança: falha de auditoria não pode derrubar a operação que a originou — mas vai para o log do servidor, onde o monitoramento encontra.

O endereço de origem nunca é gravado em claro. O hash com sal fixo permite correlacionar tentativas sem guardar o dado pessoal, conforme o [doc 15](15-retencao-e-privacidade.md). `sanitize()` remove segredos e converte datas e decimais para JSON válido.

Toda negativa de autorização é registrada pelo envoltório `route`, sem que cada rota precise lembrar.

## As três visões

A rota `/projetos/[id]` serve os três perfis. É a tradução direta do doc 01: "não são três ferramentas separadas, mas três visões da mesma operação".

| | Admin e Operação | Professor | Cliente |
|---|---|---|---|
| Escopo, período, etapas | ● | ● | ● |
| Pessoas envolvidas | ● | ● | ● |
| Progresso | ● | ● | ● |
| Atividades | ● | ● | ● ponto focal |
| Próximos passos | ● | ● | — |
| Pendências da operação | ● | — | — |
| O que aguarda o cliente | — | — | ● em destaque |
| Consumo de horas | ● | próprias | — |
| Observações internas | ● | — | — |
| Materiais não publicados | ● | — | — |

Duas decisões de interface que vieram do produto, não do código:

**O rótulo do estado muda conforme quem lê.** `waiting_client` é "Aguardando cliente" para a equipe e "Aguardando você" para o cliente. O doc 06 exige que o estado venha sempre acompanhado de texto; o texto precisa ser o certo para quem está lendo.

**O cliente não vê horas em análise.** O D-004 sujeita a hora de parceiro externo a aprovação, e mostrar horas ainda não aprovadas faria o consumo de escopo oscilar para baixo quando uma fosse rejeitada. Número instável destrói a confiança de quem acompanha — que é justamente o que o portal do Cliente existe para construir.

## Ciclo de vida do projeto

Implementa o D-008. As transições ficam em `src/server/projects/lifecycle.ts`.

Encerrar exige que não haja timer em execução, hora pendente de aprovação nem atividade em aberto. A última condição é deliberada: encerrar um projeto com tarefa em aberto esconde trabalho que ficou por fazer, que é o oposto do que o portal existe para resolver. Quando a transição é recusada, a resposta nomeia cada impedimento.

Remover uma pessoa encerra o vínculo e nada mais. O doc 02 é explícito: "a remoção de acesso não deve apagar o histórico produzido pelo usuário" — as atividades, horas e atualizações dela permanecem no projeto.

## Verificação

```
npm run verify
```

| Etapa | O que cobre |
|---|---|
| `typecheck` | TypeScript estrito |
| `verify:tokens` | 46 pares de contraste, sincronia dos tokens |
| `test:prototype` | 44 checagens de navegador no protótipo |
| `test:authz` | 39 testes de autorização contra banco real |
| `test:e2e` | 34 testes de ponta a ponta com servidor e sessão |

Os testes de autorização rodam contra banco real, não mocks: a regra envolve consulta, e mock de consulta testa o mock. Eles foram submetidos a teste de mutação — trocar o 404 por 403 derruba 3 testes; fazer a concessão indevida valer derruba 2.

## Ambiente local

```
service postgresql start
createdb portal_edu && createdb portal_edu_test
cp .env.example .env        # preencher DATABASE_URL e AUTH_SECRET
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

## O que falta na Fase 1

E1 e E2 estão completos. Segue a ordem de [`13-escopo-v1.md`](13-escopo-v1.md):

| Etapa | Entrega |
|---|---|
| 3 | E3 · Atividades · E4 · Horas |
| 4 | E5 · Materiais · E6 · Atualizações |
| 5 | E9 · Dashboards · E7 · Mural · E8 · Feedbacks |
| 6 | E10 · Notificações |
| 7 | E11 e E12 · Base técnica e qualidade |

### Rotas implementadas

| Rota | Etapa |
|---|---|
| `GET/PATCH /me` | E1 |
| `GET/POST /projects` | E2 |
| `GET/PATCH /projects/{id}` | E2 |
| `GET/POST /projects/{id}/members` | E2 |
| `PATCH/DELETE /projects/{id}/members/{userId}` | E2 |
| `GET/PUT /projects/{id}/stages` | E2 |
| `GET /projects/{id}/summary` | E2 |
| `POST /projects/{id}/status` | E2 |
| `POST /projects/{id}/archive` | E2 |
| `GET/POST /projects/{id}/activities` | E2 · fronteira com E3 |

A criação de atividades entrou em E2 porque sem ela o critério de pronto não era verificável: "próximos passos" e "aguardando você" saem de atividades. O restante de E3 — timer, conclusão, histórico por atividade — vem na etapa seguinte.

### Pendências conhecidas

- O cadastro de organizações ainda não tem tela nem rota: hoje um projeto novo exige uma organização cliente já existente.
- A tela de cadastro de projeto e a de gestão de pessoas existem apenas como API; o Admin ainda opera por requisição.
- Os itens de navegação das etapas futuras não aparecem no menu, para não prometer o que não há.
