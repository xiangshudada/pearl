from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.database import get_db
from app.deps import get_current_user
from app.models.address import Address
from app.models.user import User
from app.schemas.address import AddressCreate, AddressUpdate, AddressOut

router = APIRouter(prefix="/addresses", tags=["收货地址"])


@router.get("", response_model=List[AddressOut], summary="获取地址列表")
async def list_addresses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Address)
        .where(Address.user_id == current_user.id)
        .order_by(Address.is_default.desc(), Address.created_at.asc())
    )
    return result.scalars().all()


@router.post("", response_model=AddressOut, status_code=status.HTTP_201_CREATED, summary="新增地址")
async def create_address(
    body: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # 若设为默认，先取消其他默认
    if body.is_default:
        await _clear_default(current_user.id, db)

    addr = Address(user_id=current_user.id, **body.model_dump())
    db.add(addr)
    await db.flush()
    await db.refresh(addr)
    return addr


@router.get("/{address_id}", response_model=AddressOut, summary="获取单个地址")
async def get_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    addr = await _get_or_404(address_id, current_user.id, db)
    return addr


@router.put("/{address_id}", response_model=AddressOut, summary="更新地址")
async def update_address(
    address_id: int,
    body: AddressUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    addr = await _get_or_404(address_id, current_user.id, db)

    # 若设为默认，先取消其他默认
    if body.is_default:
        await _clear_default(current_user.id, db, exclude_id=address_id)

    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(addr, key, val)

    await db.flush()
    await db.refresh(addr)
    return addr


@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT, summary="删除地址")
async def delete_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    addr = await _get_or_404(address_id, current_user.id, db)
    await db.delete(addr)


@router.patch("/{address_id}/default", response_model=AddressOut, summary="设为默认地址")
async def set_default(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    addr = await _get_or_404(address_id, current_user.id, db)
    await _clear_default(current_user.id, db, exclude_id=address_id)
    addr.is_default = 1
    await db.flush()
    await db.refresh(addr)
    return addr


# ---------- 私有辅助函数 ----------

async def _get_or_404(address_id: int, user_id: int, db: AsyncSession) -> Address:
    result = await db.execute(
        select(Address).where(Address.id == address_id, Address.user_id == user_id)
    )
    addr = result.scalar_one_or_none()
    if addr is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="地址不存在")
    return addr


async def _clear_default(user_id: int, db: AsyncSession, exclude_id: int = None):
    """将用户的所有默认地址取消（可排除指定 id）"""
    stmt = (
        update(Address)
        .where(Address.user_id == user_id, Address.is_default == 1)
        .values(is_default=0)
    )
    if exclude_id:
        stmt = stmt.where(Address.id != exclude_id)
    await db.execute(stmt)
