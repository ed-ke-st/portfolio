from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=True)
    email = Column(String(255), nullable=True)
    custom_domain = Column(String(255), unique=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    projects = relationship("Project", back_populates="owner")
    design_works = relationship("DesignWork", back_populates="owner")
    site_settings = relationship("SiteSettings", back_populates="owner")


class SiteSettings(Base):
    __tablename__ = "site_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), index=True, nullable=False)
    value = Column(JSON, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="site_settings")

    __table_args__ = (
        UniqueConstraint("user_id", "key", name="uq_user_setting"),
    )


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    tech_stack = Column(JSON, nullable=False)  # List of strings
    image_url = Column(String(500), nullable=True)
    github_link = Column(String(500), nullable=True)
    live_url = Column(String(500), nullable=True)
    featured = Column(Boolean, default=False)
    order = Column(Integer, default=0)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="projects")


class DesignWork(Base):
    __tablename__ = "design_works"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False)  # logo, branding, ui, print
    images = Column(JSON, nullable=False)  # List of image URLs
    primary_image = Column(Integer, default=0)  # Index of primary/thumbnail image
    client = Column(String(200), nullable=True)
    year = Column(Integer, nullable=True)
    featured = Column(Boolean, default=False)
    order = Column(Integer, default=0)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="design_works")
