# Smart Campus Integrated Management System — Frontend (Member 1)

Vanilla HTML5/CSS3/JavaScript served as **Spring Boot static resources**. No framework, no build step, no localStorage of data — every figure comes from the REST API.

## Structure (copy `src/main/resources/static/` into the shared repo, same path)
```
static/
  login.html  student.html  faculty.html  admin.html
  css/styles.css
  js/config.js      <- API base URL, endpoint paths, UI-permission map (edit here to match backend)
  js/auth.js        session + role guard      js/api.js   fetch wrapper, error/401 handling
  js/ui.js          toast, confirm dialog, validated form modal, searchable/filterable table, loading/empty/error states
  js/layout.js      sidebar, header, notification bell, profile menu, logout, hash router
  js/login.js
  js/views/common.js  profile, bookings, activities, notifications, admin CRUD factory
  js/views/student.js faculty.js admin.js   <- only nav + per-role config
docs/API_CONTRACT.md   docs/screenshots/
dev-tools/             <- test-only mock API + e2e script (do NOT commit to the team repo)
```

## Run with the real backend
1. Put the files above into the Spring Boot project at `src/main/resources/static/`.
2. Make sure `config.js` paths match the agreed endpoints (`docs/API_CONTRACT.md`).
3. `mvn spring-boot:run` → open `http://localhost:8080/login.html`.
4. If the frontend is served from another origin, set `API_BASE` to the full URL and enable CORS (with credentials if using cookies) on the backend.

## Role behaviour
`/login.html` → role from API → redirects to `student.html`, `faculty.html` or `admin.html`. Opening another role's page redirects back. Buttons for actions a role lacks are not rendered (`PERMISSIONS` in `config.js`); **the backend must still enforce authorization** (403s are shown as messages).

## Test without the backend (dev only)
```
node dev-tools/mock-api/server.js 8099      # http://localhost:8099 ; logins student|faculty|admin / pass1234
python3 dev-tools/e2e-test.py               # Playwright; needs playwright + chromium
```
The mock is a stand-in for UI testing only and resets on restart.

## Git (your repo)
```
git checkout -b feature/frontend
git add src/main/resources/static docs/API_CONTRACT.md docs/FRONTEND_README.md
git commit -m "feat(frontend): login page and student/faculty/admin dashboards"
git push -u origin feature/frontend
```
