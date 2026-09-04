from datetime import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, DateTime, ForeignKey, Numeric, SmallInteger, String, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from db import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    order_no: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    goods_id: Mapped[int] = mapped_column(ForeignKey("goods.id"), nullable=False, index=True)
    seller_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False, index=True)
    buyer_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False, index=True)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[int] = mapped_column(SmallInteger, default=0, comment="0待确认 1交易完成 2取消")
    create_time: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    update_time: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    is_deleted: Mapped[int] = mapped_column(SmallInteger, default=0)
