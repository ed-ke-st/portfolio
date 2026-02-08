from models import Project

projects: list[Project] = [
    Project(
        id=1,
        title="E-Commerce Platform",
        description="A full-stack e-commerce application with user authentication, product management, shopping cart, and payment integration.",
        tech_stack=["Next.js", "TypeScript", "PostgreSQL", "Stripe", "Tailwind CSS"],
        image_url="/images/ecommerce.png",
        github_link="https://github.com/username/ecommerce",
        live_url="https://ecommerce-demo.vercel.app"
    ),
    Project(
        id=2,
        title="Task Management App",
        description="A collaborative task management tool with real-time updates, drag-and-drop functionality, and team workspaces.",
        tech_stack=["React", "Node.js", "MongoDB", "Socket.io", "Redux"],
        image_url="/images/taskmanager.png",
        github_link="https://github.com/username/taskmanager",
        live_url="https://taskmanager-demo.vercel.app"
    ),
    Project(
        id=3,
        title="Weather Dashboard",
        description="A responsive weather application that displays current conditions and forecasts using geolocation and external APIs.",
        tech_stack=["Vue.js", "Python", "FastAPI", "OpenWeather API"],
        image_url="/images/weather.png",
        github_link="https://github.com/username/weather-dashboard",
        live_url=None
    ),
    Project(
        id=4,
        title="Blog CMS",
        description="A headless content management system for blogs with markdown support, image uploads, and SEO optimization.",
        tech_stack=["Next.js", "Prisma", "PostgreSQL", "AWS S3", "TypeScript"],
        image_url="/images/blogcms.png",
        github_link="https://github.com/username/blog-cms",
        live_url="https://blog-cms-demo.vercel.app"
    ),
    Project(
        id=5,
        title="Portfolio Website",
        description="This very portfolio site! Built with modern web technologies to showcase projects and skills.",
        tech_stack=["Next.js", "FastAPI", "TypeScript", "Tailwind CSS"],
        image_url="/images/portfolio.png",
        github_link="https://github.com/username/portfolio",
        live_url=None
    ),
]
