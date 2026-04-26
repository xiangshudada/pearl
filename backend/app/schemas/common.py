from typing import Generic, List, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class PageResponse(BaseModel, Generic[T]):
    """通用分页响应"""
    items: List[T]
    total: int
    page: int
    per_page: int


class MessageResponse(BaseModel):
    """通用消息响应"""
    message: str
