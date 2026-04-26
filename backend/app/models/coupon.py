from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import BigInteger, Integer, String, DateTime, func, DECIMAL, Enum
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class CouponTemplate(Base):
    __tablename__ = "coupon_templates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(64), nullable=False, comment="券名称")
    type: Mapped[str] = mapped_column(
        Enum("fixed", "percent", "free_shipping"), nullable=False, comment="满减/折扣/免邮"
    )
    discount: Mapped[Decimal] = mapped_column(
        DECIMAL(10, 2), nullable=False, comment="满减金额（元）或折扣率"
    )
    min_amount: Mapped[Optional[Decimal]] = mapped_column(
        DECIMAL(10, 2), nullable=True, comment="最低使用金额，NULL 表示无门槛"
    )
    total_count: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True, comment="总发放数量，NULL 表示不限量"
    )
    issued_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="已发放数量"
    )
    expired_days: Mapped[int] = mapped_column(
        Integer, nullable=False, default=30, comment="领取后有效天数"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )


class UserCoupon(Base):
    __tablename__ = "user_coupons"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, nullable=False, comment="持有用户 ID")
    template_id: Mapped[int] = mapped_column(Integer, nullable=False, comment="优惠券模板 ID")
    used_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True, comment="使用时间，NULL 表示未使用"
    )
    expired_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, comment="过期时间")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
