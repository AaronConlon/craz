-- 1. 创建新的团队表
CREATE TABLE teams_new (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    owner_id TEXT NOT NULL,
    settings TEXT NOT NULL DEFAULT '{"allowMemberEdit": true, "allowMemberInvite": true}',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 2. 迁移数据
INSERT INTO
    teams_new (
        id,
        name,
        description,
        owner_id,
        created_at,
        updated_at
    )
SELECT
    id,
    name,
    description,
    founder_id,
    created_at,
    updated_at
FROM teams;

-- 3. 创建新的团队成员表
CREATE TABLE team_members_new (
    id TEXT PRIMARY KEY NOT NULL,
    team_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (
        role IN ('owner', 'admin', 'member')
    ),
    joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams_new (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    UNIQUE (team_id, user_id)
);

-- 4. 迁移团队成员数据
INSERT INTO
    team_members_new (
        id,
        team_id,
        user_id,
        role,
        joined_at
    )
SELECT
    id,
    team_id,
    user_id,
    role,
    joined_at
FROM team_members;

-- 5. 删除旧表
DROP TABLE team_members;

DROP TABLE teams;

-- 6. 重命名新表
ALTER TABLE teams_new RENAME TO teams;

ALTER TABLE team_members_new RENAME TO team_members;