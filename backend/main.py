import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models import Project
from data import projects

app = FastAPI(
    title="Portfolio API",
    description="Backend API for the developer portfolio",
    version="1.0.0"
)

# CORS configuration
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Welcome to the Portfolio API"}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/api/projects", response_model=list[Project])
async def get_projects():
    return projects


@app.get("/api/projects/{project_id}", response_model=Project)
async def get_project(project_id: int):
    for project in projects:
        if project.id == project_id:
            return project
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Project not found")
