from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from database import Base


# =========================================
# USER MODEL
# =========================================

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    password = Column(
        String,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# =========================================
# RESUME HISTORY MODEL
# =========================================

class ResumeHistory(Base):
    __tablename__ = "resume_history"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    file_name = Column(
        String,
        nullable=False
    )

    ats_score = Column(
        Integer,
        default=0
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )