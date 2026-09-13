import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, func, text
from sqlalchemy.future import select

import api
import models  # noqa: F401 确保 ORM 模型注册
from config import DB_NAME, DB_PASSWORD, DB_HOST, DB_PORT, DB_USER, UPLOAD_DIR, DATABASE_URL
from db import Base, AsyncSessionLocal, async_engine
from models.user import User
from models.category import Category
from utils.security import hash_password


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="校园二手交易平台 API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in api.api_routers:
    app.include_router(r)

os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


async def init_db():
    # MySQL 需先建库再建表（建库操作仍用同步引擎，一次性执行）
    server_url = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/?charset=utf8mb4"
    server_engine = create_engine(server_url)
    with server_engine.connect() as conn:
        conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {DB_NAME} DEFAULT CHARACTER SET utf8mb4"))
        conn.commit()
    server_engine.dispose()

    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.username == "admin"))
        if not result.scalar_one_or_none():
            db.add(User(username="admin", password=hash_password("admin123"), nickname="管理员", role=1))
        result = await db.execute(select(User).where(User.username == "test"))
        if not result.scalar_one_or_none():
            db.add(User(username="test", password=hash_password("123456"), nickname="测试学生"))
        count_result = await db.execute(select(func.count()).select_from(Category))
        if count_result.scalar_one() == 0:
            for i, name in enumerate(["书籍教材", "数码产品", "服饰鞋包", "生活用品", "运动健身", "其他"], 1):
                db.add(Category(name=name, sort=i))
        await db.commit()


@app.get("/")
async def root():
    return {"message": "校园二手交易平台 API 运行中", "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
