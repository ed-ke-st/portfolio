import os
from datetime import timedelta
from urllib.parse import urlencode

from dotenv import load_dotenv
load_dotenv()

import httpx
import cloudinary
import cloudinary.uploader
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from database import engine, get_db, Base
from db_models import User, Project, DesignWork, SiteSettings
from schemas import (
    Token, UserCreate, UserResponse,
    ProjectCreate, ProjectUpdate, ProjectResponse,
    DesignWorkCreate, DesignWorkUpdate, DesignWorkResponse,
    SettingUpdate, SettingResponse, AllSettingsResponse,
)
from auth import (
    get_password_hash, authenticate_user, create_access_token,
    get_current_admin, ACCESS_TOKEN_EXPIRE_MINUTES
)

# Create tables
Base.metadata.create_all(bind=engine)


def ensure_schema() -> None:
    inspector = inspect(engine)
    if "design_works" in inspector.get_table_names():
        columns = {col["name"] for col in inspector.get_columns("design_works")}
        if "primary_image" not in columns:
            with engine.begin() as conn:
                conn.execute(
                    text(
                        "ALTER TABLE design_works "
                        "ADD COLUMN primary_image INTEGER DEFAULT 0"
                    )
                )


ensure_schema()

# Cloudinary configuration
CLOUDINARY_URL = os.getenv("CLOUDINARY_URL")
if CLOUDINARY_URL:
    # CLOUDINARY_URL format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
    cloudinary.config(cloudinary_url=CLOUDINARY_URL)
    USE_CLOUDINARY = True
else:
    USE_CLOUDINARY = False

# Create uploads directory for local fallback
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="Portfolio API",
    description="Backend API for the developer portfolio",
    version="2.0.0"
)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# CORS configuration
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============== Health & Root ==============

@app.get("/")
async def root():
    return {"message": "Welcome to the Portfolio API v2"}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


# ============== Authentication ==============

@app.post("/api/auth/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if any user exists (only allow first user registration)
    existing_users = db.query(User).count()
    if existing_users > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration is closed. Admin user already exists."
        )

    db_user = User(
        username=user.username,
        hashed_password=get_password_hash(user.password),
        is_admin=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.post("/api/auth/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_admin)):
    return current_user


# ============== Projects (Public) ==============

@app.get("/api/projects", response_model=list[ProjectResponse])
async def get_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.order, Project.id.desc()).all()
    return projects


@app.get("/api/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


# ============== Projects (Admin) ==============

@app.post("/api/admin/projects", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    db_project = Project(**project.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@app.put("/api/admin/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = project.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_project, field, value)

    db.commit()
    db.refresh(db_project)
    return db_project


@app.delete("/api/admin/projects/{project_id}")
async def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(db_project)
    db.commit()
    return {"message": "Project deleted"}


# ============== Design Work (Public) ==============

@app.get("/api/designs", response_model=list[DesignWorkResponse])
async def get_designs(category: str | None = None, db: Session = Depends(get_db)):
    query = db.query(DesignWork)
    if category:
        query = query.filter(DesignWork.category == category)
    designs = query.order_by(DesignWork.order, DesignWork.id.desc()).all()
    return designs


@app.get("/api/designs/{design_id}", response_model=DesignWorkResponse)
async def get_design(design_id: int, db: Session = Depends(get_db)):
    design = db.query(DesignWork).filter(DesignWork.id == design_id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design work not found")
    return design


# ============== Design Work (Admin) ==============

@app.post("/api/admin/designs", response_model=DesignWorkResponse)
async def create_design(
    design: DesignWorkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    db_design = DesignWork(**design.model_dump())
    db.add(db_design)
    db.commit()
    db.refresh(db_design)
    return db_design


@app.put("/api/admin/designs/{design_id}", response_model=DesignWorkResponse)
async def update_design(
    design_id: int,
    design: DesignWorkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    db_design = db.query(DesignWork).filter(DesignWork.id == design_id).first()
    if not db_design:
        raise HTTPException(status_code=404, detail="Design work not found")

    update_data = design.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_design, field, value)

    db.commit()
    db.refresh(db_design)
    return db_design


@app.delete("/api/admin/designs/{design_id}")
async def delete_design(
    design_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    db_design = db.query(DesignWork).filter(DesignWork.id == design_id).first()
    if not db_design:
        raise HTTPException(status_code=404, detail="Design work not found")

    db.delete(db_design)
    db.commit()
    return {"message": "Design work deleted"}


# ============== File Upload ==============

@app.post("/api/admin/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin)
):
    content = await file.read()

    if USE_CLOUDINARY:
        # Upload to Cloudinary
        try:
            result = cloudinary.uploader.upload(
                content,
                folder="portfolio",
                resource_type="auto"
            )
            return {
                "filename": result["public_id"],
                "url": result["secure_url"]
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    else:
        # Local fallback for development
        import uuid
        ext = file.filename.split(".")[-1] if "." in file.filename else ""
        filename = f"{uuid.uuid4()}.{ext}" if ext else str(uuid.uuid4())
        filepath = os.path.join(UPLOAD_DIR, filename)

        with open(filepath, "wb") as f:
            f.write(content)

        return {"filename": filename, "url": f"/uploads/{filename}"}


# ============== PDF Processing ==============

@app.post("/api/admin/pdf/preview")
async def preview_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin)
):
    """Upload PDF and get page count + thumbnail previews"""
    import fitz  # PyMuPDF
    import base64
    from io import BytesIO

    content = await file.read()

    try:
        doc = fitz.open(stream=content, filetype="pdf")
        pages = []

        for page_num in range(len(doc)):
            page = doc[page_num]
            # Create a low-res preview (150 DPI)
            pix = page.get_pixmap(matrix=fitz.Matrix(150/72, 150/72))
            img_bytes = pix.tobytes("png")
            b64 = base64.b64encode(img_bytes).decode("utf-8")
            pages.append({
                "page": page_num,
                "preview": f"data:image/png;base64,{b64}",
                "width": pix.width,
                "height": pix.height
            })

        doc.close()

        return {"page_count": len(pages), "pages": pages}

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process PDF: {str(e)}")


@app.post("/api/admin/pdf/extract")
async def extract_pdf_pages(
    file: UploadFile = File(...),
    pages: str = Form(""),  # Comma-separated page numbers (0-indexed)
    current_user: User = Depends(get_current_admin)
):
    """Extract selected pages from PDF as high-quality images"""
    import fitz  # PyMuPDF
    import uuid

    content = await file.read()
    page_numbers = [int(p.strip()) for p in pages.split(",") if p.strip().isdigit()]

    if not page_numbers:
        raise HTTPException(status_code=400, detail="No pages specified")

    try:
        doc = fitz.open(stream=content, filetype="pdf")
        extracted_images = []

        for page_num in page_numbers:
            if page_num < 0 or page_num >= len(doc):
                continue

            page = doc[page_num]
            # High quality export (300 DPI)
            pix = page.get_pixmap(matrix=fitz.Matrix(300/72, 300/72))
            img_bytes = pix.tobytes("png")

            if USE_CLOUDINARY:
                # Upload to Cloudinary
                result = cloudinary.uploader.upload(
                    img_bytes,
                    folder="portfolio",
                    resource_type="image"
                )
                extracted_images.append({
                    "page": page_num,
                    "url": result["secure_url"]
                })
            else:
                # Save locally
                filename = f"{uuid.uuid4()}.png"
                filepath = os.path.join(UPLOAD_DIR, filename)
                with open(filepath, "wb") as f:
                    f.write(img_bytes)
                extracted_images.append({
                    "page": page_num,
                    "url": f"/uploads/{filename}"
                })

        doc.close()

        return {"images": extracted_images}

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract pages: {str(e)}")


# ============== Project Screenshot ==============

SCREENSHOTONE_ACCESS_KEY = os.getenv("SCREENSHOTONE_ACCESS_KEY")

@app.post("/api/admin/projects/screenshot")
async def capture_project_screenshot(
    url: str = Form(...),
    current_user: User = Depends(get_current_admin)
):
    """Capture a screenshot of a live URL using ScreenshotOne API."""
    url = url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    if not url.startswith(("http://", "https://")):
        url = f"https://{url}"

    if not SCREENSHOTONE_ACCESS_KEY:
        raise HTTPException(
            status_code=500,
            detail="Screenshot service not configured. Set SCREENSHOTONE_ACCESS_KEY in environment."
        )

    try:
        params = {
            "access_key": SCREENSHOTONE_ACCESS_KEY,
            "url": url,
            "viewport_width": 1280,
            "viewport_height": 720,
            "full_page": "true",
            "format": "png",
            "block_ads": "true",
            "block_cookie_banners": "true",
            "delay": 2,
        }
        api_url = f"https://api.screenshotone.com/take?{urlencode(params)}"

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(api_url)

            if response.status_code != 200:
                raise HTTPException(
                    status_code=400,
                    detail=f"Screenshot API error: {response.text}"
                )

            return Response(content=response.content, media_type="image/png")
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="Screenshot request timed out")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to capture screenshot: {str(e)}")


# ============== Site Settings (Public) ==============

@app.get("/api/settings", response_model=AllSettingsResponse)
async def get_all_settings(db: Session = Depends(get_db)):
    settings = db.query(SiteSettings).all()
    result = {}
    for setting in settings:
        result[setting.key] = setting.value
    return result


@app.get("/api/settings/{key}")
async def get_setting(key: str, db: Session = Depends(get_db)):
    setting = db.query(SiteSettings).filter(SiteSettings.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return {"key": setting.key, "value": setting.value}


# ============== Site Settings (Admin) ==============

@app.put("/api/admin/settings/{key}", response_model=SettingResponse)
async def update_setting(
    key: str,
    data: SettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    setting = db.query(SiteSettings).filter(SiteSettings.key == key).first()

    if setting:
        setting.value = data.value
    else:
        setting = SiteSettings(key=key, value=data.value)
        db.add(setting)

    db.commit()
    db.refresh(setting)
    return setting


@app.delete("/api/admin/settings/{key}")
async def delete_setting(
    key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    setting = db.query(SiteSettings).filter(SiteSettings.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")

    db.delete(setting)
    db.commit()
    return {"message": "Setting deleted"}
