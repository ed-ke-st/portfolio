from fastapi import HTTPException
from sqlalchemy.orm import Session

from db_models import User


def get_user_by_username_or_404(username: str, db: Session) -> User:
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def get_user_by_domain(domain: str, db: Session) -> User | None:
    return db.query(User).filter(User.custom_domain == domain).first()
