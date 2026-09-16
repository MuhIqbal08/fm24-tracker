package db

const SchemaDDL = `
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- 1. Master Pemain
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fm_unique_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    nationality TEXT,
    preferred_position TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Snapshot Skuad per Periode
CREATE TABLE IF NOT EXISTS snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club_name TEXT NOT NULL,
    in_game_date TEXT NOT NULL,
    season_label TEXT NOT NULL,
    notes TEXT,
    file_checksum TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Rekam Status Atribut Pemain per Snapshot
CREATE TABLE IF NOT EXISTS player_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    snapshot_id INTEGER NOT NULL REFERENCES snapshots(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    age INTEGER NOT NULL,
    ca INTEGER NOT NULL,
    pa INTEGER NOT NULL,
    wage_weekly REAL DEFAULT 0,
    market_value REAL DEFAULT 0,
    status TEXT,
    squad_category TEXT DEFAULT 'FIRST_TEAM',
    starts INTEGER DEFAULT 0,
    subs INTEGER DEFAULT 0,
    mins INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(snapshot_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_ps_player_snapshot ON player_snapshots(player_id, snapshot_id);
CREATE INDEX IF NOT EXISTS idx_players_uid ON players(fm_unique_id);
`
