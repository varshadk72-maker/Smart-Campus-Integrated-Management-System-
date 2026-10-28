/* Reusable UI components: toast, confirm dialog, form modal w/ validation, data table w/ search+filter, states. */
(function () {
  const S = window.SCMS;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
  const fmtDate = v => {
    if (!v) return '—'; const d = new Date(v); if (isNaN(d)) return esc(v);
    return String(v).length === 10 ? d.toLocaleDateString(undefined, { dateStyle: 'medium' }) : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  };
  const pillClass = v => { v = String(v).toLowerCase();
    if (/approved|available|active|read|registered|completed/.test(v)) return 'ok';
    if (/pending|unread|maintenance/.test(v)) return 'warn';
    if (/reject|cancel|unavailable|inactive/.test(v)) return 'bad'; return 'info'; };
  const pill = v => v == null || v === '' ? '—' : `<span class="pill ${pillClass(v)}">${esc(v)}</span>`;
  const humanize = k => k.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/^./, c => c.toUpperCase());

  function toast(msg, type = 'info') {
    const box = document.getElementById('toasts'); if (!box) return;
    const t = document.createElement('div'); t.className = 'toast ' + type; t.textContent = msg; box.appendChild(t);
    setTimeout(() => t.remove(), type === 'error' ? 6000 : 3500);
  }
  const loading = (el, text = 'Loading…') => { el.setAttribute('aria-busy', 'true'); el.innerHTML = `<div class="state" role="status"><span class="spinner"></span><p>${esc(text)}</p></div>`; };
  const empty = (el, title, hint = '') => { el.removeAttribute('aria-busy'); el.innerHTML = `<div class="state"><h3>${esc(title)}</h3><p>${esc(hint)}</p></div>`; };
  function error(el, msg, retry) {
    el.removeAttribute('aria-busy');
    el.innerHTML = `<div class="state err" role="alert"><h3>Something went wrong</h3><p>${esc(msg)}</p>${retry ? '<button class="btn" data-retry>Try again</button>' : ''}</div>`;
    if (retry) el.querySelector('[data-retry]').onclick = retry;
  }

  function confirmDialog(message, { title = 'Please confirm', confirmText = 'Confirm', danger = false } = {}) {
    return new Promise(res => {
      const d = document.createElement('dialog'); d.className = 'modal'; d.setAttribute('aria-labelledby', 'cd-t');
      d.innerHTML = `<form method="dialog"><h2 id="cd-t">${esc(title)}</h2><p>${esc(message)}</p><div class="modal-actions"><button class="btn" value="cancel">Cancel</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" value="ok">${esc(confirmText)}</button></div></form>`;
      d.addEventListener('close', () => { res(d.returnValue === 'ok'); d.remove(); });
      document.body.appendChild(d); d.showModal();
    });
  }

  function fieldHtml(f, id, v) {
    const fid = `${id}-${f.name}`, val = v[f.name] ?? '', req = f.required ? ' required aria-required="true"' : '';
    const common = `id="${fid}" name="${f.name}"${req} aria-describedby="${fid}-err${f.help ? ' ' + fid + '-h' : ''}"`;
    let ctl;
    if (f.type === 'select') {
      const opts = (f.options || []).map(o => typeof o === 'string' ? { value: o, label: o } : o);
      ctl = `<select ${common}><option value="">Select…</option>${opts.map(o => `<option value="${esc(o.value)}"${String(o.value) === String(val) ? ' selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`;
    } else if (f.type === 'textarea') ctl = `<textarea ${common} rows="3">${esc(val)}</textarea>`;
    else {
      const t = f.type || 'text'; let value = val;
      if (t === 'date' && value) value = String(value).slice(0, 10);
      if (t === 'datetime-local' && value) value = String(value).slice(0, 16);
      ctl = `<input ${common} type="${t}" value="${esc(value)}"${f.min != null ? ` min="${f.min}"` : ''}${f.max != null ? ` max="${f.max}"` : ''}${f.autocomplete ? ` autocomplete="${f.autocomplete}"` : ''}>`;
    }
    return `<div class="${f.full ? 'full' : ''}"><label for="${fid}">${esc(f.label)}${f.required ? ' <span aria-hidden="true">*</span>' : ''}</label>${ctl}${f.help ? `<span class="help" id="${fid}-h">${esc(f.help)}</span>` : ''}<span class="field-error" id="${fid}-err"></span></div>`;
  }

  function formModal({ title, fields, values = {}, submitText = 'Save', validate, onSubmit }) {
    const d = document.createElement('dialog'), id = 'f' + Math.random().toString(36).slice(2, 7);
    d.className = 'modal modal-wide'; d.setAttribute('aria-labelledby', id + '-t');
    d.innerHTML = `<form novalidate><h2 id="${id}-t">${esc(title)}</h2><div class="form-error" role="alert" hidden></div><div class="form-grid">${fields.map(f => fieldHtml(f, id, values)).join('')}</div><div class="modal-actions"><button type="button" class="btn" data-cancel>Cancel</button><button type="submit" class="btn btn-primary">${esc(submitText)}</button></div></form>`;
    document.body.appendChild(d); d.showModal();
    const form = d.querySelector('form'), banner = d.querySelector('.form-error'), submit = form.querySelector('[type=submit]');
    d.addEventListener('close', () => d.remove());
    form.querySelector('[data-cancel]').onclick = () => d.close();
    const setErr = (name, msg) => { const i = form.elements[name], e = form.querySelector(`#${id}-${name}-err`); if (!i) return; e.textContent = msg || ''; msg ? i.setAttribute('aria-invalid', 'true') : i.removeAttribute('aria-invalid'); };
    form.addEventListener('input', e => e.target.name && setErr(e.target.name, ''));
    form.addEventListener('submit', async ev => {
      ev.preventDefault(); banner.hidden = true;
      const payload = {}, errs = {};
      for (const f of fields) {
        const raw = String(form.elements[f.name].value).trim(); setErr(f.name, '');
        if (!raw) { if (f.required) errs[f.name] = `${f.label} is required.`; continue; }
        if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) errs[f.name] = 'Enter a valid email address.';
        else if (f.minLength && raw.length < f.minLength) errs[f.name] = `Must be at least ${f.minLength} characters.`;
        else if (f.pattern && !new RegExp(f.pattern).test(raw)) errs[f.name] = f.patternMsg || 'Invalid format.';
        else if (f.type === 'number') { const n = Number(raw);
          if (isNaN(n)) errs[f.name] = 'Enter a number.'; else if (f.min != null && n < f.min) errs[f.name] = `Minimum is ${f.min}.`; else if (f.max != null && n > f.max) errs[f.name] = `Maximum is ${f.max}.`; }
        payload[f.name] = f.type === 'number' || f.asNumber ? Number(raw) : raw;
      }
      Object.assign(errs, validate ? validate(payload) || {} : {});
      const bad = Object.keys(errs).filter(k => errs[k]);
      if (bad.length) { bad.forEach(k => setErr(k, errs[k])); form.elements[bad[0]].focus(); return; }
      submit.disabled = true; const label = submit.textContent; submit.innerHTML = '<span class="spinner"></span> Saving…';
      try { await onSubmit(payload); d.close(); }
      catch (e) {
        if (e.fieldErrors) Object.entries(e.fieldErrors).forEach(([k, m]) => setErr(k, m));
        banner.textContent = e.message || 'Could not save.'; banner.hidden = false;
      } finally { submit.disabled = false; submit.textContent = label; }
    });
    const first = form.querySelector('input,select,textarea'); if (first) first.focus();
    return d;
  }

  /* Searchable / filterable table. columns:[{key,label,render?,format?}]  actions:row=>[{label,onClick,danger}] */
  function dataTable({ container, load, columns, searchKeys = [], filters = [], actions, toolbar = [], emptyTitle = 'No records yet', emptyHint = '', defaultFilters = {} }) {
    const id = 't' + Math.random().toString(36).slice(2, 7); let rows = [], state = { q: '', f: { ...defaultFilters } };
    container.innerHTML = `<div class="toolbar"></div><div data-body></div>`;
    const tb = container.querySelector('.toolbar'), body = container.querySelector('[data-body]');
    if (searchKeys.length) tb.insertAdjacentHTML('beforeend', `<div class="grow"><label for="${id}-q">Search</label><input id="${id}-q" type="search" placeholder="Search…"></div>`);
    filters.forEach(f => tb.insertAdjacentHTML('beforeend', `<div class="f"><label for="${id}-${f.key}">${esc(f.label)}</label><select id="${id}-${f.key}" data-f="${f.key}"></select></div>`));
    toolbar.forEach((b, i) => { const x = document.createElement('button'); x.className = 'btn ' + (b.primary ? 'btn-primary' : ''); x.textContent = b.label; x.onclick = b.onClick; if (i === 0) x.style.marginLeft = 'auto'; tb.appendChild(x); });
    const cell = (c, r) => c.render ? c.render(r) : c.format === 'date' ? fmtDate(get(r, c.key)) : c.format === 'badge' ? pill(get(r, c.key)) : (v => v == null || v === '' ? '—' : esc(v))(get(r, c.key));
    function fillFilters() {
      tb.querySelectorAll('[data-f]').forEach(sel => {
        const f = filters.find(x => x.key === sel.dataset.f), cur = state.f[f.key] || '';
        const opts = f.options || [...new Set(rows.map(r => get(r, f.key)).filter(v => v != null && v !== ''))].sort();
        sel.innerHTML = `<option value="">All</option>` + opts.map(o => `<option${o === cur ? ' selected' : ''}>${esc(o)}</option>`).join('');
      });
    }
    function draw() {
      const q = state.q.toLowerCase();
      const vis = rows.filter(r => (!q || searchKeys.some(k => String(get(r, k) ?? '').toLowerCase().includes(q))) && filters.every(f => !state.f[f.key] || String(get(r, f.key)) === state.f[f.key]));
      if (!rows.length) return empty(body, emptyTitle, emptyHint);
      if (!vis.length) return empty(body, 'No matching results', 'Try a different search or clear the filters.');
      body.removeAttribute('aria-busy');
      body.innerHTML = `<div class="table-wrap"><table><thead><tr>${columns.map(c => `<th scope="col">${esc(c.label)}</th>`).join('')}${actions ? '<th scope="col"><span class="sr-only">Actions</span></th>' : ''}</tr></thead><tbody>${vis.map((r, i) => `<tr>${columns.map(c => `<td>${cell(c, r)}</td>`).join('')}${actions ? `<td class="actions">${actions(r).map((a, j) => `<button class="btn btn-sm ${a.danger ? 'btn-link-danger' : ''}" data-i="${i}" data-j="${j}">${esc(a.label)}</button>`).join('')}</td>` : ''}</tr>`).join('')}</tbody></table></div><p class="count" aria-live="polite">Showing ${vis.length} of ${rows.length}</p>`;
      body.onclick = e => { const b = e.target.closest('button[data-i]'); if (b) { const r = vis[+b.dataset.i]; actions(r)[+b.dataset.j].onClick(r); } };
    }
    tb.addEventListener('input', e => { if (e.target.type === 'search') { state.q = e.target.value; draw(); } });
    tb.addEventListener('change', e => { if (e.target.dataset.f) { state.f[e.target.dataset.f] = e.target.value; draw(); } });
    async function reload() {
      loading(body);
      try { rows = await load(); fillFilters(); draw(); } catch (e) { error(body, e.message, reload); }
    }
    reload();
    return { reload, rows: () => rows };
  }

  S.ui = { esc, get, fmtDate, pill, humanize, toast, loading, empty, error, confirm: confirmDialog, formModal, dataTable };
})();
