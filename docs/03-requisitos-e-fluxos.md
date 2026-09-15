# Requisitos e fluxos funcionais

## Portal Admin

### Dashboard

Deve apresentar projetos ativos, encerramentos próximos, dedicação mensal, pendências e novos feedbacks. Alertas e registros devem abrir detalhes ao serem acionados.

### Cadastro de projeto

Campos mínimos:

- nome do projeto;
- cliente;
- tipo de escopo;
- descrição e entregáveis;
- formato;
- data de início e fim;
- carga horária prevista;
- participantes internos, externos e do cliente;
- ponto focal do cliente;
- observações opcionais.

### Gestão de projeto

Cada projeto deve reunir resumo, atividades, materiais, pessoas, horas, atualizações, avaliações e histórico. O Admin deve poder visualizar a mesma experiência publicada ao cliente.

### Timesheet

Dois modos são necessários:

1. Timer: selecionar projeto, tipo e atividade, iniciar, acompanhar e encerrar.
2. Registro manual: informar projeto, atividade, tipo, data, duração e observação opcional.

Os registros devem distinguir hora-aula, preparação, reunião, produção de material e outras atividades de backoffice.

### Atualizações e materiais

Admin e usuários autorizados podem publicar notas e anexar PDF, DOCX, PPTX, imagens, vídeos e links. Toda atualização deve aceitar observação opcional e registrar autor e data.

### Mural

Recados podem ser destinados a todos, professores, clientes/alunos ou projeto específico. Podem conter texto, imagem, link, período de publicação e agendamento.

## Portal do Professor

### Início

Deve compilar projetos, atividades, materiais pendentes, próximas aulas, horas e recados.

### Meus projetos

Exibe somente projetos autorizados. O detalhe inclui escopo, papel do professor, pontos focais, atividades, materiais e pessoas.

### Minhas atividades

Cada tarefa deve abrir seus detalhes e permitir a ação correspondente, como enviar material, preencher relato ou confirmar disponibilidade.

### Minhas horas

Permite timer e registro manual apenas para projetos autorizados. O professor vê seus próprios registros e totais.

### Atualizações

Permite registrar como foi uma aula ou atividade, pontos para próximos encontros, anexos e observação opcional.

### Avaliação e suporte

Permite NPS para o projeto e para a 3ADS, comentário opcional e acesso aos canais de suporte.

## Portal do Cliente

### Visão geral

Apresenta escopo, período, etapa, progresso, participantes, itens que aguardam o cliente e próximo encontro.

### Atividades

Permite buscar, filtrar e agrupar. Cada atividade deve abrir status, descrição, responsável, prazo, histórico e materiais relacionados.

### Materiais

Permite filtrar, abrir, reproduzir quando aplicável, copiar links e baixar arquivos publicados.

### Pessoas

Exibe nome, foto ou avatar, organização, papel e canais liberados.

### Contato e feedback

O cliente pode enviar dúvidas, sugestões, comentários e NPS. Não pode alterar dados operacionais.

## Fluxos críticos

### Iniciar timer

1. Usuário aciona “Iniciar”.
2. Seleciona projeto autorizado.
3. Seleciona tipo de dedicação.
4. Descreve a atividade e, opcionalmente, uma observação.
5. Inicia o contador.
6. Encerra o contador.
7. Confirma ou corrige o registro.
8. Sistema salva e atualiza os totais.

### Publicar material ao cliente

1. Usuário autorizado envia o arquivo.
2. Sistema valida formato e tamanho.
3. Material fica em revisão ou privado.
4. Admin publica para o cliente.
5. Cliente recebe notificação e pode abrir ou baixar.

### Tratar feedback

1. Cliente ou professor envia avaliação/comentário.
2. Admin recebe alerta.
3. Admin classifica tema, prioridade e responsável.
4. Responsável registra encaminhamento.
5. Feedback é encerrado com histórico preservado.

