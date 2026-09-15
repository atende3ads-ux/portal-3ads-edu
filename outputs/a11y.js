/* =========================================================================
   Portal 3ADS EDU — camada de acessibilidade do protótipo

   Implementa as exigências do doc 06 que faltavam:

   - diálogos fecham com Escape (o protótipo não tinha nenhum handler);
   - foco vai para dentro do diálogo ao abrir e volta ao gatilho ao fechar;
   - o foco fica contido enquanto o diálogo está aberto;
   - cards e linhas acionáveis respondem a Enter e Espaço;
   - diálogos recebem role, aria-modal e rótulo.

   Funciona para os três portais e para os diálogos criados em tempo de
   execução por enhancements.js e client-actions.js.

   Carregue por último, depois dos demais scripts.
   ========================================================================= */

(function () {
  'use strict';

  const FOCUSABLE = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  /** Elemento que tinha o foco antes de cada diálogo abrir. */
  const focusStack = [];

  const visible = (el) =>
    el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;

  const focusablesIn = (root) =>
    [...root.querySelectorAll(FOCUSABLE)].filter(visible);

  /* ---------------------------------------------------------------------
     Descoberta do que está aberto, da camada mais alta para a mais baixa
     --------------------------------------------------------------------- */

  function topModal() {
    const all = [...document.querySelectorAll('.timer-modal-back')].filter(visible);
    return all.length ? all[all.length - 1] : null;
  }

  function openDrawer() {
    const drawer = document.querySelector('.drawer.open');
    if (!drawer) return null;
    const scrim = document.querySelector('.drawer-back.open, .drawer-scrim.open');
    return { drawer, scrim };
  }

  function openSidebar() {
    const side = document.querySelector('.side.open, .sidebar.open');
    if (!side) return null;
    return { side, scrim: document.querySelector('.mobile-scrim.open') };
  }

  /* ---------------------------------------------------------------------
     Fechamento
     --------------------------------------------------------------------- */

  function closeTop() {
    const modal = topModal();
    if (modal) {
      // Prefere o botão do próprio diálogo: ele carrega a lógica da tela.
      const closer = modal.querySelector('.modal-close, .modal-cancel');
      if (closer) closer.click();
      else modal.remove();
      restoreFocus();
      return true;
    }

    const drawer = openDrawer();
    if (drawer) {
      drawer.drawer.classList.remove('open');
      if (drawer.scrim) drawer.scrim.classList.remove('open');
      restoreFocus();
      return true;
    }

    const sidebar = openSidebar();
    if (sidebar) {
      sidebar.side.classList.remove('open');
      if (sidebar.scrim) sidebar.scrim.classList.remove('open');
      restoreFocus();
      return true;
    }

    return false;
  }

  function restoreFocus() {
    const previous = focusStack.pop();
    if (previous && document.contains(previous) && visible(previous)) {
      previous.focus();
    }
  }

  /* ---------------------------------------------------------------------
     Escape e contenção de foco
     --------------------------------------------------------------------- */

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (closeTop()) {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }

    if (event.key !== 'Tab') return;

    const container = topModal() || openDrawer()?.drawer;
    if (!container) return;

    const items = focusablesIn(container);
    if (!items.length) return;

    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;

    // Foco escapou do diálogo: traz de volta.
    if (!container.contains(active)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
      return;
    }

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }, true);

  /* ---------------------------------------------------------------------
     Preparo de diálogos: semântica e foco inicial
     --------------------------------------------------------------------- */

  function prepareDialog(container, labelHint) {
    if (container.dataset.a11yReady) return;
    container.dataset.a11yReady = '1';

    if (!container.getAttribute('role')) container.setAttribute('role', 'dialog');
    container.setAttribute('aria-modal', 'true');

    if (!container.getAttribute('aria-label') && !container.getAttribute('aria-labelledby')) {
      const heading = container.querySelector('h1, h2, h3');
      if (heading) {
        if (!heading.id) heading.id = 'dlg-' + Math.random().toString(36).slice(2, 9);
        container.setAttribute('aria-labelledby', heading.id);
      } else if (labelHint) {
        container.setAttribute('aria-label', labelHint);
      }
    }

    const items = focusablesIn(container);
    const target = items.find((el) => !el.matches('.modal-close, .close')) || items[0];
    if (target) requestAnimationFrame(() => target.focus());
  }

  /** Registra quem abriu, para devolver o foco depois. */
  function rememberTrigger() {
    const active = document.activeElement;
    if (active && active !== document.body) focusStack.push(active);
  }

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-open], #start, #quickTimer, #stopTimer, .activity, .settings-button, .footer-profile, .client-user-profile')) {
      rememberTrigger();
    }
  }, true);

  /* ---------------------------------------------------------------------
     Diálogos criados em tempo de execução
     --------------------------------------------------------------------- */

  new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType !== 1) continue;
        const modal = node.matches?.('.timer-modal-back') ? node : node.querySelector?.('.timer-modal-back');
        if (modal) {
          const panel = modal.querySelector('.timer-modal') || modal;
          prepareDialog(panel, 'Diálogo');
        }
      }
      // O drawer abre por classe, não por inserção no DOM.
      if (record.type === 'attributes') {
        const el = record.target;
        if (el.classList?.contains('drawer') && el.classList.contains('open')) {
          delete el.dataset.a11yReady;
          prepareDialog(el, 'Painel lateral');
        }
      }
    }
  }).observe(document.body, {
    childList: true, subtree: true,
    attributes: true, attributeFilter: ['class']
  });

  /* ---------------------------------------------------------------------
     Teclado em elementos acionáveis que não são botões
     --------------------------------------------------------------------- */

  const ACTIONABLE = '.project-row, .activity, .feed-item, .material, .person, .stat, .notice, tbody tr';

  function makeKeyboardAccessible(el) {
    if (el.dataset.a11yKey) return;
    if (el.closest('.timer-modal')) return;
    el.dataset.a11yKey = '1';
    if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
    if (!el.getAttribute('role')) el.setAttribute('role', 'button');
    el.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (event.target !== el) return;          // deixa passar para controles internos
      event.preventDefault();
      rememberTrigger();
      el.click();
    });
  }

  const scan = () => document.querySelectorAll(ACTIONABLE).forEach(makeKeyboardAccessible);
  scan();
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });

  /* ---------------------------------------------------------------------
     Scrims fecham ao clique e devolvem o foco
     --------------------------------------------------------------------- */

  document.addEventListener('click', (event) => {
    const scrim = event.target;
    if (scrim.matches?.('.drawer-back, .drawer-scrim, .mobile-scrim')) restoreFocus();
    if (scrim.matches?.('.timer-modal-back')) restoreFocus();
  });
})();
