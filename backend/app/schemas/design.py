from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel

from app.schemas.material import MaterialOut


class DesignItemIn(BaseModel):
    material_id: int
    quantity: int = 1
    position: Optional[int] = None


class DesignItemOut(BaseModel):
    id: int
    design_id: int
    material_id: int
    quantity: int
    position: Optional[int] = None
    material: Optional[MaterialOut] = None

    model_config = {"from_attributes": True}


class DesignCreate(BaseModel):
    name: str = "我设计的手串"
    items: List[DesignItemIn] = []
    tags: List[str] = []
    wrist_size: Optional[Decimal] = None
    total_price: Decimal = Decimal("0")
    preview_url: Optional[str] = None
    status: str = "draft"


class DesignUpdate(BaseModel):
    name: Optional[str] = None
    items: Optional[List[DesignItemIn]] = None
    tags: Optional[List[str]] = None
    wrist_size: Optional[Decimal] = None
    total_price: Optional[Decimal] = None
    preview_url: Optional[str] = None
    status: Optional[str] = None
    is_published: Optional[int] = None


class DesignOut(BaseModel):
    id: int
    user_id: int
    name: str
    wrist_size: Optional[Decimal] = None
    preview_url: Optional[str] = None
    total_price: Decimal
    is_published: int
    like_count: int
    use_count: int
    status: str
    created_at: datetime
    updated_at: datetime

    # 关联数据（可选，详情页返回）
    tags: List[str] = []
    items: List[DesignItemOut] = []
    author_nickname: Optional[str] = None
    author_avatar: Optional[str] = None
    liked_by_me: bool = False

    model_config = {"from_attributes": True}


class LikeResponse(BaseModel):
    liked: bool
    like_count: int


class UseResponse(BaseModel):
    use_count: int
