from datetime import datetime

from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    receiver_id: int
    content: str = Field(min_length=1)


class MessageOut(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    is_read: int
    create_time: datetime

    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    user_id: int
    nickname: str
    avatar: str
    last_message: str
    last_time: datetime
    unread: int
