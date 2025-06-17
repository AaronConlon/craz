-- Migration: 004_create_history_table.sql
-- 创建 Chrome 历史记录表
--
-- 功能特性：
-- 1. 采用 Chrome History API 原始数据格式
-- 2. 支持高效的时间戳索引查询
-- 3. URL 去重机制（用户+URL 唯一约束）
-- 4. 优化的复合索引以减少查询时间
-- 5. 支持全文搜索（通过 FTS5 虚拟表）

-- 创建历史记录主表
CREATE TABLE IF NOT EXISTS history_items (
  id TEXT PRIMARY KEY,                  -- 唯一标识符
  url TEXT NOT NULL,                    -- 页面URL
  title TEXT NOT NULL,                  -- 页面标题
  lastVisitTime INTEGER NOT NULL,      -- 最后访问时间戳 (毫秒)
  visitCount INTEGER DEFAULT 1,        -- 访问次数
  typedCount INTEGER DEFAULT 0,        -- 直接输入URL的次数
  userId TEXT NOT NULL,                 -- 用户ID
  createdAt TEXT NOT NULL,              -- 创建时间 (ISO字符串)
  updatedAt TEXT NOT NULL,              -- 更新时间 (ISO字符串)

-- 用户+URL 唯一约束，确保同一用户对同一URL只有一条记录
UNIQUE(userId, url) );

-- 性能优化索引

-- 1. 用户+时间复合索引 - 优化用户历史查询（最常用）
CREATE INDEX IF NOT EXISTS idx_history_user_time ON history_items (userId, lastVisitTime DESC);

-- 2. URL 索引 - 支持URL精确查询和去重
CREATE INDEX IF NOT EXISTS idx_history_url ON history_items (url);

-- 3. 时间索引 - 支持全局时间范围查询
CREATE INDEX IF NOT EXISTS idx_history_time ON history_items (lastVisitTime DESC);

-- 4. 用户索引 - 确保用户数据隔离效率
CREATE INDEX IF NOT EXISTS idx_history_user ON history_items (userId);

-- 5. 标题索引 - 优化标题搜索
CREATE INDEX IF NOT EXISTS idx_history_title ON history_items (title);

-- 6. 访问次数索引 - 支持热门内容查询
CREATE INDEX IF NOT EXISTS idx_history_visit_count ON history_items (visitCount DESC);

-- FTS5 全文搜索虚拟表
-- 支持对标题和URL的高效全文搜索
CREATE VIRTUAL
TABLE IF NOT EXISTS history_fts USING fts5 (
    url, -- URL内容
    title, -- 标题内容
    content = 'history_items', -- 关联到主表
    content_rowid = 'rowid' -- 使用rowid关联
);

-- FTS5 触发器 - 自动同步搜索索引
-- 插入触发器
CREATE TRIGGER IF NOT EXISTS history_fts_insert AFTER INSERT ON history_items
BEGIN
  INSERT INTO history_fts(rowid, url, title) 
  VALUES (NEW.rowid, NEW.url, NEW.title);
END;

-- 删除触发器
CREATE TRIGGER IF NOT EXISTS history_fts_delete AFTER DELETE ON history_items
BEGIN
  DELETE FROM history_fts WHERE rowid = OLD.rowid;
END;

-- 更新触发器
CREATE TRIGGER IF NOT EXISTS history_fts_update AFTER UPDATE ON history_items
BEGIN
  DELETE FROM history_fts WHERE rowid = OLD.rowid;
  INSERT INTO history_fts(rowid, url, title) 
  VALUES (NEW.rowid, NEW.url, NEW.title);
END;

-- 创建分析视图以支持统计功能

-- 域名统计视图 - 预计算热门域名
CREATE VIEW IF NOT EXISTS v_domain_stats AS
SELECT
    userId,
    CASE
        WHEN url LIKE 'http://%' THEN SUBSTR(
            url,
            8,
            CASE
                WHEN INSTR(SUBSTR(url, 8), '/') > 0 THEN INSTR(SUBSTR(url, 8), '/') - 1
                ELSE LENGTH(SUBSTR(url, 8))
            END
        )
        WHEN url LIKE 'https://%' THEN SUBSTR(
            url,
            9,
            CASE
                WHEN INSTR(SUBSTR(url, 9), '/') > 0 THEN INSTR(SUBSTR(url, 9), '/') - 1
                ELSE LENGTH(SUBSTR(url, 9))
            END
        )
        ELSE 'unknown'
    END as domain,
    SUM(visitCount) as totalVisits,
    COUNT(*) as pageCount,
    MAX(lastVisitTime) as lastVisit,
    MIN(lastVisitTime) as firstVisit
FROM history_items
WHERE
    url LIKE 'http%'
GROUP BY
    userId,
    domain;

-- 每日访问统计视图
CREATE VIEW IF NOT EXISTS v_daily_stats AS
SELECT
    userId,
    DATE(
        lastVisitTime / 1000,
        'unixepoch'
    ) as visit_date,
    SUM(visitCount) as daily_visits,
    COUNT(DISTINCT url) as unique_pages,
    COUNT(*) as total_entries
FROM history_items
GROUP BY
    userId,
    visit_date;

-- 历史记录清理策略表（可选）
-- 用于配置不同用户的历史记录保留策略
CREATE TABLE IF NOT EXISTS history_retention_policies (
    userId TEXT PRIMARY KEY,
    maxDays INTEGER DEFAULT 365, -- 最多保留天数
    maxEntries INTEGER DEFAULT 50000, -- 最多保留条目数
    autoCleanup BOOLEAN DEFAULT TRUE, -- 是否自动清理
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);

-- 查询优化提示：
-- 1. 按用户查询历史时，总是在 WHERE 条件中包含 userId
-- 2. 时间范围查询使用 lastVisitTime BETWEEN start AND end
-- 3. 全文搜索使用 FTS5 表：SELECT * FROM history_fts WHERE history_fts MATCH 'keyword'
-- 4. 分页查询使用 LIMIT 和 OFFSET，配合 ORDER BY lastVisitTime DESC
-- 5. 批量操作使用事务以提高性能
-- 6. 统计查询可以利用预计算的视图