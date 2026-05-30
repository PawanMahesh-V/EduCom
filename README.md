# EduCom

EduCom is a full‑stack education communication platform providing real‑time chat, course communities, notifications, role‑based access, and an AI moderation microservice to keep conversations safer.

## Tech stack

- Frontend: React, Vite, React Query, Socket.IO Client
- Backend: Node.js, Express, Socket.IO, PostgreSQL
- ML moderation: Python, scikit‑learn, FastAPI

## Repo layout

```text
EduCom/
├─ backend/        # Express API + Socket.IO server
├─ frontend/       # React web app
├─ ml-service/     # Training pipeline + FastAPI moderation API
├─ DB.sql          # Database schema / setup SQL
```

## Quick start (development)

1) Ensure prerequisites are installed:

- Node.js 18+, npm 9+
- Python 3.10+
- PostgreSQL 14+

2) Database

- Create a PostgreSQL database and run `DB.sql` to create schema.
- Update backend environment variables to point to the DB (see `backend/.env.example` below).

3) ML moderation service (recommended before backend)

```bash
cd ml-service
python -m pip install -r requirements.txt
# prepare dataset at ml-service/dataset/toxic_comments.csv
python training/train_model.py
python main.py
```

Notes:
- The training script saves a timestamped pipeline under `ml-service/models/` (e.g. `moderation_model_20260429_201457.pkl`) and writes the chosen filename into `ml-service/models/latest_model.txt` which the API reads on startup.
- Check health: `curl http://127.0.0.1:8001/health`

4) Backend

```bash
cd backend
npm install
# create backend/.env from backend/.env.example
npm run dev
```

Important backend env vars (example):

```
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
# create frontend/.env from frontend/.env.example
npm run dev
```

Frontend env example:

```
VITE_API_URL=http://localhost:5000/api
```

## Moderation flow (summary)

1. Client sends message to backend.
2. Backend forwards text to ML moderation API (`/moderate`).
3. ML API returns `{ toxic: bool, confidence: float }` (the service loads the model referenced by `ml-service/models/latest_model.txt`).
4. Backend either saves/delivers the message or emits a blocked status.

## Useful commands

- Backend: `npm run dev`, `npm start`
- Frontend: `npm run dev`, `npm run build`, `npm run preview`
- ML: `python training/train_model.py`, `python main.py`

## Notes and troubleshooting

- If the moderation API is down and `ML_MODERATION_FAIL_OPEN=true`, the backend will allow messages through. Set it to `false` to reject while ML is unavailable.
- The ML training script validates that the dataset contains `comment_text` and `toxic` columns.
- Model artifacts are stored in `ml-service/models/` and the API uses the filename found in `latest_model.txt`.

## Next steps / roadmap

- Persist moderation events to DB for audit and cross‑device visibility
- Admin moderation dashboard and bulk tools
- Improve multilingual moderation and reduce false positives
- Add automated tests for socket + moderation integration

If you'd like, I can:
- Add `backend/.env.example` and `frontend/.env.example` files
- Create a single `start_project.py` launcher (if wanted)


