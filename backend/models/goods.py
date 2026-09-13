from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


class Goods(Base):
    __tablename__ = "goods"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False, index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("category.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    original_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    condition: Mapped[int] = mapped_column(SmallInteger, default=2, comment="新旧程度 1全新 2九成新 3八成新...")
    status: Mapped[int] = mapped_column(SmallInteger, default=0, comment="0待审核 1上架 2已售出 3下架")
    create_time: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    update_time: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    is_deleted: Mapped[int] = mapped_column(SmallInteger, default=0)

    images: Mapped[list["GoodsImage"]] = relationship(
        order_by="GoodsImage.sort", cascade="all, delete-orphan", lazy="selectin"
    )


class GoodsImage(Base):
    __tablename__ = "goods_image"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    goods_id: Mapped[int] = mapped_column(ForeignKey("goods.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url: Mapped[str] = mapped_column(String(255), nullable=False)
    sort: Mapped[int] = mapped_column(Integer, default=0)
