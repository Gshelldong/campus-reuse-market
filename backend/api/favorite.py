from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from db import get_db
from dependencies import get_current_user
from models.favorite import UserFavorite
from models.goods import Goods, GoodsImage
from models.user import User

router = APIRouter(prefix="/api/favorite", tags=["收藏"])


@router.post("/{goods_id}")
def add_favorite(
    goods_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goods = db.query(Goods).filter(Goods.id == goods_id, Goods.is_deleted == 0).first()
    if not goods:
        raise HTTPException(404, "商品不存在")
    exists = (
        db.query(UserFavorite)
        .filter(UserFavorite.user_id == user.id, UserFavorite.goods_id == goods_id)
        .first()
    )
    if exists:
        return {"message": "已收藏过该商品"}
    db.add(UserFavorite(user_id=user.id, goods_id=goods_id))
    db.commit()
    return {"message": "收藏成功"}


@router.delete("/{goods_id}")
def cancel_favorite(
    goods_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    favorite = (
        db.query(UserFavorite)
        .filter(UserFavorite.user_id == user.id, UserFavorite.goods_id == goods_id)
        .first()
    )
    if not favorite:
        raise HTTPException(404, "未收藏该商品")
    db.delete(favorite)
    db.commit()
    return {"message": "已取消收藏"}


@router.get("/check/{goods_id}")
def check_favorite(
    goods_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exists = (
        db.query(UserFavorite)
        .filter(UserFavorite.user_id == user.id, UserFavorite.goods_id == goods_id)
        .first()
    )
    return {"favorited": exists is not None}


@router.get("/my")
def my_favorites(
    page: int = 1,
    page_size: int = 10,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(UserFavorite).filter(UserFavorite.user_id == user.id)
    total = query.count()
    favorites = (
        query.order_by(UserFavorite.create_time.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    goods_ids = [f.goods_id for f in favorites]
    goods_map = {
        g.id: g
        for g in db.query(Goods)
        .options(joinedload(Goods.images))
        .filter(Goods.id.in_(goods_ids))
        .all()
    }
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
