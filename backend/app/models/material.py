from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    BigInteger, Integer, String, DateTime, func,
    DECIMAL, Enum, SmallInteger, Text
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class MaterialCategory(Base):
    __tablename__ = "material_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    parent_id: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True, comment="父分类 ID，NULL 表示顶级"
    )
    name: Mapped[str] = mapped_column(String(32), nullable=False, comment="分类名称")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="排序权重")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )


class Material(Base):
    __tablename__ = "materials"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    category_id: Mapped[int] = mapped_column(Integer, nullable=False, comment="所属子分类 ID")
    name: Mapped[str] = mapped_column(String(64), nullable=False, comment="材料名称")
    size_mm: Mapped[Decimal] = mapped_column(DECIMAL(4, 1), nullable=False, comment="尺寸（毫米）")
    price: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, comment="单颗售价（元）")
    wuxing: Mapped[Optional[str]] = mapped_column(
        Enum("金", "木", "水", "火", "土"), nullable=True, comment="五行属性"
    )
    image_url: Mapped[str] = mapped_column(String(512), nullable=False, comment="珠子展示图")
    stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="库存数量")
    is_active: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, default=1, comment="是否上架：1上架 0下架"
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="排序权重")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )
