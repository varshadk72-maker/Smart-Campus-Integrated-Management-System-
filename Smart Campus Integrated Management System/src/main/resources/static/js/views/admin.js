(function () {
  const S = window.SCMS, U = S.ui, E = S.config.E, V = S.views, { esc } = U;
  const dept = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Mathematics', 'Physics', 'Management'];
  const person = (isNew, idField, idLabel) => [
    { name: idField, label: idLabel, required: true }, { name: 'name', label: 'Full name', required: true }, { name: 'email', label: 'Email', type: 'email', required: true, autocomplete: 'off' },
    { name: 'department', label: 'Department', type: 'select', required: true, options: dept }, { name: 'phone', label: 'Phone', pattern: '^[0-9+\\-\\s]{7,15}$', patternMsg: 'Enter a valid phone number.' }];
  const overview = async c => {
    const stats = document.createElement('div'); stats.className = 'stats'; c.appendChild(stats); U.loading(stats);
    try {
      const d = await S.api.get(E.stats) || {}; stats.removeAttribute('aria-busy');
      const items = Object.entries(d).filter(([, v]) => typeof v !== 'object').map(([k, v]) => ({ label: U.humanize(k), value: v }));
      if (!items.length) return U.empty(stats, 'No statistics returned', 'The server responded without any figures.');
      V.statCards(stats, items);
    } catch (e) { U.error(stats, e.message, () => { stats.remove(); overview(c); }); }
  };
  const reports = c => {
    const el = S.card(c);
    el.innerHTML = `<div class="toolbar"><div class="f"><label for="rt">Report</label><select id="rt">${S.config.REPORTS.map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join('')}</select></div>
      <button class="btn" id="csv" disabled>Export report CSV</button><button class="btn" id="registrationCsv">Export registrations CSV</button><button class="btn" id="prn">Print</button></div><div id="rb"></div>`;
    const rb = el.querySelector('#rb'), sel = el.querySelector('#rt'), csv = el.querySelector('#csv');
    el.querySelector('#registrationCsv').onclick = async () => {
      try {
        const blob = await S.api.download(E.activityRegistrationsCsv), url = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement('a'), { href: url, download: 'activity-registrations.csv' });
        a.click(); URL.revokeObjectURL(url);
      } catch (e) { U.toast(e.message, 'error'); }
    };
    let rows = [];
    const run = async () => {
      U.loading(rb, 'Generating report…'); csv.disabled = true;
      try {
        rows = await S.api.list(E.report(sel.value));
        if (!rows.length) return U.empty(rb, 'No data for this report');
        const keys = Object.keys(rows[0]).filter(k => typeof rows[0][k] !== 'object'); rb.removeAttribute('aria-busy');
        rb.innerHTML = `<div class="table-wrap"><table><thead><tr>${keys.map(k => `<th scope="col">${esc(U.humanize(k))}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${keys.map(k => `<td>${esc(r[k] ?? '—')}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="count">${rows.length} rows</p>`;
        csv.disabled = false; csv.onclick = () => { const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
          const blob = new Blob([[keys.join(','), ...rows.map(r => keys.map(k => q(r[k])).join(','))].join('\n')], { type: 'text/csv' });
          const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${sel.value}-report.csv` }); a.click(); URL.revokeObjectURL(a.href); };
      } catch (e) { U.error(rb, e.message, run); }
    };
    sel.onchange = run; el.querySelector('#prn').onclick = () => window.print(); run();
  };
  const approvals = c => {
    const el = S.card(c);
    const t = U.dataTable({ container: el, load: () => S.api.list(E.bookings), defaultFilters: { status: 'PENDING' },
      columns: [{ key: 'requestedBy.name', label: 'Requested by', render: r => esc(r.requestedBy ? r.requestedBy.name : r.requestedByName || '—') }, { key: 'resource.name', label: 'Resource', render: r => esc(r.resource ? r.resource.name : r.resourceName || '—') },
        { key: 'date', label: 'Date', format: 'date' }, { key: 'startTime', label: 'From' }, { key: 'endTime', label: 'To' }, { key: 'purpose', label: 'Purpose' }, { key: 'status', label: 'Status', format: 'badge' }],
      searchKeys: ['requestedBy.name', 'resource.name', 'purpose'], filters: [{ key: 'status', label: 'Status', options: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] }],
      emptyTitle: 'No bookings found', emptyHint: 'Booking requests will appear here.',
      actions: r => S.can('admin', 'booking:approve') && /pending/i.test(r.status) ? ['APPROVED', 'REJECTED'].map(s => ({ label: s === 'APPROVED' ? 'Approve' : 'Reject', danger: s === 'REJECTED', onClick: async () => {
        if (!await U.confirm(`${s === 'APPROVED' ? 'Approve' : 'Reject'} this booking request?`, { title: 'Confirm decision', confirmText: s === 'APPROVED' ? 'Approve' : 'Reject', danger: s === 'REJECTED' })) return;
        try { await S.api.patch(E.bookingStatus(r.id), { status: s }); U.toast(`Booking ${s.toLowerCase()}`, 'success'); t.reload(); } catch (e) { U.toast(e.message, 'error'); } } })) : [] });
  };
  const opt = (list, f) => list.map(x => ({ value: x.id, label: f(x) }));
  S.layout.init({ role: 'admin', profileView: false, nav: [
    { id: 'overview', label: 'Overview', icon: 'home', desc: 'Live campus statistics from the server.', render: overview },
    { id: 'students', label: 'Students', icon: 'grad', desc: 'Manage student records.', render: V.crud({ path: E.students, noun: 'student', perm: 'student:write', searchKeys: ['name', 'rollNo', 'email', 'department'], filters: [{ key: 'department', label: 'Department' }],
      columns: [{ key: 'rollNo', label: 'Roll no.' }, { key: 'name', label: 'Name' }, { key: 'department', label: 'Department' }, { key: 'semester', label: 'Sem' }, { key: 'email', label: 'Email' }],
      fields: isNew => [...person(isNew, 'rollNo', 'Roll number'), { name: 'semester', label: 'Semester', type: 'number', min: 1, max: 8, required: true }, ...(isNew ? [{ name: 'password', label: 'Initial password', type: 'password', required: true, minLength: 8, autocomplete: 'new-password' }] : [])] }) },
    { id: 'faculty', label: 'Faculty', icon: 'users', desc: 'Manage faculty records.', render: V.crud({ path: E.facultyAll, noun: 'faculty member', perm: 'faculty:write', searchKeys: ['name', 'employeeId', 'email', 'department'], filters: [{ key: 'department', label: 'Department' }],
      columns: [{ key: 'employeeId', label: 'Employee ID' }, { key: 'name', label: 'Name' }, { key: 'department', label: 'Department' }, { key: 'designation', label: 'Designation' }, { key: 'email', label: 'Email' }],
      fields: isNew => [...person(isNew, 'employeeId', 'Employee ID'), { name: 'designation', label: 'Designation', type: 'select', required: true, options: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'] }, ...(isNew ? [{ name: 'password', label: 'Initial password', type: 'password', required: true, minLength: 8, autocomplete: 'new-password' }] : [])] }) },
    { id: 'courses', label: 'Courses', icon: 'book', desc: 'Manage courses and faculty assignment.', render: V.crud({ path: E.courses, noun: 'course', perm: 'course:write', searchKeys: ['code', 'name', 'faculty.name'], filters: [{ key: 'department', label: 'Department' }],
      prepare: async () => ({ faculty: await S.api.list(E.facultyAll) }), toForm: r => ({ ...r, facultyId: r.faculty ? r.faculty.id : r.facultyId }),
      columns: [{ key: 'code', label: 'Code' }, { key: 'name', label: 'Course' }, { key: 'credits', label: 'Credits' }, { key: 'semester', label: 'Sem' }, { key: 'department', label: 'Department' }, { key: 'faculty.name', label: 'Faculty' }],
      fields: (n, x) => [{ name: 'code', label: 'Course code', required: true }, { name: 'name', label: 'Course name', required: true }, { name: 'credits', label: 'Credits', type: 'number', min: 1, max: 10, required: true }, { name: 'semester', label: 'Semester', type: 'number', min: 1, max: 8, required: true },
        { name: 'department', label: 'Department', type: 'select', options: dept, required: true }, { name: 'facultyId', label: 'Assigned faculty', type: 'select', asNumber: true, options: opt(x.faculty, f => `${f.name} (${f.department || ''})`), help: 'Optional' }] }) },
    { id: 'resources', label: 'Resources', icon: 'box', desc: 'Manage rooms, labs and equipment.', render: V.crud({ path: E.resources, noun: 'resource', perm: 'resource:write', searchKeys: ['name', 'type', 'location'], filters: [{ key: 'type', label: 'Type' }, { key: 'status', label: 'Status' }],
      columns: [{ key: 'name', label: 'Name' }, { key: 'type', label: 'Type' }, { key: 'location', label: 'Location' }, { key: 'capacity', label: 'Capacity' }, { key: 'status', label: 'Status', format: 'badge' }],
      fields: () => [{ name: 'name', label: 'Name', required: true }, { name: 'type', label: 'Type', type: 'select', required: true, options: ['Classroom', 'Laboratory', 'Auditorium', 'Seminar Hall', 'Sports', 'Equipment'] }, { name: 'location', label: 'Location' }, { name: 'capacity', label: 'Capacity', type: 'number', min: 1 }, { name: 'status', label: 'Status', type: 'select', required: true, options: ['AVAILABLE', 'UNAVAILABLE', 'MAINTENANCE'] }] }) },
    { id: 'approvals', label: 'Booking Approvals', icon: 'check', desc: 'Review and decide on resource booking requests.', render: approvals },
    { id: 'activities', label: 'Campus Activities', icon: 'cal', desc: 'Create and manage campus events.', render: V.crud({ path: E.activities, noun: 'activity', perm: 'activity:write', searchKeys: ['title', 'venue', 'category'], filters: [{ key: 'category', label: 'Category' }],
      columns: [{ key: 'title', label: 'Title' }, { key: 'category', label: 'Category' }, { key: 'venue', label: 'Venue' }, { key: 'eventDate', label: 'When', format: 'date' }, { key: 'capacity', label: 'Capacity' }],
      fields: () => [{ name: 'title', label: 'Title', required: true, full: true }, { name: 'category', label: 'Category', type: 'select', required: true, options: ['Academic', 'Cultural', 'Sports', 'Technical', 'Workshop'] }, { name: 'venue', label: 'Venue', required: true }, { name: 'eventDate', label: 'Date & time', type: 'datetime-local', required: true }, { name: 'capacity', label: 'Maximum capacity', type: 'number', min: 1, step: 1, required: true }, { name: 'description', label: 'Description', type: 'textarea', full: true }] }) },
    { id: 'reports', label: 'Reports', icon: 'chart', desc: 'Generate, export and print reports.', render: reports }] });
})();
