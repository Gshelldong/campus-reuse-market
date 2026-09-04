from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db import get_db
from models.user import User
from schemas.user import LoginRequest, LoginResponse, RegisterRequest, UserOut
from utils.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["认证"])


@router.post("/register", response_model=UserOut)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    exists = db.query(User).filter(User.username == data.username).first()
    if exists:
        raise HTTPException(400, "用户名已存在")
    user = User(
        username=data.username,
        password=hash_password(data.password),
        nickname=data.nickname or data.username,
        phone=data.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(400, "用户名或密码错误")
    if user.is_deleted == 1:
        raise HTTPException(403, "账号不存在")
    if user.status == 1:
        raise HTTPException(403, "账号已被禁用，请联系管理员")
    token = create_access_token(user.id, user.role)
    return LoginResponse(token=token, user=UserOut.model_validate(user))
