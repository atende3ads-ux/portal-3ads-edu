# Contrato inicial de API

> Proposta para a versão produtiva. Nenhum endpoint desta página existe no protótipo atual.

## Convenções

- base: `/api/v1`;
- autenticação por sessão segura ou token de curta duração;
- datas em ISO 8601 e UTC;
- paginação por cursor;
- erros no formato `{ "code": "...", "message": "...", "details": {} }`;
- todas as operações validam perfil e vínculo com o projeto.

## Autenticação e conta

| Método | Rota | Finalidade |
|---|---|---|
| POST | `/auth/login` | Entrar |
| POST | `/auth/logout` | Encerrar sessão |
| POST | `/auth/recover` | Iniciar recuperação |
| GET | `/me` | Dados e permissões do usuário |
| PATCH | `/me` | Atualizar perfil |

## Projetos

| Método | Rota | Finalidade |
|---|---|---|
| GET | `/projects` | Listar projetos autorizados |
| POST | `/projects` | Criar projeto |
| GET | `/projects/{id}` | Obter detalhes |
| PATCH | `/projects/{id}` | Atualizar projeto |
| POST | `/projects/{id}/archive` | Arquivar projeto |
| GET | `/projects/{id}/summary` | Indicadores consolidados |

Filtros recomendados: `status`, `client_id`, `format`, `start_from`, `end_to`, `search`.

## Membros e permissões

| Método | Rota | Finalidade |
|---|---|---|
| GET | `/projects/{id}/members` | Listar envolvidos |
| POST | `/projects/{id}/members` | Adicionar ou convidar |
| PATCH | `/projects/{id}/members/{userId}` | Alterar papel/permissões |
| DELETE | `/projects/{id}/members/{userId}` | Remover acesso |

## Atividades

| Método | Rota | Finalidade |
|---|---|---|
| GET | `/projects/{id}/activities` | Listar e filtrar atividades |
| POST | `/projects/{id}/activities` | Criar atividade |
| GET | `/activities/{id}` | Detalhe e histórico |
| PATCH | `/activities/{id}` | Atualizar atividade |
| POST | `/activities/{id}/complete` | Concluir atividade |

## Horas e timer

| Método | Rota | Finalidade |
|---|---|---|
| GET | `/time-entries` | Listar registros permitidos |
| POST | `/time-entries` | Criar registro manual |
| POST | `/timers` | Iniciar timer |
| GET | `/timers/active` | Consultar timer ativo |
| POST | `/timers/{id}/stop` | Encerrar e gerar registro |
| PATCH | `/time-entries/{id}` | Corrigir registro permitido |

O servidor deve impedir mais de um timer ativo por usuário por meio de restrição transacional.

## Atualizações e materiais

| Método | Rota | Finalidade |
|---|---|---|
| GET | `/projects/{id}/updates` | Histórico do projeto |
| POST | `/projects/{id}/updates` | Publicar atualização |
| POST | `/projects/{id}/materials/upload-url` | Obter URL temporária de upload |
| POST | `/projects/{id}/materials` | Confirmar metadados do upload |
| PATCH | `/materials/{id}` | Alterar nome, visibilidade ou status |
| GET | `/materials/{id}/download-url` | Obter download temporário |

## Recados e feedbacks

| Método | Rota | Finalidade |
|---|---|---|
| GET | `/notices` | Listar recados do usuário |
| POST | `/notices` | Criar/agendar recado |
| PATCH | `/notices/{id}` | Alterar publicação |
| POST | `/projects/{id}/feedbacks` | Enviar avaliação ou comentário |
| GET | `/feedbacks` | Fila administrativa |
| PATCH | `/feedbacks/{id}` | Classificar, atribuir ou resolver |

## Respostas e status HTTP

- `200`: consulta ou atualização bem-sucedida;
- `201`: recurso criado;
- `204`: operação sem corpo de resposta;
- `400`: dados inválidos;
- `401`: sessão ausente ou expirada;
- `403`: usuário autenticado sem permissão;
- `404`: recurso inexistente ou não visível;
- `409`: conflito, como timer já ativo;
- `413`: arquivo maior que o permitido;
- `422`: regra de negócio não atendida;
- `429`: excesso de solicitações;
- `500`: falha inesperada com identificador de suporte.

## Auditoria

Criação, alteração, publicação, download sensível, mudança de permissão e encerramento de timer devem registrar ator, entidade, ação, data e contexto técnico suficiente para investigação.

