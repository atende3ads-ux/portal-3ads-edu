# Tokens de design

> Entregável da Fase 0: “transformar identidade visual em tokens e componentes”.
> Arquivos: [`design/tokens.css`](../design/tokens.css), [`design/tokens.json`](../design/tokens.json), [`design/verify-tokens.mjs`](../design/verify-tokens.mjs).

## Por que esta unificação era necessária

O protótipo declara a paleta **duas vezes**, em arquivos diferentes, com valores que não batem: um bloco `:root` em `outputs/portal.css` (Admin e Professor) e outro dentro de `outputs/index.html` (Cliente).

| Token | portal.css | index.html | Consequência |
|---|---|---|---|
| `--muted` | `#656a73` | `#646972` | Texto secundário com tom diferente entre perfis |
| `--soft` | `#969ba4` | `#9298a2` | Idem, em metadados |
| `--line` | `#dde0e6` | `#dce0e6` | Bordas desalinhadas lado a lado |
| `--bluewash` | `#e7f2ff` | `#e8f3ff` | Fundo de destaque inconsistente |
| `--amber` | `#a65b08` | `#a85c08` | Estado “atenção” com dois tons |
| `--red` | `#be3838` | `#c43a3a` | Estado “problema” com dois tons |
| `--ink` (escuro) | `#f7f8fa` | `#f6f7f9` | Texto principal divergente |
| `--shadow` | `0 16px 45px` | `0 18px 50px` | Elevação diferente |
| `--hover` | não existe | `#f7f9fc` | `typography.css` precisa do fallback `var(--hover,var(--surface2))` |
| `--deep` | não existe | `#000aff` | Declarado e **nunca usado** — código morto |

Nenhuma dessas diferenças é intencional: são desvios acumulados. Como os três portais aparecem lado a lado na mesma sessão (o seletor “Visualizar como” troca entre eles), a inconsistência é perceptível.

`design/tokens.css` passa a ser a **única** declaração. `design/verify-tokens.mjs` falha se `tokens.css` e `tokens.json` divergirem, para que o problema não se repita.

## Auditoria de contraste

O doc 06 exige contraste compatível com **WCAG AA**: 4,5:1 para texto normal e 3:1 para texto grande e componentes de interface. A paleta original do protótipo **não atendia**.

### Reprovações no tema claro

| Par | Contraste | Onde aparece |
|---|---:|---|
| `--soft` sobre `--surface2` | 2,40:1 | `.feed-item small`, `.eyebrow`, `.micro`, metadados de 11 px |
| `--soft` sobre `--surface` | 2,79:1 | Mesmos elementos sobre cards |
| `--blue` sobre `--surface2` | 3,39:1 | `.action`, `.status`, `.text-btn`, links de painel |
| `--blue` sobre `--surface` | 3,94:1 | Idem |
| `--green` sobre `--surface2` | 4,11:1 | Estado “concluído” |
| `--amber` sobre `--surface2` | 4,39:1 | Estado “atenção” |
| `#fff` sobre `--blue` | 3,94:1 | Texto de **todo botão primário** |

O caso mais grave é `--soft`: é o token usado justamente nos textos de 11 px, o menor tamanho da interface, onde o contraste importa mais.

### Reprovações no tema escuro

| Par | Contraste |
|---|---:|
| `--red` sobre `--surface2` | 3,16:1 |
| `--amber` sobre `--surface2` | 3,42:1 |
| `--green` sobre `--surface2` | 3,65:1 |
| `--soft` sobre `--surface2` | 3,87:1 |
| `--blue` sobre `--surface2` | 4,42:1 |

## Paleta corrigida

Cada cor foi ajustada **apenas na luminosidade**, preservando matiz e saturação — a identidade não muda, a legibilidade sim. O azul `#007cff` da marca continua intacto para preenchimentos, barras e ícones, onde o mínimo é 3:1.

| Papel | Claro | Escuro | Pior caso |
|---|---|---|---:|
| `--ink` texto principal | `#0a0b0e` | `#f7f8fa` | 16,4:1 |
| `--muted` texto secundário | `#656a73` | `#a4aab4` | 4,68:1 |
| `--soft` metadados | `#666c76` | `#7c828d` | 4,51:1 |
| `--accent` preenchimento | `#007cff` | `#007cff` | 3,62:1 |
| `--accent-strong` fundo de botão | `#0072eb` | `#0072eb` | 4,56:1 |
| `--accent-text` link e rótulo | `#0068d6` | `#057fff` | 4,55:1 |
| `--positive` | `#10795d` | `#139472` | 4,57:1 |
| `--warning` | `#a15808` | `#c36b09` | 4,50:1 |
| `--danger` | `#be3838` | `#d05e5e` | 4,52:1 |

A separação entre `--accent` (preenchimento), `--accent-strong` (fundo de botão) e `--accent-text` (texto) é o que permite manter o azul da marca sem sacrificar a legibilidade: cada um responde a um requisito de contraste diferente.

### Verificação contínua

```
node design/verify-tokens.mjs
```

Confere 46 pares texto/fundo e a sincronia entre CSS e JSON. Sai com código 1 em caso de falha — deve entrar no CI junto com lint e testes.

## Tipografia

A escala vem de `outputs/typography.css`, que já respeita o piso de legibilidade do doc 06.

| Token | Valor | Uso |
|---|---|---|
| `--text-micro` | 11 px | Rótulo, status, eyebrow — **piso absoluto** |
| `--text-body` | 12 px | Corpo padrão |
| `--text-strong` | 14 px | Título de item, nome, valor em destaque |
| `--text-h3` | 16 px | Título de seção e de painel |
| `--text-h2` | 20 px | — |
| `--text-stat` | 24 px | Indicadores do portal do Cliente |
| `--text-metric` | 26 px | Indicadores de Admin e Professor |
| `--text-h1` | `clamp(30px, 3vw, 40px)` | Título de página |
| `--text-display` | `clamp(36px, 4vw, 46px)` | Título do projeto |

Altura de linha mínima de 1,5 para texto corrido, acima do piso de 1,4 exigido.

### Pendência da fonte

O protótipo declara `font-family: Geist` mas **não possui nenhum `@font-face`**. A fonte só aparece em máquinas que já a tenham instalada; nas demais, o navegador cai para `"Helvetica Neue"`. Isso explica a observação do doc 04 sobre o protótipo depender do computador em que foi desenvolvido.

Na v1 a Geist precisa ser servida pelo projeto — `next/font/local` com os arquivos versionados, ou `next/font/google`. Até lá, `--font-sans` inclui `"Inter"` e `system-ui` como fallbacks de métrica próxima.

## Espaçamento

O protótipo usa valores irregulares — 3, 5, 6, 7, 9, 11, 12, 13, 14, 15, 17, 19, 21, 22, 25, 28 px — sem escala aparente. Os tokens adotam base 4: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`. Ao portar cada componente, arredonde para o degrau mais próximo.

## Raio e elevação

Raios do protótipo: 7, 8, 9, 10, 12, 14 px. Consolidados em `--radius-sm: 6px`, `md: 8px`, `lg: 10px`, `xl: 14px` e `full: 999px`.

Elevação em três níveis (`sm`, `md`, `lg`), com opacidades próprias para cada tema — no escuro, sombras claras não funcionam.

## Layout e breakpoints

| Token | Valor |
|---|---|
| `--sidebar-width` | 224 px |
| `--sidebar-width-collapsed` | 72 px |
| `--topbar-height` | 58 px |
| `--content-max` | 1280 px |

O `max-width` do conteúdo também divergia: 1280 px em `portal.css`, 1220 px em `index.html`. Unificado em 1280 px.

O protótipo tem apenas dois breakpoints, 900 px e 560 px. O doc 07 pede verificação em 1440, 1024, 768, 390 e 320 px — e 1024 px e 768 px caem no mesmo tratamento, contrariando o doc 06, que pede “tablet: reduzir colunas sem reduzir legibilidade”. Falta um degrau intermediário.

Breakpoints propostos: `sm: 480px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`.

## Lacunas de acessibilidade no protótipo

Levantamento por varredura do código em `outputs/`:

| Exigência do doc 06 | Situação | Correção |
|---|---|---|
| Diálogos fecham com **Escape** | **0 ocorrências** de `Escape` no código | Handler de teclado em modais e drawers |
| **Foco visível** em toda ação | Apenas 2 regras `:focus-visible`, restritas a `.card-interactive` e `.interactive-row` | Token `--focus-ring` aplicado globalmente |
| Respeitar **`prefers-reduced-motion`** | **0 ocorrências** | Bloco no `tokens.css` zerando as durações |
| Alvos de toque de **40 × 40 px** | `.rating-buttons` 30×30, `.person-actions` 32×32, `.sidebar-collapse` 28×28 | Token `--touch-min: 40px` |
| Contraste WCAG AA | Reprovava em 12 pares | Paleta corrigida acima |
| Foco inicial em diálogos | Não implementado | Mover foco ao abrir, devolver ao fechar |

As três primeiras são exigências textuais do doc 06 que o protótipo simplesmente não implementa. Nenhuma delas é cosmética: sem Escape e sem foco visível, a navegação por teclado exigida pelo doc 07 não se completa.

## Defeitos de layout encontrados

O doc 07 exige que a interface funcione em 1440, 1024, 768, 390 e 320 px. A verificação automatizada (`npm run test:prototype`) reprovava em **6 dos 15 casos**. Todos foram corrigidos em `outputs/a11y.css`.

| Defeito | Onde | Efeito |
|---|---|---|
| Painel lateral fechado na área de rolagem | Três portais, várias larguras | O drawer é escondido com `translateX(101%)`; transform não altera o layout, mas o elemento continua rolável. Também ficava acessível a leitor de tela e à tabulação |
| Coluna do dashboard sem `min-width: 0` | Admin e Professor, 1024 px | `.grid` usa `1.5fr .8fr`; as linhas de projeto somam 650 px de mínimo e empurravam 92 px para fora |
| Falta de breakpoint intermediário | Admin e Professor, 1024 px | Só existiam cortes em 900 px e 560 px — a lacuna já apontada acima |
| Tabela sem contêiner de rolagem | Professor, “Próximas aulas”, 390 e 320 px | `.table` recebe `min-width: 560px` no celular; o painel não tinha `table-wrap` e estourava 204 px |
| Barra de filtros rígida | Cliente, 1024 e 320 px | `.toolbar` é um grid de oito colunas fixas que não cabia; abaixo de 900 px o protótipo escondia metade dos filtros, contrariando o doc 03 |
| Cadeia do grid sem `min-width: 0` | Cliente, 390 px | A fila de chips tem 515 px de min-content e arrastava a página inteira, estourando 161 px |

Três observações sobre esses achados:

1. **Nenhum foi introduzido pelas correções de acessibilidade** — todos foram confirmados na versão original, antes das mudanças.
2. **O caso de 1024 px valida a lacuna de breakpoint** apontada acima: era exatamente a largura sem tratamento próprio.
3. **A barra de filtros expõe um conflito entre documentos.** O protótipo escondia filtros abaixo de 900 px; o doc 03 prevê “buscar, filtrar e agrupar” no portal do Cliente, sem ressalva por tamanho de tela. A correção faz a barra quebrar em linhas, mantendo todos os filtros acessíveis em qualquer largura.

## Verificação do protótipo

```
npm install          # instala o Playwright
npm run verify       # tokens + protótipo
```

`tests/prototype-a11y.mjs` cobre os itens do doc 07 que uma máquina consegue conferir: carregamento sem erro, tokens aplicados, Escape nos diálogos, foco entrando e voltando, Enter em linhas acionáveis, alvos de toque e ausência de rolagem horizontal nas cinco larguras. São 44 verificações.

O que a máquina **não** cobre e continua exigindo pessoa: se a informação faz sentido, se a prioridade está clara e se o fluxo corresponde ao trabalho real — para isso existe [`16-roteiro-de-validacao.md`](16-roteiro-de-validacao.md).

## Arquivos do protótipo após as correções

| Arquivo | Papel | Ordem |
|---|---|---|
| `outputs/tokens.css` | Declaração única da paleta | Primeiro |
| `outputs/portal.css` | Estilos de Admin e Professor | — |
| `outputs/typography.css` | Tipografia e componentes | — |
| `outputs/a11y.css` | Correções de acessibilidade e layout | **Último** |
| `outputs/a11y.js` | Escape, foco e teclado | Último script |

`a11y.css` precisa vir por último porque sobrescreve as folhas existentes; `tokens.css` vem primeiro porque só declara variáveis. Na v1 essa inversão desaparece: os tokens são a base e nenhuma folha posterior redefine cor.

## Inventário de componentes

Componentes já presentes no protótipo, a serem reconstruídos como React na Fase 1:

**Navegação** — `Sidebar` (expandida/recolhida, persistente), `NavButton`, `FooterProfile` + `AccountMenu`, `Topbar`, `RoleSwitch`, `MobileMenu`.

**Estrutura** — `Page`, `PageHead`, `Panel`, `PanelHead`, `Grid`, `Drawer` + `Scrim`, `Modal`, `Tabs`.

**Dados** — `MetricRow` / `Metric`, `StatRow` / `Stat`, `Table`, `ProjectRow`, `ActivityRow`, `FeedItem`, `NoticeRow`, `MaterialRow`, `PersonCard`, `PersonCompact`, `Progress`, `MiniProgress`, `Group` (colapsável), `Agenda`, `EmptyState`.

**Formulário** — `Field` (label, input, select, textarea), `FormGrid`, `Upload`, `SearchBox`, `Select`, `ViewChip`, `ToolButton`, `RatingScale` (0–10).

**Retorno** — `StatusBadge` (positivo, neutro, atenção, problema), `Toast`, `TimerBar`, `TimerModal`, `Avatar` (foto ou iniciais).

Todo componente de estado precisa expor **texto**, não apenas cor — o doc 06 é explícito: “cor nunca deve ser o único indicador”.

## Identidade

Regras do doc 06, mantidas:

- usar exclusivamente o logotipo oficial 3ADS EDU;
- preservar proporção e área de respiro;
- versão azul no tema claro, branca no tema escuro;
- não sobrepor controles ao logotipo.

Os arquivos de imagem ainda não estão versionados — ver [`outputs/assets/README.md`](../outputs/assets/README.md).
