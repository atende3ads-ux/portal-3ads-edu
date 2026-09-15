#!/usr/bin/env node
/**
 * Portal 3ADS EDU — verificação dos tokens de design.
 *
 * Faz duas checagens:
 *
 * 1. Contraste — cada par texto/fundo contra o mínimo exigido pelo doc 06
 *    (WCAG AA): 4.5:1 para texto normal, 3:1 para texto grande e
 *    componentes de interface.
 *
 * 2. Sincronia — tokens.css e tokens.json precisam declarar exatamente as
 *    mesmas cores. Foi a divergência silenciosa entre os blocos :root de
 *    portal.css e index.html que motivou esta unificação.
 *
 * Uso: node design/verify-tokens.mjs
 * Sai com código 1 se algo reprovar — pronto para usar em CI.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const tokens = JSON.parse(readFileSync(join(here, 'tokens.json'), 'utf8'));
const css = readFileSync(join(here, 'tokens.css'), 'utf8');

const channel = (v) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((x) => x + x).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const ratio = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/** Texto que precisa de 4.5:1 contra todas as superfícies do tema. */
const BODY_TEXT = ['ink', 'muted', 'soft', 'accentText', 'positive', 'warning', 'danger'];
const SURFACES = ['bg', 'surface', 'surface2'];

/** Pares avulsos que não seguem o padrão texto-sobre-superfície. */
const extraPairs = (p) => [
  ['onAccent', 'accentStrong', 4.5, 'texto do botão primário'],
  ['accent', 'bg', 3.0, 'preenchimento e barras de progresso'],
];

let failures = 0;
let checks = 0;

for (const theme of ['light', 'dark']) {
  const p = tokens.color[theme];
  console.log(`\n── tema ${theme} ${'─'.repeat(52 - theme.length)}`);

  for (const fg of BODY_TEXT) {
    for (const bg of SURFACES) {
      const r = ratio(p[fg], p[bg]);
      const ok = r >= 4.5;
      checks++;
      if (!ok) failures++;
      const mark = ok ? '  ok ' : ' FALHA';
      console.log(`${mark} ${fg.padEnd(12)} sobre ${bg.padEnd(9)} ${r.toFixed(2)}:1  (min 4.50)`);
    }
  }

  for (const [fg, bg, min, label] of extraPairs(p)) {
    const r = ratio(p[fg], p[bg]);
    const ok = r >= min;
    checks++;
    if (!ok) failures++;
    const mark = ok ? '  ok ' : ' FALHA';
    console.log(`${mark} ${fg.padEnd(12)} sobre ${bg.padEnd(9)} ${r.toFixed(2)}:1  (min ${min.toFixed(2)}) — ${label}`);
  }
}

console.log(`\n${checks} pares verificados · ${failures} reprovações`);

/* ---------------------------------------------------------------------
   Sincronia entre tokens.css e tokens.json
   --------------------------------------------------------------------- */

console.log(`\n── sincronia css ↔ json ${'─'.repeat(38)}`);

/** Nome do token JSON -> custom property correspondente no CSS. */
const CSS_NAME = {
  bg: '--bg', surface: '--surface', surface2: '--surface-2', hover: '--hover',
  line: '--line', bluewash: '--bluewash', ink: '--ink', muted: '--muted',
  soft: '--soft', onAccent: '--on-accent', positive: '--positive',
  neutral: '--neutral', warning: '--warning', danger: '--danger',
};

/** Extrai o bloco :root correto e resolve um custom property literal. */
const blockFor = (theme) => {
  const marker = theme === 'dark' ? ':root[data-theme="dark"]' : ':root {';
  const start = css.indexOf(marker);
  if (start === -1) return '';
  const end = css.indexOf('\n}', start);
  return css.slice(start, end === -1 ? undefined : end);
};

let drift = 0;
for (const theme of ['light', 'dark']) {
  const block = blockFor(theme);
  for (const [key, prop] of Object.entries(CSS_NAME)) {
    const expected = tokens.color[theme][key];
    const found = new RegExp(`${prop}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`).exec(block);
    if (!found) continue;   // herdado do tema claro — nada a comparar
    if (found[1].toLowerCase() !== expected.toLowerCase()) {
      drift++;
      console.log(` FALHA ${theme}.${key}: css ${found[1]} ≠ json ${expected}`);
    }
  }
}
if (drift === 0) console.log('  ok  cores declaradas nos dois arquivos batem');

/* ---------------------------------------------------------------------
   Resultado
   --------------------------------------------------------------------- */

if (failures > 0 || drift > 0) {
  console.error('\nTokens reprovados. Ajuste design/tokens.json e design/tokens.css.');
  process.exit(1);
}
console.log('\nTokens em conformidade: WCAG AA e css/json sincronizados.');
