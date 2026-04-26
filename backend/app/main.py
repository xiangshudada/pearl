import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
import app.models  # noqa: F401 — 确保所有 ORM 模型已注册到 Base.metadata
from app.routers import auth, materials, designs, addresses, coupons, admin

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)s  %(name)s  %(message)s",
)
logger = logging.getLogger("pearl")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时自动建表（若表已存在则跳过）
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("珠了个珠 后端服务启动 🚀")
    yield
    logger.info("珠了个珠 后端服务关闭")


app = FastAPI(
    title="珠了个珠 API",
    description="手串 DIY 定制微信小程序后端服务",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS 中间件（开发阶段允许所有来源）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由，统一前缀 /api
app.include_router(auth.router, prefix="/api")
app.include_router(materials.router, prefix="/api")
app.include_router(designs.router, prefix="/api")
app.include_router(addresses.router, prefix="/api")
app.include_router(coupons.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.get("/", tags=["健康检查"])
async def health_check():
    return {"status": "ok", "service": "珠了个珠 API"}
