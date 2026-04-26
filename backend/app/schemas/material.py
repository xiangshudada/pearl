from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel


# ---- 分类 ----

class CategoryBase(BaseModel):
    name: str
    parent_id: Optional[int] = None
    sort_order: int = 0


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[int] = None
    sort_order: Optional[int] = None


class CategoryOut(BaseModel):
    id: int
    name: str
    parent_id: Optional[int] = None
    sort_order: int
    created_at: datetime

    model_config = {"from_attributes": True}


class CategoryTree(BaseModel):
    id: int
    name: str
    sort_order: int
    children: List["CategoryTree"] = []

    model_config = {"from_attributes": True}


CategoryTree.model_rebuild()


# ---- 材料 ----

class MaterialBase(BaseModel):
    category_id: int
    name: str
    size_mm: Decimal
    price: Decimal
    wuxing: Optional[str] = None
    image_url: str
    stock: int = 0
    is_active: int = 1
    sort_order: int = 0


class MaterialCreate(MaterialBase):
    pass


class MaterialUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = None
    size_mm: Optional[Decimal] = None
    price: Optional[Decimal] = None
    wuxing: Optional[str] = None
    image_url: Optional[str] = None
    stock: Optional[int] = None
    is_active: Optional[int] = None
    sort_order: Optional[int] = None


class MaterialOut(BaseModel):
    id: int
    category_id: int
    name: str
    size_mm: Decimal
    price: Decimal
    wuxing: Optional[str] = None
    image_url: str
    stock: int
    is_active: int
    sort_order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
