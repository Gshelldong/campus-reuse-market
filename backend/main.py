import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, text

import api
import models  # noqa: F401 确保 ORM 模型注册
from config import DB_NAME, DB_PASSWORD, DB_HOST, DB_PORT, DB_USER, UPLOAD_DIR, DATABASE_URL
from db import Base, SessionLocal, engine
from models.user import User
from models.category import Category
from utils.security import hash_password

app = FastAPI(title="校园二手交易平台 API", version="1.0.0")

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


@app.on_event("startup")
def init_db():
    # MySQL 需先建库再建表
    server_url = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/?charset=utf8mb4"
    server_engine = create_engine(server_url)
    with server_engine.connect() as conn:
        conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {DB_NAME} DEFAULT CHARACTER SET utf8mb4"))
        conn.commit()
    server_engine.dispose()

    Base.metadata.create_all(engine)

    db = SessionLocal()
    try:
        if not db.query(User).filter(User.username == "admin").first():
            db.add(User(username="admin", password=hash_password("admin123"), nickname="管理员", role=1))
        if not db.query(User).filter(User.username == "test").first():
            db.add(User(username="test", password=hash_password("123456"), nickname="测试学生"))
        if db.query(Category).count() == 0:
            for i, name in enumerate(["书籍教材", "数码产品", "服饰鞋包", "生活用品", "运动健身", "其他"], 1):
                db.add(Category(name=name, sort=i))
        db.commit()
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "校园二手交易平台 API 运行中", "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
