CREATE TABLE IF NOT EXISTS bookmarks (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    favicon TEXT NULL,
    favicon_base64 TEXT NULL,
    is_public INTEGER DEFAULT 0 NOT NULL,
    user_id TEXT NOT NULL,
    team_id TEXT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);