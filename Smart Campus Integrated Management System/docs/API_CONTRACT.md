# Frontend ⇄ Backend API contract (PROPOSED — confirm with Members 2–4)

The frontend was built **before** seeing the team repo, so these paths/shapes are assumptions.
All paths live in `static/js/config.js`; if the agreed names differ, edit that file only (plus field names below if needed).

Base: `/api` · JSON · `Authorization: Bearer <token>` (cookie sessions also work: requests send `credentials: include`).
Errors: HTTP status + `{ "message": "...", "errors": { "field": "msg" } }` (errors may also be an array of `{field,message}`).
List endpoints may return a plain array **or** a Spring `Page` (`content: []`).

| Purpose | Method & path | Request | Response fields used |
|---|---|---|---|
| Login | POST `/auth/login` | `{username,password}` | `{token, user:{id,name,email,role}}`; role `STUDENT/FACULTY/ADMIN` (`ROLE_` prefix OK). If `user` absent, `GET /auth/me` is called |
| Current user | GET `/auth/me` | – | `{id,name,email,role}` |
| Logout | POST `/auth/logout` | `{}` | any (failures ignored) |
| Student profile | GET `/students/me` | – | `rollNo,name,email,department,semester,phone` |
| Student courses | GET `/students/me/courses` | – | `[ {code,name,credits,semester,faculty:{name}} ]` |
| Student faculty | GET `/students/me/faculty` | – | `[ {name,department,designation,email,courseName} ]` |
| Faculty profile | GET `/faculty/me` | – | `employeeId,name,email,department,designation,phone` |
| Faculty courses | GET `/faculty/me/courses` | – | `[ {code,name,credits,semester,department} ]` |
| Faculty students | GET `/faculty/me/students` | – | `[ {rollNo,name,department,semester,email,courseName} ]` |
| Notifications | GET `/notifications` | – | `[ {id,title,message,createdAt,read:boolean} ]` |
| Mark read | PATCH `/notifications/{id}/read` | `{}` | any |
| Activities | GET `/activities` | – | `[ {id,title,category,venue,eventDate,description,registered?} ]` |
| Register | POST `/activities/{id}/register` | `{}` | any |
| Resources | GET `/resources` | – | `[ {id,name,type,location,capacity,status} ]` status `AVAILABLE/UNAVAILABLE/MAINTENANCE` |
| My bookings | GET `/bookings/my` | – | `[ {id,resource:{name},date,startTime,endTime,purpose,status} ]` |
| Create booking | POST `/bookings` | `{resourceId,date,startTime,endTime,purpose}` | any |
| Cancel booking | PUT `/bookings/{id}/cancel` | `{}` | any |
| All bookings (admin) | GET `/bookings` | – | as above + `requestedBy:{name}` |
| Decide booking | PATCH `/bookings/{id}/status` | `{status:"APPROVED"\|"REJECTED"}` | any |
| Students CRUD | GET/POST `/students`, PUT/DELETE `/students/{id}` | `{rollNo,name,email,department,phone,semester,password(create)}` | rows as profile |
| Faculty CRUD | GET/POST `/faculty`, PUT/DELETE `/faculty/{id}` | `{employeeId,name,email,department,phone,designation,password(create)}` | rows as profile |
| Courses CRUD | GET/POST `/courses`, PUT/DELETE `/courses/{id}` | `{code,name,credits,semester,department,facultyId}` | `faculty:{id,name}` |
| Resources CRUD | POST `/resources`, PUT/DELETE `/resources/{id}` | `{name,type,location,capacity,status}` | – |
| Activities CRUD | POST `/activities`, PUT/DELETE `/activities/{id}` | `{title,category,venue,eventDate,description,capacity}` | – |
| Statistics | GET `/admin/stats` | – | flat object of numbers, e.g. `{totalStudents:…}` — each key becomes a card, label auto-humanised |
| Reports | GET `/admin/reports/{students\|faculty\|courses\|bookings\|activities}` | – | array of flat objects; columns = keys of first row |

Open questions for the team: auth style (JWT vs session), exact paths, field names, whether the admin gets notifications, how a student/faculty "my" scope is derived (token vs id in path).
