from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class OrderCreate(BaseModel):
    goods_id: int


class OrderOut(BaseModel):
    id: int
    order_no: str
    goods_id: int
    goods_title: str
    goods_cover: str
    seller_id: int
    seller_name: str
    buyer_id: int
    buyer_name: str
    price: Decimal
    status: int
    create_time: datetime

    model_config = {"from_attributes": True}
