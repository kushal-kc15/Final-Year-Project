# Vyapar Margadarshan — frontend v2

Frontend for the Vyapar Margadarshan expense workspace.
The whole UI is one React + Vite + Tailwind app, talking to the existing
Django backend at `http://localhost:8000` through a Vite dev proxy.

## Run it

You need both servers running.

### 1. Backend (Django + DRF)

```bash
cd ../backend
cp .env.example .env          # one-time
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver    # http://localhost:8000
```

The backend's CORS settings already allow `http://localhost:5174`,
which is the port this Vite app runs on.

### 2. Frontend (this folder)

```bash
npm install
npm run dev                   # http://localhost:5174
```

Open <http://localhost:5174>. API calls are proxied to the Django
backend automatically — there is no need to set an absolute URL.

## Env

`.env` is committed with safe local-dev values. Override with
`.env.local` if you need different ports. The variables Vite reads:

| Var                   | Default       | Purpose                                |
| --------------------- | ------------- | -------------------------------------- |
| `VITE_API_BASE_URL`   | `/api`        | Path the axios client uses.            |
| `VITE_APP_NAME`       | "Vyapar Margadarshan" | Shown in the masthead / page titles. |
| `VITE_GOOGLE_CLIENT_ID` | (from .env)  | Google Sign-In on Login / Register.    |

## Build

```bash
npm run build                # production bundle in dist/
npm run preview              # preview the production bundle locally
```

## Layout

```
src/
  components/    shared UI (Button, Field, Panel, Money, Charts, …)
  context/       AuthContext, ToastProvider
  lib/           api, currency, date, utils
  pages/         one file per route
  App.jsx        router
  main.jsx       root
```

## Talking to a different backend

If you want to hit a backend on another host without the dev proxy,
set `VITE_API_BASE_URL` to the full origin, e.g.:

```
VITE_API_BASE_URL=https://staging.example.com/api
```

…and add that origin to `CORS_ALLOWED_ORIGINS` in `backend/.env`.
