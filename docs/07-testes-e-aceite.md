# Plano de testes e critérios de aceite

## Testes compartilhados

- [ ] Logotipo não é sobreposto em nenhuma largura.
- [ ] Menu expande e recolhe sem deslocamentos indevidos.
- [ ] Estado do menu persiste após recarregar.
- [ ] Perfil compacto abre o menu da conta.
- [ ] Tema claro/escuro persiste.
- [ ] Nenhum texto funcional possui menos de 11 px.
- [ ] Cards acionáveis têm hover, foco e ação real.
- [ ] Interface funciona em 1440, 1024, 768, 390 e 320 px.
- [ ] Navegação por teclado alcança todas as ações.
- [ ] Modais podem ser fechados pelo botão, fundo e tecla Escape.

## Admin

- [ ] Cadastrar projeto com todos os campos mínimos.
- [ ] Convidar usuário e definir perfil/projetos.
- [ ] Abrir qualquer projeto e navegar por suas abas.
- [ ] Registrar horas manualmente.
- [ ] Iniciar e encerrar timer.
- [ ] Impedir dois timers simultâneos.
- [ ] Publicar atualização com e sem anexo.
- [ ] Publicar recado por público.
- [ ] Abrir feedback e registrar encaminhamento.
- [ ] Exportar relatório de horas.

## Professor

- [ ] Exibir somente projetos autorizados.
- [ ] Abrir todas as tarefas.
- [ ] Enviar material em tarefa.
- [ ] Registrar relato de aula com observação opcional.
- [ ] Iniciar timer após selecionar projeto e atividade.
- [ ] Registrar hora-aula manualmente.
- [ ] Enviar NPS e comentário.
- [ ] Bloquear acesso por URL a projeto não autorizado.

## Cliente

- [ ] Exibir somente o projeto autorizado.
- [ ] Filtrar atividades por status, responsável e etapa.
- [ ] Abrir detalhe de todas as atividades.
- [ ] Abrir e baixar materiais publicados.
- [ ] Não exibir materiais privados.
- [ ] Abrir perfil dos participantes.
- [ ] Enviar comentário e NPS.
- [ ] Impedir edição de dados do projeto.

## Arquivos

- [ ] Validar formatos permitidos.
- [ ] Validar limite de tamanho.
- [ ] Rejeitar arquivo com MIME incompatível.
- [ ] Verificar autorização no upload e download.
- [ ] Exibir progresso e erro recuperável.
- [ ] Preservar nome, autor, data e versão.

## Segurança

- [ ] Sessão expira conforme política.
- [ ] Rotas e API validam permissão no servidor.
- [ ] Tentativa não autorizada retorna 403 sem expor dados.
- [ ] Conteúdo textual é protegido contra XSS.
- [ ] Operações sensíveis geram auditoria.
- [ ] Rate limiting em login, feedback e uploads.

## Critério de aceite da primeira versão produtiva

A versão pode ser liberada quando todos os fluxos críticos funcionarem com dados reais, os testes de autorização estiverem aprovados, não houver defeitos críticos ou altos abertos e houver backup, monitoramento e plano de suporte definidos.

