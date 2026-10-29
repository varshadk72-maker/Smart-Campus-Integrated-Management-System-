/* Single place to align with the backend team's agreed API. If paths change, edit ONLY this file. */
window.SCMS = window.SCMS || {};
SCMS.config = {
  API_BASE: '/api',   // same-origin when served by Spring Boot from static/. Use a full URL (+ CORS on backend) if served separately.
  E: {
    login: '/auth/login', logout: '/auth/logout', me: '/auth/me',
    student: { profile: '/students/me', courses: '/students/me/courses', faculty: '/students/me/faculty', notifications: '/notifications' },
    faculty: { profile: '/faculty/me', courses: '/faculty/me/courses', students: '/faculty/me/students', notifications: '/notifications' },
    markRead: id => `/notifications/${id}/read`,
    activities: '/activities', register: id => `/activities/${id}/register`,
    resources: '/resources',
    bookings: '/bookings', myBookings: '/bookings/my', cancelBooking: id => `/bookings/${id}/cancel`, bookingStatus: id => `/bookings/${id}/status`,
    students: '/students', facultyAll: '/faculty', courses: '/courses',
    stats: '/admin/stats', report: t => `/admin/reports/${t}`,
    activityRegistrationsCsv: '/admin/reports/activities/registrations.csv'
  },
  REPORTS: [['students','Students'],['faculty','Faculty'],['courses','Courses'],['bookings','Bookings'],['activities','Activities']],
  /* UI-only permissions: hide actions a role cannot use. The backend remains the real security control. */
  PERMISSIONS: {
    student: ['booking:create','booking:cancel','activity:register'],
    faculty: ['booking:create','booking:cancel'],
    admin: ['student:write','faculty:write','course:write','resource:write','booking:approve','activity:write','report:view']
  }
};
SCMS.can = (role, perm) => (SCMS.config.PERMISSIONS[role] || []).includes(perm);
