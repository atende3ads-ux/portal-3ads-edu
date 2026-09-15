# Registro de mudanças

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
