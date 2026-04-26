from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel


class CouponTemplateBase(BaseModel):
    name: str
    type: str
    discount: Decimal
    min_amount: Optional[Decimal] = None
    total_count: Optional[int] = None
    expired_days: int = 30


class CouponTemplateCreate(CouponTemplateBase):
    pass


class CouponTemplateUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    discount: Optional[Decimal] = None
    min_amount: Optional[Decimal] = None
    total_count: Optional[int] = None
    expired_days: Optional[int] = None


class CouponTemplateOut(BaseModel):
    id: int
    name: str
    type: str
    discount: Decimal
    min_amount: Optional[Decimal] = None
    total_count: Optional[int] = None
    issued_count: int
    expired_days: int
    created_at: datetime

    model_config = {"from_attributes": True}


class UserCouponOut(BaseModel):
    id: int
    user_id: int
    template_id: int
    used_at: Optional[datetime] = None
    expired_at: datetime
    created_at: datetime
    template: Optional[CouponTemplateOut] = None

    model_config = {"from_attributes": True}


class DistributeResponse(BaseModel):
    distributed_count: int
    message: str
