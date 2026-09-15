# Arquitetura técnica

## Arquitetura atual do protótipo

O protótipo é estático e executado integralmente no navegador.

| Arquivo | Responsabilidade |
|---|---|
| `outputs/admin.html` | Estrutura, conteúdo e lógica básica do Admin |
| `outputs/trainer.html` | Estrutura, conteúdo e lógica básica do Professor |
| `outputs/index.html` | Estrutura, conteúdo e lógica básica do Cliente |
| `outputs/portal.css` | Estilos-base de Admin e Professor |
| `outputs/typography.css` | Tipografia, componentes compartilhados e refinamentos |
| `outputs/enhancements.js` | Ícones, menu, timer, uploads e interações de Admin/Professor |
| `outputs/client-actions.js` | Interações adicionais do Cliente |
| `outputs/assets/` | Imagens demonstrativas |

## Persistência atual

O navegador usa `localStorage` para:

- `edu-theme`: preferência de tema;
- `edu-sidebar-collapsed`: estado do menu lateral;
- `edu-time-records`: registros demonstrativos do timer;
- `edu-client-feedback`: avaliações demonstrativas do cliente.

Esses dados não são compartilhados entre dispositivos, não são seguros e podem ser apagados pelo usuário. Não constituem persistência de produção.

## Limitações técnicas atuais

- dados e usuários fictícios incorporados ao HTML;
- ausência de autenticação e recuperação de senha;
- ausência de controle de acesso real;
- nenhuma API ou banco de dados;
- uploads não são enviados a um servidor;
- downloads geram arquivos demonstrativos;
- links externos são simulados;
- caminhos dos logotipos dependem do computador local;
- não existe auditoria, backup ou observabilidade.

## Arquitetura recomendada para produção

### Front-end

- aplicação React/Next.js ou equivalente;
- rotas protegidas por perfil e projeto;
- componentes compartilhados e tokens de design;
- renderização responsiva e acessível;
- camada de consulta com cache e estados de carregamento/erro.

### Backend

- API com autenticação e autorização centralizadas;
- regras de negócio por serviço;
- validação de entrada;
- trilha de auditoria;
- notificações assíncronas.

### Dados e arquivos

- PostgreSQL para dados relacionais;
- armazenamento de objetos compatível com S3 para arquivos;
- URLs assinadas e temporárias para upload/download;
- antivírus e validação de MIME;
- backups automáticos e política de retenção.

### Infraestrutura

- ambientes separados de desenvolvimento, homologação e produção;
- HTTPS obrigatório;
- gestão segura de segredos;
- logs estruturados, métricas e alertas;
- CI/CD com testes e migrações controladas.

## Segurança e LGPD

- coletar somente os dados necessários;
- documentar base legal e finalidade;
- criptografar dados em trânsito e repouso;
- aplicar menor privilégio;
- registrar acessos e alterações relevantes;
- permitir correção, exportação e exclusão conforme política;
- definir prazo de retenção de projetos, arquivos e avaliações;
- firmar regras de tratamento para fornecedores de armazenamento e comunicação.

