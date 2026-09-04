from decimal import Decimal

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from db import get_db
from dependencies import get_current_admin, get_current_user
from models.category import Category
from models.goods import Goods, GoodsImage
from models.user import User
from schemas.goods import GoodsOut, GoodsUpdate
from utils.file import save_upload_file

router = APIRouter(prefix="/api/goods", tags=["商品"])


def _get_goods_or_404(db: Session, goods_id: int) -> Goods:
    goods = (
        db.query(Goods)
        .options(joinedload(Goods.images))
        .filter(Goods.id == goods_id, Goods.is_deleted == 0)
        .first()
    )
    if not goods:
        raise HTTPException(404, "商品不存在")
    return goods


def _build_list_items(db: Session, query, page: int, page_size: int, order_by: str | None = None):
    total = query.count()
    order_cols = {
        "price_asc": Goods.price.asc(),
        "price_desc": Goods.price.desc(),
    }
    col = order_cols.get(order_by, Goods.create_time.desc())
    rows = (
        query.order_by(col)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    goods_ids = [g.id for g in rows]
    cover_map = {}
    if goods_ids:
        covers = (
            db.query(GoodsImage.goods_id, GoodsImage.image_url)
            .filter(GoodsImage.goods_id.in_(goods_ids))
            .order_by(GoodsImage.sort)
            .all()
        )
        for goods_id, url in covers:
            cover_map.setdefault(goods_id, url)
    seller_ids = {g.user_id for g in rows}
    sellers = {u.id: u for u in db.query(User).filter(User.id.in_(seller_ids)).all()}
    records = []
    for g in rows:
        seller = sellers.get(g.user_id)
        records.append(
            {
                "id": g.id,
                "title": g.title,
                "price": g.price,
                "original_price": g.original_price,
                "condition": g.condition,
                "status": g.status,
                "category_id": g.category_id,
                "user_id": g.user_id,
                "nickname": seller.nickname if seller else "",
                "avatar": seller.avatar if seller else "",
                "cover_image": cover_map.get(g.id, ""),
                "create_time": g.create_time,
            }
        )
    return {"total": total, "page": page, "page_size": page_size, "records": records}


def _apply_filters(query, keyword: str | None, category_id: int | None, status: int | None):
    if keyword:
        query = query.filter(or_(Goods.title.contains(keyword), Goods.description.contains(keyword)))
    if category_id:
        query = query.filter(Goods.category_id == category_id)
    if status is not None:
        query = query.filter(Goods.status == status)
    return query


@router.get("")
def list_goods(
    page: int = 1,
    page_size: int = 10,
    keyword: str | None = None,
    category_id: int | None = None,
    order_by: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Goods).filter(Goods.is_deleted == 0, Goods.status == 1)
    query = _apply_filters(query, keyword, category_id, None)
    return _build_list_items(db, query, page, page_size, order_by)


@router.get("/my")
def my_published(
    page: int = 1,
    page_size: int = 10,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Goods).filter(Goods.is_deleted == 0, Goods.user_id == user.id)
    return _build_list_items(db, query, page, page_size)


@router.post("", response_model=GoodsOut)
def publish_goods(
    title: str = Form(...),
    description: str = Form(""),
    price: Decimal = Form(...),
    original_price: Decimal | None = Form(None),
    condition: int = Form(2),
    category_id: int = Form(...),
    images: list[UploadFile] = File(default=[]),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not db.query(Category).filter(Category.id == category_id, Category.is_deleted == 0).first():
        raise HTTPException(400, "分类不存在")
    goods = Goods(
        user_id=user.id,
        category_id=category_id,
        title=title,
        description=description,
        price=price,
        original_price=original_price,
        condition=condition,
        status=0,
    )
    db.add(goods)
    db.flush()
    for idx, img in enumerate(images):
        url = save_upload_file(img)
        goods.images.append(GoodsImage(goods_id=goods.id, image_url=url, sort=idx))
    db.commit()
    db.refresh(goods)
    return goods


@router.get("/{goods_id}", response_model=GoodsOut)
def goods_detail(goods_id: int, db: Session = Depends(get_db)):
    return _get_goods_or_404(db, goods_id)


@router.put("/{goods_id}")
def update_goods(
    goods_id: int,
    data: GoodsUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goods = _get_goods_or_404(db, goods_id)
    if goods.user_id != user.id and user.role != 1:
        raise HTTPException(403, "只能编辑自己发布的商品")
    if data.category_id and not db.query(Category).filter(Category.id == data.category_id).first():
        raise HTTPException(400, "分类不存在")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(goods, field, value)
    goods.status = 0  # 重新编辑后需再次审核
    db.commit()
    return {"message": "修改成功，已重新提交审核"}


@router.delete("/{goods_id}")
def delete_goods(
    goods_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goods = _get_goods_or_404(db, goods_id)
    if goods.user_id != user.id and user.role != 1:
        raise HTTPException(403, "只能删除自己发布的商品")
    goods.is_deleted = 1
    goods.status = 3
    db.commit()
    return {"message": "已删除"}


@router.put("/{goods_id}/offline")
def offline_goods(
    goods_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goods = _get_goods_or_404(db, goods_id)
    if goods.user_id != user.id and user.role != 1:
        raise HTTPException(403, "无权操作")
    goods.status = 3
    db.commit()
    return {"message": "已下架"}


# ---------- 管理员 ----------

@router.get("/admin/list")
def admin_list_goods(
    page: int = 1,
    page_size: int = 10,
    keyword: str | None = None,
    category_id: int | None = None,
    status: int | None = None,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Goods).filter(Goods.is_deleted == 0)
    query = _apply_filters(query, keyword, category_id, status)
    return _build_list_items(db, query, page, page_size)


@router.put("/admin/{goods_id}/audit")
def audit_goods(
    goods_id: int,
    approved: bool,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    goods = _get_goods_or_404(db, goods_id)
    goods.status = 1 if approved else 3
    db.commit()
    return {"message": "审核通过，商品已上架" if approved else "审核拒绝，商品已下架", "status": goods.status}
