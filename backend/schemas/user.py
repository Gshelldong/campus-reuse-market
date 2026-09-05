from datetime import datetime

from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6, max_length=64)
    nickname: str = Field(default="", max_length=50)
    phone: str = Field(default="", max_length=20)


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user: "UserOut"


class UserOut(BaseModel):
    id: int
    username: str
    nickname: str
    avatar: str
    phone: str
    role: int
    status: int
    create_time: datetime

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    nickname: str | None = Field(default=None, max_length=50)
    phone: str | None = Field(default=None, max_length=20)
    avatar: str | None = Field(default=None, max_length=255)


class PasswordUpdateRequest(BaseModel):
    old_password: str
    new_password: str = Field(min_length=6, max_length=64)
