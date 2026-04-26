from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import BigInteger, String, DateTime, func, DECIMAL, Enum
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, nullable=False, comment="下单用户 ID")
    design_id: Mapped[int] = mapped_column(BigInteger, nullable=False, comment="购买的设计 ID")
    address_id: Mapped[int] = mapped_column(BigInteger, nullable=False, comment="收货地址 ID")
    user_coupon_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, nullable=True, comment="使用的优惠券 ID"
    )
    total_amount: Mapped[Decimal] = mapped_column(
        DECIMAL(10, 2), nullable=False, comment="订单原价（元）"
    )
    discount_amount: Mapped[Decimal] = mapped_column(
        DECIMAL(10, 2), nullable=False, default=0, comment="优惠金额（元）"
    )
    pay_amount: Mapped[Decimal] = mapped_column(
        DECIMAL(10, 2), nullable=False, comment="实付金额（元）"
    )
    status: Mapped[str] = mapped_column(
        Enum("pending_payment", "paid", "shipped", "completed", "cancelled"),
        nullable=False,
        default="pending_payment",
    )
    wx_transaction_id: Mapped[Optional[str]] = mapped_column(
        String(64), nullable=True, comment="微信支付流水号"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )
