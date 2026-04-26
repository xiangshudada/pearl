from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.deps import get_current_user
from app.models.coupon import UserCoupon, CouponTemplate
from app.models.user import User
from app.schemas.coupon import UserCouponOut, CouponTemplateOut

router = APIRouter(prefix="/coupons", tags=["优惠券"])


@router.get("", response_model=List[UserCouponOut], summary="我的优惠券列表")
async def list_my_coupons(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取当前用户的优惠券列表，含模板详情"""
    result = await db.execute(
        select(UserCoupon)
        .where(UserCoupon.user_id == current_user.id)
        .order_by(UserCoupon.expired_at.asc(), UserCoupon.created_at.desc())
    )
    user_coupons = result.scalars().all()

    # 填充模板信息
    output = []
    for uc in user_coupons:
        tmpl_result = await db.execute(
            select(CouponTemplate).where(CouponTemplate.id == uc.template_id)
        )
        tmpl = tmpl_result.scalar_one_or_none()
        out = UserCouponOut(
            id=uc.id,
            user_id=uc.user_id,
            template_id=uc.template_id,
            used_at=uc.used_at,
            expired_at=uc.expired_at,
            created_at=uc.created_at,
            template=tmpl,
        )
        output.append(out)

    return output
