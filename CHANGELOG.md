# Registro de mudanças

## 2026-09-15 · Fase 1 · E2 · Projetos

### Telas

Primeiras telas da versão produtiva, construídas sobre os tokens auditados
do `docs/11` — WCAG AA, foco visível, Escape e alvos de 40 px desde o
início, não como correção posterior.

- navegação lateral recolhível com preferência persistida, menu de conta e
  sobreposição no celular;
- lista de projetos com recorte por perfil;
- **detalhe do projeto nas três visões**, em uma rota só: escopo, etapas,
  progresso, pessoas, atividades, materiais e atualizações, cada perfil
  vendo o que lhe cabe.

### API

- membros: listar, adicionar, alterar papel e permissões, remover;
- etapas do projeto, com reordenação em bloco;
- ciclo de vida do D-008, com os impedimentos de encerramento nomeados;
- indicadores consolidados por perfil;
- criação e listagem de atividades — fronteira com E3, necessária para o
  critério de pronto do E2.

### Critério de pronto do E2

Um projeto criado inteiramente pela API — projeto, etapas, pessoas,
ativação e atividades — exibe escopo, pessoas, progresso e próximos passos
corretamente nas três visões, verificado no HTML renderizado. Nenhum dado
inserido manualmente no banco.

### Decisões de interface

- **o rótulo do estado muda conforme quem lê**: `waiting_client` é
  "Aguardando cliente" para a equipe e "Aguardando você" para o cliente;
- **o cliente não vê horas em análise**: o consumo de escopo usa apenas
  horas aprovadas, para não oscilar quando uma for rejeitada.

### Defeitos encontrados na revisão visual

- o indicador de etapa transbordava e colidia com o vizinho quando o nome
  era longo;
- o estado `waiting_client` aparecia como "Aguardando você" para o Admin.

### Verificação

`npm run verify`: **163 verificações**, todas passando.

## 2026-09-15 · Fase 1 · E1 · Acesso e identidade

### Aplicação

Primeira entrega de código da versão produtiva, na stack decidida em `docs/12`:
Next.js 15 com App Router, Prisma 7 sobre PostgreSQL 16 e Auth.js v5.

- **modelo de dados** completo do `docs/05`: 11 entidades, Auth.js e convites,
  com as máquinas de estado de projeto, atividade, material e horas;
- **regras de integridade no banco**, não na aplicação: índice parcial que
  garante um único timer ativo por usuário, constraints de período, horas e
  NPS, e gatilho que torna a trilha de auditoria imutável;
- **camada de autorização** traduzindo `docs/14`: 22 permissões, conjuntos por
  perfil, verificação de capacidade e de escopo, e recorte de leitura aplicado
  no banco;
- **autenticação sem senha**: SSO restrito ao domínio para a equipe e link
  mágico de 15 minutos para professores e clientes; ninguém se cadastra
  sozinho, o acesso nasce de convite;
- **trilha de auditoria** com hash de IP, remoção de segredos e registro
  automático de toda negativa de autorização;
- **rotas** `/api/v1/me`, `/api/v1/projects` e `/api/v1/projects/{id}`
  conforme o contrato do `docs/10`.

### Critério de pronto do E1

Um professor autenticado que acessa projeto alheio recebe **404**, não 403 —
403 confirmaria a existência do projeto — e a tentativa fica registrada em
`AuditLog` com hash do IP. Verificado por HTTP, com servidor e sessão reais.

### Defeito encontrado durante a construção

A rota `/me` listava os vínculos direto de `ProjectMember`, sem passar pela
regra de visibilidade, e devolvia ao professor um projeto em rascunho que ele
não deveria enxergar. O teste de ponta a ponta pegou; o da camada, não.

### Verificação

`npm run verify` encadeia typecheck, tokens, protótipo, autorização e ponta a
ponta: **144 verificações**, todas passando. Os testes de autorização rodam
contra banco real e foram submetidos a teste de mutação.

### Documentação

- `docs/17-aplicacao.md`: estrutura, decisões de implementação e o que falta.

## 2026-09-15 · Fase 0

### Visão do produto

- ampliada a visão do produto com o contexto da operação: os oito papéis simultâneos do Portal, as necessidades de cada perfil, o fluxo integrado de dez passos e o resultado esperado.

### Entregáveis da Fase 0

- **tokens de design** (`docs/11`, `design/`): paleta unificada, auditada contra WCAG AA, com verificador automatizado;
- **decisões técnicas** (`docs/12`): as oito pendências do roadmap resolvidas, com stack definida — Next.js full-stack, Prisma, PostgreSQL, Auth.js e armazenamento compatível com S3;
- **escopo da v1** (`docs/13`): doze épicos, critérios de pronto, o que fica fora e a ordem de construção;
- **matriz de permissões validada** (`docs/14`): campos “Opcional” resolvidos, quatro permissões acrescentadas, mapeamento para os endpoints e dez testes de autorização obrigatórios;
- **retenção e privacidade** (`docs/15`): bases legais, prazos, anonimização, auditoria e pendências jurídicas;
- **roteiro de validação** (`docs/16`): sessões guiadas para os três perfis, com métricas e classificação de achados.

### Correções no protótipo

Auditoria de acessibilidade e responsividade, com correções aplicadas em `outputs/tokens.css`, `outputs/a11y.css` e `outputs/a11y.js`:

- paleta duplicada e divergente entre `portal.css` e `index.html` unificada em um único arquivo;
- doze pares de cor reprovavam em contraste WCAG AA — entre eles o texto de metadados, com 2,40:1, e todo botão primário, com 3,94:1. Toda a paleta agora passa;
- diálogos passam a fechar com Escape, que não existia em nenhum lugar do código;
- foco visível em todas as ações, foco que entra no diálogo ao abrir e volta ao gatilho ao fechar, e contenção de foco enquanto o diálogo está aberto;
- `prefers-reduced-motion` respeitado, o que também não existia;
- alvos de toque elevados a 40 × 40 px;
- painel lateral fechado removido da área de rolagem, da ordem de tabulação e da árvore de acessibilidade;
- seis defeitos de responsividade corrigidos, incluindo 204 px de estouro no Professor em 390 px e 161 px no Cliente; acrescentado o breakpoint intermediário que faltava em 1024 px;
- filtros do portal do Cliente deixam de sumir no celular: a barra passa a quebrar em linhas;
- fonte Geist passa a ser carregada pelo projeto, em vez de depender de instalação local.

### Verificação

- `design/verify-tokens.mjs`: 46 pares de contraste e sincronia entre CSS e JSON;
- `tests/prototype-a11y.mjs`: 44 verificações de navegador nas cinco larguras do plano de testes;
- `npm run verify` executa as duas.

## 2026-09-15

### Documentação

- criada documentação completa do produto e do protótipo;
- documentados perfis, permissões e fluxos;
- registrada a arquitetura atual e suas limitações;
- proposto modelo de dados para produção;
- formalizados padrões de design, UX e acessibilidade;
- criado plano de testes e roadmap de implementação.

### Protótipo documentado

- três visualizações: Admin, Professor e Cliente;
- identidade oficial 3ADS EDU em temas claro e escuro;
- navegação lateral recolhível;
- perfil compacto com menu de conta;
- tipografia com piso de legibilidade;
- estados semânticos;
- cards e linhas acionáveis;
- timer demonstrativo;
- uploads e downloads demonstrativos;
- observação opcional em registros;
- persistência local de preferências, horas e feedbacks.

## Observação

Este changelog passa a registrar alterações a partir da consolidação documental. Mudanças anteriores foram reunidas na seção “Protótipo documentado”.
