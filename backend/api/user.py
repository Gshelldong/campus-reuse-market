from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from db import get_db
from dependencies import get_current_admin, get_current_user
from models.user import User
from schemas.user import PasswordUpdateRequest, UserOut, UserUpdateRequest
from utils.security import hash_password, verify_password

router = APIRouter(prefix="/api/user", tags=["用户"])


@router.get("/me", response_model=UserOut)
async def get_me(user: User = Depends(get_current_user)):
    return user


@router.put("/me", response_model=UserOut)
async def update_me(
    data: UserUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.nickname is not None:
        user.nickname = data.nickname
    if data.phone is not None:
        user.phone = data.phone
    if data.avatar is not None:
        user.avatar = data.avatar
    await db.commit()
    await db.refresh(user)
    return user


@router.put("/password")
async def update_password(
    data: PasswordUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(data.old_password, user.password):
        raise HTTPException(400, "原密码错误")
    user.password = hash_password(data.new_password)
    await db.commit()
    return {"message": "密码修改成功"}


# ---------- 管理员 ----------

@router.get("/list", response_model=list[UserOut])
async def list_users(admin: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.is_deleted == 0, User.role == 0).order_by(User.id.desc())
    )
    return result.scalars().all()


@router.put("/{user_id}/status")
async def toggle_user_status(
    user_id: int,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id, User.is_deleted == 0))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(404, "用户不存在")
    target.status = 0 if target.status == 1 else 1
    await db.commit()
    return {"message": "操作成功", "status": target.status}
