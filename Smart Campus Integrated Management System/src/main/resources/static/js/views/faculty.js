(function () {
  const S = window.SCMS, U = S.ui, E = S.config.E, V = S.views, e = E.faculty;
  const profileFields = [{ key: 'employeeId', label: 'Employee ID' }, { key: 'department', label: 'Department' }, { key: 'designation', label: 'Designation' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }];
  const overview = async c => {
    const stats = document.createElement('div'); stats.className = 'stats'; c.appendChild(stats); U.loading(stats);
    const [co, st, bk, nt] = await Promise.allSettled([S.api.list(e.courses), S.api.list(e.students), S.api.list(E.myBookings), S.api.list(e.notifications)]);
    const n = r => r.status === 'fulfilled' ? r.value.length : null; stats.removeAttribute('aria-busy');
    V.statCards(stats, [{ label: 'Assigned courses', value: n(co), href: '#courses' }, { label: 'My students', value: n(st), href: '#students' }, { label: 'My bookings', value: n(bk), href: '#bookings' },
      { label: 'Unread notifications', value: nt.status === 'fulfilled' ? nt.value.filter(x => x.read === false || x.isRead === false).length : null, href: '#notifications' }]);
    if ([co, st, bk, nt].some(r => r.status === 'rejected')) { const m = document.createElement('p'); m.className = 'help'; m.setAttribute('role', 'alert'); m.textContent = 'Some figures could not be loaded (shown as “—”).'; c.appendChild(m); }
    V.profile(e.profile, profileFields)(c);
  };
  S.layout.init({ role: 'faculty', notifEndpoint: e.notifications, nav: [
    { id: 'overview', label: 'Overview', icon: 'home', desc: 'A live summary of your teaching workload.', render: overview },
    { id: 'profile', label: 'My Profile', icon: 'user', render: V.profile(e.profile, profileFields) },
    { id: 'courses', label: 'Assigned Courses', icon: 'book', desc: 'Courses you teach.', render: V.list({ endpoint: e.courses, searchKeys: ['code', 'name'], emptyTitle: 'No courses assigned', columns: [{ key: 'code', label: 'Code' }, { key: 'name', label: 'Course' }, { key: 'credits', label: 'Credits' }, { key: 'semester', label: 'Semester' }, { key: 'department', label: 'Department' }] }) },
    { id: 'students', label: 'Students', icon: 'users', desc: 'Students enrolled in your courses.', render: V.list({ endpoint: e.students, searchKeys: ['name', 'rollNo', 'email'], filters: [{ key: 'courseName', label: 'Course' }, { key: 'department', label: 'Department' }], emptyTitle: 'No students found', columns: [{ key: 'rollNo', label: 'Roll no.' }, { key: 'name', label: 'Name' }, { key: 'department', label: 'Department' }, { key: 'semester', label: 'Sem' }, { key: 'email', label: 'Email' }, { key: 'courseName', label: 'Course' }] }) },
    { id: 'bookings', label: 'Resource Bookings', icon: 'box', desc: 'Reserve classrooms, labs and equipment.', render: V.bookings('faculty', E.myBookings) },
    { id: 'activities', label: 'Campus Activities', icon: 'cal', render: V.activities('faculty') },
    { id: 'notifications', label: 'Notifications', icon: 'bell', render: V.notifications(e.notifications) }] });
})();
