from datetime import datetime

from sqlalchemy import BigInteger, String, DateTime, func, SmallInteger
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Address(Base):
    __tablename__ = "addresses"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, nullable=False, comment="所属用户 ID")
    name: Mapped[str] = mapped_column(String(32), nullable=False, comment="收件人姓名")
    phone: Mapped[str] = mapped_column(String(16), nullable=False, comment="联系电话")
    province: Mapped[str] = mapped_column(String(32), nullable=False, comment="省")
    city: Mapped[str] = mapped_column(String(32), nullable=False, comment="市")
    district: Mapped[str] = mapped_column(String(32), nullable=False, comment="区/县")
    detail: Mapped[str] = mapped_column(String(128), nullable=False, comment="详细地址")
    is_default: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, default=0, comment="是否默认地址"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )
