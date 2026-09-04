from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from db import Base


class UserFavorite(Base):
    __tablename__ = "user_favorite"
    __table_args__ = (UniqueConstraint("user_id", "goods_id", name="uk_user_goods"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False, index=True)
    goods_id: Mapped[int] = mapped_column(ForeignKey("goods.id"), nullable=False, index=True)
    create_time: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
