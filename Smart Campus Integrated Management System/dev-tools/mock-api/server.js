/* DEV/TEST ONLY — NOT part of the deliverable. Stand-in for the Spring Boot API so the frontend can be exercised
   without the team backend. Data is in-memory and resets on restart. Usage: node server.js [port] */
const http = require('http'), fs = require('fs'), path = require('path');
const STATIC = path.join(__dirname, '../../src/main/resources/static'), PORT = +process.argv[2] || 8080;
let id = 100; const nid = () => ++id;
const db = {
  students: [{ id: 1, rollNo: 'CSE001', name: 'Aarav Mehta', email: 'aarav@campus.edu', department: 'Computer Science', semester: 5, phone: '9876543210' }, { id: 2, rollNo: 'ECE014', name: 'Diya Rao', email: 'diya@campus.edu', department: 'Electronics', semester: 3, phone: '9812345678' }],
  faculty: [{ id: 1, employeeId: 'F100', name: 'Dr. Kavita Nair', email: 'kavita@campus.edu', department: 'Computer Science', designation: 'Professor', phone: '9000000001' }],
  courses: [{ id: 1, code: 'CS301', name: 'Database Systems', credits: 4, semester: 5, department: 'Computer Science', facultyId: 1 }, { id: 2, code: 'CS302', name: 'Operating Systems', credits: 4, semester: 5, department: 'Computer Science', facultyId: 1 }],
  resources: [{ id: 1, name: 'Seminar Hall A', type: 'Seminar Hall', location: 'Block C', capacity: 120, status: 'AVAILABLE' }, { id: 2, name: 'Lab 3', type: 'Laboratory', location: 'Block B', capacity: 40, status: 'AVAILABLE' }, { id: 3, name: 'Projector P2', type: 'Equipment', location: 'Store', capacity: 1, status: 'MAINTENANCE' }],
  activities: [{ id: 1, title: 'Hackathon 2026', category: 'Technical', venue: 'Main Auditorium', eventDate: '2026-11-15T10:00', description: '24-hour coding event' }],
  bookings: [{ id: 1, resourceId: 1, requestedById: 1, date: '2026-11-02', startTime: '10:00', endTime: '12:00', purpose: 'Club meeting', status: 'PENDING' }],
  notifications: [{ id: 1, userId: 1, title: 'Welcome', message: 'Your account is active.', createdAt: '2026-10-20T09:00', read: false }], regs: []
};
const users = { student: { u: 'student', p: 'pass1234', user: { id: 1, name: 'Aarav Mehta', email: 'aarav@campus.edu', role: 'STUDENT' } }, faculty: { u: 'faculty', p: 'pass1234', user: { id: 1, name: 'Dr. Kavita Nair', email: 'kavita@campus.edu', role: 'FACULTY' } }, admin: { u: 'admin', p: 'pass1234', user: { id: 0, name: 'Campus Admin', email: 'admin@campus.edu', role: 'ADMIN' } } };
const j = (res, code, body) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(body === undefined ? '' : JSON.stringify(body)); };
const fac = id => db.faculty.find(f => f.id === id);
const course = c => ({ ...c, faculty: fac(c.facultyId) });
const booking = b => ({ ...b, resource: db.resources.find(r => r.id === b.resourceId), requestedBy: db.students.find(s => s.id === b.requestedById) || { name: 'Dr. Kavita Nair' } });
const sess = {};
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x'), p = url.pathname; let raw = '';
  req.on('data', d => raw += d); req.on('end', () => {
    if (!p.startsWith('/api/')) { let f = path.join(STATIC, p === '/' ? 'login.html' : p); if (!f.startsWith(STATIC) || !fs.existsSync(f)) { res.writeHead(404); return res.end('nf'); }
      const t = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' }[path.extname(f)] || 'application/octet-stream'; res.writeHead(200, { 'Content-Type': t }); return res.end(fs.readFileSync(f)); }
    const body = raw ? JSON.parse(raw) : {}, a = p.slice(4), m = req.method;
    if (a === '/auth/login' && m === 'POST') { const u = Object.values(users).find(x => x.u === body.username && x.p === body.password); if (!u) return j(res, 401, { message: 'Invalid username or password.' }); const t = 'tok-' + u.u; sess[t] = u; return j(res, 200, { token: t, user: u.user }); }
    const me = sess[(req.headers.authorization || '').replace('Bearer ', '')]; if (!me) return j(res, 401, { message: 'Unauthenticated' });
    const role = me.user.role;
    if (a === '/auth/logout') return j(res, 204);
    if (a === '/auth/me') return j(res, 200, me.user);
    if (a.startsWith('/admin/') && role !== 'ADMIN') return j(res, 403, { message: 'Forbidden' });
    if (['/students', '/faculty', '/courses'].some(x => a === x || a.startsWith(x + '/')) && m !== 'GET' && role !== 'ADMIN') return j(res, 403, { message: 'Forbidden' });
    if (url.searchParams.get('fail')) return j(res, 500, {});
    if (a === '/students/me') return j(res, 200, db.students[0]);
    if (a === '/students/me/courses') return j(res, 200, db.courses.map(course));
    if (a === '/students/me/faculty') return j(res, 200, db.faculty.map(f => ({ ...f, courseName: 'Database Systems' })));
    if (a === '/faculty/me') return j(res, 200, db.faculty[0]);
    if (a === '/faculty/me/courses') return j(res, 200, db.courses);
    if (a === '/faculty/me/students') return j(res, 200, db.students.map(s => ({ ...s, courseName: 'Database Systems' })));
    if (a === '/notifications') return j(res, 200, db.notifications);
    let mm; if ((mm = a.match(/^\/notifications\/(\d+)\/read$/))) { db.notifications.find(n => n.id == mm[1]).read = true; return j(res, 200, {}); }
    if (a === '/bookings/my') return j(res, 200, db.bookings.map(booking));
    if ((mm = a.match(/^\/bookings\/(\d+)\/cancel$/))) { db.bookings.find(b => b.id == mm[1]).status = 'CANCELLED'; return j(res, 200, {}); }
    if ((mm = a.match(/^\/bookings\/(\d+)\/status$/))) { if (role !== 'ADMIN') return j(res, 403, { message: 'Forbidden' }); db.bookings.find(b => b.id == mm[1]).status = body.status; return j(res, 200, {}); }
    if ((mm = a.match(/^\/activities\/(\d+)\/register$/))) { db.regs.push(+mm[1]); return j(res, 200, {}); }
    if (a === '/admin/stats') return j(res, 200, { totalStudents: db.students.length, totalFaculty: db.faculty.length, totalCourses: db.courses.length, totalResources: db.resources.length, pendingBookings: db.bookings.filter(b => b.status === 'PENDING').length, upcomingActivities: db.activities.length });
    if ((mm = a.match(/^\/admin\/reports\/(\w+)$/))) return j(res, 200, db[mm[1]] || []);
    if (a === '/bookings' && m === 'POST') { if (!db.resources.find(r => r.id === body.resourceId)) return j(res, 400, { message: 'Validation failed', errors: { resourceId: 'Unknown resource' } }); const b = { id: nid(), ...body, requestedById: me.user.id || 1, status: 'PENDING' }; db.bookings.push(b); return j(res, 201, b); }
    const col = ['students', 'faculty', 'courses', 'resources', 'activities', 'bookings'].find(c => a === '/' + c || a.startsWith('/' + c + '/'));
    if (col) { const seg = a.split('/')[2], list = db[col], wrap = col === 'courses' ? course : col === 'bookings' ? booking : x => x;
      if (m === 'GET') return j(res, 200, list.map(wrap));
      if (m === 'POST') { const k = { students: 'rollNo', faculty: 'employeeId', courses: 'code' }[col]; if (k && list.some(x => x[k] === body[k])) return j(res, 409, { message: `${k} already exists`, errors: { [k]: 'Must be unique' } }); const o = { id: nid(), ...body }; delete o.password; list.push(o); return j(res, 201, o); }
      const i = list.findIndex(x => x.id == seg); if (i < 0) return j(res, 404, { message: 'Not found' });
      if (m === 'PUT') { list[i] = { ...list[i], ...body }; return j(res, 200, list[i]); } if (m === 'DELETE') { list.splice(i, 1); return j(res, 204); } }
    j(res, 404, { message: 'No such endpoint: ' + a });
  });
}).listen(PORT, () => console.log('Mock API + static on http://localhost:' + PORT));
