from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from db import get_db
from models.user import User
from utils.security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "未登录")
    try:
        payload = decode_access_token(credentials.credentials)
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "登录已过期，请重新登录")
    result = await db.execute(select(User).where(User.id == payload.get("user_id")))
    user = result.scalar_one_or_none()
    if user is None or user.is_deleted == 1:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "用户不存在")
    if user.status == 1:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "账号已被禁用")
    return user


async def get_current_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != 1:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "无管理员权限")
    return user
