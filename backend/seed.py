"""
Seed script to populate initial data.
Run with: python seed.py
"""
from database import SessionLocal, engine, Base
from db_models import Project, DesignWork, SiteSettings

# Create tables
Base.metadata.create_all(bind=engine)

# Sample projects
sample_projects = [
    {
        "title": "E-Commerce Platform",
        "description": "A full-stack e-commerce application with user authentication, product management, shopping cart, and payment integration.",
        "tech_stack": ["Next.js", "TypeScript", "PostgreSQL", "Stripe", "Tailwind CSS"],
        "image_url": None,
        "github_link": "https://github.com/username/ecommerce",
        "live_url": "https://ecommerce-demo.vercel.app",
        "featured": True,
        "order": 1
    },
    {
        "title": "Task Management App",
        "description": "A collaborative task management tool with real-time updates, drag-and-drop functionality, and team workspaces.",
        "tech_stack": ["React", "Node.js", "MongoDB", "Socket.io", "Redux"],
        "image_url": None,
        "github_link": "https://github.com/username/taskmanager",
        "live_url": "https://taskmanager-demo.vercel.app",
        "featured": True,
        "order": 2
    },
    {
        "title": "Weather Dashboard",
        "description": "A responsive weather application that displays current conditions and forecasts using geolocation and external APIs.",
        "tech_stack": ["Vue.js", "Python", "FastAPI", "OpenWeather API"],
        "image_url": None,
        "github_link": "https://github.com/username/weather-dashboard",
        "live_url": None,
        "featured": False,
        "order": 3
    },
    {
        "title": "Portfolio Website",
        "description": "This very portfolio site! Built with modern web technologies to showcase projects and skills.",
        "tech_stack": ["Next.js", "FastAPI", "TypeScript", "Tailwind CSS"],
        "image_url": None,
        "github_link": "https://github.com/username/portfolio",
        "live_url": None,
        "featured": False,
        "order": 4
    },
]

# Sample design work
sample_designs = [
    {
        "title": "Tech Startup Logo",
        "description": "Modern, minimalist logo design for a SaaS startup.",
        "category": "logo",
        "images": [],
        "client": "TechStart Inc.",
        "year": 2024,
        "featured": True,
        "order": 1
    },
    {
        "title": "Coffee Shop Branding",
        "description": "Complete brand identity including logo, color palette, and typography.",
        "category": "branding",
        "images": [],
        "client": "Bean & Brew",
        "year": 2024,
        "featured": True,
        "order": 2
    },
    {
        "title": "Mobile App UI",
        "description": "User interface design for a fitness tracking mobile application.",
        "category": "ui",
        "images": [],
        "client": "FitTrack",
        "year": 2023,
        "featured": False,
        "order": 3
    },
]

# Default site settings
default_settings = {
    "hero": {
        "title": "Hi, I'm a",
        "highlight": "Full-Stack Developer",
        "subtitle": "I build modern web applications with clean code and great user experiences. Passionate about creating solutions that make a difference.",
        "cta_primary": "View My Work",
        "cta_secondary": "Get in Touch"
    },
    "skills": [
        {"name": "TypeScript", "category": "Language", "level": 85},
        {"name": "JavaScript", "category": "Language", "level": 80},
        {"name": "Python", "category": "Language", "level": 78},
        {"name": "React", "category": "Frontend", "level": 82},
        {"name": "Next.js", "category": "Frontend", "level": 80},
        {"name": "Tailwind CSS", "category": "Frontend", "level": 76},
        {"name": "Node.js", "category": "Backend", "level": 75},
        {"name": "FastAPI", "category": "Backend", "level": 72},
        {"name": "PostgreSQL", "category": "Database", "level": 70},
        {"name": "MongoDB", "category": "Database", "level": 68},
        {"name": "Git", "category": "Tools", "level": 78},
        {"name": "Docker", "category": "Tools", "level": 70},
    ],
    "skill_categories": [
        "Language",
        "Frontend",
        "Backend",
        "Database",
        "Tools",
    ],
    "contact": {
        "heading": "Get in Touch",
        "subheading": "Feel free to reach out for collaborations or just a friendly hello",
        "email": "hello@example.com",
        "github": "https://github.com",
        "linkedin": "https://linkedin.com",
        "twitter": "",
        "instagram": "",
        "phone": ""
    },
    "appearance": {
        "accent": "#2563eb",
        "background": "#ffffff",
        "text": "#111827",
        "muted": "#6b7280",
        "card": "#f4f4f5",
        "border": "#e4e4e7",
        "sections": {
            "hero": "",
            "projects": "",
            "designs": "",
            "skills": "",
            "footer": ""
        },
        "dark_mode": False,
        "dark": {
            "accent": "#60a5fa",
            "background": "#0b0f1a",
            "text": "#e5e7eb",
            "muted": "#9ca3af",
            "card": "#111827",
            "border": "#1f2937",
            "sections": {
                "hero": "",
                "projects": "",
                "designs": "",
                "skills": "",
                "footer": ""
            }
        }
    },
    "footer": {
        "copyright": "Portfolio. All rights reserved."
    }
}


def seed_database():
    db = SessionLocal()
    try:
        # Check if data already exists
        existing_projects = db.query(Project).count()
        if existing_projects > 0:
            print("Database already has project data. Skipping project/design seed.")
        else:
            # Add projects
            for project_data in sample_projects:
                project = Project(**project_data)
                db.add(project)

            # Add design work
            for design_data in sample_designs:
                design = DesignWork(**design_data)
                db.add(design)

            print(f"Seeded {len(sample_projects)} projects and {len(sample_designs)} design works.")

        # Seed settings if not exist
        existing_settings = db.query(SiteSettings).count()
        if existing_settings == 0:
            for key, value in default_settings.items():
                setting = SiteSettings(key=key, value=value)
                db.add(setting)
            print(f"Seeded {len(default_settings)} site settings.")
        else:
            print("Settings already exist. Skipping settings seed.")

        db.commit()

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
