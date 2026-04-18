# Project

## Stack
- Frontend: React + Vite (`frontend/`)
- Backend: FastAPI (`backend/`) — read-only for API reference

## Frontend Commands
- `cd frontend && npm install` — install dependencies
- `cd frontend && npm run dev` — start dev server
- `cd frontend && npm run build` — production build
- `cd frontend && npm run lint` — lint check

## Structure
- `frontend/src/App.jsx` — root app component
- `frontend/src/main.jsx` — entry point
- `frontend/index.html` — HTML template
- `backend/app/main.py` — FastAPI routes (reference only)
- `backend/app/services/` — backend services (reference only)

## Ground Rules
- All edits must stay within `frontend/`
- Read `backend/` only to understand API contracts (endpoints, payloads, types)
- Do not modify any backend files