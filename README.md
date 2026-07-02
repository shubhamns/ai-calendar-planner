# AI Calendar Planner

Full-stack calendar app with local event management, OpenAI planning assistant, and email reminders.

<img width="1362" height="678" alt="image" src="https://github.com/user-attachments/assets/fb87791e-6039-45c3-86ce-9f750c4c81f8" />


## Features

- **Authentication** — Register, login, JWT sessions (30 min)
- **Calendar** — FullCalendar grid with create, edit, delete, drag, and resize
- **AI planner** — OpenAI-powered schedule suggestions (5 prompts/day)
- **Email reminders** — Gmail SMTP, sent 5 minutes before event end
- **Mobile-friendly** — Responsive layout and touch-friendly controls

## Tech Stack

### Frontend
- React 19, Vite, TypeScript
- Tailwind CSS, ShadCN UI
- FullCalendar, TanStack Query, Zustand
- React Hook Form, Zod, Axios

### Backend
- Python 3.12+, FastAPI, Uvicorn
- SQLAlchemy 2.0, SQLite (dev) / PostgreSQL (prod)
- Pydantic v2, JWT (python-jose), bcrypt
- LangChain + OpenAI, SMTP email reminders

## Project Structure

```
ai-calendar-planner/
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── utils/
├── backend/
│   ├── app/
│   │   ├── api.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── email_service.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── reminders.py
│   │   ├── schemas.py
│   │   └── services.py
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
└── README.md
```

## Setup

### Prerequisites

- Node.js 20+
- Python 3.12+
- OpenAI API key
- Gmail app password (for email reminders)

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Runs at `http://localhost:5173`.

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # first time only — then edit .env with your keys
uvicorn app.main:app --reload
```

Runs at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

**Important:** Only run `cp .env.example .env` on first setup. After that, edit `.env` directly so you don't overwrite secrets.

## Environment Variables

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL (default: `http://localhost:8000/api/v1`) |
| `VITE_APP_NAME` | App display name |

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Database URL (default: `sqlite:///./app.db`) |
| `SECRET_KEY` | JWT secret (long random string) |
| `ALGORITHM` | JWT algorithm (default: `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry (default: `30`) |
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENAI_MODEL` | Model name (default: `gpt-4o`) |
| `PROMPT_LIMIT_PER_DAY` | Daily AI prompt limit (default: `5`) |
| `ALLOWED_ORIGINS` | CORS origins (default: `http://localhost:5173`) |
| `EMAIL` | Gmail address for sending reminders |
| `PASS` | Gmail app password |
| `SMTP_HOST` | SMTP host (default: `smtp.gmail.com`) |
| `SMTP_PORT` | SMTP port (default: `587`) |
| `REMINDER_MINUTES_BEFORE` | Minutes before event end to send email (default: `5`) |
| `DEFAULT_TIMEZONE` | Timezone for email formatting (default: `Asia/Kolkata`) |

## Development

Run both servers in separate terminals:

```bash
# Terminal 1 — Backend
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload

# Terminal 2 — Frontend
cd frontend && npm run dev
```

### Tests

```bash
cd backend && source .venv/bin/activate && pytest
```

### Build frontend

```bash
cd frontend && npm run build
```

## Email Reminders

- A background scheduler starts with the backend and checks every 30 seconds
- Reminders are sent **5 minutes before the event end time**
- Email goes to the **user's registered login email**
- Each event gets one reminder; editing start/end time resets it
- Backend must stay running for reminders to send

## API Overview

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/auth/register` | Register |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/auth/me` | Current user |
| GET | `/api/v1/calendar/stats` | Today / upcoming counts |
| GET | `/api/v1/calendar/events` | List events |
| POST | `/api/v1/calendar/events` | Create event |
| PUT | `/api/v1/calendar/events/{id}` | Update event |
| DELETE | `/api/v1/calendar/events/{id}` | Delete event |
| POST | `/api/v1/ai/plan` | AI planning prompt |

## Deployment

- **Frontend:** Deploy `frontend/dist` to Vercel, Netlify, or any static host
- **Backend:** Deploy to Railway, Render, Fly.io, or similar
- **Database:** Use PostgreSQL in production (`DATABASE_URL` with `psycopg2-binary`)

## License

MIT License — see LICENSE file for details.
