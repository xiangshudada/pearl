from datetime import datetime, timedelta
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete, update

from app.config import settings
from app.database import get_db
from app.deps import require_admin
from app.models.material import Material, MaterialCategory
from app.models.design import Design, DesignTag, DesignItem, DesignLike
from app.models.coupon import CouponTemplate, UserCoupon
from app.models.order import Order
from app.models.user import User
from app.schemas.auth import AdminLoginRequest, TokenResponse
from app.schemas.material import (
    MaterialCreate, MaterialUpdate, MaterialOut,
    CategoryCreate, CategoryUpdate, CategoryOut,
)
from app.schemas.design import DesignOut
from app.schemas.coupon import (
    CouponTemplateCreate, CouponTemplateUpdate, CouponTemplateOut,
    DistributeResponse,
)
from app.schemas.common import PageResponse

from jose import jwt

router = APIRouter(prefix="/admin", tags=["管理员"])


# ---------- 管理员登录 ----------

@router.post("/login", response_model=TokenResponse, summary="管理员登录")
async def admin_login(body: AdminLoginRequest):
    """账号密码登录，成功返回 JWT（is_admin=true）"""
    if body.username != settings.ADMIN_USERNAME or body.password != settings.ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="账号或密码错误",
        )

    expire = datetime.utcnow() + timedelta(days=settings.JWT_EXPIRE_DAYS)
    payload = {
        "user_id": None,
        "openid": None,
        "is_admin": True,
        "exp": expire,
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return TokenResponse(access_token=token)


# ---------- 分类管理 ----------

@router.get("/categories", response_model=List[CategoryOut], summary="获取所有分类")
async def admin_list_categories(
    _: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MaterialCategory).order_by(MaterialCategory.sort_order)
    )
    return result.scalars().all()


@router.post(
    "/categories",
    response_model=CategoryOut,
    status_code=status.HTTP_201_CREATED,
    summary="创建分类",
)
async def admin_create_category(
    body: CategoryCreate,
    _: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    cat = MaterialCategory(**body.model_dump())
    db.add(cat)
    await db.flush()
    await db.refresh(cat)
    return cat


@router.put("/categories/{category_id}", response_model=CategoryOut, summary="更新分类")
async def admin_update_category(
    category_id: int,
    body: CategoryUpdate,
    _: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MaterialCategory).where(MaterialCategory.id == category_id)
    )
    cat = result.scalar_one_or_none()
    if cat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="分类不存在")

    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(cat, key, val)

    await db.flush()
    await db.refresh(cat)
    return cat


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT, summary="删除分类")
async def admin_delete_category(
    category_id: int,
    _: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MaterialCategory).where(MaterialCategory.id == category_id)
    )
    cat = result.scalar_one_or_none()
    if cat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="分类不存在")
    await db.delete(cat)


# ---------- 材料管理 ----------

@router.get("/materials", response_model=PageResponse[MaterialOut], summary="材料列表（管理）")
async def admin_list_materials(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    category_id: Optional[int] = None,
    name: Optional[str] = None,
    _: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    conditions = []
    if category_id:
        conditions.append(Material.category_id == category_id)
    if name:
        conditions.append(Material.name.like(f"%{name}%"))

    from sqlalchemy import and_
    where_clause = and_(*conditions) if conditions else True

    count_result = await db.execute(
        select(func.count()).select_from(Material).where(where_clause)
    )
    total = count_result.scalar_one()

    offset = (page - 1) * per_page
    data_result = await db.execute(
        select(Material).where(where_clause).order_by(Material.sort_order, Material.id)
        .offset(offset).limit(per_page)
    )
    items = data_result.scalars().all()
    return PageResponse(items=items, total=total, page=page, per_page=per_page)


@router.post(
    "/materials",
    response_model=MaterialOut,
    status_code=status.HTTP_201_CREATED,
    summary="创建材料",
)
async def admin_create_material(
    body: MaterialCreate,
    _: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    mat = Material(**body.model_dump())
    db.add(mat)
    await db.flush()
    await db.refresh(mat)
    return mat


@router.put("/materials/{material_id}", response_model=MaterialOut, summary="更新材料")
async def admin_update_material(
    material_id: int,
    body: MaterialUpdate,
    _: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Material).where(Material.id == material_id))
    mat = result.scalar_one_or_none()
    if mat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="材料不存在")

    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(mat, key, val)

    await db.flush()
    await db.refresh(mat)
    return mat


@router.delete("/materials/{material_id}", status_code=status.HTTP_204_NO_CONTENT, summary="删除材料")
async def admin_delete_material(
    material_id: int,
    _: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Material).where(Material.id == material_id))
    mat = result.scalar_one_or_none()
    if mat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="材料不存在")
    await db.delete(mat)


# ---------- 设计管理 ----------

@router.get("/designs", response_model=PageResponse[DesignOut], summary="设计列表（管理）")
async def admin_list_designs(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    is_published: Optional[int] = Query(None),
    _: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import and_
    conditions = []
    if is_published is not None:
        conditions.append(Design.is_published == is_published)

    where_clause = and_(*conditions) if conditions else True

    count_result = await db.execute(
        select(func.count()).select_from(Design).where(where_clause)
    )
    total = count_result.scalar_one()

    offset = (page - 1) * per_page
    data_result = await db.execute(
        select(Design).where(where_clause).order_by(Design.created_at.desc())
        .offset(offset).limit(per_page)
    )
    designs = data_result.scalars().all()

    from app.routers.designs import _build_design_out
    items = [await _build_design_out(d, db) for d in designs]
    return PageResponse(items=items, total=total, page=page, per_page=per_page)


@router.put("/designs/{design_id}/publish", response_model=DesignOut, summary="切换设计发布状态")
async def admin_toggle_publish(
    design_id: int,
    _: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Design).where(Design.id == design_id))
    design = result.scalar_one_or_none()
    if design is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="设计不存在")

    design.is_published = 0 if design.is_published else 1
    await db.flush()
    await db.refresh(design)

    from app.routers.designs import _build_design_out
    return await _build_design_out(design, db)


# ---------- 优惠券模板管理 ----------

@router.get(
    "/coupon-templates",
    response_model=List[CouponTemplateOut],
    summary="优惠券模板列表",
)
async def admin_list_coupon_templates(
    _: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CouponTemplate).order_by(CouponTemplate.created_at.desc())
    )
    return result.scalars().all()


@router.post(
    "/coupon-templates",
    response_model=CouponTemplateOut,
    status_code=status.HTTP_201_CREATED,
    summary="创建优惠券模板",
)
async def admin_create_coupon_template(
    body: CouponTemplateCreate,
    _: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    tmpl = CouponTemplate(**body.model_dump())
    db.add(tmpl)
    await db.flush()
    await db.refresh(tmpl)
    return tmpl


@router.put(
    "/coupon-templates/{template_id}",
    response_model=CouponTemplateOut,
    summary="更新优惠券模板",
)
async def admin_update_coupon_template(
    template_id: int,
    body: CouponTemplateUpdate,
    _: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CouponTemplate).where(CouponTemplate.id == template_id)
    )
    tmpl = result.scalar_one_or_none()
    if tmpl is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="模板不存在")

    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(tmpl, key, val)

    await db.flush()
    await db.refresh(tmpl)
    return tmpl


@router.delete(
    "/coupon-templates/{template_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="删除优惠券模板",
)
async def admin_delete_coupon_template(
    template_id: int,
    _: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CouponTemplate).where(CouponTemplate.id == template_id)
    )
    tmpl = result.scalar_one_or_none()
    if tmpl is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="模板不存在")
    await db.delete(tmpl)


@router.post(
    "/coupon-templates/{template_id}/distribute",
    response_model=DistributeResponse,
    summary="给所有用户发放优惠券",
)
async def admin_distribute_coupons(
    template_id: int,
    _: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """向全体用户发放指定模板的优惠券"""
    tmpl_result = await db.execute(
        select(CouponTemplate).where(CouponTemplate.id == template_id)
    )
    tmpl = tmpl_result.scalar_one_or_none()
    if tmpl is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="模板不存在")

    # 获取所有用户
    users_result = await db.execute(select(User.id))
    user_ids = [row[0] for row in users_result.all()]

    if not user_ids:
        return DistributeResponse(distributed_count=0, message="没有用户需要发放")

    expired_at = datetime.utcnow() + timedelta(days=tmpl.expired_days)
    count = 0
    for uid in user_ids:
        db.add(
            UserCoupon(
                user_id=uid,
                template_id=template_id,
                expired_at=expired_at,
            )
        )
        count += 1

    # 更新已发放数量
    tmpl.issued_count += count
    await db.flush()

    return DistributeResponse(
        distributed_count=count,
        message=f"已向 {count} 位用户发放优惠券",
    )


# ---------- 订单管理（预留） ----------

@router.get("/orders", response_model=PageResponse[dict], summary="订单列表（预留）")
async def admin_list_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    order_status: Optional[str] = Query(None, alias="status"),
    _: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """订单管理预留接口，本期返回基础数据"""
    from sqlalchemy import and_
    conditions = []
    if order_status:
        conditions.append(Order.status == order_status)

    where_clause = and_(*conditions) if conditions else True

    count_result = await db.execute(
        select(func.count()).select_from(Order).where(where_clause)
    )
    total = count_result.scalar_one()

    offset = (page - 1) * per_page
    data_result = await db.execute(
        select(Order).where(where_clause).order_by(Order.created_at.desc())
        .offset(offset).limit(per_page)
    )
    orders = data_result.scalars().all()

    items = [
        {
            "id": o.id,
            "user_id": o.user_id,
            "design_id": o.design_id,
            "total_amount": str(o.total_amount),
            "pay_amount": str(o.pay_amount),
            "status": o.status,
            "created_at": o.created_at.isoformat(),
        }
        for o in orders
    ]
    return PageResponse(items=items, total=total, page=page, per_page=per_page)
