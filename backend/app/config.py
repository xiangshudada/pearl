from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # 数据库配置
    DB_HOST: str = "192.168.237.128"
    DB_PORT: int = 3306
    DB_NAME: str = "pearl"
    DB_USER: str = "root"
    DB_PASSWORD: str = "123"

    # 微信小程序配置
    WX_APP_ID: str = "wx2e76f29852a634ce"
    WX_APP_SECRET: str = "79636714647feecbc9a3f8046398e311"
    WX_LOGIN_URL: str = "https://api.weixin.qq.com/sns/jscode2session"

    # JWT 配置
    JWT_SECRET: str = "change_this_secret_in_production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_DAYS: int = 7

    # 管理员账号
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"mysql+asyncmy://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            f"?charset=utf8mb4"
        )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
