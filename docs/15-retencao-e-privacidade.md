# Retenção, privacidade e auditoria

> Entregável da Fase 0: “definir regras de retenção e privacidade”.
> Desenvolve a seção de Segurança e LGPD de [`04-arquitetura-tecnica.md`](04-arquitetura-tecnica.md).

> **Este documento é uma proposta técnica, não parecer jurídico.** As bases legais e os prazos precisam ser revisados por quem responde juridicamente pela 3ADS antes da entrada em produção.

## Papéis na LGPD

| Papel | Quem | Observação |
|---|---|---|
| Controlador | 3ADS | Decide finalidade e meios do tratamento |
| Operador | Provedores de hospedagem, banco, armazenamento e e-mail | Exigem contrato com cláusulas de tratamento |
| Titular | Usuários do portal: equipe, professores, clientes e alunos | |

Uma situação merece atenção: quando a empresa cliente indica participantes, **a 3ADS trata dados de titulares com quem não tem relação direta**. O contrato com o cliente precisa prever essa indicação e a comunicação aos participantes.

## Dados tratados

| Categoria | Dados | Base legal | Finalidade |
|---|---|---|---|
| Identificação | Nome, e-mail, foto, organização | Execução de contrato | Acesso e identificação no projeto |
| Vínculo | Perfil, papel, projetos, permissões | Execução de contrato | Autorização |
| Operacional | Atividades, horas, atualizações, materiais | Execução de contrato | Entrega e gestão do projeto |
| Avaliação | NPS, comentários | Legítimo interesse | Melhoria do serviço |
| Acesso | Logs, hash de IP, timestamps | Legítimo interesse | Segurança e auditoria |
| Comunicação | Preferências de notificação | Consentimento | Envio de avisos |

Nenhum dado sensível na acepção do art. 5º, II é tratado. **Se o produto passar a registrar necessidade de acessibilidade, saúde ou qualquer dado sensível de participante, este documento precisa ser revisto antes.**

### Minimização

Não coletar: CPF de participante, telefone pessoal, endereço residencial, data de nascimento, cargo detalhado, dados de pagamento de professor. O portal não faz faturamento — não precisa de dado financeiro.

O documento da organização (`Organization.document`) é dado de pessoa jurídica e permanece.

## Prazos de retenção

| Dado | Retenção | Contagem a partir de |
|---|---|---|
| Projeto e histórico | 5 anos | Encerramento do projeto |
| Materiais | 5 anos | Encerramento do projeto |
| Registros de horas | 5 anos | Criação |
| Atualizações e relatos | 5 anos | Encerramento do projeto |
| Feedbacks identificados | 3 anos | Criação |
| Feedbacks anônimos | Indefinida, já sem identificação | — |
| Conta de usuário ativa | Enquanto houver vínculo | — |
| Conta desativada | 2 anos, depois anonimizada | Desativação |
| Trilha de auditoria | 5 anos | Criação |
| Logs de aplicação | 90 dias | Criação |
| Tokens de acesso e sessão | 30 dias | Expiração |
| Backups | 90 dias, rotativos | Criação |

Cinco anos acompanha o prazo geral de prescrição do Código Civil para pretensões contratuais. **Confirmar com a assessoria jurídica.**

### Acesso do usuário externo após o encerramento

Conforme [D-008](12-decisoes-tecnicas.md#d-008--encerramento-e-arquivamento-de-projetos), cliente e professor mantêm leitura e download por 12 meses após o projeto ser concluído. Depois o acesso cessa, mas o conteúdo permanece disponível à equipe 3ADS pelo prazo de retenção.

## Exclusão e anonimização

O doc 02 é explícito: **remover acesso não apaga o histórico produzido pelo usuário.** Isso cria uma tensão real com o direito de exclusão, resolvida assim:

**Anonimizar, não apagar.** Ao excluir um titular:

- `User.name` vira `"Usuário removido"`, `email` vira um valor irreversível derivado por hash, `avatar_url` é apagado;
- registros produzidos — horas, atualizações, materiais, atividades — **permanecem**, agora atribuídos ao usuário anonimizado;
- comentários e feedbacks identificados são anonimizados, preservando o texto;
- `AuditLog` mantém o `actor_user_id`, que aponta para o registro anonimizado.

Isso preserva a integridade da operação — as horas de um projeto não podem desaparecer porque alguém saiu — e atende a finalidade da exclusão: o dado deixa de identificar a pessoa.

**Quando apagar de fato.** Foto de perfil, preferências de notificação, tokens e sessões são apagados sem substituto.

**Prazo.** 15 dias corridos do pedido, prorrogáveis mediante justificativa.

## Direitos do titular

| Direito | Como é atendido | Prazo |
|---|---|---|
| Confirmação e acesso | Página de conta + exportação JSON sob pedido | 15 dias |
| Correção | Edição na própria conta; dados de vínculo pelo Admin | Imediato |
| Anonimização ou eliminação | Processo acima | 15 dias |
| Portabilidade | Exportação estruturada em JSON | 15 dias |
| Informação sobre compartilhamento | Lista de operadores neste documento | Imediato |
| Revogação de consentimento | Preferências de notificação | Imediato |

Canal de contato do encarregado: **a definir pela 3ADS** e publicar no portal.

## Segurança

**Trânsito.** HTTPS obrigatório, HSTS, TLS 1.2 no mínimo.

**Repouso.** Criptografia no banco e no bucket. Segredos em cofre do provedor, nunca no repositório.

**Acesso.** Menor privilégio, conforme [`14-matriz-permissoes.md`](14-matriz-permissoes.md). Acesso de desenvolvedor a produção é nominal, temporário e registrado.

**Arquivos.** URLs assinadas de 15 minutos, autorização verificada no momento do pedido, validação de tipo por conteúdo e antivírus antes da publicação.

**Aplicação.** Escape de saída contra XSS, consultas parametrizadas pelo ORM, proteção CSRF, cabeçalhos de segurança e `Content-Security-Policy`.

**Rate limiting.** Login e recuperação: 5 tentativas por e-mail a cada 15 minutos. Feedback: 10 por hora por usuário. Upload: 20 por hora por usuário.

**Dados em ambientes não produtivos.** Nunca dados reais. `staging` usa massa sintética.

## Trilha de auditoria

`AuditLog` registra ator, ação, entidade, identificador, estado anterior e posterior, hash do IP e data.

**Eventos obrigatórios:**

| Domínio | Eventos |
|---|---|
| Acesso | Emissão e consumo de token, login, logout, falha de autenticação |
| Autorização | Alteração de perfil ou permissão, adição e remoção de membro, negativa por escopo |
| Projeto | Criação, alteração de escopo, horas previstas ou datas, mudança de estado |
| Horas | Criação, correção, aprovação, rejeição, início e fim de timer |
| Materiais | Upload, publicação, despublicação, arquivamento, download de material publicado |
| Feedback | Envio, classificação, atribuição, encerramento, revelação de autoria anônima |
| Dados pessoais | Exportação, anonimização, exclusão |

**Regras.** Registro imutável — sem `UPDATE` nem `DELETE`. O hash do IP usa sal fixo, para permitir correlação sem armazenar o endereço. `before` e `after` nunca guardam segredo, token ou conteúdo de arquivo.

## Operadores

| Serviço | Função | Dados | Localização |
|---|---|---|---|
| Vercel | Aplicação | Em trânsito e logs | A confirmar |
| Neon | Banco | Todos os dados estruturados | A confirmar |
| Cloudflare R2 | Arquivos | Materiais | A confirmar |
| Resend ou SES | E-mail | Nome, e-mail, conteúdo da notificação | A confirmar |

Provedores conforme [D-002](12-decisoes-tecnicas.md#d-002--hospedagem) e [D-007](12-decisoes-tecnicas.md#d-007--canais-de-notificação), ainda pendentes de confirmação. Antes da produção, cada um precisa de contrato com cláusulas de tratamento e definição da região de armazenamento — **preferencialmente Brasil**; havendo transferência internacional, a base precisa estar documentada.

## Incidentes

1. Conter e preservar evidências.
2. Avaliar o risco aos titulares.
3. Comunicar a ANPD e os titulares em prazo razoável, quando houver risco relevante.
4. Registrar causa, impacto e correção.
5. Revisar controles.

Responsável pela condução: **a definir pela 3ADS**.

## Pendências para a 3ADS

- [ ] Revisão jurídica das bases legais e dos prazos.
- [ ] Indicação do encarregado e publicação do canal de contato.
- [ ] Cláusula contratual sobre indicação de participantes pelo cliente.
- [ ] Contrato de tratamento com cada operador.
- [ ] Definição da região de armazenamento.
- [ ] Responsável pela resposta a incidentes.
- [ ] Aviso de privacidade publicado no portal.
