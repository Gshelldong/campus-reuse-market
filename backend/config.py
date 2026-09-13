import os

DB_HOST = os.getenv("DB_HOST", "192.168.124.50")
DB_PORT = int(os.getenv("DB_PORT", "3307"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "test123456")
DB_NAME = os.getenv("DB_NAME", "campus_market")

DATABASE_URL = f"mysql+aiomysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"

JWT_SECRET = os.getenv("JWT_SECRET", "campus-reuse-market-secret-key-2024")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24 * 7

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
