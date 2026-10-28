/* Reusable dashboard shell: sidebar nav, header, notification bell, profile menu, logout, hash router. */
(function () {
  const S = window.SCMS, { esc } = S.ui;
  const P = { home:'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z', user:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', book:'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z', users:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8', cal:'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', bell:'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0', box:'M21 8l-9-5-9 5v8l9 5 9-5zM3.3 7L12 12l8.7-5M12 22V12', check:'M20 6L9 17l-5-5', chart:'M18 20V10M12 20V4M6 20v-6', logout:'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9', menu:'M3 6h18M3 12h18M5 18h14', grad:'M22 10L12 5 2 10l10 5 10-5zM6 12v5c3 3 9 3 12 0v-5' };
  const icon = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n] || P.home}"/></svg>`;
  S.icon = icon;
  let ctx;

  async function refreshBadge() {
    const ep = ctx && ctx.notifEndpoint; if (!ep) return;
    const b = document.getElementById('bell-badge');
    try { const n = (await S.api.list(ep)).filter(x => x.read === false || x.isRead === false).length; b.textContent = n > 99 ? '99+' : n; b.hidden = !n; document.getElementById('bell-link').setAttribute('aria-label', `Notifications, ${n} unread`); } catch { b.hidden = true; }
  }

  function init({ role, nav, notifEndpoint, profileView = true }) {
    const user = S.auth.requireRole(role); if (!user) return;
    ctx = { role, user, notifEndpoint, nav };
    const name = user.name || user.fullName || user.username || user.email || 'User';
    const initials = name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
    document.getElementById('app').innerHTML = `
      <aside class="sidebar" id="sidebar" aria-label="Sidebar">
        <div class="brand">${icon('grad')}<div>Smart Campus<small>${esc(role)} portal</small></div></div>
        <nav class="nav" aria-label="Main navigation">${nav.map(n => `<a href="#${n.id}" data-id="${n.id}">${icon(n.icon)}<span>${esc(n.label)}</span></a>`).join('')}</nav>
      </aside>
      <div class="backdrop" id="backdrop"></div>
      <div class="main-wrap">
        <header class="topbar">
          <button class="icon-btn menu-toggle" id="menu-btn" aria-label="Open navigation" aria-controls="sidebar" aria-expanded="false">${icon('menu')}</button>
          <div class="spacer"></div>
          ${notifEndpoint ? `<a class="icon-btn" id="bell-link" href="#notifications" aria-label="Notifications">${icon('bell')}<span class="badge-dot" id="bell-badge" hidden></span></a>` : ''}
          <div class="profile">
            <button class="profile-btn" id="profile-btn" aria-haspopup="true" aria-expanded="false"><span class="avatar" aria-hidden="true">${esc(initials)}</span><span class="nm">${esc(name)}</span></button>
            <div class="dropdown" id="profile-menu" hidden>
              <div class="who"><strong>${esc(name)}</strong><small>${esc(user.email || user.username || '')}</small><small style="text-transform:capitalize">${esc(role)}</small></div>
              ${profileView ? `<a href="#profile">${icon('user')} My profile</a>` : ''}
              <button id="logout-btn">${icon('logout')} Log out</button>
            </div>
          </div>
        </header>
        <main id="main" tabindex="-1"><div class="page-head"><h1 id="page-title"></h1><p id="page-desc"></p></div><div id="view"></div></main>
      </div>`;
    const side = document.getElementById('sidebar'), bd = document.getElementById('backdrop'), mb = document.getElementById('menu-btn');
    const toggle = o => { side.classList.toggle('open', o); bd.classList.toggle('show', o); mb.setAttribute('aria-expanded', o); };
    mb.onclick = () => toggle(!side.classList.contains('open')); bd.onclick = () => toggle(false);
    const pb = document.getElementById('profile-btn'), pm = document.getElementById('profile-menu');
    const closeMenu = () => { pm.hidden = true; pb.setAttribute('aria-expanded', 'false'); };
    pb.onclick = e => { e.stopPropagation(); pm.hidden = !pm.hidden; pb.setAttribute('aria-expanded', !pm.hidden); };
    document.addEventListener('click', e => { if (!pm.contains(e.target)) closeMenu(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenu(); toggle(false); } });
    pm.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
    document.getElementById('logout-btn').onclick = async () => { closeMenu(); if (await S.ui.confirm('You will be signed out of this session.', { title: 'Log out?', confirmText: 'Log out' })) S.auth.logout(); };

    async function route() {
      const id = location.hash.slice(1) || nav[0].id, item = nav.find(n => n.id === id) || nav[0];
      document.querySelectorAll('.nav a').forEach(a => a.dataset.id === item.id ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
      document.getElementById('page-title').textContent = item.label; document.getElementById('page-desc').textContent = item.desc || '';
      document.title = `${item.label} · Smart Campus`;
      const view = document.getElementById('view'); view.innerHTML = ''; toggle(false);
      try { await item.render(view, ctx); } catch (e) { S.ui.error(view, e.message || 'Unable to load this page.'); }
    }
    window.addEventListener('hashchange', route); route(); refreshBadge();
  }
  S.layout = { init, refreshBadge };
})();
