Project Plan: Full-Stack Developer Portfolio
🛠 Tech Stack
Frontend: Next.js (App Router), TypeScript, Tailwind CSS
Backend: FastAPI (Python) OR .NET 8 (C#)
Deployment: Vercel (Frontend), Render/Railway (Backend)
Domain: Hostinger (DNS pointing to Vercel)
✅ Phase 1: Project Initialization (DONE)
Root Setup: Create a monorepo structure with /frontend and /backend folders.
Frontend Initialization: Run npx create-next-app@latest frontend --typescript --tailwind --eslint.
Backend Initialization:
If FastAPI: Create /backend, setup venv, and install fastapi[all].
If .NET: Run dotnet new webapi -n Backend.
Git Setup: Initialize git at the root and create a .gitignore handling both Node.js and Python/C# artifacts.
✅ Phase 2: Backend API Development (DONE)
Core Models: Define a Project schema (Title, Description, TechStack, ImageURL, GithubLink).
API Endpoints:
GET /api/projects: Return a list of portfolio items.
GET /api/health: Simple health check for deployment monitoring.
CORS Configuration: Enable Cross-Origin Resource Sharing to allow the Vercel frontend domain to access the API.
Mock Data: Populate a JSON file or in-memory list with 3-5 sample projects.
✅ Phase 3: Frontend Development (DONE)
Global Layout: Setup a responsive Navigation Bar and Footer.
Type Definitions: Create frontend/types/project.ts to match the Backend schema.
Data Fetching: Implement a service/utility to fetch data from the Backend API using fetch or Axios.
UI Components:
Hero.tsx: Introduction with a call-to-action.
ProjectCard.tsx: Individual project display with hover effects.
TechStack.tsx: Icon grid of your skills.
Responsive Design: Ensure mobile-first styling using Tailwind CSS breakpoints.
✅ Phase 4: Deployment & Integration (DONE)
Environment Variables: Setup .env.local for local dev and Vercel Environment Variables for production.
Production Build: Run npm run build locally to catch any TypeScript or Linting errors.
DNS Configuration:
Point Hostinger Domain to Vercel using CNAME/A records.
CI/CD: Connect the GitHub repository to Vercel and Render for automatic deployments on git push.