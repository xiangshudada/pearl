from typing import Optional, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.database import get_db
from app.models.material import Material, MaterialCategory
from app.schemas.common import PageResponse
from app.schemas.material import MaterialOut, CategoryTree

router = APIRouter(prefix="/materials", tags=["材料"])


@router.get("/categories", response_model=List[CategoryTree], summary="获取两级分类树")
async def get_categories(db: AsyncSession = Depends(get_db)):
    """返回两级分类树：顶级分类 + 子分类"""
    result = await db.execute(
        select(MaterialCategory).order_by(MaterialCategory.sort_order)
    )
    all_cats = result.scalars().all()

    # 构建树结构
    top_level = [c for c in all_cats if c.parent_id is None]
    children_map: dict = {}
    for c in all_cats:
        if c.parent_id is not None:
            children_map.setdefault(c.parent_id, []).append(c)

    tree = []
    for cat in top_level:
        node = CategoryTree(
            id=cat.id,
            name=cat.name,
            sort_order=cat.sort_order,
            children=[
                CategoryTree(id=ch.id, name=ch.name, sort_order=ch.sort_order)
                for ch in children_map.get(cat.id, [])
            ],
        )
        tree.append(node)

    return tree


@router.get("", response_model=PageResponse[MaterialOut], summary="材料列表（分页）")
async def list_materials(
    category_id: Optional[int] = Query(None, description="分类 ID"),
    name: Optional[str] = Query(None, description="材料名称模糊搜索"),
    wuxing: Optional[str] = Query(None, description="五行属性筛选"),
    size_mm: Optional[float] = Query(None, description="尺寸筛选（mm）"),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """分页查询上架材料，支持按分类、名称、五行、尺寸筛选"""
    conditions = [Material.is_active == 1]

    if category_id is not None:
        conditions.append(Material.category_id == category_id)
    if name:
        conditions.append(Material.name.like(f"%{name}%"))
    if wuxing:
        conditions.append(Material.wuxing == wuxing)
    if size_mm is not None:
        conditions.append(Material.size_mm == size_mm)

    where_clause = and_(*conditions)

    # 总数
    count_result = await db.execute(
        select(func.count()).select_from(Material).where(where_clause)
    )
    total = count_result.scalar_one()

    # 数据
    offset = (page - 1) * per_page
    data_result = await db.execute(
        select(Material)
        .where(where_clause)
        .order_by(Material.sort_order, Material.id)
        .offset(offset)
        .limit(per_page)
    )
    items = data_result.scalars().all()

    return PageResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
    )
