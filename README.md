# EduCom

EduCom is a full-stack education communication platform with real-time chat, course communities, notifications, role-based access, and AI-powered toxic content moderation.

It is designed to help institutes manage classroom communication in one place with safer messaging.

## Tech Stack

- Frontend: React, Vite, React Query, Socket.IO Client
- Backend: Node.js, Express, Socket.IO, PostgreSQL
- ML Service: Python, scikit-learn, FastAPI
- Database: PostgreSQL

## Repository Structure

```text
EduCom/
|-- backend/        # Express API + Socket.IO server
|-- frontend/       # React web app
|-- ml-service/     # Training pipeline + FastAPI moderation API
|-- DB.sql          # Database schema / setup SQL
```

## Core Features

- JWT-based authentication and role-based access
- Course and community management
- Real-time community chat and direct messaging
- Notifications and delivery/read state handling
- Toxic message moderation using a Python ML microservice
- Blocked message UX in chat with status indicator

## Moderation Flow

1. User sends a message from frontend.
2. Backend forwards text to ML moderation API.
3. ML service predicts toxic or safe.
4. If safe, backend saves and delivers message.
5. If toxic, backend blocks delivery and emits a blocked status event.
6. Frontend shows the sender message as blocked (not delivered).

## Prerequisites

- Node.js 18+
- npm 9+
- Python 3.10+
- PostgreSQL 14+

## 1) Database Setup

1. Create a PostgreSQL database.
2. Run schema setup from `DB.sql`.
3. Ensure user credentials match backend `.env`.

## 2) Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env` (example):

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=final
DB_PASSWORD=your_password
DB_PORT=5432

PORT=5000
HOST=0.0.0.0
JWT_SECRET=your_jwt_secret

FRONTEND_URL=http://localhost:5173

EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

ML_MODERATION_API_URL=http://127.0.0.1:8001
ML_MODERATION_TIMEOUT_MS=3000
ML_MODERATION_FAIL_OPEN=true
```

Run backend:

```bash
npm run dev
```

## 3) Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env` (example):

```env
VITE_API_URL=http://localhost:5000/api
```

Run frontend:

```bash
npm run dev
```

## 4) ML Service Setup

```bash
cd ml-service
python -m pip install -r requirements.txt
```

### Prepare Dataset

The training CSV must be at:

- `ml-service/dataset/toxic_comments.csv`

Expected columns:

- `comment_text`
- `toxic` (0 or 1)

### Train Model

```bash
python training/train_model.py
```

This generates:

- `ml-service/models/moderation_model.pkl`
- `ml-service/models/vectorizer.pkl`

### Start Moderation API

```bash
python main.py
```

Health check:

```bash
curl http://127.0.0.1:8001/health
```

## Startup Order

1. Start PostgreSQL
2. Start ML service (`ml-service`)
3. Start backend (`backend`)
4. Start frontend (`frontend`)

## Useful Commands

Backend:

```bash
npm run dev
npm start
```

Frontend:

```bash
npm run dev
npm run build
npm run preview
```

ML Service:

```bash
python training/train_model.py
python main.py
```

## Notes

- If moderation service is unavailable and `ML_MODERATION_FAIL_OPEN=true`, backend allows messages.
- To enforce strict blocking when ML is down, set `ML_MODERATION_FAIL_OPEN=false`.
- Blocked-message chat bubbles currently persist per user in browser local storage.

## Future Improvements

- Persist blocked moderation attempts in database for cross-device history
- Add admin moderation dashboard and analytics
- Add multilingual moderation model tuning
- Add automated tests for socket moderation events

