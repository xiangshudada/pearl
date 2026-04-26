from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    BigInteger, Integer, String, DateTime, func,
    DECIMAL, Enum, SmallInteger
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Design(Base):
    __tablename__ = "designs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, nullable=False, comment="作者用户 ID")
    name: Mapped[str] = mapped_column(
        String(64), nullable=False, default="我设计的手串", comment="设计名称"
    )
    wrist_size: Mapped[Optional[Decimal]] = mapped_column(
        DECIMAL(4, 1), nullable=True, comment="手围（cm）"
    )
    preview_url: Mapped[Optional[str]] = mapped_column(
        String(512), nullable=True, comment="手串预览图链接"
    )
    total_price: Mapped[Decimal] = mapped_column(
        DECIMAL(10, 2), nullable=False, default=0, comment="材料合计价格（元）"
    )
    is_published: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, default=0, comment="是否发布到设计广场"
    )
    like_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="点赞数"
    )
    use_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="被他人使用次数"
    )
    status: Mapped[str] = mapped_column(
        Enum("draft", "completed"), nullable=False, default="draft", comment="草稿/已完成"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )


class DesignTag(Base):
    __tablename__ = "design_tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    design_id: Mapped[int] = mapped_column(BigInteger, nullable=False, comment="所属设计 ID")
    tag: Mapped[str] = mapped_column(String(32), nullable=False, comment="标签名称")


class DesignItem(Base):
    __tablename__ = "design_items"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    design_id: Mapped[int] = mapped_column(BigInteger, nullable=False, comment="所属设计 ID")
    material_id: Mapped[int] = mapped_column(BigInteger, nullable=False, comment="材料 ID")
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1, comment="使用数量（颗）")
    position: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True, comment="珠子在手串中的位置顺序（0起）"
    )


class DesignLike(Base):
    __tablename__ = "design_likes"

    user_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    design_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
