from datetime import datetime
from sqlalchemy import BigInteger, String, DateTime, func, SmallInteger
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    openid: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, comment="微信 openid")
    nickname: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="微信昵称")
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True, comment="头像链接")
    is_admin: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, default=0, comment="是否管理员：1是 0否"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )
