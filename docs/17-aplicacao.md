# Aplicação

> Estado da Fase 1. Cobre a etapa **E1 · Acesso e identidade** de [`13-escopo-v1.md`](13-escopo-v1.md).

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
    entrar/              tela de acesso
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
| `test:e2e` | 15 testes de ponta a ponta com servidor e sessão |

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

E1 está completo. Segue a ordem de [`13-escopo-v1.md`](13-escopo-v1.md):

| Etapa | Entrega |
|---|---|
| 2 | E2 · Projetos e membros — telas, gestão de vínculos, ciclo de vida |
| 3 | E3 · Atividades · E4 · Horas |
| 4 | E5 · Materiais · E6 · Atualizações |
| 5 | E9 · Dashboards · E7 · Mural · E8 · Feedbacks |
| 6 | E10 · Notificações |
| 7 | E11 e E12 · Base técnica e qualidade |

As rotas de `/api/v1` implementadas até aqui são `/me`, `/projects` e `/projects/{id}`. O restante do contrato do doc 10 acompanha as etapas correspondentes.
