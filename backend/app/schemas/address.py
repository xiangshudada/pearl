from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class AddressBase(BaseModel):
    name: str
    phone: str
    province: str
    city: str
    district: str
    detail: str
    is_default: int = 0


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    province: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    detail: Optional[str] = None
    is_default: Optional[int] = None


class AddressOut(BaseModel):
    id: int
    user_id: int
    name: str
    phone: str
    province: str
    city: str
    district: str
    detail: str
    is_default: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
