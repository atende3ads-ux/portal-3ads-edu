# Roteiro de validação do protótipo

> Entregável da Fase 0: “revisar protótipo com representantes dos três perfis”.
> Último item aberto antes da Fase 1.

## Objetivo

Descobrir, antes de escrever código de produção, onde a interface **não** corresponde ao trabalho real de cada perfil. Não é apresentação nem treinamento: é observação.

A pergunta que orienta tudo: *a pessoa consegue fazer o que precisa sem alguém explicando?*

## Formato

| Item | Definição |
|---|---|
| Duração | 45 minutos por sessão |
| Participantes | 2 por perfil — 6 no total |
| Condução | 1 facilitador + 1 anotador |
| Material | `outputs/admin.html`, `trainer.html`, `index.html` |
| Registro | Gravação de tela, mediante consentimento |

Duas pessoas por perfil bastam para expor os problemas graves de um protótipo nesta maturidade. Se as duas travarem no mesmo ponto, é problema estrutural.

**Quem convidar.** Admin: alguém da operação que hoje controla projetos em planilha. Professor: um trainer parceiro ativo, de preferência que reclame de desorganização. Cliente: um ponto focal de projeto em andamento.

## Regras de condução

1. **Não explique a interface.** A dúvida é o dado.
2. **Peça para pensar em voz alta.** “O que você está procurando agora?”
3. **Não defenda o protótipo.** Quem justifica a tela perde o achado.
4. **Anote o que a pessoa faz**, não o que ela diz que faria.
5. **Registre onde ela hesita.** Hesitação marca o problema antes da reclamação.
6. **Deixe travar.** Ajude só após 60 segundos, e anote que precisou ajudar.

## Sessão 1 · Admin

Contexto: *“Você chegou na segunda de manhã e vai conferir como está a operação.”*

| # | Tarefa | O que observar |
|---|---|---|
| 1 | Sem clicar em nada, diga o que exige atenção hoje | O painel comunica prioridade? Olha primeiro para onde? |
| 2 | Descubra qual projeto está com mais risco | Reconhece “Atenção” como risco? Entende 75% de horas? |
| 3 | Abra o projeto e diga em que pé está | As abas são encontradas? Qual procura primeiro? |
| 4 | Cadastre um projeto real que vocês tenham feito | Algum campo falta? Algum sobra? Onde trava? |
| 5 | Registre 2 h de preparação de ontem | Acha “Registrar horas”? Distingue de “Iniciar timer”? |
| 6 | Inicie o timer para o que vai fazer agora | O fluxo de seleção faz sentido? |
| 7 | Um cliente reclamou do cronograma. Encontre e encaminhe | Acha a avaliação? Sabe o que fazer depois? |
| 8 | Convide um professor para um projeto | Entende a escolha de permissões? |
| 9 | Veja o portal como o cliente vê | Encontra o acesso? Confia no que aparece lá? |

**Perguntas ao final.** O que você ainda faria por fora do portal? O que aqui está diferente de como vocês trabalham? Se pudesse mudar uma coisa, qual?

## Sessão 2 · Professor

Contexto: *“Você é trainer parceiro e vai preparar a aula da semana.”*

| # | Tarefa | O que observar |
|---|---|---|
| 1 | Diga o que a 3ADS espera de você esta semana | O início comunica pendência? |
| 2 | Descubra o que está mais perto de vencer | “Até amanhã” é lido como urgência? |
| 3 | Envie os slides da Aula 04 | Acha a tarefa? Entende que envia por ela? |
| 4 | Diga qual é o seu papel no projeto e com quem falar | Acha ponto focal da 3ADS e do cliente? |
| 5 | Registre como foi a última aula | O formulário cobre o que ele tem a dizer? |
| 6 | Registre 4 h de aula de ontem | Distingue hora-aula de preparação? |
| 7 | Veja quantas horas tem no mês | Acha o total? Confia nele? |
| 8 | Avalie a experiência com a 3ADS | Entende que há duas avaliações — projeto e 3ADS? |
| 9 | Veja se consegue abrir um projeto que não é seu | **Teste de expectativa de privacidade** |

**Perguntas ao final.** O que hoje você recebe por WhatsApp e passaria a buscar aqui? Falta alguma informação para dar aula? Você usaria isso toda semana, ou só quando cobrado?

## Sessão 3 · Cliente

Contexto: *“Sua empresa contratou a 3ADS e você quer saber como está.”*

| # | Tarefa | O que observar |
|---|---|---|
| 1 | Sem clicar, diga como o projeto está indo | 72% comunica? Entende a etapa atual? |
| 2 | Diga o que a 3ADS espera de você | **A pergunta mais importante.** “Aguardando você” funciona? |
| 3 | Descubra quando é o próximo encontro | Acha sem ajuda? |
| 4 | Veja o que já foi entregue | Entende o agrupamento por etapa? |
| 5 | Baixe o material da última aula | Acha “Materiais”? Distingue “Baixar” de “Abrir”? |
| 6 | Descubra quem dá as aulas | Chega em “Pessoas”? |
| 7 | Mande uma dúvida para a 3ADS | Acha o canal? Entende a nota opcional? |
| 8 | Tente mudar a data de uma atividade | **Teste de expectativa de edição** — espera poder? |

**Perguntas ao final.** Isso substitui perguntar por WhatsApp? O que faltou para você se sentir seguro sobre o andamento? Tem alguma informação aqui que não deveria estar visível para você?

## O que medir

Por tarefa:

| Métrica | Registro |
|---|---|
| Concluiu sem ajuda | sim / com ajuda / não |
| Tempo até a primeira ação correta | segundos |
| Caminhos errados | quantidade |
| Hesitação acima de 5 s | onde |
| Verbalização de dúvida | transcrever |

## Classificação dos achados

| Nível | Critério | Tratamento |
|---|---|---|
| **Bloqueador** | Impede a tarefa, ou expõe dado que não deveria | Resolver antes da Fase 1 |
| **Grave** | Conclui com ajuda ou por tentativa e erro | Corrigir na v1 |
| **Moderado** | Conclui, mas com atrito ou desconfiança | Backlog priorizado |
| **Leve** | Preferência pessoal sem impacto | Registrar |

Um mesmo achado em duas pessoas do mesmo perfil sobe de nível.

## Sinais de alerta

Se aparecerem, o problema é de concepção, não de tela:

- **Admin não identifica prioridade no painel** → o resumo operacional falhou, e é o coração do perfil.
- **Professor não entende o que deve entregar** → a necessidade central do portal do Professor não foi atendida.
- **Cliente não identifica o que depende dele** → o item 2 da sessão 3 é o teste decisivo do portal do Cliente.
- **Alguém espera poder editar o que não pode** → risco de frustração e de expectativa errada sobre o produto.
- **“Eu continuaria usando planilha”** → o portal não substituiu o que deveria substituir.

## Lacunas já conhecidas

Não gaste sessão descobrindo o que já sabemos. Estes pontos estão documentados em [`11-tokens-de-design.md`](11-tokens-de-design.md) e serão corrigidos de qualquer forma:

- ações que respondem com aviso em vez de abrir conteúdo real;
- downloads e uploads demonstrativos;
- dados fictícios embutidos no HTML;
- contraste insuficiente em textos de 11 px;
- ausência de Escape, foco visível e `prefers-reduced-motion`;
- alvos de toque abaixo de 40 × 40 px.

Se um participante reclamar de algum deles, registre como confirmação de prioridade — não como achado novo.

## Registro

Um documento por sessão, em `docs/validacao/`:

```
Perfil · Data · Participante (função, tempo de casa)

Por tarefa: concluiu / tempo / caminhos errados / citações

Achados: nível · descrição · tela · evidência (timestamp)

Citações relevantes

Conclusão do facilitador
```

Ao final das seis sessões, consolidar em `docs/validacao/resumo.md` com os achados ordenados por nível e frequência, e a decisão tomada para cada bloqueador.

## Encerramento da Fase 0

A Fase 0 se encerra quando:

- [ ] as seis sessões foram realizadas e registradas;
- [ ] os achados estão consolidados e classificados;
- [ ] todo bloqueador tem decisão registrada;
- [ ] o escopo da v1 ([`13-escopo-v1.md`](13-escopo-v1.md)) foi revisado à luz dos achados;
- [ ] as decisões “Proposto” de [`12-decisoes-tecnicas.md`](12-decisoes-tecnicas.md) foram confirmadas ou ajustadas.
