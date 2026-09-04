from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db import get_db
from dependencies import get_current_admin, get_current_user
from models.user import User
from schemas.user import PasswordUpdateRequest, UserOut, UserUpdateRequest
from utils.security import hash_password, verify_password

router = APIRouter(prefix="/api/user", tags=["用户"])


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return user


@router.put("/me", response_model=UserOut)
def update_me(
    data: UserUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.nickname is not None:
        user.nickname = data.nickname
    if data.phone is not None:
        user.phone = data.phone
    if data.avatar is not None:
        user.avatar = data.avatar
    db.commit()
    db.refresh(user)
    return user


@router.put("/password")
def update_password(
    data: PasswordUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(data.old_password, user.password):
        raise HTTPException(400, "原密码错误")
    user.password = hash_password(data.new_password)
    db.commit()
    return {"message": "密码修改成功"}


# ---------- 管理员 ----------

@router.get("/list", response_model=list[UserOut])
def list_users(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(User).filter(User.is_deleted == 0, User.role == 0).order_by(User.id.desc()).all()


@router.put("/{user_id}/status")
def toggle_user_status(
    user_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.id == user_id, User.is_deleted == 0).first()
    if not target:
        raise HTTPException(404, "用户不存在")
    target.status = 0 if target.status == 1 else 1
    db.commit()
    return {"message": "操作成功", "status": target.status}
