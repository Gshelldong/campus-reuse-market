from decimal import Decimal

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from db import get_db
from dependencies import get_current_admin, get_current_user
from models.category import Category
from models.goods import Goods, GoodsImage
from models.user import User
from schemas.goods import GoodsOut, GoodsUpdate
from utils.file import save_upload_file

router = APIRouter(prefix="/api/goods", tags=["商品"])


async def _get_goods_or_404(db: AsyncSession, goods_id: int) -> Goods:
    result = await db.execute(
        select(Goods)
        .where(Goods.id == goods_id, Goods.is_deleted == 0)
        .options(selectinload(Goods.images))
    )
    goods = result.scalar_one_or_none()
    if not goods:
        raise HTTPException(status_code=404, detail="商品不存在")
    return goods


async def _build_list_items(
    db: AsyncSession,
    base_query,
    page: int,
    page_size: int,
    order_by: str | None = None,
):
    count_result = await db.execute(
        select(func.count()).select_from(base_query.subquery())
    )
    total = count_result.scalar_one()

    order_cols = {
        "price_asc": Goods.price.asc(),
        "price_desc": Goods.price.desc(),
    }
    col = order_cols.get(order_by, Goods.create_time.desc())

    rows_result = await db.execute(
        base_query.order_by(col)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = rows_result.scalars().all()

    goods_ids = [g.id for g in rows]
    cover_map = {}
    if goods_ids:
        covers_result = await db.execute(
            select(GoodsImage.goods_id, GoodsImage.image_url)
            .where(GoodsImage.goods_id.in_(goods_ids))
            .order_by(GoodsImage.sort)
        )
        for goods_id, url in covers_result.all():
            cover_map.setdefault(goods_id, url)

    seller_ids = {g.user_id for g in rows}
    sellers = {}
    if seller_ids:
        sellers_result = await db.execute(
            select(User).where(User.id.in_(seller_ids))
        )
        sellers = {u.id: u for u in sellers_result.scalars().all()}

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


def _apply_filters(base_stmt, keyword: str | None, category_id: int | None, status: int | None):
    stmt = base_stmt
    if keyword:
        stmt = stmt.where(or_(Goods.title.contains(keyword), Goods.description.contains(keyword)))
    if category_id:
        stmt = stmt.where(Goods.category_id == category_id)
    if status is not None:
        stmt = stmt.where(Goods.status == status)
    return stmt


@router.get("")
async def list_goods(
    page: int = 1,
    page_size: int = 10,
    keyword: str | None = None,
    category_id: int | None = None,
    order_by: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Goods).where(Goods.is_deleted == 0, Goods.status == 1)
    stmt = _apply_filters(stmt, keyword, category_id, None)
    return await _build_list_items(db, stmt, page, page_size, order_by)


@router.get("/my")
async def my_published(
    page: int = 1,
    page_size: int = 10,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Goods).where(Goods.is_deleted == 0, Goods.user_id == user.id)
    return await _build_list_items(db, stmt, page, page_size)


@router.post("", response_model=GoodsOut)
async def publish_goods(
    title: str = Form(...),
    description: str = Form(""),
    price: Decimal = Form(...),
    original_price: Decimal | None = Form(None),
    condition: int = Form(2),
    category_id: int = Form(...),
    images: list[UploadFile] = File(default=[]),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cat_result = await db.execute(
        select(Category).where(Category.id == category_id, Category.is_deleted == 0)
    )
    if not cat_result.scalar_one_or_none():
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
    await db.flush()
    for idx, img in enumerate(images):
        url = await save_upload_file(img)
        db.add(GoodsImage(goods_id=goods.id, image_url=url, sort=idx))
    await db.commit()
    # 异步模式下不能懒加载关联对象，重新查询以加载 images
    return await _get_goods_or_404(db, goods.id)


@router.get("/{goods_id}", response_model=GoodsOut)
async def goods_detail(goods_id: int, db: AsyncSession = Depends(get_db)):
    return await _get_goods_or_404(db, goods_id)


@router.put("/{goods_id}")
async def update_goods(
    goods_id: int,
    data: GoodsUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    goods = await _get_goods_or_404(db, goods_id)
    if goods.user_id != user.id and user.role != 1:
        raise HTTPException(403, "只能编辑自己发布的商品")
    if data.category_id:
        cat_result = await db.execute(
            select(Category).where(Category.id == data.category_id)
        )
        if not cat_result.scalar_one_or_none():
            raise HTTPException(400, "分类不存在")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(goods, field, value)
    goods.status = 0  # 重新编辑后需再次审核
    await db.commit()
    return {"message": "修改成功，已重新提交审核"}


@router.delete("/{goods_id}")
async def delete_goods(
    goods_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    goods = await _get_goods_or_404(db, goods_id)
    if goods.user_id != user.id and user.role != 1:
        raise HTTPException(403, "只能删除自己发布的商品")
    goods.is_deleted = 1
    goods.status = 3
    await db.commit()
    return {"message": "已删除"}


@router.put("/{goods_id}/offline")
async def offline_goods(
    goods_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    goods = await _get_goods_or_404(db, goods_id)
    if goods.user_id != user.id and user.role != 1:
        raise HTTPException(403, "无权操作")
    goods.status = 3
    await db.commit()
    return {"message": "已下架"}


# ---------- 管理员 ----------

@router.get("/admin/list")
async def admin_list_goods(
    page: int = 1,
    page_size: int = 10,
    keyword: str | None = None,
    category_id: int | None = None,
    status: int | None = None,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Goods).where(Goods.is_deleted == 0)
    stmt = _apply_filters(stmt, keyword, category_id, status)
    return await _build_list_items(db, stmt, page, page_size)


@router.put("/admin/{goods_id}/audit")
async def audit_goods(
    goods_id: int,
    approved: bool,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    goods = await _get_goods_or_404(db, goods_id)
    goods.status = 1 if approved else 3
    await db.commit()
    return {"message": "审核通过，商品已上架" if approved else "审核拒绝，商品已下架", "status": goods.status}
