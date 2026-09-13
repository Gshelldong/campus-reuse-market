from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from db import get_db
from models.user import User
from schemas.user import LoginRequest, LoginResponse, RegisterRequest, UserOut
from utils.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["认证"])


@router.post("/register", response_model=UserOut)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == data.username))
    exists = result.scalar_one_or_none()
    if exists:
        raise HTTPException(400, "用户名已存在")
    user = User(
        username=data.username,
        password=hash_password(data.password),
        nickname=data.nickname or data.username,
        phone=data.phone,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == data.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(400, "用户名或密码错误")
    if user.is_deleted == 1:
        raise HTTPException(403, "账号不存在")
    if user.status == 1:
        raise HTTPException(403, "账号已被禁用，请联系管理员")
    token = create_access_token(user.id, user.role)
    return LoginResponse(token=token, user=UserOut.model_validate(user))
