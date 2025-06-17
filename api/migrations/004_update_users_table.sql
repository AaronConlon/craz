-- 1. 创建新表
CREATE TABLE users_new (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. 迁移原有数据（name 字段用 email 填充，avatar_url 设为 NULL）
INSERT INTO
    users_new (
        id,
        email,
        name,
        avatar_url,
        created_at,
        updated_at
    )
SELECT
    id,
    email,
    email,
    NULL,
    created_at,
    updated_at
FROM users;

-- 3. 删除旧表
DROP TABLE users;

-- 4. 重命名新表
ALTER TABLE users_new RENAME TO users;

-- 5. 重建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

CREATE INDEX IF NOT EXISTS idx_users_name ON users (name);