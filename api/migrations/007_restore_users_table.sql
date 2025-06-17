-- 007: 恢复用户表结构以匹配认证代码
-- 添加认证系统所需的缺失字段

-- 1. 备份现有数据
CREATE TABLE users_backup AS SELECT * FROM users;

-- 2. 删除当前表
DROP TABLE users;

-- 3. 创建新的用户表结构
CREATE TABLE users (
    id TEXT PRIMARY KEY NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_sponsored INTEGER DEFAULT 0 NOT NULL,
    receive_official_messages INTEGER DEFAULT 1 NOT NULL,
    settings TEXT NOT NULL DEFAULT '{"theme":"blue","language":"zh-CN","fontSize":"medium"}',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. 迁移现有数据（如果有的话）
-- 将 name 字段作为 username，其他字段设置默认值
INSERT INTO
    users (
        id,
        username,
        email,
        password_hash,
        is_sponsored,
        receive_official_messages,
        settings,
        created_at,
        updated_at
    )
SELECT
    id,
    COALESCE(name, email) as username, -- 使用name作为username，如果name为空则使用email
    email,
    'temp_password_hash' as password_hash, -- 临时密码，需要用户重新设置
    0 as is_sponsored,
    1 as receive_official_messages,
    '{"theme":"blue","language":"zh-CN","fontSize":"medium"}' as settings,
    created_at,
    updated_at
FROM users_backup
WHERE
    email IS NOT NULL;

-- 5. 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

-- 6. 清理备份表
DROP TABLE users_backup;