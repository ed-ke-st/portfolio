from pydantic import BaseModel


class Project(BaseModel):
    id: int
    title: str
    description: str
    tech_stack: list[str]
    image_url: str | None = None
    github_link: str | None = None
    live_url: str | None = None
