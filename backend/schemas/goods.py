from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class GoodsImageOut(BaseModel):
    id: int
    image_url: str
    sort: int

    model_config = {"from_attributes": True}


class GoodsCreate(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    description: str = ""
    price: Decimal = Field(gt=0)
    original_price: Decimal | None = None
    condition: int = Field(default=2, ge=1, le=5)
    category_id: int


class GoodsUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    price: Decimal | None = Field(default=None, gt=0)
    original_price: Decimal | None = None
    condition: int | None = Field(default=None, ge=1, le=5)
    category_id: int | None = None


class GoodsOut(BaseModel):
    id: int
    user_id: int
    category_id: int
    title: str
    description: str
    price: Decimal
    original_price: Decimal | None
    condition: int
    status: int
    create_time: datetime
    images: list[GoodsImageOut] = []

    model_config = {"from_attributes": True}


class GoodsListItem(BaseModel):
    id: int
    title: str
    price: Decimal
    original_price: Decimal | None
    condition: int
    status: int
    category_id: int
    user_id: int
    nickname: str
    avatar: str
    cover_image: str
    create_time: datetime

    model_config = {"from_attributes": True}


class PageResult(BaseModel):
    total: int
    page: int
    page_size: int
    records: list
