import os
from datetime import timedelta, datetime, timezone
import shutil
import tempfile
from urllib.parse import urlencode, urlparse

from dotenv import load_dotenv
load_dotenv()

import httpx
import dns.resolver
import cloudinary
import cloudinary.uploader
import cloudinary.api
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from database import engine, get_db, Base, DATABASE_URL
from db_models import User, Project, DesignWork, SiteSettings, Invite
from schemas import (
    Token, UserCreate, UserResponse,
    ProjectCreate, ProjectUpdate, ProjectResponse,
    DesignWorkCreate, DesignWorkUpdate, DesignWorkResponse,
    SettingUpdate, SettingResponse, AllSettingsResponse,
)
from auth import (
    get_password_hash, authenticate_user, create_access_token,
    get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
)
from tenant import get_user_by_username_or_404, get_user_by_domain

# Reserved usernames that cannot be registered
RESERVED_USERNAMES = {
    "signup", "login", "admin", "api", "settings", "about", "help",
    "support", "static", "uploads", "_next", "favicon.ico", "robots.txt",
}

# Create tables
Base.metadata.create_all(bind=engine)


def ensure_schema() -> None:
    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    # Migration: add primary_image to design_works
    if "design_works" in table_names:
        columns = {col["name"] for col in inspector.get_columns("design_works")}
        if "primary_image" not in columns:
            with engine.begin() as conn:
                conn.execute(
                    text(
                        "ALTER TABLE design_works "
                        "ADD COLUMN primary_image INTEGER DEFAULT 0"
                    )
                )

    # Migration: add multi-tenant columns
    if "projects" in table_names:
        columns = {col["name"] for col in inspector.get_columns("projects")}
        if "user_id" not in columns:
            _migrate_to_multi_tenant()

    if "users" in table_names:
        columns = {col["name"] for col in inspector.get_columns("users")}
        if "custom_domain" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN custom_domain VARCHAR(255)"))
                conn.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR(255)"))


def _migrate_to_multi_tenant() -> None:
    """Add user_id columns and assign existing data to the first user."""
    is_postgres = DATABASE_URL and "postgresql" in DATABASE_URL

    if is_postgres:
        with engine.begin() as conn:
            # Get first user id
            result = conn.execute(text("SELECT id FROM users ORDER BY id LIMIT 1"))
            row = result.fetchone()
            if not row:
                # No users yet — just add nullable columns; they'll be set on first use
                conn.execute(text("ALTER TABLE projects ADD COLUMN user_id INTEGER REFERENCES users(id)"))
                conn.execute(text("ALTER TABLE design_works ADD COLUMN user_id INTEGER REFERENCES users(id)"))
                conn.execute(text("ALTER TABLE site_settings ADD COLUMN user_id INTEGER REFERENCES users(id)"))
                # Drop old unique constraint on site_settings.key
                conn.execute(text("ALTER TABLE site_settings DROP CONSTRAINT IF EXISTS site_settings_key_key"))
                return

            first_user_id = row[0]

            # Add columns as nullable first
            conn.execute(text("ALTER TABLE projects ADD COLUMN user_id INTEGER REFERENCES users(id)"))
            conn.execute(text("ALTER TABLE design_works ADD COLUMN user_id INTEGER REFERENCES users(id)"))
            conn.execute(text("ALTER TABLE site_settings ADD COLUMN user_id INTEGER REFERENCES users(id)"))

            # Assign all existing rows to the first user
            conn.execute(text(f"UPDATE projects SET user_id = {first_user_id}"))
            conn.execute(text(f"UPDATE design_works SET user_id = {first_user_id}"))
            conn.execute(text(f"UPDATE site_settings SET user_id = {first_user_id}"))

            # Set NOT NULL
            conn.execute(text("ALTER TABLE projects ALTER COLUMN user_id SET NOT NULL"))
            conn.execute(text("ALTER TABLE design_works ALTER COLUMN user_id SET NOT NULL"))
            conn.execute(text("ALTER TABLE site_settings ALTER COLUMN user_id SET NOT NULL"))

            # Drop old unique constraint on site_settings.key, add composite
            conn.execute(text("ALTER TABLE site_settings DROP CONSTRAINT IF EXISTS site_settings_key_key"))
            conn.execute(text(
                "ALTER TABLE site_settings ADD CONSTRAINT uq_user_setting UNIQUE (user_id, key)"
            ))
    else:
        # SQLite: recreate tables with new schema
        # For dev: just drop and recreate (data will be lost, which is fine locally)
        with engine.begin() as conn:
            # Get first user
            result = conn.execute(text("SELECT id FROM users ORDER BY id LIMIT 1"))
            row = result.fetchone()
            first_user_id = row[0] if row else None

            if first_user_id:
                # Add columns (SQLite supports ADD COLUMN)
                conn.execute(text("ALTER TABLE projects ADD COLUMN user_id INTEGER REFERENCES users(id)"))
                conn.execute(text("ALTER TABLE design_works ADD COLUMN user_id INTEGER REFERENCES users(id)"))
                conn.execute(text("ALTER TABLE site_settings ADD COLUMN user_id INTEGER REFERENCES users(id)"))

                conn.execute(text(f"UPDATE projects SET user_id = {first_user_id}"))
                conn.execute(text(f"UPDATE design_works SET user_id = {first_user_id}"))
                conn.execute(text(f"UPDATE site_settings SET user_id = {first_user_id}"))
            else:
                conn.execute(text("ALTER TABLE projects ADD COLUMN user_id INTEGER REFERENCES users(id)"))
                conn.execute(text("ALTER TABLE design_works ADD COLUMN user_id INTEGER REFERENCES users(id)"))
                conn.execute(text("ALTER TABLE site_settings ADD COLUMN user_id INTEGER REFERENCES users(id)"))


ensure_schema()

# Cloudinary configuration
DEFAULT_CLOUDINARY_URL = os.getenv("CLOUDINARY_URL")
DEFAULT_SCREENSHOTONE_ACCESS_KEY = os.getenv("SCREENSHOTONE_ACCESS_KEY")
ALLOW_ENV_INTEGRATIONS = os.getenv("ALLOW_ENV_INTEGRATIONS", "false").lower() == "true"
ALLOW_LOCAL_UPLOADS = os.getenv("ALLOW_LOCAL_UPLOADS", "false").lower() == "true"

# Create uploads directory for local fallback
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

PDF_PREVIEW_DPI = int(os.getenv("PDF_PREVIEW_DPI", "120"))
PDF_PREVIEW_MAX_PAGES = int(os.getenv("PDF_PREVIEW_MAX_PAGES", "40"))
PDF_EXTRACT_DPI = int(os.getenv("PDF_EXTRACT_DPI", "220"))
PDF_EXTRACT_MAX_PAGES = int(os.getenv("PDF_EXTRACT_MAX_PAGES", "20"))
PDF_EXTRACT_MAX_DIM = int(os.getenv("PDF_EXTRACT_MAX_DIM", "2400"))
PDF_EXTRACT_FORMAT = os.getenv("PDF_EXTRACT_FORMAT", "jpeg").lower()
PDF_EXTRACT_QUALITY = int(os.getenv("PDF_EXTRACT_QUALITY", "80"))
REQUIRE_INVITE = os.getenv("REQUIRE_INVITE", "false").lower() == "true"

app = FastAPI(
    title="Portfolio API",
    description="Backend API for the multi-tenant portfolio platform",
    version="3.0.0"
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


def _get_integration_settings(db: Session, user: User) -> dict:
    setting = (
        db.query(SiteSettings)
        .filter(SiteSettings.user_id == user.id, SiteSettings.key == "integrations")
        .first()
    )
    if setting and isinstance(setting.value, dict):
        return setting.value
    return {}


def _get_cloudinary_url(db: Session, user: User) -> str | None:
    integrations = _get_integration_settings(db, user)
    cloudinary_url = (integrations.get("cloudinary_url") or "").strip()
    if cloudinary_url:
        return cloudinary_url
    if ALLOW_ENV_INTEGRATIONS:
        return DEFAULT_CLOUDINARY_URL
    return None


def _get_screenshotone_key(db: Session, user: User) -> str | None:
    integrations = _get_integration_settings(db, user)
    access_key = (integrations.get("screenshotone_access_key") or "").strip()
    if access_key:
        return access_key
    if ALLOW_ENV_INTEGRATIONS:
        return DEFAULT_SCREENSHOTONE_ACCESS_KEY
    return None


def _configure_cloudinary(cloudinary_url: str) -> None:
    parsed = urlparse(cloudinary_url)
    if parsed.scheme != "cloudinary":
        raise ValueError("Cloudinary URL must start with cloudinary://")
    cloud_name = parsed.hostname
    api_key = parsed.username
    api_secret = parsed.password
    if not cloud_name or not api_key or not api_secret:
        raise ValueError("Cloudinary URL is missing cloud_name or credentials.")
    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True
    )


@app.post("/api/admin/integrations/cloudinary/test")
async def test_cloudinary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cloudinary_url = _get_cloudinary_url(db, current_user)
    if not cloudinary_url:
        raise HTTPException(status_code=400, detail="Cloudinary URL is not configured.")
    try:
        _configure_cloudinary(cloudinary_url)
        cloudinary.api.ping()
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cloudinary test failed: {str(e)}")


def _seed_default_settings(db: Session, user_id: int) -> None:
    """Seed default settings for a new user."""
    defaults = {
        "hero": {
            "title": "Hello, I'm",
            "highlight": "Your Name",
            "subtitle": "A passionate developer creating amazing experiences",
            "cta_primary": "View Dev Projects",
            "cta_secondary": "Contact Me",
        },
        "contact": {
            "heading": "Get in Touch",
            "subheading": "Feel free to reach out for collaborations or just a friendly hello",
            "email": "",
            "github": "",
            "linkedin": "",
            "twitter": "",
            "instagram": "",
            "phone": "",
        },
        "footer": {
            "copyright": "Portfolio. All rights reserved.",
        },
        "appearance": {
            "accent": "#2563eb",
            "background": "#ffffff",
            "text": "#111827",
            "muted": "#6b7280",
            "card": "#f4f4f5",
            "border": "#e4e4e7",
            "dark_mode": False,
        },
    }
    for key, value in defaults.items():
        setting = SiteSettings(key=key, value=value, user_id=user_id)
        db.add(setting)
    db.commit()


# ============== Health & Root ==============

@app.get("/")
async def root():
    return {"message": "Welcome to the Portfolio API v3"}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


# ============== Authentication ==============

@app.post("/api/auth/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    if REQUIRE_INVITE:
        token = (user.invite_token or "").strip()
        if not token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invite token is required."
            )
        invite = db.query(Invite).filter(Invite.token == token).first()
        if not invite:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid invite token."
            )
        if invite.used_at is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invite token has already been used."
            )
        if invite.expires_at and invite.expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invite token has expired."
            )

    # Validate username
    username_lower = user.username.lower().strip()
    if username_lower in RESERVED_USERNAMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{user.username}' is reserved."
        )
    if len(username_lower) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be at least 3 characters."
        )
    if not username_lower.replace("-", "").replace("_", "").isalnum():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username can only contain letters, numbers, hyphens, and underscores."
        )

    # Check for duplicate username
    existing = db.query(User).filter(User.username == username_lower).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken."
        )

    db_user = User(
        username=username_lower,
        hashed_password=get_password_hash(user.password),
        is_admin=True,
        email=user.email,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    if REQUIRE_INVITE:
        invite.used_by_user_id = db_user.id
        invite.used_at = datetime.now(timezone.utc)
        db.commit()

    # Seed default settings
    _seed_default_settings(db, db_user.id)

    return db_user


@app.post("/api/admin/invites")
async def create_invite(
    expires_in_days: int | None = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    import secrets

    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    token = secrets.token_urlsafe(24)
    expires_at = None
    if expires_in_days and expires_in_days > 0:
        expires_at = datetime.now(timezone.utc) + timedelta(days=expires_in_days)

    invite = Invite(
        token=token,
        created_by_user_id=current_user.id,
        expires_at=expires_at
    )
    db.add(invite)
    db.commit()
    return {"token": token, "expires_at": invite.expires_at}


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
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ============== Domain Resolution ==============

@app.get("/api/resolve-domain")
async def resolve_domain(domain: str = Query(...), db: Session = Depends(get_db)):
    user = get_user_by_domain(domain, db)
    if not user:
        raise HTTPException(status_code=404, detail="No user found for this domain")
    return {"username": user.username}


# ============== Public User-Scoped Routes ==============

@app.get("/api/u/{username}/profile", response_model=UserResponse)
async def get_user_profile(username: str, db: Session = Depends(get_db)):
    user = get_user_by_username_or_404(username, db)
    return user


@app.get("/api/u/{username}/projects", response_model=list[ProjectResponse])
async def get_user_projects(username: str, db: Session = Depends(get_db)):
    user = get_user_by_username_or_404(username, db)
    projects = (
        db.query(Project)
        .filter(Project.user_id == user.id)
        .order_by(Project.order, Project.id.desc())
        .all()
    )
    return projects


@app.get("/api/u/{username}/projects/{project_id}", response_model=ProjectResponse)
async def get_user_project(username: str, project_id: int, db: Session = Depends(get_db)):
    user = get_user_by_username_or_404(username, db)
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.get("/api/u/{username}/designs", response_model=list[DesignWorkResponse])
async def get_user_designs(
    username: str,
    category: str | None = None,
    db: Session = Depends(get_db),
):
    user = get_user_by_username_or_404(username, db)
    query = db.query(DesignWork).filter(DesignWork.user_id == user.id)
    if category:
        query = query.filter(DesignWork.category == category)
    designs = query.order_by(DesignWork.order, DesignWork.id.desc()).all()
    return designs


@app.get("/api/u/{username}/designs/{design_id}", response_model=DesignWorkResponse)
async def get_user_design(username: str, design_id: int, db: Session = Depends(get_db)):
    user = get_user_by_username_or_404(username, db)
    design = (
        db.query(DesignWork)
        .filter(DesignWork.id == design_id, DesignWork.user_id == user.id)
        .first()
    )
    if not design:
        raise HTTPException(status_code=404, detail="Design work not found")
    return design


@app.get("/api/u/{username}/settings", response_model=AllSettingsResponse)
async def get_user_settings(username: str, db: Session = Depends(get_db)):
    user = get_user_by_username_or_404(username, db)
    settings = db.query(SiteSettings).filter(SiteSettings.user_id == user.id).all()
    result = {}
    for setting in settings:
        if setting.key == "integrations":
            continue
        result[setting.key] = setting.value
    return result


@app.get("/api/u/{username}/settings/{key}")
async def get_user_setting(username: str, key: str, db: Session = Depends(get_db)):
    user = get_user_by_username_or_404(username, db)
    setting = (
        db.query(SiteSettings)
        .filter(SiteSettings.user_id == user.id, SiteSettings.key == key)
        .first()
    )
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return {"key": setting.key, "value": setting.value}


# ============== Admin Projects (Scoped to authenticated user) ==============

@app.post("/api/admin/projects", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_project = Project(**project.model_dump(), user_id=current_user.id)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@app.put("/api/admin/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == current_user.id)
        .first()
    )
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
    current_user: User = Depends(get_current_user)
):
    db_project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == current_user.id)
        .first()
    )
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(db_project)
    db.commit()
    return {"message": "Project deleted"}


# ============== Admin Design Work (Scoped to authenticated user) ==============

@app.post("/api/admin/designs", response_model=DesignWorkResponse)
async def create_design(
    design: DesignWorkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_design = DesignWork(**design.model_dump(), user_id=current_user.id)
    db.add(db_design)
    db.commit()
    db.refresh(db_design)
    return db_design


@app.put("/api/admin/designs/{design_id}", response_model=DesignWorkResponse)
async def update_design(
    design_id: int,
    design: DesignWorkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_design = (
        db.query(DesignWork)
        .filter(DesignWork.id == design_id, DesignWork.user_id == current_user.id)
        .first()
    )
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
    current_user: User = Depends(get_current_user)
):
    db_design = (
        db.query(DesignWork)
        .filter(DesignWork.id == design_id, DesignWork.user_id == current_user.id)
        .first()
    )
    if not db_design:
        raise HTTPException(status_code=404, detail="Design work not found")

    db.delete(db_design)
    db.commit()
    return {"message": "Design work deleted"}


# ============== File Upload (Scoped to authenticated user) ==============

@app.post("/api/admin/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        content = await file.read()

        cloudinary_url = _get_cloudinary_url(db, current_user)
        if cloudinary_url:
            _configure_cloudinary(cloudinary_url)
            result = cloudinary.uploader.upload(
                content,
                folder=f"portfolio/{current_user.username}",
                resource_type="auto"
            )
            return {
                "filename": result["public_id"],
                "url": result["secure_url"]
            }

        if not ALLOW_LOCAL_UPLOADS:
            raise HTTPException(
                status_code=400,
                detail="Image hosting not configured. Add a Cloudinary URL in Settings -> Integrations."
            )

        import uuid
        ext = file.filename.split(".")[-1] if "." in file.filename else ""
        filename = f"{uuid.uuid4()}.{ext}" if ext else str(uuid.uuid4())
        filepath = os.path.join(UPLOAD_DIR, filename)

        with open(filepath, "wb") as f:
            f.write(content)

        return {"filename": filename, "url": f"/uploads/{filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


# ============== PDF Processing ==============

@app.post("/api/admin/pdf/preview")
async def preview_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload PDF and get page count + thumbnail previews"""
    import fitz  # PyMuPDF
    import base64

    tmp_path = None
    doc = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        doc = fitz.open(tmp_path)
        pages = []
        total_pages = len(doc)
        preview_count = min(total_pages, PDF_PREVIEW_MAX_PAGES)

        for page_num in range(preview_count):
            page = doc[page_num]
            pix = page.get_pixmap(
                matrix=fitz.Matrix(PDF_PREVIEW_DPI / 72, PDF_PREVIEW_DPI / 72),
                alpha=False
            )
            img_bytes = pix.tobytes("png")
            del pix
            b64 = base64.b64encode(img_bytes).decode("utf-8")
            pages.append({
                "page": page_num,
                "preview": f"data:image/png;base64,{b64}",
                "width": page.rect.width * (PDF_PREVIEW_DPI / 72),
                "height": page.rect.height * (PDF_PREVIEW_DPI / 72)
            })

        return {
            "page_count": total_pages,
            "pages": pages,
            "preview_count": len(pages),
            "truncated": total_pages > len(pages)
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process PDF: {str(e)}")
    finally:
        if doc is not None:
            doc.close()
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


@app.post("/api/admin/pdf/extract")
async def extract_pdf_pages(
    file: UploadFile = File(...),
    pages: str = Form(""),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Extract selected pages from PDF as high-quality images."""
    import fitz  # PyMuPDF
    import uuid

    page_numbers = [int(p.strip()) for p in pages.split(",") if p.strip().isdigit()]
    page_numbers = sorted(set(page_numbers))

    if not page_numbers:
        raise HTTPException(status_code=400, detail="No pages specified")
    if len(page_numbers) > PDF_EXTRACT_MAX_PAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Too many pages requested. Limit is {PDF_EXTRACT_MAX_PAGES} pages per extract."
        )

    tmp_path = None
    doc = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        doc = fitz.open(tmp_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to open PDF: {str(e)}")

    extracted_images = []
    failed_pages = []
    cloudinary_url = _get_cloudinary_url(db, current_user)
    use_local_uploads = ALLOW_LOCAL_UPLOADS
    if not cloudinary_url and not use_local_uploads:
        raise HTTPException(
            status_code=400,
            detail="Image hosting not configured. Add a Cloudinary URL in Settings -> Integrations."
        )

    for page_num in page_numbers:
        if page_num < 0 or page_num >= len(doc):
            failed_pages.append({"page": page_num, "error": "Page number out of range"})
            continue

        try:
            page = doc[page_num]
            base_scale = PDF_EXTRACT_DPI / 72
            max_side = max(page.rect.width, page.rect.height)
            if max_side > 0:
                scale_cap = PDF_EXTRACT_MAX_DIM / max_side
                scale = min(base_scale, scale_cap)
            else:
                scale = base_scale

            pix = page.get_pixmap(
                matrix=fitz.Matrix(scale, scale),
                alpha=False
            )
            if PDF_EXTRACT_FORMAT in ("jpg", "jpeg"):
                try:
                    img_bytes = pix.tobytes("jpg", quality=PDF_EXTRACT_QUALITY)
                except TypeError:
                    img_bytes = pix.tobytes("jpg")
                file_ext = "jpg"
            else:
                img_bytes = pix.tobytes("png")
                file_ext = "png"
            del pix

            if cloudinary_url:
                _configure_cloudinary(cloudinary_url)
                result = cloudinary.uploader.upload(
                    img_bytes,
                    folder=f"portfolio/{current_user.username}",
                    resource_type="image"
                )
                extracted_images.append({
                    "page": page_num,
                    "url": result["secure_url"]
                })
            elif use_local_uploads:
                filename = f"{uuid.uuid4()}.{file_ext}"
                filepath = os.path.join(UPLOAD_DIR, filename)
                with open(filepath, "wb") as f:
                    f.write(img_bytes)
                extracted_images.append({
                    "page": page_num,
                    "url": f"/uploads/{filename}"
                })
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Image hosting not configured. Add a Cloudinary URL in Settings -> Integrations."
                )
        except Exception as e:
            failed_pages.append({"page": page_num, "error": str(e)})

    try:
        return {
            "images": extracted_images,
            "failed": failed_pages,
            "total_requested": len(page_numbers),
            "total_extracted": len(extracted_images)
        }
    finally:
        if doc is not None:
            doc.close()
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


# ============== Project Screenshot ==============

@app.post("/api/admin/projects/screenshot")
async def capture_project_screenshot(
    url: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Capture a screenshot of a live URL using ScreenshotOne API."""
    url = url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    if not url.startswith(("http://", "https://")):
        url = f"https://{url}"

    screenshotone_access_key = _get_screenshotone_key(db, current_user)
    if not screenshotone_access_key:
        raise HTTPException(
            status_code=400,
            detail="Screenshot service not configured. Add a ScreenshotOne access key in Settings -> Integrations."
        )

    try:
        params = {
            "access_key": screenshotone_access_key,
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


# ============== Admin Site Settings (Scoped to authenticated user) ==============

@app.get("/api/admin/settings", response_model=AllSettingsResponse)
async def get_admin_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    settings = db.query(SiteSettings).filter(SiteSettings.user_id == current_user.id).all()
    result = {}
    for setting in settings:
        result[setting.key] = setting.value
    return result


@app.put("/api/admin/settings/{key}", response_model=SettingResponse)
async def update_setting(
    key: str,
    data: SettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    setting = (
        db.query(SiteSettings)
        .filter(SiteSettings.user_id == current_user.id, SiteSettings.key == key)
        .first()
    )

    if setting:
        setting.value = data.value
    else:
        setting = SiteSettings(key=key, value=data.value, user_id=current_user.id)
        db.add(setting)

    db.commit()
    db.refresh(setting)
    return setting


@app.delete("/api/admin/settings/{key}")
async def delete_setting(
    key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    setting = (
        db.query(SiteSettings)
        .filter(SiteSettings.user_id == current_user.id, SiteSettings.key == key)
        .first()
    )
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")

    db.delete(setting)
    db.commit()
    return {"message": "Setting deleted"}


# ============== Custom Domain ==============

# Vercel API integration for programmatic domain management
VERCEL_TOKEN = os.getenv("VERCEL_TOKEN", "")
VERCEL_PROJECT_ID = os.getenv("VERCEL_PROJECT_ID", "")
VERCEL_TEAM_ID = os.getenv("VERCEL_TEAM_ID", "")


async def add_domain_to_vercel(domain: str) -> dict:
    """Add a domain to the Vercel project."""
    if not VERCEL_TOKEN or not VERCEL_PROJECT_ID:
        return {"ok": False, "error": "Vercel integration not configured"}

    url = f"https://api.vercel.com/v10/projects/{VERCEL_PROJECT_ID}/domains"
    if VERCEL_TEAM_ID:
        url += f"?teamId={VERCEL_TEAM_ID}"

    headers = {
        "Authorization": f"Bearer {VERCEL_TOKEN}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                headers=headers,
                json={"name": domain},
                timeout=30.0,
            )
            if response.status_code in (200, 201):
                return {"ok": True, "data": response.json()}
            elif response.status_code == 409:
                # Domain already exists
                return {"ok": True, "data": {"name": domain, "already_exists": True}}
            else:
                return {"ok": False, "error": response.text, "status": response.status_code}
    except Exception as e:
        return {"ok": False, "error": str(e)}


async def remove_domain_from_vercel(domain: str) -> dict:
    """Remove a domain from the Vercel project."""
    if not VERCEL_TOKEN or not VERCEL_PROJECT_ID:
        return {"ok": False, "error": "Vercel integration not configured"}

    url = f"https://api.vercel.com/v10/projects/{VERCEL_PROJECT_ID}/domains/{domain}"
    if VERCEL_TEAM_ID:
        url += f"?teamId={VERCEL_TEAM_ID}"

    headers = {
        "Authorization": f"Bearer {VERCEL_TOKEN}",
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.delete(url, headers=headers, timeout=30.0)
            if response.status_code in (200, 204):
                return {"ok": True}
            elif response.status_code == 404:
                # Domain doesn't exist, that's fine
                return {"ok": True}
            else:
                return {"ok": False, "error": response.text, "status": response.status_code}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@app.put("/api/admin/domain")
async def set_custom_domain(
    domain: str = Form(""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    domain = domain.strip().lower()
    old_domain = current_user.custom_domain

    if not domain:
        # Clear custom domain
        if old_domain:
            # Remove from Vercel
            await remove_domain_from_vercel(old_domain)
        current_user.custom_domain = None
        db.commit()
        return {"message": "Custom domain cleared", "custom_domain": None}

    # Check if domain is already taken
    existing = db.query(User).filter(
        User.custom_domain == domain,
        User.id != current_user.id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This domain is already in use by another user."
        )

    # Add to Vercel
    vercel_result = await add_domain_to_vercel(domain)
    if not vercel_result.get("ok"):
        error_msg = vercel_result.get("error", "Failed to add domain to Vercel")
        # If Vercel integration isn't configured, still allow setting domain (for testing)
        if "not configured" not in error_msg:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to configure domain: {error_msg}"
            )

    # Remove old domain from Vercel if different
    if old_domain and old_domain != domain:
        await remove_domain_from_vercel(old_domain)

    current_user.custom_domain = domain
    db.commit()
    return {"message": "Custom domain set", "custom_domain": domain}


@app.get("/api/admin/domain/status")
async def get_domain_status(
    current_user: User = Depends(get_current_user)
):
    domain = (current_user.custom_domain or "").strip()
    if not domain:
        return {"status": "not_set", "domain": None}

    expected_cname = os.getenv("DOMAIN_CHECK_CNAME", "").strip().lower().rstrip(".")
    expected_a = os.getenv("DOMAIN_CHECK_A", "").strip()

    if not expected_cname and not expected_a:
        return {"status": "unconfigured", "domain": domain}

    result = {
        "status": "not_verified",
        "domain": domain,
        "expected_cname": expected_cname or None,
        "expected_a": expected_a or None,
        "found_cname": None,
        "found_a": [],
    }

    try:
        cname_answers = dns.resolver.resolve(domain, "CNAME")
        cnames = [str(r.target).rstrip(".").lower() for r in cname_answers]
        result["found_cname"] = cnames[0] if cnames else None
    except Exception:
        result["found_cname"] = None

    try:
        a_answers = dns.resolver.resolve(domain, "A")
        result["found_a"] = [str(r.address) for r in a_answers]
    except Exception:
        result["found_a"] = []

    cname_ok = expected_cname and result["found_cname"] == expected_cname
    a_ok = expected_a and expected_a in result["found_a"]

    if cname_ok or a_ok:
        result["status"] = "verified"

    return result
