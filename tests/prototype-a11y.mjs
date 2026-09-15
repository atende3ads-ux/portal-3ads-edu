#!/usr/bin/env node
/**
 * Portal 3ADS EDU — verificação automatizada do protótipo.
 *
 * Cobre os itens verificáveis por máquina do plano de testes
 * (docs/07-testes-e-aceite.md) e as correções de docs/11-tokens-de-design.md:
 *
 *   - as três telas carregam sem erro de script;
 *   - os tokens auditados estão aplicados;
 *   - diálogos fecham com Escape e devolvem o foco ao gatilho;
 *   - cards e linhas acionáveis respondem a Enter;
 *   - alvos de toque têm ao menos 40 x 40 px;
 *   - não há rolagem horizontal em 1440, 1024, 768, 390 e 320 px.
 *
 * Requer Playwright:  npm install
 * Uso:                npm run test:prototype
 */

import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const OUTPUTS = pathToFileURL(resolve(here, '..', 'outputs')).href;

/** Em ambientes onde o browser do Playwright não bate com o instalado. */
const EXECUTABLE = process.env.CHROMIUM_PATH
  ?? ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome']
       .find((p) => existsSync(p));

const VIEWPORTS = [
  { label: '1440', width: 1440, height: 900 },
  { label: '1024', width: 1024, height: 768 },
  { label: '768', width: 768, height: 1024 },
  { label: '390', width: 390, height: 844 },
  { label: '320', width: 320, height: 640 },
];

const TOUCH_SELECTOR =
  '.rating-buttons button, .person-actions button, .sidebar-collapse, .tool-btn, ' +
  '.modal-close, .close, .menu, .mobile-menu';

let pass = 0;
let fail = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? '  ok  ' : ' FALHA'} ${name}${extra ? `  — ${extra}` : ''}`);
  ok ? pass++ : fail++;
};

const browser = await chromium.launch(EXECUTABLE ? { executablePath: EXECUTABLE } : {});
const newPage = (vp) => browser.newPage({ viewport: { width: vp.width, height: vp.height } });

/* ------------------------------------------------------------------ */
/* Carregamento e tokens                                              */
/* ------------------------------------------------------------------ */

for (const file of ['admin.html', 'trainer.html', 'index.html']) {
  console.log(`\n── ${file} ${'─'.repeat(Math.max(0, 48 - file.length))}`);
  const page = await newPage(VIEWPORTS[0]);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    // falha de rede em fonte externa não é erro de script
    if (m.type() === 'error' && !m.text().includes('net::')) errors.push(m.text());
  });

  await page.goto(`${OUTPUTS}/${file}`);
  await page.waitForTimeout(500);

  check('carrega sem erro de script', errors.length === 0, errors[0] ?? '');

  const tokens = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return {
      soft: s.getPropertyValue('--soft').trim(),
      fill: s.getPropertyValue('--blue-fill').trim(),
      blue: s.getPropertyValue('--blue').trim(),
    };
  });
  check('token --soft auditado', tokens.soft === '#666c76', tokens.soft);
  check('token --blue auditado', tokens.blue === '#0068d6', tokens.blue);
  check('token --blue-fill presente', tokens.fill === '#0072eb', tokens.fill);

  await page.close();
}

/* ------------------------------------------------------------------ */
/* Responsividade                                                     */
/* ------------------------------------------------------------------ */

console.log(`\n── rolagem horizontal ${'─'.repeat(31)}`);
for (const file of ['admin.html', 'trainer.html', 'index.html']) {
  for (const vp of VIEWPORTS) {
    const page = await newPage(vp);
    await page.goto(`${OUTPUTS}/${file}`);
    await page.waitForTimeout(350);
    const excess = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      // `overflow-x: clip` no html impede a barra espúria do drawer fechado,
      // então scrollWidth deixaria de acusar. Medimos o conteúdo diretamente:
      // o elemento mais à direita que não é fixo nem tem rolagem própria.
      let worst = 0;
      for (const el of document.querySelectorAll('.content *')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0) continue;
        if (el.closest('[style*="overflow"], .table-wrap, .viewbar, .entity-toolbar, .filters, .tabs, .drawer')) continue;
        const style = getComputedStyle(el);
        if (style.position === 'fixed') continue;
        let scroller = false;
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          const ov = getComputedStyle(p).overflowX;
          if (ov === 'auto' || ov === 'scroll' || ov === 'clip' || ov === 'hidden') { scroller = true; break; }
        }
        if (scroller) continue;
        worst = Math.max(worst, Math.round(r.right - vw));
      }
      return Math.max(0, worst);
    });
    check(`${file} em ${vp.label}px`, excess <= 1, excess > 1 ? `conteudo excede ${excess}px` : '');
    await page.close();
  }
}

/* ------------------------------------------------------------------ */
/* Alvos de toque, em cada página visível                             */
/* ------------------------------------------------------------------ */

console.log(`\n── alvos de toque ${'─'.repeat(35)}`);
for (const [file, pages] of [
  ['admin.html', ['dashboard', 'projects', 'hours', 'access']],
  ['index.html', ['overview', 'materials', 'people', 'contact']],
]) {
  const page = await newPage(VIEWPORTS[3]);
  await page.goto(`${OUTPUTS}/${file}`);
  await page.waitForTimeout(400);

  for (const name of pages) {
    await page.evaluate((id) => {
      document.querySelectorAll('.page').forEach((p) => p.classList.toggle('active', p.id === `page-${id}`));
    }, name);
    await page.waitForTimeout(200);

    const small = await page.evaluate((sel) =>
      [...document.querySelectorAll(sel)]
        .filter((el) => el.getClientRects().length > 0)
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { cls: el.className.toString().slice(0, 22), w: Math.round(r.width), h: Math.round(r.height) };
        })
        .filter((m) => m.w < 40 || m.h < 40), TOUCH_SELECTOR);

    check(`${file} · ${name}`, small.length === 0,
      small.length ? small.map((m) => `${m.cls} ${m.w}x${m.h}`).join(', ') : '');
  }
  await page.close();
}

/* ------------------------------------------------------------------ */
/* Teclado                                                            */
/* ------------------------------------------------------------------ */

console.log(`\n── teclado e diálogos ${'─'.repeat(31)}`);
{
  const page = await newPage(VIEWPORTS[0]);
  await page.goto(`${OUTPUTS}/admin.html`);
  await page.waitForTimeout(400);

  await page.click('[data-open="project"]');
  await page.waitForTimeout(350);
  check('drawer abre', await page.evaluate(() => document.querySelector('#drawer')?.classList.contains('open')) === true);
  check('foco entra no drawer',
    await page.evaluate(() => !!document.querySelector('#drawer')?.contains(document.activeElement)));

  await page.keyboard.press('Escape');
  await page.waitForTimeout(350);
  check('Escape fecha o drawer',
    await page.evaluate(() => !document.querySelector('#drawer')?.classList.contains('open')));

  await page.click('#quickTimer');
  await page.waitForTimeout(350);
  check('modal do timer abre', await page.evaluate(() => !!document.querySelector('.timer-modal-back')));
  check('modal tem aria-modal e rótulo', await page.evaluate(() => {
    const m = document.querySelector('.timer-modal');
    return !!(m?.getAttribute('aria-modal') && (m.getAttribute('aria-label') || m.getAttribute('aria-labelledby')));
  }));

  await page.keyboard.press('Escape');
  await page.waitForTimeout(350);
  check('Escape fecha o modal', await page.evaluate(() => !document.querySelector('.timer-modal-back')));
  await page.close();
}

{
  const page = await newPage(VIEWPORTS[0]);
  await page.goto(`${OUTPUTS}/index.html`);
  await page.waitForTimeout(400);

  await page.evaluate(() => document.querySelector('.activity')?.focus());
  await page.keyboard.press('Enter');
  await page.waitForTimeout(350);
  check('Enter abre o detalhe da atividade',
    await page.evaluate(() => document.querySelector('#drawer')?.classList.contains('open')) === true);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(350);
  check('Escape fecha o detalhe',
    await page.evaluate(() => !document.querySelector('#drawer')?.classList.contains('open')));
  check('foco volta para o gatilho',
    await page.evaluate(() => document.activeElement?.classList.contains('activity')) === true);
  await page.close();
}

await browser.close();
console.log(`\n${pass} passaram · ${fail} falharam`);
process.exit(fail ? 1 : 0);
