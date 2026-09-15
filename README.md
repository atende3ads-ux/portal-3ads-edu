# Portal 3ADS EDU

Protótipo navegável do portal de gestão e acompanhamento dos projetos educacionais da 3ADS.

## Experiências disponíveis

- **Admin:** projetos, pessoas, permissões, horas, atualizações, recados e avaliações.
- **Professor:** projetos autorizados, atividades, materiais, horas e suporte.
- **Cliente:** acompanhamento do projeto, etapas, materiais, pessoas e feedbacks.

## Abrir o protótipo

| Perfil | Arquivo |
|---|---|
| Admin | [`outputs/admin.html`](outputs/admin.html) |
| Professor | [`outputs/trainer.html`](outputs/trainer.html) |
| Cliente | [`outputs/index.html`](outputs/index.html) |

Os arquivos podem ser abertos diretamente no navegador ou servidos com `npm run serve`.

## Documentação

A documentação completa começa em [`DOCUMENTACAO.md`](DOCUMENTACAO.md). Ela inclui produto, permissões, fluxos, arquitetura, dados, UX, testes, roadmap, guia de uso e contrato inicial de API, além dos entregáveis da Fase 0: tokens de design, decisões técnicas, escopo da v1, matriz de permissões validada, política de retenção e roteiro de validação.

## Desenvolvimento

```
service postgresql start
cp .env.example .env     # preencher DATABASE_URL e AUTH_SECRET
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

## Verificação

```
npm run verify
```

Encadeia typecheck, contraste da paleta contra WCAG AA, comportamento do protótipo nas cinco larguras do plano de testes, os testes de autorização contra banco real e os testes de ponta a ponta da API.

## Estado do projeto

O repositório contém duas coisas:

- **a aplicação** em construção (Next.js, Prisma, PostgreSQL), com a etapa de acesso e identidade concluída — ver [`docs/17-aplicacao.md`](docs/17-aplicacao.md);
- **o protótipo** navegável em `outputs/`, mantido como referência visual e de fluxo.

O protótipo usa dados demonstrativos e `localStorage`; não é a aplicação.

A versão produtiva ainda precisará de backend, banco de dados, autenticação, autorização no servidor, armazenamento de arquivos, auditoria, testes automatizados e infraestrutura.

## Tecnologias atuais

- HTML5;
- CSS3;
- JavaScript sem framework;
- armazenamento demonstrativo no navegador.

A stack da versão produtiva está decidida em [`docs/12-decisoes-tecnicas.md`](docs/12-decisoes-tecnicas.md): Next.js full-stack, Prisma sobre PostgreSQL, Auth.js e armazenamento compatível com S3.

## Uso e confidencialidade

Material de trabalho da 3ADS. Não distribuir ou publicar sem autorização. Nenhuma licença pública foi atribuída ao repositório.

