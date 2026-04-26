from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class UserBase(BaseModel):
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None


class UserUpdate(UserBase):
    pass


class UserOut(BaseModel):
    id: int
    openid: str
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    is_admin: int
    created_at: datetime

    model_config = {"from_attributes": True}
