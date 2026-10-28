(function () {
  const S = window.SCMS, U = S.ui, E = S.config.E, V = S.views, e = E.student;
  const courseCols = [{ key: 'code', label: 'Code' }, { key: 'name', label: 'Course' }, { key: 'credits', label: 'Credits' }, { key: 'semester', label: 'Semester' }, { key: 'faculty.name', label: 'Faculty' }];
  const overview = async c => {
    const stats = document.createElement('div'); stats.className = 'stats'; c.appendChild(stats); U.loading(stats);
    const [co, bk, nt, ac] = await Promise.allSettled([S.api.list(e.courses), S.api.list(E.myBookings), S.api.list(e.notifications), S.api.list(E.activities)]);
    const n = r => r.status === 'fulfilled' ? r.value.length : null;
    stats.removeAttribute('aria-busy');
    V.statCards(stats, [{ label: 'Enrolled courses', value: n(co), href: '#courses' }, { label: 'My bookings', value: n(bk), href: '#bookings' },
      { label: 'Unread notifications', value: nt.status === 'fulfilled' ? nt.value.filter(x => x.read === false || x.isRead === false).length : null, href: '#notifications' }, { label: 'Campus activities', value: n(ac), href: '#activities' }]);
    if ([co, bk, nt, ac].some(r => r.status === 'rejected')) { const m = document.createElement('p'); m.className = 'help'; m.setAttribute('role', 'alert'); m.textContent = 'Some figures could not be loaded (shown as “—”). Open the relevant section for details.'; c.appendChild(m); }
    V.profile(e.profile, profileFields)(c);
  };
  const profileFields = [{ key: 'rollNo', label: 'Roll number' }, { key: 'department', label: 'Department' }, { key: 'semester', label: 'Semester' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }];
  S.layout.init({ role: 'student', notifEndpoint: e.notifications, nav: [
    { id: 'overview', label: 'Overview', icon: 'home', desc: 'A live summary of your campus life.', render: overview },
    { id: 'profile', label: 'My Profile', icon: 'user', render: V.profile(e.profile, profileFields) },
    { id: 'courses', label: 'Enrolled Courses', icon: 'book', desc: 'Courses you are currently enrolled in.', render: V.list({ endpoint: e.courses, columns: courseCols, searchKeys: ['code', 'name', 'faculty.name'], emptyTitle: 'Not enrolled in any course', emptyHint: 'Contact the administration if this is unexpected.' }) },
    { id: 'faculty', label: 'My Faculty', icon: 'users', desc: 'Faculty assigned to your courses.', render: V.list({ endpoint: e.faculty, searchKeys: ['name', 'department', 'email'], emptyTitle: 'No faculty assigned', columns: [{ key: 'name', label: 'Name' }, { key: 'department', label: 'Department' }, { key: 'designation', label: 'Designation' }, { key: 'email', label: 'Email' }, { key: 'courseName', label: 'Course' }] }) },
    { id: 'activities', label: 'Campus Activities', icon: 'cal', desc: 'Browse and register for campus events.', render: V.activities('student') },
    { id: 'bookings', label: 'Resource Bookings', icon: 'box', desc: 'Reserve classrooms, labs and equipment.', render: V.bookings('student', E.myBookings) },
    { id: 'notifications', label: 'Notifications', icon: 'bell', render: V.notifications(e.notifications) }] });
})();
