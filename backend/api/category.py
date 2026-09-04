from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db import get_db
from dependencies import get_current_admin
from models.category import Category
from models.goods import Goods
from schemas.category import CategoryCreate, CategoryOut, CategoryUpdate

router = APIRouter(prefix="/api/category", tags=["分类"])


@router.get("/list", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return (
        db.query(Category)
        .filter(Category.is_deleted == 0)
        .order_by(Category.sort, Category.id)
        .all()
    )


@router.post("", response_model=CategoryOut)
def create_category(
    data: CategoryCreate,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    exists = db.query(Category).filter(Category.name == data.name, Category.is_deleted == 0).first()
    if exists:
        raise HTTPException(400, "分类已存在")
    category = Category(name=data.name, sort=data.sort)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int,
    data: CategoryUpdate,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    category = db.query(Category).filter(Category.id == category_id, Category.is_deleted == 0).first()
    if not category:
        raise HTTPException(404, "分类不存在")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(category, field, value)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    category = db.query(Category).filter(Category.id == category_id, Category.is_deleted == 0).first()
    if not category:
        raise HTTPException(404, "分类不存在")
    goods_count = db.query(Goods).filter(Goods.category_id == category_id, Goods.is_deleted == 0).count()
    if goods_count > 0:
        raise HTTPException(400, f"该分类下有 {goods_count} 件商品，无法删除")
    category.is_deleted = 1
    db.commit()
    return {"message": "删除成功"}
