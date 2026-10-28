/* Views shared by several roles. Each factory returns render(container, ctx). */
(function () {
  const S = window.SCMS, U = S.ui, E = S.config.E, { esc } = U;
  const V = S.views = {};
  const card = c => { const d = document.createElement('section'); d.className = 'card'; c.appendChild(d); return d; };
  S.card = card;

  V.profile = (endpoint, fields) => async c => {
    const el = card(c);
    const go = async () => {
      U.loading(el);
      try {
        const p = await S.api.get(endpoint); if (!p) return U.empty(el, 'No profile found');
        const nm = p.name || p.fullName || '—';
        el.removeAttribute('aria-busy');
        el.innerHTML = `<div class="profile-head"><span class="avatar" aria-hidden="true">${esc(nm.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase())}</span><div><h2 style="margin:0">${esc(nm)}</h2><span class="help">${esc(p.email || '')}</span></div></div>
          <dl class="kv">${fields.map(f => `<div><dt>${esc(f.label)}</dt><dd>${f.format === 'date' ? U.fmtDate(U.get(p, f.key)) : esc(U.get(p, f.key) ?? '—')}</dd></div>`).join('')}</dl>`;
      } catch (e) { U.error(el, e.message, go); }
    }; go();
  };

  V.list = ({ endpoint, columns, searchKeys, filters, emptyTitle, emptyHint, load }) => c => {
    const el = card(c); U.dataTable({ container: el, load: load || (() => S.api.list(endpoint)), columns, searchKeys, filters, emptyTitle, emptyHint });
  };

  V.notifications = endpoint => c => {
    const el = card(c);
    const t = U.dataTable({ container: el, load: async () => (await S.api.list(endpoint)).map(r => ({ ...r, status: r.read === false || r.isRead === false ? 'Unread' : 'Read' })),
      columns: [{ key: 'title', label: 'Title' }, { key: 'message', label: 'Message' }, { key: 'createdAt', label: 'Received', format: 'date' },
        { key: 'read', label: 'Status', render: r => U.pill(r.read === false || r.isRead === false ? 'Unread' : 'Read') }],
      searchKeys: ['title', 'message'], emptyTitle: 'No notifications', emptyHint: 'You are all caught up.',
      filters: [{ key: 'status', label: 'Status', options: ['Unread', 'Read'] }],
      actions: r => (r.read === false || r.isRead === false) ? [{ label: 'Mark as read', onClick: async () => {
        try { await S.api.patch(E.markRead(r.id), {}); U.toast('Marked as read', 'success'); t.reload(); S.layout.refreshBadge(); } catch (e) { U.toast(e.message, 'error'); } } }] : [] });
  };

  V.bookings = (role, endpoint) => c => {
    const el = card(c);
    const t = U.dataTable({ container: el, load: () => S.api.list(endpoint),
      columns: [{ key: 'resource.name', label: 'Resource', render: r => esc(r.resource ? r.resource.name : r.resourceName || '—') }, { key: 'date', label: 'Date', format: 'date' },
        { key: 'startTime', label: 'From' }, { key: 'endTime', label: 'To' }, { key: 'purpose', label: 'Purpose' }, { key: 'status', label: 'Status', format: 'badge' }],
      searchKeys: ['resource.name', 'purpose', 'status'], filters: [{ key: 'status', label: 'Status' }],
      emptyTitle: 'No bookings yet', emptyHint: S.can(role, 'booking:create') ? 'Use “New booking” to reserve a campus resource.' : '',
      toolbar: S.can(role, 'booking:create') ? [{ label: '+ New booking', primary: true, onClick: () => newBooking(t) }] : [],
      actions: r => S.can(role, 'booking:cancel') && /pending|approved/i.test(r.status) ? [{ label: 'Cancel', danger: true, onClick: async () => {
        if (!await U.confirm('Cancel this booking request?', { title: 'Cancel booking', confirmText: 'Cancel booking', danger: true })) return;
        try { await S.api.put(E.cancelBooking(r.id), {}); U.toast('Booking cancelled', 'success'); t.reload(); } catch (e) { U.toast(e.message, 'error'); } } }] : [] });
  };

  async function newBooking(table) {
    let resources; try { resources = await S.api.list(E.resources); } catch (e) { return U.toast(e.message, 'error'); }
    const avail = resources.filter(r => !r.status || /available/i.test(r.status));
    if (!avail.length) return U.toast('No resources are currently available to book.', 'error');
    const today = new Date().toISOString().slice(0, 10);
    U.formModal({ title: 'New resource booking', submitText: 'Submit request',
      fields: [{ name: 'resourceId', label: 'Resource', type: 'select', required: true, asNumber: true, full: true, options: avail.map(r => ({ value: r.id, label: `${r.name}${r.location ? ' — ' + r.location : ''}` })) },
        { name: 'date', label: 'Date', type: 'date', required: true, min: today }, { name: 'startTime', label: 'Start time', type: 'time', required: true },
        { name: 'endTime', label: 'End time', type: 'time', required: true }, { name: 'purpose', label: 'Purpose', type: 'textarea', required: true, full: true }],
      validate: v => v.startTime && v.endTime && v.endTime <= v.startTime ? { endTime: 'End time must be after start time.' } : {},
      onSubmit: async v => { await S.api.post(E.bookings, v); U.toast('Booking request submitted', 'success'); table.reload(); } });
  }

  V.activities = role => c => {
    const el = card(c);
    const t = U.dataTable({ container: el, load: () => S.api.list(E.activities),
      columns: [{ key: 'title', label: 'Activity' }, { key: 'category', label: 'Category' }, { key: 'venue', label: 'Venue' }, { key: 'eventDate', label: 'When', format: 'date' }, { key: 'description', label: 'Details' }],
      searchKeys: ['title', 'venue', 'description', 'category'], filters: [{ key: 'category', label: 'Category' }], emptyTitle: 'No campus activities', emptyHint: 'Nothing is scheduled right now.',
      actions: r => S.can(role, 'activity:register') ? [{ label: r.registered ? 'Registered' : 'Register', onClick: async () => {
        if (r.registered) return;
        try { await S.api.post(E.register(r.id), {}); U.toast('Registered for ' + r.title, 'success'); t.reload(); } catch (e) { U.toast(e.message, 'error'); } } }] : [] });
  };

  /* Admin CRUD factory */
  V.crud = ({ path, noun, perm, columns, fields, toForm, searchKeys, filters, prepare }) => async c => {
    const el = card(c); let extra = {};
    if (prepare) { try { extra = await prepare(); } catch (e) { return U.error(el, e.message); } }
    const can = S.can('admin', perm), cap = noun[0].toUpperCase() + noun.slice(1);
    const open = row => U.formModal({ title: row ? `Edit ${noun}` : `Add ${noun}`, fields: fields(!row, extra), values: row ? (toForm ? toForm(row) : row) : {},
      onSubmit: async v => { row ? await S.api.put(`${path}/${row.id}`, v) : await S.api.post(path, v); U.toast(`${cap} ${row ? 'updated' : 'created'}`, 'success'); t.reload(); } });
    const t = U.dataTable({ container: el, load: () => S.api.list(path), columns, searchKeys, filters, emptyTitle: `No ${noun}s found`, emptyHint: can ? `Use “Add ${noun}” to create the first one.` : '',
      toolbar: can ? [{ label: `+ Add ${noun}`, primary: true, onClick: () => open(null) }] : [],
      actions: r => can ? [{ label: 'Edit', onClick: open }, { label: 'Delete', danger: true, onClick: async () => {
        if (!await U.confirm(`Delete this ${noun}? This cannot be undone.`, { title: `Delete ${noun}`, confirmText: 'Delete', danger: true })) return;
        try { await S.api.del(`${path}/${r.id}`); U.toast(`${cap} deleted`, 'success'); t.reload(); } catch (e) { U.toast(e.message, 'error'); } } }] : [] });
  };

  /* Stat cards from real API values */
  V.statCards = (el, items) => { el.innerHTML = items.map(i => `<${i.href ? 'a href="' + i.href + '"' : 'div'} class="stat"><div class="n">${i.value == null ? '—' : esc(i.value)}</div><div class="l">${esc(i.label)}</div></${i.href ? 'a' : 'div'}>`).join(''); };
})();
