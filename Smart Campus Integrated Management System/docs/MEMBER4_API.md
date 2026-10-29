# Member 4 backend: activities and registrations

The backend runs from this project directory with Java 21 and Maven. It uses the existing `smart_campus_db` tables and does not create, drop, or replace a student or user table.

## Database setup

1. Create/select `smart_campus_db`, then run the existing `database/activities.sql` only if its tables have not already been created. It uses `CREATE TABLE IF NOT EXISTS`; its sample insert is not idempotent.
2. Run `database/migrations/V2__activities_and_registrations.sql`. It adds the activity category, converts existing activity dates to `DATETIME` (date values are preserved at midnight), and ensures the registration status is non-null.
3. Optionally run `database/sample_data.sql`, which skips an activity with the same name.

The current team schema has a unique `(activity_id, student_id)` key and an activity foreign key. The student/user table is not present in this repository, so this backend does not guess its name or add an invalid foreign key. The signed-in identity integration described below is required.

## Configuration and authentication integration

Copy `.env.example` values to environment variables; never commit real passwords or signing keys.

The API is a stateless Spring Security OAuth2 resource server. It validates HS256 bearer tokens signed with `SCIMS_JWT_SECRET` (at least 32 UTF-8 bytes) and accepts role claims named `role` or `roles`, with values `STUDENT`, `FACULTY`, or `ADMIN`. `scope` authorities are also retained. The existing team's login/auth service must issue those signed tokens using the same secret. A student token must additionally contain a trustworthy numeric `student_id` claim matching the team's actual student primary key. Registration requests never accept a student ID from the request body.

The frontend login page cannot authenticate against this backend alone: this repository has no user model, password store, `/api/auth/login` service, or existing signed-token issuer. Integrate Member 1/2's authentication service before expecting frontend login to work. Do not solve that by disabling security or accepting unsigned/request-provided identities.

## Endpoints

All paths below are prefixed with `/api` and require `Authorization: Bearer <signed-token>` unless otherwise noted. JSON activity dates are ISO-8601 local date-times, for example `2026-11-15T10:00:00`.

| Method and path | Access | Purpose |
|---|---|---|
| `GET /activities` | STUDENT, FACULTY, ADMIN | List activities; student response includes `registered` |
| `GET /activities/{id}` | STUDENT, FACULTY, ADMIN | Fetch one activity |
| `POST /activities` | ADMIN | Create activity; requires title, category, eventDate, venue, capacity >= 1 |
| `PUT /activities/{id}` | ADMIN | Update; capacity cannot be lowered below active registrations |
| `DELETE /activities/{id}` | ADMIN | Delete only if no registration rows exist |
| `POST /activities/{id}/register` | STUDENT | Register the authenticated student; duplicate/full/missing activity errors are 409/404 |
| `GET /registrations/me` | STUDENT | List registrations for the authenticated student |
| `DELETE /registrations/{registrationId}` | STUDENT | Cancel an owned registration; another student's record returns 403 |
| `GET /registrations` | ADMIN | List all registrations |
| `GET /admin/activities/analytics` | ADMIN | Activity counts, remaining capacity, popular activities, and status totals |
| `GET /admin/stats` | ADMIN | Frontend-compatible activity and registration count cards |
| `GET /admin/reports/activities` | ADMIN | Activity summary rows |
| `GET /admin/reports/activities/registrations.csv` | ADMIN | UTF-8 CSV attachment of registration records |

Validation errors return HTTP 400 with `{ "message": "...", "errors": { "field": "reason" } }`. Not found, conflict, and forbidden errors use HTTP 404, 409, and 403.

## Run and test

Set `DB_USERNAME`, `DB_PASSWORD`, and `SCIMS_JWT_SECRET`; `DB_URL` defaults to `jdbc:mysql://localhost:3306/smart_campus_db`.

```powershell
$env:DB_USERNAME = "your_mysql_username"
$env:DB_PASSWORD = "your_local_mysql_password"
$env:SCIMS_JWT_SECRET = "your_local_shared_secret_at_least_32_bytes"
mvn spring-boot:run
```

Run automated tests with `mvn test`, and package with `mvn package`.
