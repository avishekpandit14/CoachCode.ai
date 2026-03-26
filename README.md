# CoachCode.ai

Placement preparation and coding practice platform — MERN stack with MySQL (Sequelize) and JWT role-based auth.

## Quick start

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET
npm install
npm run dev 
```

Server runs at `http://localhost:5000`. API base: `http://localhost:5000/api`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`. Vite proxies `/api` and `/uploads` to the backend.

### Database

Create a MySQL database (e.g. `coachcode_db`) and set `DB_NAME`, `DB_USER`, `DB_PASSWORD` in `backend/.env`. Tables are created automatically on first run (Sequelize sync).

## Project structure

- **backend/** — Express API, Sequelize models, JWT auth, role middleware, uploads.
- **frontend/** — React (Vite), AuthContext, protected and role-based routes, dashboard and section pages.
- **ARCHITECTURE.md** — System design, database schema, API routes, middleware, and development roadmap.

## Roles 

- **Student** — Materials (read), Practice, Mock tests, Roadmap, Bookmarks, Notes, Announcements, Contests.
- **Faculty** — Same as student + upload materials, add questions, create tests, post announcements, create contests.
- **Admin** — Same as faculty + manage users (CRUD, roles).

## Next steps

1. Add **Judge0** (or similar) for code execution in Practice.
2. Add **rich text editor** and **auto-save** for Smart Notes.
3. Add **dark/light theme** toggle (CSS variables already in place).
4. Add **analytics** endpoints and dashboard charts.
5. Restrict registration role to `student` in production; create faculty/admin via admin panel.

See **ARCHITECTURE.md** for full API list, schema, and deployment notes.
