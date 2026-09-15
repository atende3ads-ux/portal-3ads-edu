# Decisões técnicas

> Entregável da Fase 0. Resolve as oito pendências listadas em [`08-roadmap-para-producao.md`](08-roadmap-para-producao.md) e registra a stack escolhida.

## Como ler este documento

Cada decisão traz contexto, alternativas consideradas, a escolha e suas consequências. O campo **Status** distingue dois casos:

- **Decidido** — escolha técnica, pode ser implementada;
- **Proposto** — depende de uma definição de negócio da 3ADS. A implementação segue pela opção recomendada, e trocá-la depois tem o custo indicado.

Nenhuma decisão “Proposto” bloqueia o início da Fase 1.

---

## D-000 · Stack da aplicação

**Status:** Decidido

**Contexto.** O doc 04 recomenda React/Next.js, PostgreSQL e armazenamento compatível com S3. Faltava escolher entre monólito e serviços separados.

**Decisão.** Next.js (App Router) full-stack, com Route Handlers servindo `/api/v1`, Prisma sobre PostgreSQL, Auth.js para sessão e um bucket compatível com S3 para arquivos. Repositório único.

**Alternativas.** Front separado com API NestJS — dois deploys e mais cerimônia, sem benefício enquanto o consumidor da API for apenas o próprio portal. Supabase — aceleraria a Fase 1, mas amarraria a autorização a políticas RLS, e o doc 02 exige regras por projeto e por permissão granular que ficam mais legíveis e testáveis em código.

**Consequências.**

- o contrato do doc 10 é implementado como Route Handlers em `app/api/v1/*`, preservando rotas e códigos de status;
- Server Components leem dados direto do banco, com a autorização aplicada na mesma camada de serviço usada pela API — nunca duas implementações da mesma regra;
- a API pública continua disponível caso um segundo consumidor apareça;
- se um dia for preciso separar, a camada de serviço já está isolada do transporte.

---

## D-001 · Provedor de autenticação

**Status:** Decidido

**Contexto.** Três públicos com exigências diferentes: equipe interna (uso diário), professores parceiros (uso esporádico, fora do domínio da 3ADS) e clientes (uso ocasional, baixa tolerância a fricção).

**Decisão.** **Auth.js** (NextAuth v5) com sessão em cookie `httpOnly`, `Secure` e `SameSite=Lax`, oferecendo dois caminhos:

| Público | Entrada |
|---|---|
| Equipe 3ADS | Google Workspace (SSO), domínio restrito |
| Professores e clientes | Link mágico por e-mail, válido por 15 minutos e de uso único |

**Por quê.** Link mágico elimina a senha — e com ela o suporte para recuperação, o vazamento por reuso e a exigência de política de complexidade. Para quem entra no portal uma vez por semana, é também menos fricção. O SSO cobre a equipe interna, que precisa de sessão persistente e desligamento centralizado.

**Consequências.**

- exige provedor de e-mail transacional confiável (ver D-007) — se o e-mail atrasa, ninguém entra;
- o convite descrito no doc 03 passa a ser o mesmo mecanismo do login: `POST /auth/recover` e o convite emitem o mesmo tipo de token;
- sessão expira em 12 horas de inatividade e 30 dias de duração máxima;
- `AuditLog` registra cada emissão e consumo de token.

**Fica fora da v1.** Segundo fator. Recomendado para o perfil Admin geral assim que houver dado real de cliente em produção — anotado no backlog, não na v1.

---

## D-002 · Hospedagem

**Status:** Proposto — depende de política de fornecedores e orçamento da 3ADS

**Decisão recomendada.** Vercel para a aplicação, Neon para PostgreSQL e Cloudflare R2 para arquivos, todos com dados na região mais próxima disponível.

**Por quê.** É o caminho de menor operação para a escala real do produto: dezenas de projetos, dezenas de usuários, arquivos na casa de gigabytes. R2 não cobra egresso, o que importa porque materiais de vídeo serão baixados repetidamente por alunos.

**Alternativa.** AWS completa (Amplify/ECS + RDS + S3) — mais controle e melhor se a 3ADS já tiver contrato e governança em AWS; em troca, exige alguém cuidando de infraestrutura.

**Custo de trocar depois.** Baixo para a aplicação e para os arquivos (S3-compatível é padrão); médio para o banco, por causa da migração de dados.

**Ambientes.** `development`, `staging` e `production` separados, com bancos e buckets distintos. Nenhum dado real de cliente fora de produção.

---

## D-003 · Limite e retenção de arquivos

**Status:** Proposto — o limite por arquivo depende do custo aceito pela 3ADS

**Decisão recomendada.**

| Tipo | Formatos | Limite |
|---|---|---|
| Documento | PDF, DOCX, PPTX, XLSX | 50 MB |
| Imagem | PNG, JPG, WEBP | 10 MB |
| Vídeo | MP4, MOV | 2 GB |
| Link | URL externa | — |

Cota de 50 GB por projeto, com alerta ao Admin em 80%.

**Regras de upload.** Upload direto ao bucket por URL assinada de 15 minutos; o servidor confirma os metadados depois. Validação dupla de tipo: extensão e *magic number* do conteúdo — extensão isolada é trivial de forjar. Arquivo rejeitado nunca chega a ser confirmado como `Material`.

**Antivírus.** Varredura assíncrona antes de o material sair de `in_review`. Enquanto não houver resultado, o arquivo não fica disponível para download. Este é o ponto que justifica o estado `in_review` já previsto no doc 05.

**Retenção.** Detalhada em [`15-retencao-e-privacidade.md`](15-retencao-e-privacidade.md).

---

## D-004 · Aprovação de horas

**Status:** Proposto — decisão de processo da 3ADS

**Contexto.** O doc 05 prevê os estados `running`, `submitted`, `approved` e `rejected`, mas não define se a aprovação é obrigatória. A resposta muda o produto: se horas de professor alimentam pagamento, aprovação é controle financeiro; se alimentam só gestão de esforço, é burocracia.

**Decisão recomendada.** Aprovação **assimétrica**:

| Quem registra | Fluxo |
|---|---|
| Equipe 3ADS (Admin, Operação) | `submitted` → contabiliza direto |
| Professor ou parceiro externo | `submitted` → precisa de `approved` por Admin |

**Por quê.** A hora do parceiro externo tende a virar pagamento e merece conferência. A hora interna já está sob gestão direta, e exigir aprovação criaria uma fila sem ganho.

**Consequências.**

- os indicadores distinguem *horas registradas* de *horas aprovadas*; o consumo de escopo mostrado ao cliente usa apenas as aprovadas, para não oscilar;
- rejeitar exige justificativa, que fica visível para quem registrou;
- o Admin tem uma fila de aprovação — surge como pendência no dashboard;
- se a 3ADS preferir aprovar tudo ou nada, é uma mudança de configuração, não de modelo: os estados já existem.

---

## D-005 · Cliente e aluno

**Status:** Decidido

**Contexto.** O doc 02 trata “cliente ou aluno” como um perfil só, mas o doc 01 descreve necessidades diferentes: o ponto focal acompanha o projeto, o aluno consome conteúdo.

**Decisão.** Um único perfil (`client`) com dois papéis em `ProjectMember.role`:

| Papel | Vê | Pode |
|---|---|---|
| `client_focal` | Projeto completo: escopo, progresso, atividades, pessoas, materiais, agenda | Comentar, avaliar, receber alertas |
| `client_learner` | Materiais publicados, agenda e próprios feedbacks | Comentar, avaliar |

O aluno **não** vê atividades internas, responsáveis, horas nem o progresso agregado do contrato — informação de gestão que pertence ao ponto focal.

**Por quê.** Criar um quinto perfil duplicaria a matriz de permissões inteira para uma diferença que é de escopo de leitura, não de natureza de acesso. `ProjectMember` já carrega `role` e `permissions`; a distinção cabe ali.

**Consequências.** O portal do Cliente renderiza dois layouts a partir do papel. A v1 entrega `client_focal` completo; `client_learner` entra quando houver o primeiro projeto com turma aberta.

---

## D-006 · Anonimato em avaliações

**Status:** Proposto — envolve compromisso da 3ADS com quem responde

**Contexto.** `Feedback` tem o campo `anonymous`, e o portal do Cliente já oferece “Enviar anonimamente”. Falta definir o que a promessa significa: anônimo para quem?

**Decisão recomendada.** Anonimato **parcial e declarado**:

- a autoria fica oculta para todos os leitores do feedback, inclusive Admin;
- `author_user_id` continua gravado, porque a LGPD exige poder atender pedido de exclusão do titular e porque sem isso não há como impedir envio em massa;
- o acesso a essa identidade é restrito ao Admin geral, exige justificativa registrada e gera `AuditLog` — reservado a investigação de abuso ou a obrigação legal;
- a interface explicita o alcance real, em vez de prometer anonimato absoluto que o sistema não entrega.

**Texto sugerido:** *“Seu nome não aparece para a equipe do projeto. O registro é preservado apenas para fins de segurança e auditoria.”*

**Regra adicional.** Avaliação anônima **não** pode ser respondida diretamente. Se precisar de retorno, a resposta vai ao mural ou ao ponto focal — nunca por um canal que revele o autor.

---

## D-007 · Canais de notificação

**Status:** Proposto — WhatsApp depende de contrato da 3ADS

**Decisão recomendada para a v1.** Dois canais:

| Canal | Uso |
|---|---|
| No portal | Todos os eventos; sino com contador e lista |
| E-mail | Apenas eventos acionáveis |

Eventos que geram e-mail: convite de acesso, atividade atribuída, prazo a vencer em 48 h, material publicado para o cliente, feedback recebido, hora rejeitada. Tudo mais fica só no portal — e-mail demais vira e-mail ignorado.

Cada usuário controla a frequência: imediato, resumo diário ou desligado. Convite e recuperação de acesso são transacionais e não podem ser desligados.

**Provedor.** Resend ou Amazon SES, com domínio próprio, SPF, DKIM e DMARC configurados. Como o login depende de e-mail (D-001), a entrega é requisito de disponibilidade: monitorar taxa de entrega e alertar sobre falhas.

**WhatsApp.** Fica no backlog. Exige API oficial, aprovação de templates e consentimento registrado por titular — escopo próprio, não um acréscimo à v1.

---

## D-008 · Encerramento e arquivamento de projetos

**Status:** Decidido

**Ciclo de vida.** `draft` → `active` → (`paused`) → `completed` → `archived`, com `cancelled` a partir de qualquer estado anterior a `completed`.

| Estado | Efeito |
|---|---|
| `draft` | Só a equipe 3ADS vê. Convites não são enviados |
| `active` | Operação normal |
| `paused` | Leitura para todos; timer bloqueado; some dos indicadores de capacidade |
| `completed` | Encerra atividades e horas; cliente e professor mantêm leitura e download |
| `cancelled` | Como `completed`, mas não conta nos indicadores de entrega |
| `archived` | Somente leitura para a equipe 3ADS; sai das listas padrão |

**Regras de transição.**

- para `completed`: nenhum timer ativo e nenhuma hora pendente de aprovação; atividades em aberto precisam ser concluídas ou canceladas explicitamente;
- arquivamento automático 180 dias após `completed`, com aviso ao Admin 15 dias antes;
- arquivar **não apaga nada** — é mudança de visibilidade. A exclusão segue o doc 15;
- projeto arquivado pode voltar a `completed` por um Admin geral, com registro em `AuditLog`;
- o doc 02 é explícito: remover acesso não apaga o histórico produzido pelo usuário. Vale igualmente para o encerramento.

**Acesso após o encerramento.** Cliente e professor mantêm leitura e download por 12 meses após `completed`. Depois disso, o acesso se encerra, mas o conteúdo permanece disponível para a equipe 3ADS até o prazo de retenção.

---

## Resumo

| # | Decisão | Status | Escolha |
|---|---|---|---|
| D-000 | Stack | Decidido | Next.js full-stack + Prisma + PostgreSQL |
| D-001 | Autenticação | Decidido | Auth.js: SSO Google (interno) + link mágico (externo) |
| D-002 | Hospedagem | Proposto | Vercel + Neon + Cloudflare R2 |
| D-003 | Arquivos | Proposto | 50 MB doc / 2 GB vídeo, 50 GB por projeto |
| D-004 | Aprovação de horas | Proposto | Assimétrica: externo aprova, interno não |
| D-005 | Cliente e aluno | Decidido | Um perfil, dois papéis em `ProjectMember` |
| D-006 | Anonimato | Proposto | Parcial e declarado, com auditoria |
| D-007 | Notificações | Proposto | Portal + e-mail; WhatsApp no backlog |
| D-008 | Encerramento | Decidido | Ciclo com arquivamento automático em 180 dias |

As cinco decisões “Proposto” devem ser confirmadas pela 3ADS antes do fim da Fase 1. Nenhuma impede começar.
