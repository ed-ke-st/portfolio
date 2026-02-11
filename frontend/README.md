# Frontend

Next.js app bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Setup

```bash
cd frontend
npm install
```

## Running

```bash
npm run dev
```

Runs on [http://localhost:3000](http://localhost:3000). Expects the backend on port 8000.

## Optional Vercel integrations

For global platform config + platform image uploads:

- `EDGE_CONFIG`: Edge Config connection string (used for landing-page reads).
- `EDGE_CONFIG_ID`: Edge Config ID (used for write sync calls).
- `VERCEL_API_TOKEN`: Vercel API token with access to update Edge Config items.
- `VERCEL_TEAM_ID`: optional, required when your project belongs to a team.
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob token for server-side uploads.
