from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from db import get_db
from dependencies import get_current_user
from models.chat import ChatMessage
from models.user import User
from schemas.chat import MessageCreate, MessageOut

router = APIRouter(prefix="/api/chat", tags=["聊天"])


@router.post("/message", response_model=MessageOut)
def send_message(
    data: MessageCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.receiver_id == user.id:
        raise HTTPException(400, "不能给自己发消息")
    receiver = db.query(User).filter(User.id == data.receiver_id, User.is_deleted == 0).first()
    if not receiver:
        raise HTTPException(404, "接收方不存在")
    msg = ChatMessage(sender_id=user.id, receiver_id=data.receiver_id, content=data.content)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.get("/messages/{other_id}")
def chat_history(
    other_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    other = db.query(User).filter(User.id == other_id, User.is_deleted == 0).first()
    if not other:
        raise HTTPException(404, "用户不存在")
    messages = (
        db.query(ChatMessage)
        .filter(
            or_(
                (ChatMessage.sender_id == user.id) & (ChatMessage.receiver_id == other_id),
                (ChatMessage.sender_id == other_id) & (ChatMessage.receiver_id == user.id),
            )
        )
        .order_by(ChatMessage.create_time)
        .all()
    )
    unread = [m for m in messages if m.receiver_id == user.id and m.is_read == 0]
    for m in unread:
        m.is_read = 1
    db.commit()
    return [
        {
            "id": m.id,
            "sender_id": m.sender_id,
            "receiver_id": m.receiver_id,
            "content": m.content,
            "is_read": m.is_read,
            "create_time": m.create_time,
            "is_self": m.sender_id == user.id,
        }
        for m in messages
    ]


@router.get("/conversations")
def my_conversations(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    messages = (
        db.query(ChatMessage)
        .filter(or_(ChatMessage.sender_id == user.id, ChatMessage.receiver_id == user.id))
        .order_by(ChatMessage.create_time.desc())
        .all()
    )
    conv_map: dict[int, dict] = {}
    unread_map: dict[int, int] = {}
    for m in messages:
        other_id = m.receiver_id if m.sender_id == user.id else m.sender_id
        if other_id not in conv_map:
            conv_map[other_id] = {
                "user_id": other_id,
                "last_message": m.content,
                "last_time": m.create_time,
            }
            if m.receiver_id == user.id and m.is_read == 0:
                unread_map[other_id] = 1
    if not conv_map:
        return []
    users = {
        u.id: u
        for u in db.query(User)
        .filter(User.id.in_(list(conv_map.keys())), User.is_deleted == 0)
        .all()
    }
    return [
        {
            "user_id": uid,
            "nickname": users[uid].nickname if uid in users else "用户不存在",
            "avatar": users[uid].avatar if uid in users else "",
            "last_message": info["last_message"],
            "last_time": info["last_time"],
            "unread": unread_map.get(uid, 0),
        }
        for uid, info in conv_map.items()
        if uid in users
    ]


@router.get("/unread/count")
def unread_count(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    count = (
        db.query(ChatMessage)
        .filter(ChatMessage.receiver_id == user.id, ChatMessage.is_read == 0)
        .count()
    )
    return {"count": count}
