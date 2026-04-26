-- 珠了个珠 · 数据库 Schema
-- 数据库：微信云开发 CloudBase CynosDB MySQL（MySQL 8.0 兼容）
-- 连接方式：云托管内网直连，地址见云开发控制台 → 数据库 → MySQL → 连接信息
-- 字符集：utf8mb4

CREATE DATABASE IF NOT EXISTS pearl DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pearl;

-- ============================================================
-- 用户表
-- ============================================================
CREATE TABLE users (
  id          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  openid      VARCHAR(64)      NOT NULL COMMENT '微信 openid',
  nickname    VARCHAR(64)               COMMENT '微信昵称',
  avatar_url  VARCHAR(512)              COMMENT '头像链接',
  created_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_openid (openid)
) COMMENT='用户表';

-- ============================================================
-- 材料分类表（管理员后台维护）
-- parent_id = NULL  → 顶级分类，即 Tab 名称（珠子 / 配饰）
-- parent_id = 顶级ID → 子分类（白水晶 / 紫水晶 / 海蓝宝 …）
-- ============================================================
CREATE TABLE material_categories (
  id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  parent_id   INT UNSIGNED              COMMENT '父分类 ID，NULL 表示顶级',
  name        VARCHAR(32)      NOT NULL COMMENT '分类名称',
  sort_order  INT              NOT NULL DEFAULT 0 COMMENT '排序权重，越小越靠前',
  created_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_parent (parent_id)
) COMMENT='材料分类表';

-- 初始化顶级分类
INSERT INTO material_categories (name, sort_order) VALUES ('珠子', 1), ('配饰', 2);

-- ============================================================
-- 材料表（珠子 + 配饰）
-- ============================================================
CREATE TABLE materials (
  id           BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  category_id  INT UNSIGNED     NOT NULL COMMENT '所属子分类 ID',
  name         VARCHAR(64)      NOT NULL COMMENT '材料名称，如 巴西紫水晶',
  size_mm      DECIMAL(4,1)     NOT NULL COMMENT '尺寸（毫米），如 6.0 / 8.0 / 10.0',
  price        DECIMAL(10,2)    NOT NULL COMMENT '单颗售价（元）',
  wuxing       ENUM('金','木','水','火','土') COMMENT '五行属性，可为空',
  image_url    VARCHAR(512)     NOT NULL COMMENT '珠子展示图',
  stock        INT              NOT NULL DEFAULT 0 COMMENT '库存数量',
  is_active    TINYINT(1)       NOT NULL DEFAULT 1 COMMENT '是否上架：1上架 0下架',
  sort_order   INT              NOT NULL DEFAULT 0 COMMENT '排序权重',
  created_at   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_category_active (category_id, is_active),
  KEY idx_wuxing (wuxing)
) COMMENT='材料表（珠子与配饰）';

-- ============================================================
-- 手串设计表
-- ============================================================
CREATE TABLE designs (
  id            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED  NOT NULL COMMENT '作者用户 ID',
  name          VARCHAR(64)      NOT NULL DEFAULT '我设计的手串' COMMENT '设计名称',
  wrist_size    DECIMAL(4,1)              COMMENT '手围（cm），如 16.4',
  preview_url   VARCHAR(512)              COMMENT '手串预览图链接',
  total_price   DECIMAL(10,2)    NOT NULL DEFAULT 0 COMMENT '材料合计价格（元）',
  is_published  TINYINT(1)       NOT NULL DEFAULT 0 COMMENT '是否发布到设计广场',
  like_count    INT UNSIGNED     NOT NULL DEFAULT 0 COMMENT '点赞数',
  use_count     INT UNSIGNED     NOT NULL DEFAULT 0 COMMENT '被他人使用次数',
  status        ENUM('draft','completed') NOT NULL DEFAULT 'draft' COMMENT '草稿/已完成',
  created_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user (user_id),
  KEY idx_published_created (is_published, created_at DESC)
) COMMENT='手串设计表';

-- ============================================================
-- 设计风格标签表
-- 一个设计可有多个标签（如 简约、清冷、五行水…）
-- ============================================================
CREATE TABLE design_tags (
  id         INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  design_id  BIGINT UNSIGNED  NOT NULL COMMENT '所属设计 ID',
  tag        VARCHAR(32)      NOT NULL COMMENT '标签名称',
  PRIMARY KEY (id),
  KEY idx_design (design_id)
) COMMENT='设计风格标签';

-- ============================================================
-- 设计材料明细表
-- 记录手串中每颗珠子的种类、数量和位置
-- ============================================================
CREATE TABLE design_items (
  id           BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  design_id    BIGINT UNSIGNED  NOT NULL COMMENT '所属设计 ID',
  material_id  BIGINT UNSIGNED  NOT NULL COMMENT '材料 ID',
  quantity     SMALLINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '使用数量（颗）',
  position     SMALLINT UNSIGNED          COMMENT '珠子在手串中的位置顺序（0起）',
  PRIMARY KEY (id),
  KEY idx_design (design_id),
  KEY idx_material (material_id)
) COMMENT='设计材料明细表';

-- ============================================================
-- 设计点赞表
-- 用联合主键防止重复点赞
-- ============================================================
CREATE TABLE design_likes (
  user_id    BIGINT UNSIGNED  NOT NULL,
  design_id  BIGINT UNSIGNED  NOT NULL,
  created_at DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, design_id),
  KEY idx_design (design_id)
) COMMENT='设计点赞记录';

-- ============================================================
-- 收货地址表
-- ============================================================
CREATE TABLE addresses (
  id          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED  NOT NULL COMMENT '所属用户 ID',
  name        VARCHAR(32)      NOT NULL COMMENT '收件人姓名',
  phone       VARCHAR(16)      NOT NULL COMMENT '联系电话',
  province    VARCHAR(32)      NOT NULL COMMENT '省',
  city        VARCHAR(32)      NOT NULL COMMENT '市',
  district    VARCHAR(32)      NOT NULL COMMENT '区/县',
  detail      VARCHAR(128)     NOT NULL COMMENT '详细地址',
  is_default  TINYINT(1)       NOT NULL DEFAULT 0 COMMENT '是否默认地址',
  created_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user (user_id)
) COMMENT='收货地址表';

-- ============================================================
-- 优惠券模板表（管理员创建，定义券的规则）
-- ============================================================
CREATE TABLE coupon_templates (
  id            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  name          VARCHAR(64)      NOT NULL COMMENT '券名称，如 新人立减10元',
  type          ENUM('fixed','percent','free_shipping') NOT NULL COMMENT '满减/折扣/免邮',
  discount      DECIMAL(10,2)    NOT NULL COMMENT '满减金额（元）或折扣率（如 0.88 = 88折）',
  min_amount    DECIMAL(10,2)              COMMENT '最低使用金额，NULL 表示无门槛',
  total_count   INT UNSIGNED               COMMENT '总发放数量，NULL 表示不限量',
  issued_count  INT UNSIGNED     NOT NULL DEFAULT 0 COMMENT '已发放数量',
  expired_days  INT UNSIGNED     NOT NULL DEFAULT 30 COMMENT '领取后有效天数',
  created_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) COMMENT='优惠券模板';

-- ============================================================
-- 用户优惠券表（用户持有的券）
-- ============================================================
CREATE TABLE user_coupons (
  id           BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED  NOT NULL COMMENT '持有用户 ID',
  template_id  INT UNSIGNED     NOT NULL COMMENT '优惠券模板 ID',
  used_at      DATETIME                   COMMENT '使用时间，NULL 表示未使用',
  expired_at   DATETIME         NOT NULL COMMENT '过期时间',
  created_at   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_unused (user_id, used_at),
  KEY idx_template (template_id)
) COMMENT='用户优惠券';

-- ============================================================
-- 订单表（预留结构，本期不实现业务逻辑）
-- ============================================================
CREATE TABLE orders (
  id                BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id           BIGINT UNSIGNED  NOT NULL COMMENT '下单用户 ID',
  design_id         BIGINT UNSIGNED  NOT NULL COMMENT '购买的设计 ID',
  address_id        BIGINT UNSIGNED  NOT NULL COMMENT '收货地址 ID',
  user_coupon_id    BIGINT UNSIGNED            COMMENT '使用的优惠券 ID',
  total_amount      DECIMAL(10,2)    NOT NULL COMMENT '订单原价（元）',
  discount_amount   DECIMAL(10,2)    NOT NULL DEFAULT 0 COMMENT '优惠金额（元）',
  pay_amount        DECIMAL(10,2)    NOT NULL COMMENT '实付金额（元）',
  status            ENUM('pending_payment','paid','shipped','completed','cancelled')
                                     NOT NULL DEFAULT 'pending_payment',
  wx_transaction_id VARCHAR(64)                COMMENT '微信支付流水号',
  created_at        DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user (user_id),
  KEY idx_status (status)
) COMMENT='订单表（预留，本期不实现）';
