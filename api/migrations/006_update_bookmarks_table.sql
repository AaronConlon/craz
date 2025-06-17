-- 0. 如果临时表已存在，先删除
DROP TABLE IF EXISTS bookmarks_new;

-- 1. 创建新的书签表
CREATE TABLE bookmarks_new (
    id TEXT PRIMARY KEY NOT NULL,
    url TEXT,
    title TEXT NOT NULL,
    parent_id TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    date_added INTEGER NOT NULL,
    date_modified INTEGER NOT NULL,
    metadata TEXT NOT NULL DEFAULT '{}',
    user_id TEXT,
    team_id TEXT,
    created_by TEXT NOT NULL,
    updated_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES bookmarks_new (id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users (id),
    FOREIGN KEY (updated_by) REFERENCES users (id)
);

-- 2. 迁移数据（parent_id 字段用 NULL 占位）
INSERT INTO
    bookmarks_new (
        id,
        url,
        title,
        parent_id,
        sort_order,
        date_added,
        date_modified,
        metadata,
        user_id,
        team_id,
        created_by,
        updated_by,
        created_at,
        updated_at
    )
SELECT
    id,
    url,
    title,
    NULL as parent_id,
    0,
    CAST(
        strftime ('%s', created_at) AS INTEGER
    ),
    CAST(
        strftime ('%s', updated_at) AS INTEGER
    ),
    '{}',
    user_id,
    team_id,
    user_id,
    user_id,
    created_at,
    updated_at
FROM bookmarks;

-- 3. 删除旧表
DROP TABLE IF EXISTS bookmarks;

-- 4. 重命名新表
ALTER TABLE bookmarks_new RENAME TO bookmarks;

-- 5. 创建索引
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks (user_id);

CREATE INDEX IF NOT EXISTS idx_bookmarks_team_id ON bookmarks (team_id);

CREATE INDEX IF NOT EXISTS idx_bookmarks_parent_id ON bookmarks (parent_id);

CREATE INDEX IF NOT EXISTS idx_bookmarks_date_added ON bookmarks (date_added);

CREATE INDEX IF NOT EXISTS idx_bookmarks_created_by ON bookmarks (created_by);

CREATE INDEX IF NOT EXISTS idx_bookmarks_updated_by ON bookmarks (updated_by);