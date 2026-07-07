# EduCom

EduCom is an enterprise-grade, full‑stack education communication platform providing real‑time chat, course communities, a campus marketplace, role‑based access, and an AI moderation microservice to keep conversations safer.

## Live Demo & Test Credentials

**Live App:** [https://edu-com-six.vercel.app/](https://edu-com-six.vercel.app/)

Feel free to test the live application using the following test accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@szabist.pk` | `password` |
| **Teacher** | `teacher@szabist.pk` | `password` |
| **Student** | `Student@szabist.pk` | `password` |

## Architecture & Tech Stack

EduCom strictly adheres to modern **PERN Stack** (PostgreSQL, Express, React, Node.js) development principles, ensuring a decoupled, scalable, and highly maintainable architecture.

- **Frontend:** React, Vite, Custom Hooks, Component-based UI, Socket.IO Client.
- **Backend:** Node.js, Express (MVC Pattern), Socket.IO, PostgreSQL.
- **ML Moderation:** Python, scikit‑learn, FastAPI.

### Core Architectural Features:
- **Separation of Concerns:** The React frontend handles presentation and local state via custom hooks (e.g., `useCart`, `useChatSocket`), completely decoupled from the Node.js API.
- **MVC Backend:** The backend is logically separated into Routes, Controllers, Models, and Services (e.g., `MessageService.js`, `PayFastService.js`).
- **Real-Time WebSockets:** Socket.IO handles live chat and moderation events cleanly, acting strictly as a transport layer decoupled from core database logic.
- **Security:** Secure JWT authentication, stateless sessions, and strictly `.env`-driven credential management.

## Repo Layout

```text
EduCom/
├─ backend/
│  ├─ controllers/ # HTTP Request Handlers
│  ├─ models/      # PostgreSQL DB Queries
│  ├─ routes/      # Express API Routes
│  ├─ services/    # Business Logic & External Integrations
│  └─ sockets/     # Real-time WebSocket Handlers
├─ frontend/       
│  ├─ src/
│  │  ├─ components/ # Modular UI components
│  │  ├─ hooks/      # State & side-effect management
│  │  └─ pages/      # Route entrypoints
├─ ml-service/     # Training pipeline + FastAPI moderation API
├─ DB.sql          # Database schema / setup SQL
```

## Quick Start (Development)

1) Ensure prerequisites are installed:

- Node.js 18+, npm 9+
- Python 3.10+
- PostgreSQL 14+

2) Database

- Create a PostgreSQL database and run `DB.sql` to create schema.
- Update backend environment variables to point to the DB.

3) ML Moderation Service (recommended before backend)

```bash
cd ml-service
python -m pip install -r requirements.txt
# prepare dataset at ml-service/dataset/toxic_comments.csv
python training/train_model.py
python main.py
```

Notes:
- The training script saves a timestamped pipeline under `ml-service/models/` and writes the chosen filename into `ml-service/models/latest_model.txt` which the API reads on startup.
- Check health: `curl http://127.0.0.1:8001/health`

4) Backend

```bash
cd backend
npm install
# ensure your backend/.env is populated
npm run dev
```

Important backend env vars (example):

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=educom
DB_PASSWORD=your_password
DB_PORT=5432

PORT=5000
JWT_SECRET=your_jwt_secret

ML_MODERATION_API_URL=http://127.0.0.1:8001
ML_MODERATION_TIMEOUT_MS=3000
ML_MODERATION_FAIL_OPEN=true
```

5) Frontend

```bash
cd frontend
npm install
# ensure your frontend/.env is populated
npm run dev
```

Frontend env example:

```env
VITE_API_URL=http://localhost:5000/api
```

## Moderation Flow

1. Client sends message to backend.
2. Backend forwards text to ML moderation API (`/moderate`).
3. ML API returns `{ toxic: bool, confidence: float }`.
4. Backend either saves/delivers the message or emits a blocked status to the socket layer.

## Useful Commands

- Backend: `npm run dev`, `npm start`
- Frontend: `npm run dev`, `npm run build`, `npm run preview`
- ML: `python training/train_model.py`, `python main.py`
