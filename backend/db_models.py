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
    super_admin = Column(Boolean, default=False, nullable=False)
    email = Column(String(255), nullable=True)
    custom_domain = Column(String(255), unique=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    projects = relationship("Project", back_populates="owner")
    design_works = relationship("DesignWork", back_populates="owner")
    site_settings = relationship("SiteSettings", back_populates="owner")
    created_invites = relationship("Invite", back_populates="creator", foreign_keys="Invite.created_by_user_id")
    used_invites = relationship("Invite", back_populates="used_by", foreign_keys="Invite.used_by_user_id")


class Invite(Base):
    __tablename__ = "invites"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(128), unique=True, index=True, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    used_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    used_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    creator = relationship("User", foreign_keys=[created_by_user_id], back_populates="created_invites")
    used_by = relationship("User", foreign_keys=[used_by_user_id], back_populates="used_invites")


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
    video_url = Column(String(500), nullable=True)
    gallery = Column(JSON, nullable=True)  # List of {type, url, caption}
    github_link = Column(String(500), nullable=True)
    live_url = Column(String(500), nullable=True)
    github_releases = Column(Boolean, default=False, nullable=True)
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
    videos = Column(JSON, nullable=True)  # List of video URLs
    client = Column(String(200), nullable=True)
    year = Column(Integer, nullable=True)
    featured = Column(Boolean, default=False)
    order = Column(Integer, default=0)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="design_works")
