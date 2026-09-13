from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

from config import DATABASE_URL

async_engine = create_async_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=3600)
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine, autocommit=False, autoflush=False, class_=AsyncSession, expire_on_commit=False
)
Base = declarative_base()



async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
