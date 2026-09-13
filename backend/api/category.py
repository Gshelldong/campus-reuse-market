from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from db import get_db
from dependencies import get_current_admin
from models.category import Category
from models.goods import Goods
from schemas.category import CategoryCreate, CategoryOut, CategoryUpdate

router = APIRouter(prefix="/api/category", tags=["分类"])


@router.get("/list", response_model=list[CategoryOut])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Category)
        .where(Category.is_deleted == 0)
        .order_by(Category.sort, Category.id)
    )
    return result.scalars().all()


@router.post("", response_model=CategoryOut)
async def create_category(
    data: CategoryCreate,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Category).where(Category.name == data.name, Category.is_deleted == 0)
    )
    exists = result.scalar_one_or_none()
    if exists:
        raise HTTPException(400, "分类已存在")
    category = Category(name=data.name, sort=data.sort)
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.put("/{category_id}", response_model=CategoryOut)
async def update_category(
    category_id: int,
    data: CategoryUpdate,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.is_deleted == 0)
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(404, "分类不存在")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(category, field, value)
    await db.commit()
    await db.refresh(category)
    return category


@router.delete("/{category_id}")
async def delete_category(
    category_id: int,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.is_deleted == 0)
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(404, "分类不存在")
    goods_count_result = await db.execute(
        select(func.count()).select_from(Goods).where(
            Goods.category_id == category_id, Goods.is_deleted == 0
        )
    )
    goods_count = goods_count_result.scalar_one()
    if goods_count > 0:
        raise HTTPException(400, f"该分类下有 {goods_count} 件商品，无法删除")
    category.is_deleted = 1
    await db.commit()
    return {"message": "删除成功"}
