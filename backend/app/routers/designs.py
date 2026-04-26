from typing import Optional, List

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, delete

from app.database import get_db
from app.deps import get_current_user, get_current_user_optional
from app.models.design import Design, DesignTag, DesignItem, DesignLike
from app.models.material import Material
from app.models.user import User
from app.schemas.common import PageResponse
from app.schemas.design import (
    DesignCreate, DesignUpdate, DesignOut, DesignItemOut,
    LikeResponse, UseResponse,
)

router = APIRouter(prefix="/designs", tags=["设计"])


async def _build_design_out(
    design: Design,
    db: AsyncSession,
    current_user: Optional[User] = None,
    include_items: bool = False,
) -> DesignOut:
    """将 Design ORM 对象组装为 DesignOut，填充关联数据"""
    # 获取标签
    tag_result = await db.execute(
        select(DesignTag.tag).where(DesignTag.design_id == design.id)
    )
    tags = [row[0] for row in tag_result.all()]

    # 获取作者信息
    author_result = await db.execute(
        select(User.nickname, User.avatar_url).where(User.id == design.user_id)
    )
    author = author_result.first()
    author_nickname = author.nickname if author else None
    author_avatar = author.avatar_url if author else None

    # 是否已点赞
    liked_by_me = False
    if current_user:
        like_result = await db.execute(
            select(DesignLike).where(
                and_(
                    DesignLike.user_id == current_user.id,
                    DesignLike.design_id == design.id,
                )
            )
        )
        liked_by_me = like_result.scalar_one_or_none() is not None

    items: List[DesignItemOut] = []
    if include_items:
        item_result = await db.execute(
            select(DesignItem)
            .where(DesignItem.design_id == design.id)
            .order_by(DesignItem.position)
        )
        design_items = item_result.scalars().all()

        for di in design_items:
            mat_result = await db.execute(
                select(Material).where(Material.id == di.material_id)
            )
            mat = mat_result.scalar_one_or_none()
            items.append(
                DesignItemOut(
                    id=di.id,
                    design_id=di.design_id,
                    material_id=di.material_id,
                    quantity=di.quantity,
                    position=di.position,
                    material=mat,
                )
            )

    return DesignOut(
        id=design.id,
        user_id=design.user_id,
        name=design.name,
        wrist_size=design.wrist_size,
        preview_url=design.preview_url,
        total_price=design.total_price,
        is_published=design.is_published,
        like_count=design.like_count,
        use_count=design.use_count,
        status=design.status,
        created_at=design.created_at,
        updated_at=design.updated_at,
        tags=tags,
        items=items,
        author_nickname=author_nickname,
        author_avatar=author_avatar,
        liked_by_me=liked_by_me,
    )


@router.get("", response_model=PageResponse[DesignOut], summary="设计广场列表")
async def list_designs(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sort: str = Query("popular", description="排序方式：popular | latest"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """获取已发布的设计广场列表，支持按热度或最新排序"""
    where_clause = Design.is_published == 1

    count_result = await db.execute(
        select(func.count()).select_from(Design).where(where_clause)
    )
    total = count_result.scalar_one()

    order_col = Design.use_count.desc() if sort == "popular" else Design.created_at.desc()
    offset = (page - 1) * per_page

    data_result = await db.execute(
        select(Design).where(where_clause).order_by(order_col).offset(offset).limit(per_page)
    )
    designs = data_result.scalars().all()

    items = [
        await _build_design_out(d, db, current_user, include_items=False)
        for d in designs
    ]
    return PageResponse(items=items, total=total, page=page, per_page=per_page)


@router.post("", response_model=DesignOut, status_code=status.HTTP_201_CREATED, summary="创建设计")
async def create_design(
    body: DesignCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """创建新的手串设计"""
    design = Design(
        user_id=current_user.id,
        name=body.name,
        wrist_size=body.wrist_size,
        total_price=body.total_price,
        preview_url=body.preview_url,
        status=body.status,
    )
    db.add(design)
    await db.flush()

    # 插入标签
    for tag_str in body.tags:
        db.add(DesignTag(design_id=design.id, tag=tag_str))

    # 插入明细
    for item in body.items:
        db.add(
            DesignItem(
                design_id=design.id,
                material_id=item.material_id,
                quantity=item.quantity,
                position=item.position,
            )
        )

    await db.flush()
    await db.refresh(design)
    return await _build_design_out(design, db, current_user, include_items=True)


@router.get("/my", response_model=List[DesignOut], summary="我的设计列表")
async def my_designs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取当前用户的所有设计（含草稿）"""
    result = await db.execute(
        select(Design)
        .where(Design.user_id == current_user.id)
        .order_by(Design.updated_at.desc())
    )
    designs = result.scalars().all()
    return [await _build_design_out(d, db, current_user, include_items=False) for d in designs]


@router.get("/{design_id}", response_model=DesignOut, summary="设计详情")
async def get_design(
    design_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """获取设计详情，含材料明细、标签和作者信息"""
    result = await db.execute(select(Design).where(Design.id == design_id))
    design = result.scalar_one_or_none()
    if design is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="设计不存在")

    # 未发布的设计只有作者可见
    if not design.is_published:
        if current_user is None or current_user.id != design.user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="设计不存在")

    return await _build_design_out(design, db, current_user, include_items=True)


@router.put("/{design_id}", response_model=DesignOut, summary="更新设计")
async def update_design(
    design_id: int,
    body: DesignUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """更新设计（仅作者可操作）"""
    result = await db.execute(select(Design).where(Design.id == design_id))
    design = result.scalar_one_or_none()
    if design is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="设计不存在")
    if design.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权操作此设计")

    # 更新基础字段
    update_fields = body.model_dump(exclude_unset=True, exclude={"items", "tags"})
    for key, val in update_fields.items():
        setattr(design, key, val)

    # 更新标签
    if body.tags is not None:
        await db.execute(delete(DesignTag).where(DesignTag.design_id == design.id))
        for tag_str in body.tags:
            db.add(DesignTag(design_id=design.id, tag=tag_str))

    # 更新明细
    if body.items is not None:
        await db.execute(delete(DesignItem).where(DesignItem.design_id == design.id))
        for item in body.items:
            db.add(
                DesignItem(
                    design_id=design.id,
                    material_id=item.material_id,
                    quantity=item.quantity,
                    position=item.position,
                )
            )

    await db.flush()
    await db.refresh(design)
    return await _build_design_out(design, db, current_user, include_items=True)


@router.delete("/{design_id}", status_code=status.HTTP_204_NO_CONTENT, summary="删除设计")
async def delete_design(
    design_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """删除设计（仅作者可操作）"""
    result = await db.execute(select(Design).where(Design.id == design_id))
    design = result.scalar_one_or_none()
    if design is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="设计不存在")
    if design.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权操作此设计")

    await db.execute(delete(DesignTag).where(DesignTag.design_id == design.id))
    await db.execute(delete(DesignItem).where(DesignItem.design_id == design.id))
    await db.execute(delete(DesignLike).where(DesignLike.design_id == design.id))
    await db.delete(design)


@router.post("/{design_id}/like", response_model=LikeResponse, summary="切换点赞")
async def toggle_like(
    design_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """切换点赞状态，返回最新点赞数"""
    result = await db.execute(select(Design).where(Design.id == design_id))
    design = result.scalar_one_or_none()
    if design is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="设计不存在")

    like_result = await db.execute(
        select(DesignLike).where(
            and_(
                DesignLike.user_id == current_user.id,
                DesignLike.design_id == design_id,
            )
        )
    )
    existing_like = like_result.scalar_one_or_none()

    if existing_like:
        await db.delete(existing_like)
        design.like_count = max(0, design.like_count - 1)
        liked = False
    else:
        db.add(DesignLike(user_id=current_user.id, design_id=design_id))
        design.like_count += 1
        liked = True

    await db.flush()
    await db.refresh(design)
    return LikeResponse(liked=liked, like_count=design.like_count)


@router.post("/{design_id}/use", response_model=UseResponse, summary="使用设计（增加 use_count）")
async def use_design(
    design_id: int,
    db: AsyncSession = Depends(get_db),
):
    """记录他人使用此设计，增加 use_count"""
    result = await db.execute(select(Design).where(Design.id == design_id))
    design = result.scalar_one_or_none()
    if design is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="设计不存在")

    design.use_count += 1
    await db.flush()
    await db.refresh(design)
    return UseResponse(use_count=design.use_count)
