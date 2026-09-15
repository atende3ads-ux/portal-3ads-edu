# Design system e UX

## Direção visual

Interface operacional minimalista, com alta densidade controlada, fundo claro ou escuro, tipografia objetiva e azul 3ADS como cor de ação. A experiência prioriza leitura rápida e detalhes sob demanda.

## Identidade

- usar exclusivamente o logotipo oficial 3ADS EDU;
- preservar proporção e área de respiro;
- usar a versão azul no tema claro e branca no tema escuro;
- evitar sobreposição de controles sobre o logotipo.

## Tipografia

- corpo: 12 px como padrão;
- mínimo absoluto: 11 px;
- títulos de seção: 16 px;
- títulos de página: escala responsiva entre 30 e 40 px;
- título principal do projeto: escala responsiva entre 36 e 46 px;
- altura de linha mínima de 1,4 para textos corridos.

## Cores semânticas

| Significado | Uso |
|---|---|
| Positivo | concluído, aprovado, publicado, ativo |
| Neutro/informativo | em andamento, próximo, não iniciado |
| Atenção | pendente, aguardando, próximo do prazo |
| Problema | atrasado, bloqueado, rejeitado, erro |

Cor nunca deve ser o único indicador. Sempre acompanhar por texto e, quando útil, ícone.

## Navegação lateral

- logotipo e controle de recolhimento ocupam espaços próprios;
- menu pode ser expandido ou reduzido;
- no modo reduzido, exibir ícones e tooltips;
- perfil compacto fica no rodapé;
- clique no perfil abre opções de conta, configurações, tema e saída;
- preferência de expansão e tema deve persistir.

## Componentes interativos

Cards, linhas e atividades clicáveis devem:

- usar cursor de ação;
- apresentar hover e foco visível;
- responder a Enter quando focados;
- abrir página, painel lateral ou modal com conteúdo real;
- não usar apenas uma notificação dizendo “aberto”.

## Formulários

- rótulo sempre visível;
- indicação clara de campos obrigatórios e opcionais;
- validação próxima ao campo;
- estado de envio e confirmação;
- preservação do conteúdo em caso de erro;
- observação opcional em registros e atualizações.

## Imagens e avatares

- foto real quando disponibilizada e autorizada;
- avatar por iniciais como fallback;
- imagens de projeto somente quando tiverem função clara;
- nunca inserir imagem decorativa dentro de metadados ou áreas sem contexto;
- usar texto alternativo adequado.

## Responsividade

- desktop: lateral fixa e conteúdo em grade;
- tablet: reduzir colunas sem reduzir legibilidade;
- celular: menu em sobreposição, cards em uma coluna e tabelas com rolagem horizontal;
- alvos de toque recomendados de pelo menos 40 × 40 px.

## Acessibilidade

- contraste compatível com WCAG AA;
- foco visível;
- navegação completa por teclado;
- diálogos com título, foco inicial e fechamento por Escape;
- ícones com rótulo acessível quando forem botões;
- estados anunciados a tecnologias assistivas;
- respeito a `prefers-reduced-motion`.

