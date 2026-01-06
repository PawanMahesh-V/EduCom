# EduCom Full‑Stack Guide (React + Node/Express + PostgreSQL)

This document consolidates the essential concepts and project specifics for the EduCom application. It’s organized as a practical study guide with direct references to this repo and ready‑to‑run steps.

---

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+ reachable via credentials in `.env`
6
### Environment variables
Create `backend/.env`:

```
# Server
PORT=5000
HOST=0.0.0.0
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# JWT
JWT_SECRET=replace_with_a_secure_random_string

# Postgres (use your local/hosted DB)
DB_USER=postgres
DB_HOST=localhost
DB_NAME=educom
DB_PASSWORD=postgres_password
DB_PORT=5432

# Email (optional; needed for verification codes)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_account
EMAIL_PASS=your_password
```

Create `frontend/.env`:

```
VITE_API_URL=http://localhost:5000/api
```

### Install and run

Backend:
```bash
cd backend
npm install
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## Frontend (React.js)

### Core Web Basics
- HTML5 semantic tags: structure pages for accessibility and SEO.
- CSS3 layouts: Flexbox and Grid for responsive layouts.
- JavaScript ES6+: use `let/const`, arrow functions, destructuring, spread/rest, promises, async/await, and array methods (`map`, `filter`, `reduce`).

In this project:
- Vite + React 19 configured in `frontend/vite.config.js`.
- Global styles in `frontend/src/styles/global.css` and `frontend/src/index.css`.

### React Fundamentals
- JSX and function components across `frontend/src/pages` and `frontend/src/components`.
- Props for composition; State with `useState` in page components (e.g., dashboards and forms).
- Events & Forms: controlled inputs and handlers.
- Conditional rendering for role‑based views.
- Lists & keys when rendering courses, communities, messages.

Key files:
- App shell in `frontend/src/App.jsx`.
- Layouts: `frontend/src/components/DashboardLayout.jsx`, `frontend/src/components/MessageLayout.jsx`.

### React Hooks (Very Important)
- `useState`, `useEffect`, `useRef` used widely.
- `useContext`: can be added for global state (not required here).
- `useMemo`/`useCallback`: apply for expensive computations or stable handlers.
- Real‑time hooks in `frontend/src/hooks/useSocket.js` provide:
  - `useCommunityMessages()` for room join, new message, delete message
  - `useTypingIndicator()` for typing signals
  - `useNotifications()` for real‑time notifications
  - `useDirectMessages()` and `useDMTypingIndicator()` for DMs

### Routing & State Management
- React Router in `frontend/package.json` (`react-router-dom@7`).
- Typical setup with `BrowserRouter`, `<Routes>`, `<Route>` across pages.
- `useParams` and `useNavigate` for route params and navigation.
- Global state:
  - Session‑based token and user stored in `sessionStorage`.
  - Protected routing via `frontend/src/components/ProtectedRoute.jsx` using `allowedRoles`.
- Redux/RTK: optional; not required for current scope.

### API Integration
- API base: `frontend/src/config/api.js` reads `VITE_API_URL`.
- Fetch wrapper: `frontend/src/api/client.js` adds `Authorization: Bearer <token>` from `sessionStorage`.
- Handle loading, errors, and JSON parsing inside the wrapper.
- Env variables via `import.meta.env` (Vite).

### UI & Best Practices
- Component reusability and controlled components throughout pages.
- Styling: global CSS + `styled-components` available; CSS Modules or Tailwind/MUI can be added later.
- Performance basics: memoization, splitting large lists, deferring heavy computations; avoid unnecessary re‑renders by stabilizing callbacks.

### Real‑Time (Socket.IO)
- Client in `frontend/src/services/socket.js` connects to `SOCKET_URL` (base server URL without `/api`).
- Hooks in `frontend/src/hooks/useSocket.js` manage rooms, messages, notifications, typing, user status.
- Depends on auth user ID to register the socket.

---

## Backend (Node.js + Express.js)

### Node.js Basics
- Node runtime with event loop and non‑blocking IO.
- Package management via npm.
- CommonJS modules used (`require/module.exports`).
- File structure:
  - Entry: `backend/server.js`
  - Config: `backend/config/*` (database, email, constants)
  - Controllers: `backend/controllers/*`
  - Middleware: `backend/middleware/*`
  - Routes: `backend/routes/*`
  - Models: `backend/models/*`

### Express.js Core Concepts
- Server in `backend/server.js` with JSON parsing and CORS.
- Middleware: `backend/middleware/auth.js` verifies `Authorization: Bearer <JWT>` and attaches `req.user`.
- Routing: mounted under `/api/*` (auth, users, courses, communities, dashboard, notifications, direct-messages).
- Request/Response: JSON payloads, status codes, body/params/query handling.
- Error handling:
  - Controllers return appropriate status codes; add centralized error middleware for uniform responses as an enhancement.

### REST API Development
- REST principles: resource‑oriented endpoints, stateless requests, standard verbs.
- CRUD operations implemented across users, courses, communities, messages, notifications.
- Use proper status codes: 2xx success, 4xx client errors, 5xx server errors.

### Authentication & Authorization
- Login is 2‑step: credential check then email verification code (`/auth/login` then `/auth/verify-login`).
- JWT via `jsonwebtoken` with `JWT_SECRET`; token returned to client for subsequent requests.
- Password hashing via `bcrypt` during registration and reset.
- Role‑based access (RBAC): roles like Admin, Teacher, Student, HOD used in controllers and socket events.
- Protected routes on frontend via `ProtectedRoute` redirecting users based on role.

Key files:
- Auth flows: `backend/controllers/AuthController.js`
- JWT guard: `backend/middleware/auth.js`

### Security Basics
- CORS configured in `backend/server.js` using `FRONTEND_URL`.
- Rate limiting dependency present (`express-rate-limit`); recommended to enable across sensitive routes.
- Input validation: consider adding `Joi` or `Zod` to validate request bodies.
- Headers hardening: consider `helmet`.
- Env secrets: `.env` with secure `JWT_SECRET` and database credentials.

### Real‑Time (Socket.IO)
- Server in `backend/server.js` using `socket.io` with CORS.
- Tracks connected users to emit targeted events (DMs, notifications, user status).
- Community rooms for message broadcasting.

---

## Database (PostgreSQL)

### PostgreSQL Fundamentals
- Tables, rows, columns; data types; primary/foreign keys; constraints.

### SQL Queries (Very Important)
- Core statements: `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
- Clauses: `WHERE`, `ORDER BY`, `LIMIT`.
- Joins: `INNER`, `LEFT` for relations (e.g., communities ↔ courses).
- Aggregations: `COUNT`, `SUM`, `AVG`.
- Indexes: add on frequently filtered columns (e.g., `users.email`, `messages.community_id`, `notifications.user_id`).

### PostgreSQL with Node.js
- Connection pooling in `backend/config/database.js` using `pg`.
- Parameterized queries (e.g., `$1`, `$2`) used across controllers and models to prevent SQL injection.
- Example from `backend/models/User.js`:
  - `SELECT ... WHERE LOWER(email) = LOWER($1) OR LOWER(reg_id) = LOWER($1)`

### Suggested Schema (aligns with current code)
Below DDLs reflect referenced tables; adapt names/constraints to your conventions.

```sql
-- users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  reg_id VARCHAR(64) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL,         -- 'Admin' | 'Teacher' | 'Student' | 'HOD'
  department VARCHAR(128) NOT NULL,
  semester INT,
  program_year INT,
  section VARCHAR(64),
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- courses
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(64) UNIQUE NOT NULL,
  teacher_id INT REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses(teacher_id);

-- communities (course-specific groups)
CREATE TABLE IF NOT EXISTS communities (
  id SERIAL PRIMARY KEY,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_communities_course ON communities(course_id);

-- enrollments (students <-> courses)
CREATE TABLE IF NOT EXISTS enrollments (
  id SERIAL PRIMARY KEY,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  student_id INT REFERENCES users(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_enrollment ON enrollments(course_id, student_id);

-- messages (community or direct message)
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  community_id INT REFERENCES communities(id) ON DELETE SET NULL, -- NULL for DMs
  sender_id INT REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INT REFERENCES users(id) ON DELETE CASCADE,         -- NULL for community
  content TEXT NOT NULL,
  status VARCHAR(32) DEFAULT 'approved',
  is_read BOOLEAN DEFAULT FALSE,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_messages_community ON messages(community_id);
CREATE INDEX IF NOT EXISTS idx_messages_dm ON messages(sender_id, receiver_id);

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  sender_id INT REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(32) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  course_id INT REFERENCES courses(id) ON DELETE SET NULL,
  target_role VARCHAR(32),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- verification codes for login
CREATE TABLE IF NOT EXISTS login_verification_codes (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(16) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_login_codes_email ON login_verification_codes(email);

-- verification codes for password reset
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(16) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_reset_codes_email ON password_reset_codes(email);

-- registration requests (pending→approved/rejected)
CREATE TABLE IF NOT EXISTS registration_requests (
  id SERIAL PRIMARY KEY,
  reg_id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL,
  department VARCHAR(128) NOT NULL,
  semester INT,
  program_year INT,
  status VARCHAR(32) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_reg_requests_status ON registration_requests(status);
```

---

## Backend–Frontend Integration

### API Endpoints
Defined in `frontend/src/config/api.js`. Key groups:
- `AUTH`: login, verify login, register, forgot/reset password, current user
- `USERS`: list, by id, teachers
- `COURSES`: CRUD and enrollment
- `COMMUNITIES`: list, by id, members, messages, delete
- `NOTIFICATIONS`: list, read all, broadcast, mark read
- `DASHBOARD`: admin stats, recent users/courses, activity
- `DIRECT_MESSAGES`: conversations, messages, search, delete

### Handling CORS
- Backend CORS allows `FRONTEND_URL` in `backend/server.js`.
- Socket.IO configured with same origin allowance.

### Token Storage
- Current approach: `sessionStorage` (`userToken`, `user`), simple and easy.
- Tradeoffs:
  - Pros: straightforward, cleared on tab/session close.
  - Cons: exposed to JS; vulnerable to XSS if not mitigated.
- Alternative: HTTP‑only cookies for tokens; requires server changes and CSRF protection.

### Protected Routes
- `frontend/src/components/ProtectedRoute.jsx`: redirects based on `allowedRoles` and valid token/user.
- Example usage: wrap admin routes with `allowedRoles={["Admin"]}`.

---

## Shared / Core Concepts

### Version Control
- Git flows with feature branches and PRs.
- GitHub for remote collaboration and code reviews.

### Project Architecture
- Layered/MVC style: controllers handle HTTP, models encapsulate SQL, middleware cross‑cuts (auth), routes wire endpoints.
- Separation of concerns: UI components vs pages vs API wrapper vs hooks.
- Clean folder structure already present in both `backend/` and `frontend/`.

### Error Handling & Debugging
- Use `try/catch` inside controllers; return consistent JSON error shapes.
- Add centralized error middleware to normalize 4xx/5xx responses.
- Logging: `console` now; consider `pino`/`winston` for structured logs.

---

## Recommended Enhancements (Optional)
- Enable `express-rate-limit` for auth and messaging endpoints.
- Add `helmet` for HTTP header security.
- Add input validation (`Joi`/`Zod`) for all POST/PUT/PATCH endpoints.
- Consider moving to HTTP‑only cookies for JWT to mitigate XSS risks.
- Add E2E tests (Playwright/Cypress) and unit tests (Jest) for critical flows.
- Consider Redux Toolkit if global state grows complex.
- Add UI library (MUI/Tailwind) if you need faster component development.

---

## Try It End‑to‑End

1) Start PostgreSQL locally and apply the SQL schema above.
2) Set `.env` files in `backend/` and `frontend/`.
3) Run backend and frontend dev servers:

```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run dev
```

4) Open the app at `http://localhost:5173` and log in:
- Login is 2‑step (password → email verification code).
- Once verified, a JWT is issued; the frontend stores `user` and `userToken` in `sessionStorage`.
- Protected routes redirect users to role dashboards.

5) Test real‑time features:
- Communities: join rooms, send messages, see typing indicators.
- Direct Messages: send DM, toggle anonymous (students → teachers/HOD), see live updates.
- Notifications: broadcast to roles and receive in real‑time if online.

---

## References in Repo
- Backend: `backend/server.js`, `backend/config/database.js`, `backend/middleware/auth.js`, `backend/controllers/AuthController.js`
- Frontend: `frontend/src/App.jsx`, `frontend/src/components/ProtectedRoute.jsx`, `frontend/src/config/api.js`, `frontend/src/api/client.js`, `frontend/src/hooks/useSocket.js`, `frontend/src/services/socket.js`

This guide should serve as both a learning map and the authoritative technical overview for EduCom.
