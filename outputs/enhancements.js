(function () {
  const one = (s, root = document) => root.querySelector(s);
  const all = (s, root = document) => [...root.querySelectorAll(s)];

  const paths = {
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    projects: '<path d="M3 6h7l2 2h9v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 11h18"/>',
    tasks: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m7 9 2 2 4-4M7 16h10"/>',
    hours: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    updates: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    notices: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h10M7 13h6"/>',
    feedbacks: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8z"/>',
    access: '<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a6 6 0 0 1 12 0v2M18 8v6M15 11h6"/>',
    home: '<path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    support: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.7 2.7 0 1 1 4.5 2c-1.2.8-2 1.3-2 3M12 18h.01"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/>',
    stop: '<circle cx="12" cy="12" r="9"/><rect x="9" y="9" width="6" height="6" rx="1"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    upload: '<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"/>',
    collapse: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 9l-3 3 3 3"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'
  };
  function icon(name) {
    return `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.tasks}</svg>`;
  }

  const navMap = {
    dashboard: 'dashboard', projects: 'projects', hours: 'hours', updates: 'updates',
    notices: 'notices', feedbacks: 'feedbacks', access: 'access', home: 'home',
    tasks: 'tasks', support: 'support'
  };
  all('.nav button[data-page]').forEach(button => {
    const label = button.textContent.replace(/^[^\p{L}\p{N}]+/u, '').trim();
    button.innerHTML = icon(navMap[button.dataset.page] || 'tasks') + `<span>${label}</span>`;
  });
  const themeButton = one('#theme');
  if (themeButton) themeButton.innerHTML = icon('sun') + '<span>Alternar tema</span>';
  const mobileMenu = one('#menu');
  if (mobileMenu) {
    mobileMenu.innerHTML = '<span class="menu-lines"><i></i><i></i><i></i></span>';
    mobileMenu.setAttribute('aria-label', 'Abrir menu');
  }
  all('.global-search').forEach(el => {
    el.innerHTML = icon('search') + `<span>${el.textContent.replace(/^⌕\s*/, '')}</span>`;
  });

  const app = one('.app');
  const sidebar = one('.side');
  if (app && sidebar) {
    const collapse = document.createElement('button');
    collapse.className = 'sidebar-collapse';
    collapse.type = 'button';
    collapse.title = 'Minimizar menu';
    collapse.setAttribute('aria-label', 'Minimizar menu lateral');
    collapse.innerHTML = icon('collapse');
    const sidebarBrand = one('.logo', sidebar);
    (sidebarBrand || sidebar).appendChild(collapse);
    const saved = localStorage.getItem('edu-sidebar-collapsed') === 'true';
    app.classList.toggle('sidebar-collapsed', saved);
    collapse.onclick = () => {
      app.classList.toggle('sidebar-collapsed');
      localStorage.setItem('edu-sidebar-collapsed', String(app.classList.contains('sidebar-collapsed')));
    };
    const foot = one('.foot');
    if (foot) {
      const settings = document.createElement('button');
      settings.className = 'settings-button';
      settings.innerHTML = icon('settings') + '<span>Configurações</span>';
      settings.onclick = openSettings;
      foot.prepend(settings);
    }
  }

  function openSettings() {
    const trainerAccount = document.title.includes('Professor');
    const accountPhoto = trainerAccount ? 'assets/profile-rafael.png' : 'assets/profile-nathalia.png';
    const overlay = document.createElement('div');
    overlay.className = 'timer-modal-back';
    overlay.innerHTML = `<section class="timer-modal settings-modal"><header><div>${icon('settings')}<div><span class="eyebrow">Preferências</span><h2>Configurações</h2></div></div><button class="modal-close">×</button></header><div class="timer-modal-body"><div class="settings-profile"><img src="${accountPhoto}" alt="Foto de perfil"><div><strong>Conta e perfil</strong><span>Atualize foto, nome e informações pessoais</span></div><button class="btn settings-action">Editar</button></div><label class="settings-row"><div>${icon('bell')}<span><strong>Notificações</strong><small>Receber alertas de prazos e atualizações</small></span></div><input type="checkbox" checked></label><label class="settings-row"><div>${icon('sun')}<span><strong>Aparência</strong><small>Usar modo escuro nesta conta</small></span></div><input class="theme-checkbox" type="checkbox" ${document.documentElement.dataset.theme === 'dark' ? 'checked' : ''}></label><div class="settings-row"><div>${icon('user')}<span><strong>Segurança e acesso</strong><small>Senha, sessões e permissões</small></span></div><button class="btn settings-action">Abrir</button></div></div><footer><button class="btn modal-close">Fechar</button><button class="btn primary save-settings">Salvar alterações</button></footer></section>`;
    document.body.appendChild(overlay);
    all('.modal-close', overlay).forEach(button => button.onclick = () => overlay.remove());
    one('.theme-checkbox', overlay).onchange = event => {
      document.documentElement.dataset.theme = event.target.checked ? 'dark' : 'light';
      localStorage.setItem('edu-theme', document.documentElement.dataset.theme);
    };
    all('.settings-action', overlay).forEach(button => button.onclick = () => { if (typeof toast === 'function') toast('Configuração aberta'); });
    one('.save-settings', overlay).onclick = () => { overlay.remove(); if (typeof toast === 'function') toast('Preferências salvas'); };
  }

  all('.project-row').forEach(row => {
    row.classList.add('interactive-row');
    const last = row.lastElementChild;
    if (last && (last.textContent.trim() === '›' || last.textContent.trim() === '→')) last.innerHTML = icon('chevron');
    if (!row.dataset.open && !row.onclick) row.onclick = () => openInformationCard(row, 'Informações');
  });
  all('.notice .icon').forEach((box, index) => box.innerHTML = icon(index === 1 ? 'image' : index === 2 ? 'hours' : 'bell'));
  all('.status').forEach(status => {
    const text = status.textContent.toLowerCase();
    if (/conclu|pronto|ativo|publicado/.test(text)) status.classList.add('semantic-positive');
    else if (/atenção|pendente|aguard|atras/.test(text)) status.classList.add('semantic-warning');
    else status.classList.add('semantic-neutral');
  });
  all('.panel, .metric, .person').forEach(card => {
    if (card.querySelector('a,button,[data-open]') || card.classList.contains('person')) card.classList.add('card-interactive');
  });
  all('.person').forEach(card => card.onclick = event => {
    if (!event.target.closest('button,a')) { if (typeof toast === 'function') toast('Perfil da pessoa aberto'); }
  });

  all('.avatar').forEach(avatar => {
    if (avatar.textContent.trim() === 'NM') avatar.innerHTML = '<img src="assets/profile-nathalia.png" alt="Nathália Machado">';
  });
  const profile = one('.profile');
  if (profile && !one('img', profile)) {
    const trainerAccount = document.title.includes('Professor');
    const profilePhoto = trainerAccount ? 'assets/profile-rafael.png' : 'assets/profile-nathalia.png';
    const profileName = trainerAccount ? 'Rafael Martins' : 'Nathália Machado';
    profile.insertAdjacentHTML('afterbegin', `<img class="profile-photo" src="${profilePhoto}" alt="${profileName}">`);
  }
  const profileFoot = one('.foot');
  if (profile && profileFoot) {
    profile.classList.add('footer-profile');
    profileFoot.prepend(profile);
    profile.setAttribute('role', 'button');
    profile.setAttribute('tabindex', '0');
    profile.setAttribute('aria-label', 'Abrir menu da conta');
    const profileDetails = document.createElement('div');
    all(':scope > .eyebrow, :scope > strong, :scope > span:not(.profile-chevron)', profile).forEach(item => profileDetails.appendChild(item));
    profile.appendChild(profileDetails);
    profile.insertAdjacentHTML('beforeend', `<span class="profile-chevron">${icon('chevron')}</span>`);
    profile.onclick = () => toggleAccountMenu(profileFoot);
    profile.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') toggleAccountMenu(profileFoot); };
  }
  if (themeButton) themeButton.classList.add('legacy-footer-action');
  const standaloneSettings = one('.settings-button');
  if (standaloneSettings) standaloneSettings.classList.add('legacy-footer-action');

  function toggleAccountMenu(host) {
    const current = one('.account-menu', host);
    if (current) { current.remove(); return; }
    const menu = document.createElement('div');
    menu.className = 'account-menu';
    menu.innerHTML = `<button type="button" data-profile>${icon('user')}<span><strong>Meu perfil</strong><small>Dados pessoais e acesso</small></span></button><button type="button" data-settings>${icon('settings')}<span><strong>Configurações</strong><small>Notificações e segurança</small></span></button><button type="button" data-theme>${icon('sun')}<span><strong>Alternar tema</strong><small>Claro ou escuro</small></span></button><button type="button" data-exit>${icon('support')}<span><strong>Sair</strong><small>Encerrar esta sessão</small></span></button>`;
    host.appendChild(menu);
    one('[data-profile]', menu).onclick = () => typeof toast === 'function' && toast('Perfil aberto');
    one('[data-settings]', menu).onclick = () => { menu.remove(); openSettings(); };
    one('[data-theme]', menu).onclick = () => { themeButton?.click(); menu.remove(); };
    one('[data-exit]', menu).onclick = () => typeof toast === 'function' && toast('Sessão preservada nesta demonstração');
  }

  function openInformationCard(card, category) {
    const title = one('h3,strong,h2,td', card)?.textContent.trim() || category;
    const description = one('p', card)?.textContent.trim() || 'Consulte as informações relacionadas a este registro.';
    const overlay = document.createElement('div');
    overlay.className = 'timer-modal-back';
    overlay.innerHTML = `<section class="timer-modal info-modal" role="dialog" aria-modal="true"><header><div>${icon('tasks')}<div><span class="eyebrow">${category}</span><h2>${title}</h2></div></div><button class="modal-close">×</button></header><div class="timer-modal-body"><div class="info-summary"><strong>${title}</strong><p>${description}</p></div><div class="settings-row"><div>${icon('projects')}<span><strong>Projeto relacionado</strong><small>Embaixadores IA · IPOG</small></span></div><span class="semantic-neutral">Em andamento</span></div><div class="settings-row"><div>${icon('hours')}<span><strong>Próximo passo</strong><small>Revisar informações e registrar uma atualização</small></span></div><span>Esta semana</span></div></div><footer><button class="btn modal-close">Fechar</button><button class="btn primary info-confirm">Entendi</button></footer></section>`;
    document.body.appendChild(overlay);
    all('.modal-close,.info-confirm', overlay).forEach(button => button.onclick = () => overlay.remove());
  }
  all('.feed-item, tbody tr').forEach(card => {
    card.classList.add('card-interactive');
    card.tabIndex = 0;
    card.onclick = event => { if (!event.target.closest('button,a,input')) openInformationCard(card, card.matches('tr') ? 'Registro' : 'Informações'); };
    card.onkeydown = event => { if (event.key === 'Enter') openInformationCard(card, 'Informações'); };
  });
  one('.project-cover')?.remove();
  all('.btn.primary').forEach(button => {
    if (button.textContent.trim().startsWith('+')) {
      button.innerHTML = icon('plus') + `<span>${button.textContent.replace('+', '').trim()}</span>`;
    }
  });

  const observation = '<div class="field full"><label>Observação opcional</label><textarea placeholder="Inclua algum contexto adicional, se necessário..."></textarea></div>';
  try {
    if (typeof templates !== 'undefined') {
      ['time', 'update', 'notice'].forEach(key => {
        if (templates[key] && !templates[key].includes('Observação opcional')) {
          templates[key] = templates[key].replace('</div><button', observation + '</div><button');
        }
      });
    }
    if (typeof tpl !== 'undefined') {
      ['time', 'update', 'task'].forEach(key => {
        if (tpl[key] && !tpl[key].includes('Observação opcional')) {
          tpl[key] = tpl[key].replace('</div><button', observation + '</div><button');
        }
      });
    }
  } catch (_) {}

  let timerInterval = null;
  let seconds = 0;
  let activeTimer = null;
  function formatTime(total) {
    const h = String(Math.floor(total / 3600)).padStart(2, '0');
    const m = String(Math.floor(total % 3600 / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
  function showTimerSetup() {
    const old = one('#timerSetup');
    if (old) old.remove();
    const admin = document.title.includes('Operação');
    const overlay = document.createElement('div');
    overlay.id = 'timerSetup';
    overlay.className = 'timer-modal-back open';
    overlay.innerHTML = `<section class="timer-modal" role="dialog" aria-modal="true" aria-label="Iniciar timer">
      <header><div>${icon('play')}<div><span class="eyebrow">Timesheet</span><h2>Iniciar atividade</h2></div></div><button class="modal-close" type="button">×</button></header>
      <div class="timer-modal-body">
        <div class="field"><label>Projeto / cliente</label><select id="timerProject"><option value="">Selecione...</option><option>Embaixadores IA · IPOG</option><option>Workshop Liderança · Araguaia</option>${admin ? '<option>Mentoria Growth · Grupo Saga</option>' : ''}</select></div>
        <div class="field"><label>Tipo de dedicação</label><select id="timerType"><option>Preparação / backoffice</option><option>Hora-aula / treinamento</option><option>Reunião / alinhamento</option><option>Produção de material</option></select></div>
        <div class="field"><label>Atividade</label><input id="timerActivity" placeholder="Ex.: Preparação da Aula 04"></div>
        <div class="field"><label>Observação opcional</label><textarea id="timerNote" placeholder="Contexto adicional sobre esta atividade..."></textarea></div>
        <div class="timer-error" id="timerError"></div>
      </div>
      <footer><button class="btn modal-cancel" type="button">Cancelar</button><button class="btn primary modal-start" type="button">${icon('play')} Iniciar timer</button></footer>
    </section>`;
    document.body.appendChild(overlay);
    const closeModal = () => overlay.remove();
    one('.modal-close', overlay).onclick = one('.modal-cancel', overlay).onclick = closeModal;
    overlay.onclick = event => { if (event.target === overlay) closeModal(); };
    one('.modal-start', overlay).onclick = () => {
      const project = one('#timerProject').value;
      const activity = one('#timerActivity').value.trim();
      if (!project || !activity) {
        one('#timerError').textContent = 'Selecione um projeto e descreva a atividade.';
        return;
      }
      activeTimer = { project, activity, type: one('#timerType').value, note: one('#timerNote').value.trim() };
      startTimer();
      closeModal();
    };
  }
  function startTimer() {
    clearInterval(timerInterval);
    seconds = 0;
    const bar = one('.timer');
    if (!bar) return;
    const title = one('.timer strong', bar);
    const subtitle = one('.timer small', bar);
    const display = one('.timer > span', bar);
    const button = one('.timer > button', bar);
    title.textContent = activeTimer.activity;
    subtitle.textContent = `${activeTimer.project} · ${activeTimer.type}`;
    display.textContent = '00:00:00';
    button.innerHTML = icon('stop') + '<span>Encerrar</span>';
    button.classList.add('running');
    button.onclick = finishTimer;
    timerInterval = setInterval(() => { seconds++; display.textContent = formatTime(seconds); }, 1000);
  }
  function finishTimer() {
    if (!activeTimer) return;
    clearInterval(timerInterval);
    const elapsed = Math.max(seconds, 1);
    const record = { ...activeTimer, seconds: elapsed, finishedAt: new Date().toISOString() };
    const records = JSON.parse(localStorage.getItem('edu-time-records') || '[]');
    records.unshift(record);
    localStorage.setItem('edu-time-records', JSON.stringify(records));
    const bar = one('.timer');
    one('.timer strong', bar).textContent = 'Nenhuma atividade em andamento';
    one('.timer small', bar).textContent = 'O último registro foi salvo no timesheet';
    one('.timer > span', bar).textContent = formatTime(elapsed);
    const button = one('.timer > button', bar);
    button.innerHTML = icon('play') + '<span>Iniciar</span>';
    button.classList.remove('running');
    button.onclick = showTimerSetup;
    activeTimer = null;
    if (typeof toast === 'function') toast('Timer encerrado e registro salvo com sucesso');
  }
  ['#start', '#quickTimer'].forEach(selector => {
    const button = one(selector);
    if (button) {
      button.innerHTML = icon('play') + '<span>Iniciar</span>';
      button.onclick = showTimerSetup;
    }
  });
  const stopButton = one('#stopTimer');
  if (stopButton) {
    stopButton.innerHTML = icon('stop') + '<span>Encerrar</span>';
    stopButton.onclick = () => {
      activeTimer = { project: 'Embaixadores IA · IPOG', activity: 'Produção de material', type: 'Backoffice', note: '' };
      seconds = 2538;
      finishTimer();
    };
  }

  function enhanceProjectTabs(tabs) {
    if (tabs.dataset.ready) return;
    tabs.dataset.ready = '1';
    const buttons = all('button', tabs);
    const host = tabs.parentElement;
    const content = document.createElement('div');
    content.className = 'drawer-tab-content';
    let sibling = tabs.nextSibling;
    while (sibling) {
      const next = sibling.nextSibling;
      content.appendChild(sibling);
      sibling = next;
    }
    host.appendChild(content);
    const initial = content.innerHTML;
    const admin = document.title.includes('Operação');
    const views = {
      Resumo: initial,
      Atividades: `<div class="drawer-list-row">${icon('tasks')}<div><strong>Desenvolvimento dos protótipos</strong><p>Em andamento · Responsável: 3ADS EDU · 22 set</p></div><button class="btn drawer-action">Abrir</button></div><div class="drawer-list-row">${icon('hours')}<div><strong>Validar fluxos apresentados</strong><p>Aguardando cliente · 23 set</p></div><button class="btn drawer-action">Abrir</button></div><div class="drawer-list-row">${icon('projects')}<div><strong>Encontro 04</strong><p>Próximo · 24 set às 14h</p></div><button class="btn drawer-action">Abrir</button></div>`,
      Materiais: `<div class="drawer-list-row">${icon('projects')}<div><strong>Slides · Aula 03</strong><p>PDF · 8 MB · enviado em 18 set</p></div><button class="btn drawer-download">Baixar</button></div><div class="drawer-list-row">${icon('play')}<div><strong>Gravação · Aula 03</strong><p>Vídeo · 1h42min</p></div><button class="btn drawer-action">Assistir</button></div><div class="drawer-list-row">${icon('projects')}<div><strong>Framework de Viabilidade IA</strong><p>PDF · material de apoio</p></div><button class="btn drawer-download">Baixar</button></div>`,
      Pessoas: `<div class="person-compact"><div class="avatar">NM</div><div><strong>Nathália Machado</strong><span>3ADS EDU · Direção do projeto</span></div></div><div class="person-compact"><div class="avatar">RM</div><div><strong>Rafael Martins</strong><span>Professor parceiro · Aulas 03, 04 e 05</span></div></div><div class="person-compact"><div class="avatar">JG</div><div><strong>Jéssica Gomes</strong><span>IPOG · Ponto focal do cliente</span></div></div>`,
      Horas: `<div class="metrics" style="grid-template-columns:repeat(3,1fr)"><div class="metric"><strong>24h30</strong><span>Realizadas</span></div><div class="metric"><strong>60h</strong><span>Previstas</span></div><div class="metric"><strong>41%</strong><span>Utilizado</span></div></div><div class="drawer-list-row">${icon('hours')}<div><strong>Produção de material</strong><p>Nathália · Backoffice · 14 set</p></div><strong>2h18</strong></div><div class="drawer-list-row">${icon('hours')}<div><strong>Aula 03</strong><p>Rafael · Hora-aula · 08 set</p></div><strong>2h</strong></div>`
    };
    function bindContentActions() {
      all('.drawer-action', content).forEach(button => button.onclick = () => {
        if (typeof toast === 'function') toast('Detalhes abertos');
      });
      all('.drawer-download', content).forEach(button => button.onclick = () => {
        const blob = new Blob(['Material demonstrativo 3ADS EDU'], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url; link.download = 'material-3ads-edu.txt'; link.click();
        URL.revokeObjectURL(url);
        if (typeof toast === 'function') toast('Download iniciado');
      });
    }
    buttons.forEach(button => {
      button.type = 'button';
      button.onclick = () => {
        buttons.forEach(item => item.classList.toggle('active', item === button));
        content.setAttribute('aria-busy', 'true');
        setTimeout(() => {
          const label = button.textContent.trim();
          content.innerHTML = views[label] || `<div class="feed-item"><strong>${label}</strong><p>Nenhuma informação cadastrada nesta seção.</p></div>`;
          content.removeAttribute('aria-busy');
          bindContentActions();
        }, 120);
      };
    });
    bindContentActions();
    if (!admin) buttons.filter(button => button.textContent.trim() === 'Horas').forEach(button => button.remove());
  }

  function enhanceUpload(area) {
    if (area.dataset.ready) return;
    area.dataset.ready = '1';
    area.innerHTML = icon('upload') + `<strong>${area.textContent.trim()}</strong><span>Clique para selecionar arquivos</span>`;
    area.tabIndex = 0;
    area.onclick = () => {
      const input = document.createElement('input');
      input.type = 'file'; input.multiple = true;
      input.accept = '.pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.mp4,.mov';
      input.onchange = () => {
        if (input.files.length) area.querySelector('span').textContent = `${input.files.length} arquivo(s) selecionado(s)`;
      };
      input.click();
    };
  }
  all('.upload').forEach(enhanceUpload);
  all('.tabs').forEach(enhanceProjectTabs);
  new MutationObserver(() => {
    all('.upload').forEach(enhanceUpload);
    all('.tabs').forEach(enhanceProjectTabs);
  }).observe(document.body, { childList: true, subtree: true });

  all('button').forEach(button => {
    const text = button.textContent.trim().toLowerCase();
    if ((text.includes('exportar') || text === 'baixar') && !button.dataset.enhanced) {
      button.dataset.enhanced = '1';
      button.innerHTML = icon('download') + `<span>${button.textContent.replace('↓', '').trim()}</span>`;
      button.onclick = () => {
        const blob = new Blob(['Data,Pessoa,Projeto,Atividade,Horas\n14/09/2026,Nathália,Embaixadores IA,Produção de material,2h18'], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = '3ads-edu-registros.csv'; a.click(); URL.revokeObjectURL(url);
        if (typeof toast === 'function') toast('Download iniciado');
      };
    }
  });
})();
