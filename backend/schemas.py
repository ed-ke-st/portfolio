from pydantic import BaseModel
from datetime import datetime
from typing import Any


# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str | None = None


class UserCreate(BaseModel):
    username: str
    password: str
    email: str | None = None
    invite_token: str | None = None


class UserResponse(BaseModel):
    id: int
    username: str
    is_admin: bool
    super_admin: bool
    email: str | None = None
    custom_domain: str | None = None

    class Config:
        from_attributes = True


# Project schemas
class ProjectBase(BaseModel):
    title: str
    description: str
    tech_stack: list[str]
    image_url: str | None = None
    github_link: str | None = None
    live_url: str | None = None
    featured: bool = False
    order: int = 0


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    tech_stack: list[str] | None = None
    image_url: str | None = None
    github_link: str | None = None
    live_url: str | None = None
    featured: bool | None = None
    order: int | None = None


class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


# Design Work schemas
class DesignWorkBase(BaseModel):
    title: str
    description: str | None = None
    category: str
    images: list[str]
    primary_image: int = 0
    client: str | None = None
    year: int | None = None
    featured: bool = False
    order: int = 0


class DesignWorkCreate(DesignWorkBase):
    pass


class DesignWorkUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    images: list[str] | None = None
    primary_image: int | None = None
    client: str | None = None
    year: int | None = None
    featured: bool | None = None
    order: int | None = None


class DesignWorkResponse(DesignWorkBase):
    id: int
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


# Site Settings schemas
class SettingUpdate(BaseModel):
    value: Any


class SettingResponse(BaseModel):
    key: str
    value: Any

    class Config:
        from_attributes = True


class AllSettingsResponse(BaseModel):
    hero: dict | None = None
    skills: list[dict] | None = None
    skill_categories: list[dict] | list[str] | None = None
    contact: dict | None = None
    cv: dict | None = None
    footer: dict | None = None
    appearance: dict | None = None
    integrations: dict | None = None
