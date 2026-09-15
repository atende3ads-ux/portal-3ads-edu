# Matriz de permissões validada

> Entregável da Fase 0: “validar a matriz de permissões”.
> Resolve os campos “Opcional” de [`02-perfis-e-permissoes.md`](02-perfis-e-permissoes.md) e liga cada permissão aos endpoints de [`10-contrato-de-api.md`](10-contrato-de-api.md).

## Modelo de autorização

A autorização responde a **duas perguntas em sequência**, e ambas precisam passar:

1. **O usuário tem a permissão?** — capacidade, vinda do perfil e das concessões por projeto.
2. **O recurso está no escopo dele?** — vínculo, vindo de `ProjectMember`.

Ter `material.publish` não autoriza publicar em qualquer projeto: autoriza publicar nos projetos dos quais a pessoa é membro com aquela permissão. O Admin geral é a única exceção — seu escopo é global.

```
permitido = temPermissao(usuario, acao) && noEscopo(usuario, recurso)
```

As duas verificações acontecem **no servidor**, na camada de serviço, compartilhada entre Route Handlers e Server Components. Esconder um botão não é autorização.

## Perfis

| Perfil | Código | Escopo | Permissões |
|---|---|---|---|
| Admin geral | `admin` | Global | Todas, fixas |
| Operação 3ADS | `ops` | Projetos em que é membro | Conjunto padrão, ajustável por projeto |
| Professor ou trainer | `trainer` | Projetos em que é membro | Conjunto fixo, restrito |
| Cliente — ponto focal | `client_focal` | Projeto autorizado | Leitura e feedback |
| Cliente — aluno | `client_learner` | Projeto autorizado | Leitura parcial e feedback |

Os dois papéis de cliente vêm do [D-005](12-decisoes-tecnicas.md#d-005--cliente-e-aluno).

## Matriz resolvida

Os “Opcional” do doc 02 se referiam ao perfil Operação. A resolução: Operação recebe um **conjunto padrão** ao ser convidada, e o Admin pode ampliar ou reduzir por projeto. As colunas abaixo mostram o padrão.

| Recurso | Admin | Operação | Professor | Focal | Aluno |
|---|:---:|:---:|:---:|:---:|:---:|
| Visualizar todos os projetos | ● | ○ | — | — | — |
| Visualizar projeto autorizado | ● | ● | ● | ● | ● |
| Criar projeto | ● | ○ | — | — | — |
| Editar projeto | ● | ● | — | — | — |
| Arquivar projeto | ● | — | — | — | — |
| Gerenciar usuários | ● | ○ | — | — | — |
| Gerenciar permissões | ● | — | — | — | — |
| Criar atividades | ● | ● | — | — | — |
| Atualizar atividade atribuída | ● | ● | ● | — | — |
| Ver atividades do projeto | ● | ● | ● | ● | — |
| Registrar horas | ● | ● | ● | — | — |
| Usar timer | ● | ● | ● | — | — |
| Ver horas próprias | ● | ● | ● | — | — |
| Ver horas de todos | ● | ● | — | — | — |
| Aprovar horas | ● | ○ | — | — | — |
| Publicar atualização | ● | ● | ● | — | — |
| Enviar material | ● | ● | ● | — | — |
| Publicar material ao cliente | ● | ● | — | — | — |
| Baixar material publicado | ● | ● | ● | ● | ● |
| Publicar recado geral | ● | ○ | — | — | — |
| Enviar comentário ou avaliação | ● | ● | ● | ● | ● |
| Ver feedbacks de todos | ● | ● | — | — | — |
| Tratar feedback | ● | ● | — | — | — |

● concedido por padrão ○ concedível pelo Admin — nunca

### Decisões por trás dos “Opcional”

**Operação cria projeto (○).** Nem todo usuário de Operação é gestor. Quem faz apoio administrativo não precisa abrir contrato. Concedível.

**Operação gerencia usuários (○).** Convidar cliente e professor é rotina operacional; alterar perfil de usuário interno, não. A permissão `user.manage` autoriza convidar e desativar dentro dos projetos onde a pessoa é membro. `permission.manage` fica **exclusiva do Admin geral** — quem pode alterar permissões pode escalar a si mesmo.

**Operação aprova horas (○).** O D-004 sujeita a hora de parceiro externo a aprovação. Quem aprova assume uma responsabilidade financeira: concedível, não padrão.

**Operação publica recado geral (○).** Recado para “todos” alcança clientes de todos os projetos. Padrão é publicar apenas no escopo dos próprios projetos; o alcance global é concedível.

**Professor não publica material ao cliente (—).** O doc 03 é explícito: o professor envia, o material fica em revisão, o Admin publica. É controle de qualidade da 3ADS sobre o que chega ao cliente, e não deve ser concedível.

**Aluno não vê atividades (—).** O D-005 reserva a visão de execução ao ponto focal. O aluno vê materiais e agenda.

## Permissões granulares

As 18 do doc 02, mais quatro que os fluxos exigem e não estavam nomeadas.

| Permissão | Autoriza | Endpoints |
|---|---|---|
| `project.read` | Ver projeto no escopo | `GET /projects`, `GET /projects/{id}`, `GET /projects/{id}/summary` |
| `project.create` | Criar projeto | `POST /projects` |
| `project.update` | Editar projeto e etapas | `PATCH /projects/{id}` |
| `project.archive` | Arquivar e reabrir | `POST /projects/{id}/archive` |
| `activity.read` | Ver atividades | `GET /projects/{id}/activities`, `GET /activities/{id}` |
| `activity.manage` | Criar, editar, atribuir, concluir | `POST /projects/{id}/activities`, `PATCH /activities/{id}`, `POST /activities/{id}/complete` |
| `activity.update_own` † | Atualizar atividade atribuída a si | `PATCH /activities/{id}`, `POST /activities/{id}/complete` |
| `material.read` | Listar e baixar material publicado | `GET /materials/{id}/download-url` |
| `material.upload` | Enviar arquivo | `POST /projects/{id}/materials/upload-url`, `POST /projects/{id}/materials` |
| `material.publish` | Publicar, despublicar, arquivar | `PATCH /materials/{id}` |
| `time.read_own` | Ver horas próprias | `GET /time-entries` (filtrado) |
| `time.read_all` | Ver horas de todos no projeto | `GET /time-entries` (completo) |
| `time.create` | Registrar horas e usar timer | `POST /time-entries`, `POST /timers`, `GET /timers/active`, `POST /timers/{id}/stop`, `PATCH /time-entries/{id}` |
| `time.approve` † | Aprovar ou rejeitar horas | `PATCH /time-entries/{id}` (campo `status`) |
| `update.create` | Publicar atualização e relato | `POST /projects/{id}/updates` |
| `update.read` † | Ver linha do tempo conforme visibilidade | `GET /projects/{id}/updates` |
| `notice.manage` | Criar, editar, agendar recado | `POST /notices`, `PATCH /notices/{id}` |
| `feedback.create` | Enviar comentário e avaliação | `POST /projects/{id}/feedbacks` |
| `feedback.read_all` | Ver a fila de feedbacks | `GET /feedbacks` |
| `feedback.manage` † | Classificar, atribuir, resolver | `PATCH /feedbacks/{id}` |
| `user.manage` | Convidar, desativar, editar membros | `POST /projects/{id}/members`, `DELETE /projects/{id}/members/{userId}` |
| `permission.manage` | Alterar perfil e permissões | `PATCH /projects/{id}/members/{userId}` |

† Acrescentada nesta validação. `activity.update_own` distingue o professor — que mexe só no que é dele — de `activity.manage`. `time.approve` e `feedback.manage` sustentam os fluxos dos docs 03 e 12, que existiam sem permissão nomeada. `update.read` faltava: sem ela, não havia como expressar que o cliente lê apenas atualizações publicadas.

## Conjuntos por perfil

```
admin            todas as permissões, escopo global

ops (padrão)     project.read, project.update, activity.read, activity.manage,
                 material.read, material.upload, material.publish,
                 time.read_own, time.read_all, time.create,
                 update.create, update.read,
                 feedback.create, feedback.read_all, feedback.manage

ops (concedível) project.create, notice.manage, time.approve, user.manage

trainer          project.read, activity.read, activity.update_own,
                 material.read, material.upload,
                 time.read_own, time.create,
                 update.create, update.read, feedback.create

client_focal     project.read, activity.read, material.read,
                 update.read, feedback.create

client_learner   project.read (parcial), material.read,
                 update.read, feedback.create
```

## Regras de escopo

Além da permissão, o servidor aplica:

| Regra | Efeito |
|---|---|
| Vínculo ativo | `ProjectMember` sem `removed_at`. Membro removido não cria registros novos |
| Projeto rascunho | `draft` é invisível para trainer e cliente, mesmo sendo membros |
| Projeto pausado ou encerrado | Escrita bloqueada para todos os perfis, exceto Admin |
| Visibilidade da atualização | Cliente vê apenas `visibility = published` |
| Estado do material | Cliente e trainer veem apenas `published`; `private` e `in_review` são internos |
| Autoria da hora | `time.read_own` filtra por `user_id`; `time.create` só grava em nome próprio |
| Atividade atribuída | `activity.update_own` exige `owner_user_id` igual ao usuário |
| Feedback anônimo | Autoria oculta na leitura, conforme [D-006](12-decisoes-tecnicas.md#d-006--anonimato-em-avaliações) |
| Download | Autorização verificada **no momento do pedido**, não na emissão do link |

## Respostas a acesso negado

O doc 02 exige que um professor não descubra a existência de projetos não autorizados. Isso muda o código de status:

| Situação | Resposta |
|---|---|
| Sessão ausente ou expirada | `401` |
| Recurso existe, fora do escopo do usuário | **`404`** |
| Recurso no escopo, permissão insuficiente | `403` |
| Cliente tentando escrever em dado operacional | `403` |

O `404` para recurso fora de escopo é deliberado: `403` confirmaria que o projeto existe. A distinção entre `403` e `404` acompanha o escopo, não a existência do registro.

Toda resposta `403` e todo `404` por escopo geram `AuditLog` com ator, rota, recurso pretendido e hash do IP.

## Testes obrigatórios

Derivados do doc 07, cada um com teste automatizado:

- [ ] Professor recebe `404` ao acessar projeto não autorizado por URL direta.
- [ ] Professor não recebe nome de cliente ou projeto alheio em nenhuma listagem, busca ou mensagem de erro.
- [ ] Cliente recebe `403` ao tentar `PATCH` em projeto, atividade, material ou hora.
- [ ] Cliente não recebe material `private` nem `in_review` em nenhuma resposta.
- [ ] Trainer não consegue publicar material ao cliente mesmo forjando a requisição.
- [ ] Membro removido recebe `404` no projeto e `403` ao tentar criar registro.
- [ ] URL de download expira e não funciona para usuário sem acesso.
- [ ] Usuário sem `permission.manage` não altera as próprias permissões.
- [ ] `time.read_own` nunca devolve registro de outro usuário.
- [ ] Alteração de permissão gera `AuditLog` com estado anterior e posterior.

Estes testes rodam no CI. Regressão em autorização é defeito crítico e bloqueia o deploy.
