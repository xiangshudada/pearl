from datetime import datetime, timedelta
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt

from app.config import settings
from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.auth import WxLoginRequest, TokenResponse
from app.schemas.user import UserOut

router = APIRouter(prefix="/auth", tags=["认证"])


def create_access_token(user_id: int, openid: str, is_admin: bool = False) -> str:
    """生成 JWT token"""
    expire = datetime.utcnow() + timedelta(days=settings.JWT_EXPIRE_DAYS)
    payload = {
        "user_id": user_id,
        "openid": openid,
        "is_admin": is_admin,
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


@router.post("/login", response_model=TokenResponse, summary="微信小程序登录")
async def wx_login(body: WxLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    使用微信小程序 code 换取 openid，创建或查找用户，返回 JWT token。
    """
    # 调用微信 jscode2session 接口
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            settings.WX_LOGIN_URL,
            params={
                "appid": settings.WX_APP_ID,
                "secret": settings.WX_APP_SECRET,
                "js_code": body.code,
                "grant_type": "authorization_code",
            },
        )

    wx_data = resp.json()

    if "errcode" in wx_data and wx_data["errcode"] != 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"微信登录失败：{wx_data.get('errmsg', '未知错误')}",
        )

    openid: Optional[str] = wx_data.get("openid")
    if not openid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="未能获取 openid",
        )

    # 查找或创建用户
    result = await db.execute(select(User).where(User.openid == openid))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(openid=openid)
        db.add(user)
        await db.flush()
        await db.refresh(user)

    token = create_access_token(
        user_id=user.id,
        openid=user.openid,
        is_admin=bool(user.is_admin),
    )
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserOut, summary="获取当前用户信息")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
