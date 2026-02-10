# Portfolio Site

Full-stack portfolio site with a Next.js frontend and FastAPI backend.

## Project Structure

```
├── frontend/   # Next.js app (deployed on Vercel)
├── backend/    # FastAPI server (deployed on Railway)
```

## Local Development

### Backend

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

Requires a `.env` file — copy `.env.example` and fill in values:

```bash
cp .env.example .env
```

### Frontend

```bash
cd frontend
npm run dev
```

Runs on [http://localhost:3000](http://localhost:3000). Expects the backend on port 8000.
