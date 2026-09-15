# Modelo de dados proposto

## Entidades principais

### User

| Campo | Tipo | Observação |
|---|---|---|
| id | UUID | Identificador |
| name | string | Nome completo |
| email | string | Único e normalizado |
| avatar_url | string | Opcional |
| status | enum | invited, active, blocked |
| created_at | datetime | Auditoria |

### Organization

Representa 3ADS, cliente ou empresa parceira. Campos: `id`, `name`, `type`, `document`, `status`.

### Project

Campos: `id`, `client_organization_id`, `name`, `type`, `format`, `description`, `scope`, `planned_hours`, `start_date`, `end_date`, `status`, `current_stage`, `client_focal_user_id`, `notes`, `created_by`.

### ProjectMember

Relaciona usuário e projeto. Campos: `project_id`, `user_id`, `role`, `permissions`, `responsibility`, `joined_at`, `removed_at`.

### Activity

Campos: `id`, `project_id`, `stage_id`, `title`, `description`, `status`, `priority`, `owner_user_id`, `due_at`, `completed_at`, `created_by`.

### TimeEntry

Campos: `id`, `project_id`, `activity_id`, `user_id`, `type`, `started_at`, `ended_at`, `duration_minutes`, `source`, `observation`, `status`.

### Update

Campos: `id`, `project_id`, `activity_id`, `author_user_id`, `type`, `title`, `body`, `observation`, `visibility`, `created_at`.

### Material

Campos: `id`, `project_id`, `activity_id`, `uploaded_by`, `name`, `kind`, `mime_type`, `size_bytes`, `storage_key`, `visibility`, `published_at`, `downloadable`.

### Notice

Campos: `id`, `title`, `body`, `image_material_id`, `audience_type`, `project_id`, `link_url`, `publish_at`, `expires_at`, `status`, `created_by`.

### Feedback

Campos: `id`, `project_id`, `author_user_id`, `audience_role`, `target`, `score`, `message`, `anonymous`, `status`, `assigned_to`, `created_at`, `resolved_at`.

### AuditLog

Campos: `id`, `actor_user_id`, `action`, `entity_type`, `entity_id`, `before`, `after`, `ip_hash`, `created_at`.

## Relacionamentos

- uma organização cliente possui muitos projetos;
- um projeto possui muitos membros, atividades, materiais, horas e atualizações;
- um usuário participa de muitos projetos por meio de `ProjectMember`;
- uma atividade pode possuir materiais, atualizações e registros de horas;
- um feedback pertence a um projeto e pode ser atribuído a um Admin;
- toda alteração sensível deve gerar `AuditLog`.

## Estados sugeridos

### Projeto

`draft`, `active`, `paused`, `completed`, `cancelled`, `archived`.

### Atividade

`not_started`, `in_progress`, `waiting_client`, `waiting_3ads`, `blocked`, `completed`, `cancelled`.

### Material

`private`, `in_review`, `published`, `archived`.

### Registro de horas

`running`, `submitted`, `approved`, `rejected`.

## Regras de integridade

- `ended_at` deve ser posterior a `started_at`;
- somente um timer ativo por usuário;
- membros removidos não podem criar novos registros;
- `planned_hours` não pode ser negativo;
- arquivos publicados precisam pertencer ao mesmo projeto do usuário solicitante;
- mudanças de status devem preservar histórico.

