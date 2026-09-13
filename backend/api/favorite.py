from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from db import get_db
from dependencies import get_current_user
from models.favorite import UserFavorite
from models.goods import Goods, GoodsImage
from models.user import User

router = APIRouter(prefix="/api/favorite", tags=["收藏"])


@router.post("/{goods_id}")
async def add_favorite(
    goods_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Goods).where(Goods.id == goods_id, Goods.is_deleted == 0)
    )
    goods = result.scalar_one_or_none()
    if not goods:
        raise HTTPException(404, "商品不存在")
    result = await db.execute(
        select(UserFavorite).where(
            UserFavorite.user_id == user.id, UserFavorite.goods_id == goods_id
        )
    )
    exists = result.scalar_one_or_none()
    if exists:
        return {"message": "已收藏过该商品"}
    db.add(UserFavorite(user_id=user.id, goods_id=goods_id))
    await db.commit()
    return {"message": "收藏成功"}


@router.delete("/{goods_id}")
async def cancel_favorite(
    goods_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserFavorite).where(
            UserFavorite.user_id == user.id, UserFavorite.goods_id == goods_id
        )
    )
    favorite = result.scalar_one_or_none()
    if not favorite:
        raise HTTPException(404, "未收藏该商品")
    await db.delete(favorite)
    await db.commit()
    return {"message": "已取消收藏"}


@router.get("/check/{goods_id}")
async def check_favorite(
    goods_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserFavorite).where(
            UserFavorite.user_id == user.id, UserFavorite.goods_id == goods_id
        )
    )
    exists = result.scalar_one_or_none()
    return {"favorited": exists is not None}


@router.get("/my")
async def my_favorites(
    page: int = 1,
    page_size: int = 10,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    count_result = await db.execute(
        select(func.count()).select_from(UserFavorite).where(UserFavorite.user_id == user.id)
    )
    total = count_result.scalar_one()

    favorites_result = await db.execute(
        select(UserFavorite)
        .where(UserFavorite.user_id == user.id)
        .order_by(UserFavorite.create_time.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    favorites = favorites_result.scalars().all()

    goods_ids = [f.goods_id for f in favorites]
    goods_map = {}
    if goods_ids:
        goods_result = await db.execute(
            select(Goods)
            .options(selectinload(Goods.images))
            .where(Goods.id.in_(goods_ids))
        )
        goods_map = {g.id: g for g in goods_result.scalars().all()}

    records = []
    for f in favorites:
        g = goods_map.get(f.goods_id)
        if not g or g.is_deleted == 1:
            continue
        records.append(
            {
                "favorite_id": f.id,
                "favorite_time": f.create_time,
                "id": g.id,
                "title": g.title,
                "price": float(g.price),
                "original_price": float(g.original_price) if g.original_price else None,
                "condition": g.condition,
                "status": g.status,
                "cover_image": g.images[0].image_url if g.images else "",
            }
        )
    return {"total": total, "page": page, "page_size": page_size, "records": records}
