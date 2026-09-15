(function () {
  const one = (s, root = document) => root.querySelector(s);
  const all = (s, root = document) => [...root.querySelectorAll(s)];
  const paths = {
    collapse: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 9l-3 3 3 3"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>'
  };
  const icon = name => `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;

  const app = one('.app');
  const sidebar = one('.sidebar');
  if (app && sidebar) {
    const collapse = document.createElement('button');
    collapse.className = 'sidebar-collapse';
    collapse.type = 'button';
    collapse.title = 'Minimizar menu';
    collapse.setAttribute('aria-label', 'Minimizar menu lateral');
    collapse.innerHTML = icon('collapse');
    const sidebarBrand = one('.brand', sidebar);
    (sidebarBrand || sidebar).appendChild(collapse);
    app.classList.toggle('sidebar-collapsed', localStorage.getItem('edu-sidebar-collapsed') === 'true');
    collapse.onclick = () => {
      app.classList.toggle('sidebar-collapsed');
      localStorage.setItem('edu-sidebar-collapsed', String(app.classList.contains('sidebar-collapsed')));
    };
    const foot = one('.side-foot');
    if (foot) {
      const clientProfile = document.createElement('div');
      clientProfile.className = 'footer-profile client-user-profile';
      clientProfile.innerHTML = '<img class="profile-photo" src="assets/profile-nathalia.png" alt="Foto de Jéssica Gomes"><div><span class="micro">Acesso do cliente</span><strong>Jéssica Gomes</strong><small>IPOG · Responsável interna</small></div>';
      foot.prepend(clientProfile);
      const settings = document.createElement('button');
      settings.className = 'theme settings-button';
      settings.innerHTML = icon('settings') + '<span>Configurações</span>';
      settings.onclick = openSettings;
      clientProfile.after(settings);
      clientProfile.setAttribute('role', 'button');
      clientProfile.setAttribute('tabindex', '0');
      clientProfile.setAttribute('aria-label', 'Abrir menu da conta');
      clientProfile.insertAdjacentHTML('beforeend', `<span class="profile-chevron">${icon('collapse')}</span>`);
      clientProfile.onclick = () => toggleAccountMenu(foot);
      clientProfile.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') toggleAccountMenu(foot); };
      settings.classList.add('legacy-footer-action');
      one('#theme')?.classList.add('legacy-footer-action');
    }
  }

  function toggleAccountMenu(host) {
    const current = one('.account-menu', host);
    if (current) { current.remove(); return; }
    const menu = document.createElement('div');
    menu.className = 'account-menu';
    menu.innerHTML = `<button type="button" data-profile>${icon('user')}<span><strong>Meu perfil</strong><small>Dados pessoais e acesso</small></span></button><button type="button" data-settings>${icon('settings')}<span><strong>Configurações</strong><small>Notificações e segurança</small></span></button><button type="button" data-theme>${icon('sun')}<span><strong>Alternar tema</strong><small>Claro ou escuro</small></span></button>`;
    host.appendChild(menu);
    one('[data-profile]', menu).onclick = () => typeof toast === 'function' && toast('Perfil aberto');
    one('[data-settings]', menu).onclick = () => { menu.remove(); openSettings(); };
    one('[data-theme]', menu).onclick = () => { one('#theme')?.click(); menu.remove(); };
  }

  function openSettings() {
    const overlay = document.createElement('div');
    overlay.className = 'timer-modal-back';
    overlay.innerHTML = `<section class="timer-modal settings-modal" role="dialog" aria-modal="true"><header><div>${icon('settings')}<div><span class="micro">Preferências</span><h2>Configurações</h2></div></div><button class="modal-close" aria-label="Fechar">×</button></header><div class="timer-modal-body"><div class="settings-profile"><img src="assets/profile-nathalia.png" alt="Nathália Machado"><div><strong>Conta e perfil</strong><span>Foto, nome e informações de acesso</span></div><button class="action settings-action">Editar</button></div><label class="settings-row"><div>${icon('bell')}<span><strong>Notificações</strong><small>Alertas de materiais e próximos passos</small></span></div><input type="checkbox" checked></label><label class="settings-row"><div>${icon('sun')}<span><strong>Aparência</strong><small>Usar modo escuro nesta conta</small></span></div><input class="theme-checkbox" type="checkbox" ${document.documentElement.dataset.theme === 'dark' ? 'checked' : ''}></label><div class="settings-row"><div>${icon('user')}<span><strong>Segurança e acesso</strong><small>Senha e sessões da conta</small></span></div><button class="action settings-action">Abrir</button></div></div><footer><button class="action modal-close">Fechar</button><button class="primary save-settings">Salvar alterações</button></footer></section>`;
    document.body.appendChild(overlay);
    all('.modal-close', overlay).forEach(button => button.onclick = () => overlay.remove());
    one('.theme-checkbox', overlay).onchange = event => {
      document.documentElement.dataset.theme = event.target.checked ? 'dark' : 'light';
      localStorage.setItem('edu-theme', document.documentElement.dataset.theme);
    };
    all('.settings-action', overlay).forEach(button => button.onclick = () => typeof toast === 'function' && toast('Configuração aberta'));
    one('.save-settings', overlay).onclick = () => { overlay.remove(); if (typeof toast === 'function') toast('Preferências salvas'); };
  }

  all('.avatar').forEach(avatar => {
    if (avatar.textContent.trim() === 'NM') avatar.innerHTML = '<img src="assets/profile-nathalia.png" alt="Nathália Machado">';
  });
  one('.client-project-visual')?.remove();

  all('.state').forEach(state => {
    const text = state.textContent.toLowerCase();
    if (/conclu|aprovad|disponível|confirmad/.test(text)) state.classList.add('semantic-positive');
    else if (/aguard|atenção|pendente|atras/.test(text)) state.classList.add('semantic-warning');
    else state.classList.add('semantic-neutral');
  });
  all('.person, .material, .group, .stat').forEach(card => card.classList.add('card-interactive'));
  all('.person-actions').forEach(actions => {
    actions.innerHTML = `<button type="button" aria-label="Enviar mensagem">${icon('mail')}</button><button type="button" aria-label="Abrir perfil">${icon('user')}</button>`;
    all('button', actions).forEach(button => button.onclick = () => typeof toast === 'function' && toast(button.getAttribute('aria-label')));
  });
  all('.person').forEach(card => card.onclick = event => {
    if (!event.target.closest('button,a')) openClientDetail(card, 'Perfil');
  });
  all('.material').forEach(card => card.onclick = event => {
    if (!event.target.closest('button,a')) openClientDetail(card, 'Material');
  });
  all('.stat').forEach(card => {
    if (!card.dataset.quick) card.onclick = () => openClientDetail(card, 'Próximo encontro');
  });
  function openClientDetail(card, category) {
    const title = one('h3,strong', card)?.textContent.trim() || category;
    const description = one('p', card)?.textContent.trim() || 'Informações completas deste item do projeto.';
    const overlay = document.createElement('div');
    overlay.className = 'timer-modal-back';
    overlay.innerHTML = `<section class="timer-modal info-modal"><header><div>${icon('user')}<div><span class="micro">${category}</span><h2>${title}</h2></div></div><button class="modal-close">×</button></header><div class="timer-modal-body"><div class="info-summary"><strong>${title}</strong><p>${description}</p></div><div class="settings-row"><div>${icon('bell')}<span><strong>Status atual</strong><small>Informação atualizada pela equipe 3ADS EDU</small></span></div><span class="semantic-neutral">Disponível</span></div></div><footer><button class="action modal-close">Fechar</button><button class="primary detail-ok">Entendi</button></footer></section>`;
    document.body.appendChild(overlay);
    all('.modal-close,.detail-ok', overlay).forEach(button => button.onclick = () => overlay.remove());
  }
  const form = one('#feedback');
  if (form) {
    const textarea = one('textarea', form);
    const rating = document.createElement('div');
    rating.className = 'client-rating';
    rating.innerHTML = '<label>Nota opcional para o projeto</label><div class="rating-buttons"></div>';
    textarea.before(rating);
    const buttons = one('.rating-buttons', rating);
    for (let score = 0; score <= 10; score++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = score;
      button.onclick = () => {
        all('button', buttons).forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        form.dataset.score = score;
      };
      buttons.appendChild(button);
    }
    form.onsubmit = event => {
      event.preventDefault();
      const records = JSON.parse(localStorage.getItem('edu-client-feedback') || '[]');
      records.unshift({ score: form.dataset.score || null, message: textarea.value, createdAt: new Date().toISOString() });
      localStorage.setItem('edu-client-feedback', JSON.stringify(records));
      form.reset(); delete form.dataset.score;
      all('button', buttons).forEach(item => item.classList.remove('active'));
      if (typeof toast === 'function') toast('Avaliação e comentário enviados. Obrigado!');
    };
  }

  all('.action').forEach(button => {
    const label = button.textContent.trim().toLowerCase();
    if (label.includes('baixar')) {
      button.onclick = () => {
        const blob = new Blob(['Material demonstrativo do Portal 3ADS EDU'], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = 'material-3ads-edu.txt'; link.click();
        URL.revokeObjectURL(url);
        if (typeof toast === 'function') toast('Download iniciado');
      };
    } else if (label.includes('copiar')) {
      button.onclick = async () => {
        try { await navigator.clipboard.writeText('https://portal.3adsedu.com.br/ipog/embaixadores-ia'); }
        catch (_) {}
        if (typeof toast === 'function') toast('Link copiado');
      };
    } else if (label.includes('abrir') || label.includes('play')) {
      button.onclick = () => openClientDetail(button.closest('.material,.person,.panel') || button, 'Detalhes');
    }
  });
})();
