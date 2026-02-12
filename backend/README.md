# Backend

FastAPI server handling authentication, projects, design work, and site settings.

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill in values
```

## Running

```bash
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

## Environment Variables

See `.env.example` for all required variables:

- `ALLOWED_ORIGINS` — CORS origins (default: `http://localhost:3000`)
- `CLOUDINARY_URL` — image hosting
- `SCREENSHOTONE_ACCESS_KEY` — project screenshot capture (optional if using per-user integrations)
- `ALLOW_ENV_INTEGRATIONS` — allow env vars as a fallback for integrations (default: false)
- `ALLOW_LOCAL_UPLOADS` — allow local filesystem uploads when Cloudinary isn’t set (default: false)
- `DOMAIN_CHECK_A` / `DOMAIN_CHECK_CNAME` / `DOMAIN_CHECK_NS` — optional DNS verification targets for custom domains
- `REQUIRE_INVITE` — require an invite token to sign up (default: false)

## Invite-only signup

If `REQUIRE_INVITE=true`, users must provide an invite token on signup.
Create a token with:

```bash
curl -X POST "$API_URL/api/admin/invites" \
  -H "Authorization: Bearer $TOKEN"
```
- `DATABASE_URL` — Postgres connection string (uses SQLite locally if unset)
- `SECRET_KEY` — JWT signing key
