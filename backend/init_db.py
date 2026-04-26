"""
数据库初始化脚本
用途：首次部署时执行，将 docs/schema.sql 导入数据库（含索引、注释、初始分类数据）
后续启动：uvicorn 的 lifespan 会自动 create_all，无需重复执行此脚本

用法：
  cd backend
  python init_db.py
"""

import asyncio
import os
import re
import sys
from pathlib import Path

import asyncmy
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_NAME = os.getenv("DB_NAME", "pearl")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

SCHEMA_FILE = Path(__file__).parent.parent / "docs" / "schema.sql"


def split_statements(sql: str) -> list[str]:
    """按分号拆分 SQL 语句，忽略注释和空语句。"""
    # 去掉单行注释
    sql = re.sub(r"--[^\n]*", "", sql)
    # 去掉多行注释
    sql = re.sub(r"/\*.*?\*/", "", sql, flags=re.DOTALL)
    stmts = [s.strip() for s in sql.split(";")]
    return [s for s in stmts if s]


async def init():
    if not SCHEMA_FILE.exists():
        print(f"❌ 找不到 schema 文件：{SCHEMA_FILE}")
        sys.exit(1)

    sql_content = SCHEMA_FILE.read_text(encoding="utf-8")
    statements = split_statements(sql_content)

    print(f"连接数据库 {DB_USER}@{DB_HOST}:{DB_PORT} ...")

    # 先不指定数据库，用于执行 CREATE DATABASE
    conn = await asyncmy.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        autocommit=True,
    )

    try:
        async with conn.cursor() as cur:
            for stmt in statements:
                first_word = stmt.split()[0].upper() if stmt.split() else ""
                try:
                    await cur.execute(stmt)
                    if first_word in ("CREATE", "INSERT", "ALTER"):
                        print(f"  ✓ {stmt[:60].replace(chr(10), ' ')}...")
                except asyncmy.errors.OperationalError as e:
                    code = e.args[0]
                    if code in (1007, 1050):
                        # 1007: 数据库已存在  1050: 表已存在
                        print(f"  ⚠ 已存在，跳过：{stmt[:50]}...")
                    else:
                        print(f"  ✗ 错误 ({code})：{e.args[1]}")
                        print(f"    语句：{stmt[:100]}")
                except Exception as e:
                    print(f"  ✗ 未知错误：{e}")
                    print(f"    语句：{stmt[:100]}")
    finally:
        await conn.ensure_closed()

    print("\n✅ 数据库初始化完成！")
    print(f"   数据库：{DB_NAME}")
    print("   已创建：users, material_categories, materials, designs,")
    print("            design_tags, design_items, design_likes,")
    print("            addresses, coupon_templates, user_coupons, orders")


if __name__ == "__main__":
    asyncio.run(init())
