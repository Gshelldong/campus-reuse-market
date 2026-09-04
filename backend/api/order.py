import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from db import get_db
from dependencies import get_current_admin, get_current_user
from models.goods import Goods, GoodsImage
from models.order import Order
from models.user import User

router = APIRouter(prefix="/api/order", tags=["订单"])


def _order_to_dict(order: Order, goods_map: dict, user_map: dict) -> dict:
    goods = goods_map.get(order.goods_id)
    seller = user_map.get(order.seller_id)
    buyer = user_map.get(order.buyer_id)
    return {
        "id": order.id,
        "order_no": order.order_no,
        "goods_id": order.goods_id,
        "goods_title": goods.title if goods else "",
        "goods_cover": (goods.images[0].image_url if goods and goods.images else ""),
        "seller_id": order.seller_id,
        "seller_name": seller.nickname if seller else "",
        "buyer_id": order.buyer_id,
        "buyer_name": buyer.nickname if buyer else "",
        "price": order.price,
        "status": order.status,
        "create_time": order.create_time,
    }


def _build_orders(db: Session, query, page: int, page_size: int):
    total = query.count()
    orders = (
        query.order_by(Order.create_time.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    goods_map = {
        g.id: g
        for g in db.query(Goods)
        .options(joinedload(Goods.images))
        .filter(Goods.id.in_([o.goods_id for o in orders]))
        .all()
    }
    user_ids = {o.seller_id for o in orders} | {o.buyer_id for o in orders}
    user_map = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()}
    records = [_order_to_dict(o, goods_map, user_map) for o in orders]
    return {"total": total, "page": page, "page_size": page_size, "records": records}


@router.post("/{goods_id}")
def create_order(
    goods_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goods = (
        db.query(Goods)
        .filter(Goods.id == goods_id, Goods.is_deleted == 0)
        .first()
    )
    if not goods:
        raise HTTPException(404, "商品不存在")
    if goods.status != 1:
        raise HTTPException(400, "商品不可购买（未上架或已售出）")
    if goods.user_id == user.id:
        raise HTTPException(400, "不能购买自己发布的商品")
    order = Order(
        order_no=datetime.now().strftime("%Y%m%d%H%M%S") + uuid.uuid4().hex[:8],
        goods_id=goods.id,
        seller_id=goods.user_id,
        buyer_id=user.id,
        price=goods.price,
        status=0,
    )
    goods.status = 2  # 已售出
    db.add(order)
    db.commit()
    db.refresh(order)
    return {"message": "下单成功", "order_id": order.id, "order_no": order.order_no}


@router.get("/my")
def my_orders(
    page: int = 1,
    page_size: int = 10,
    role: str = "all",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Order).filter(Order.is_deleted == 0)
    if role == "buyer":
        query = query.filter(Order.buyer_id == user.id)
    elif role == "seller":
        query = query.filter(Order.seller_id == user.id)
    else:
        query = query.filter((Order.buyer_id == user.id) | (Order.seller_id == user.id))
    return _build_orders(db, query, page, page_size)


@router.put("/{order_id}/confirm")
def confirm_order(
    order_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id, Order.is_deleted == 0).first()
    if not order:
        raise HTTPException(404, "订单不存在")
    if order.buyer_id != user.id and order.seller_id != user.id:
        raise HTTPException(403, "无权操作该订单")
    if order.status != 0:
        raise HTTPException(400, "订单状态不允许确认")
    order.status = 1
    db.commit()
    return {"message": "交易完成"}


@router.put("/{order_id}/cancel")
def cancel_order(
    order_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id, Order.is_deleted == 0).first()
    if not order:
        raise HTTPException(404, "订单不存在")
    if order.buyer_id != user.id and order.seller_id != user.id:
        raise HTTPException(403, "无权操作该订单")
    if order.status != 0:
        raise HTTPException(400, "订单状态不允许取消")
    order.status = 2
    goods = db.query(Goods).filter(Goods.id == order.goods_id).first()
    if goods:
        goods.status = 1  # 取消订单后商品重新上架
    db.commit()
    return {"message": "订单已取消，商品重新上架"}


# ---------- 管理员 ----------

@router.get("/admin/list")
def admin_list_orders(
    page: int = 1,
    page_size: int = 10,
    status: int | None = None,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Order).filter(Order.is_deleted == 0)
    if status is not None:
        query = query.filter(Order.status == status)
    return _build_orders(db, query, page, page_size)
