from datetime import datetime

from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    sort: int = 0


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=50)
    sort: int | None = None


class CategoryOut(BaseModel):
    id: int
    name: str
    sort: int

    model_config = {"from_attributes": True}
