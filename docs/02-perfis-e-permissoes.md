# Perfis e permissões

## Perfis

### Admin geral

Possui visão completa da operação, gerencia usuários e pode delegar permissões mais restritas.

### Operação 3ADS

Usuário interno com permissões definidas por projeto ou módulo. Pode atualizar projetos, registrar horas e gerenciar materiais quando autorizado.

### Professor ou trainer

Parceiro externo que acessa somente os projetos em que participa. Pode registrar horas, enviar materiais, atualizar aulas, concluir tarefas e avaliar a experiência.

### Cliente ou aluno

Acompanha somente os projetos autorizados. Tem acesso de leitura ao escopo, andamento, pessoas e materiais publicados. Pode enviar comentários e avaliações.

## Matriz de permissões proposta

| Recurso | Admin geral | Operação | Professor | Cliente |
|---|---:|---:|---:|---:|
| Visualizar todos os projetos | Sim | Conforme permissão | Não | Não |
| Criar e editar projeto | Sim | Opcional | Não | Não |
| Gerenciar usuários e permissões | Sim | Opcional | Não | Não |
| Visualizar projeto autorizado | Sim | Sim | Sim | Sim |
| Criar atividades | Sim | Opcional | Não | Não |
| Atualizar atividade atribuída | Sim | Sim | Sim | Não |
| Registrar horas | Sim | Sim | Sim | Não |
| Usar timer | Sim | Sim | Sim | Não |
| Publicar atualização | Sim | Sim | Sim | Não |
| Enviar material | Sim | Sim | Sim | Não |
| Publicar material para cliente | Sim | Opcional | Não | Não |
| Baixar material publicado | Sim | Sim | Sim | Sim |
| Publicar recado geral | Sim | Opcional | Não | Não |
| Enviar comentário ou avaliação | Sim | Sim | Sim | Sim |
| Visualizar feedbacks de todos | Sim | Opcional | Não | Não |

## Regras obrigatórias

- A autorização deve ser validada no servidor, nunca apenas escondida na interface.
- Professores não podem descobrir nomes ou dados de projetos não autorizados.
- Clientes não podem editar escopo, etapas, atividades, materiais ou pessoas.
- Downloads devem verificar acesso ao arquivo no momento da solicitação.
- Alterações de permissão devem gerar registro de auditoria.
- A remoção de acesso não deve apagar o histórico produzido pelo usuário.

## Permissões granulares recomendadas

- `project.read`
- `project.create`
- `project.update`
- `project.archive`
- `activity.read`
- `activity.manage`
- `material.read`
- `material.upload`
- `material.publish`
- `time.read_own`
- `time.read_all`
- `time.create`
- `update.create`
- `notice.manage`
- `feedback.create`
- `feedback.read_all`
- `user.manage`
- `permission.manage`

