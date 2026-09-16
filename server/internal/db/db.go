package db

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

type DB struct {
	*sql.DB
}

// NewDB initializes the SQLite database connection, sets PRAGMA modes (WAL, foreign keys),
// and executes the initial schema migrations.
func NewDB(dbPath string) (*DB, error) {
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create database directory %s: %w", dir, err)
	}

	dsn := fmt.Sprintf("%s?_pragma=foreign_keys(1)&_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)&_pragma=synchronous(NORMAL)", dbPath)
	database, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open sqlite database: %w", err)
	}

	// Limit connection pool appropriately for SQLite to avoid lock contention
	database.SetMaxOpenConns(1)

	if err := database.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping sqlite database: %w", err)
	}

	// Run migrations
	if _, err := database.Exec(SchemaDDL); err != nil {
		return nil, fmt.Errorf("failed to run database migrations: %w", err)
	}

	// Idempotent column additions for existing databases
	_, _ = database.Exec("ALTER TABLE player_snapshots ADD COLUMN squad_category TEXT DEFAULT 'FIRST_TEAM';")
	_, _ = database.Exec("ALTER TABLE player_snapshots ADD COLUMN starts INTEGER DEFAULT 0;")
	_, _ = database.Exec("ALTER TABLE player_snapshots ADD COLUMN subs INTEGER DEFAULT 0;")
	_, _ = database.Exec("ALTER TABLE player_snapshots ADD COLUMN mins INTEGER DEFAULT 0;")
	_, _ = database.Exec("UPDATE player_snapshots SET squad_category = 'U18' WHERE age <= 18 AND (squad_category IS NULL OR squad_category = 'FIRST_TEAM');")
	_, _ = database.Exec("UPDATE player_snapshots SET squad_category = 'U20' WHERE age >= 19 AND age <= 20 AND (squad_category IS NULL OR squad_category = 'FIRST_TEAM');")
	_, _ = database.Exec("UPDATE player_snapshots SET squad_category = 'SENIOR' WHERE age >= 21 AND (squad_category IS NULL OR squad_category = 'FIRST_TEAM');")

	return &DB{DB: database}, nil
}
