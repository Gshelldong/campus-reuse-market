import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

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


async def _build_orders(db: AsyncSession, base_stmt, page: int, page_size: int):
    count_result = await db.execute(
        select(func.count()).select_from(base_stmt.subquery())
    )
    total = count_result.scalar_one()

    orders_result = await db.execute(
        base_stmt.order_by(Order.create_time.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    orders = orders_result.scalars().all()

    goods_map = {}
    if orders:
        goods_result = await db.execute(
            select(Goods)
            .options(selectinload(Goods.images))
            .where(Goods.id.in_([o.goods_id for o in orders]))
        )
        goods_map = {g.id: g for g in goods_result.scalars().all()}

    user_ids = {o.seller_id for o in orders} | {o.buyer_id for o in orders}
    user_map = {}
    if user_ids:
        users_result = await db.execute(select(User).where(User.id.in_(user_ids)))
        user_map = {u.id: u for u in users_result.scalars().all()}

    records = [_order_to_dict(o, goods_map, user_map) for o in orders]
    return {"total": total, "page": page, "page_size": page_size, "records": records}


@router.post("/{goods_id}")
async def create_order(
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
    await db.commit()
    await db.refresh(order)
    return {"message": "下单成功", "order_id": order.id, "order_no": order.order_no}


@router.get("/my")
async def my_orders(
    page: int = 1,
    page_size: int = 10,
    role: str = "all",
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Order).where(Order.is_deleted == 0)
    if role == "buyer":
        stmt = stmt.where(Order.buyer_id == user.id)
    elif role == "seller":
        stmt = stmt.where(Order.seller_id == user.id)
    else:
        stmt = stmt.where(or_(Order.buyer_id == user.id, Order.seller_id == user.id))
    return await _build_orders(db, stmt, page, page_size)


@router.put("/{order_id}/confirm")
async def confirm_order(
    order_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.is_deleted == 0)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "订单不存在")
    if order.buyer_id != user.id and order.seller_id != user.id:
        raise HTTPException(403, "无权操作该订单")
    if order.status != 0:
        raise HTTPException(400, "订单状态不允许确认")
    order.status = 1
    await db.commit()
    return {"message": "交易完成"}


@router.put("/{order_id}/cancel")
async def cancel_order(
    order_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.is_deleted == 0)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "订单不存在")
    if order.buyer_id != user.id and order.seller_id != user.id:
        raise HTTPException(403, "无权操作该订单")
    if order.status != 0:
        raise HTTPException(400, "订单状态不允许取消")
    order.status = 2
    goods_result = await db.execute(select(Goods).where(Goods.id == order.goods_id))
    goods = goods_result.scalar_one_or_none()
    if goods:
        goods.status = 1  # 取消订单后商品重新上架
    await db.commit()
    return {"message": "订单已取消，商品重新上架"}


# ---------- 管理员 ----------

@router.get("/admin/list")
async def admin_list_orders(
    page: int = 1,
    page_size: int = 10,
    status: int | None = None,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Order).where(Order.is_deleted == 0)
    if status is not None:
        stmt = stmt.where(Order.status == status)
    return await _build_orders(db, stmt, page, page_size)
