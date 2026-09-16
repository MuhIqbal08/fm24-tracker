package db

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"fm-tracker/server/internal/models"
)

var (
	ErrAlreadyImported  = errors.New("snapshot with this file checksum has already been imported")
	ErrSnapshotNotFound = errors.New("snapshot not found")
	ErrPlayerNotFound   = errors.New("player not found")
)

// CreateSnapshot saves a new snapshot and all its player records in a single transaction.
func (d *DB) CreateSnapshot(ctx context.Context, parsed *models.ParsedSnapshot) (*models.Snapshot, error) {
	tx, err := d.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Check for duplicate checksum if non-empty
	if parsed.FileChecksum != "" {
		var existingID int64
		err := tx.QueryRowContext(ctx, "SELECT id FROM snapshots WHERE file_checksum = ?", parsed.FileChecksum).Scan(&existingID)
		if err == nil {
			return nil, fmt.Errorf("%w (snapshot ID: %d)", ErrAlreadyImported, existingID)
		} else if !errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("failed to check existing checksum: %w", err)
		}
	}

	// Insert snapshot
	insertSnapshotSQL := `
		INSERT INTO snapshots (club_name, in_game_date, season_label, notes, file_checksum)
		VALUES (?, ?, ?, ?, ?)
	`
	res, err := tx.ExecContext(ctx, insertSnapshotSQL,
		parsed.ClubName,
		parsed.InGameDate,
		parsed.SeasonLabel,
		parsed.Notes,
		parsed.FileChecksum,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to insert snapshot: %w", err)
	}

	snapshotID, err := res.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("failed to get last insert id: %w", err)
	}

	// Prepare statements for upserting players and player snapshots
	upsertPlayerStmt, err := tx.PrepareContext(ctx, `
		INSERT INTO players (fm_unique_id, name, nationality, preferred_position)
		VALUES (?, ?, ?, ?)
		ON CONFLICT(fm_unique_id) DO UPDATE SET
			name = excluded.name,
			nationality = CASE WHEN excluded.nationality != '' THEN excluded.nationality ELSE players.nationality END,
			preferred_position = CASE WHEN excluded.preferred_position != '' THEN excluded.preferred_position ELSE players.preferred_position END
		RETURNING id
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to prepare upsert player statement: %w", err)
	}
	defer upsertPlayerStmt.Close()

	insertPlayerSnapshotStmt, err := tx.PrepareContext(ctx, `
		INSERT INTO player_snapshots (snapshot_id, player_id, age, ca, pa, wage_weekly, market_value, status, squad_category, starts, subs, mins)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(snapshot_id, player_id) DO UPDATE SET
			age = excluded.age,
			ca = excluded.ca,
			pa = excluded.pa,
			wage_weekly = excluded.wage_weekly,
			market_value = excluded.market_value,
			status = excluded.status,
			squad_category = excluded.squad_category,
			starts = excluded.starts,
			subs = excluded.subs,
			mins = excluded.mins
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to prepare insert player snapshot statement: %w", err)
	}
	defer insertPlayerSnapshotStmt.Close()

	totalPlayers := 0
	for _, p := range parsed.Players {
		if p.Name == "" {
			continue
		}
		var playerID int64
		err := upsertPlayerStmt.QueryRowContext(ctx, p.FMUniqueID, p.Name, p.Nationality, p.Position).Scan(&playerID)
		if err != nil {
			return nil, fmt.Errorf("failed to upsert player %s (UID: %s): %w", p.Name, p.FMUniqueID, err)
		}

		squadCat := p.SquadCategory
		if squadCat == "" {
			if p.Age <= 18 {
				squadCat = "U18"
			} else if p.Age <= 20 {
				squadCat = "U20"
			} else {
				squadCat = "FIRST_TEAM"
			}
		}

		_, err = insertPlayerSnapshotStmt.ExecContext(ctx,
			snapshotID,
			playerID,
			p.Age,
			p.CA,
			p.PA,
			p.WageWeekly,
			p.MarketValue,
			p.Status,
			squadCat,
			p.Starts,
			p.Subs,
			p.Mins,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to insert snapshot record for player %s: %w", p.Name, err)
		}
		totalPlayers++
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return &models.Snapshot{
		ID:           snapshotID,
		ClubName:     parsed.ClubName,
		InGameDate:   parsed.InGameDate,
		SeasonLabel:  parsed.SeasonLabel,
		Notes:        parsed.Notes,
		FileChecksum: parsed.FileChecksum,
		TotalPlayers: totalPlayers,
	}, nil
}

// GetSnapshots returns a list of all snapshots with player counts.
func (d *DB) GetSnapshots(ctx context.Context) ([]models.Snapshot, error) {
	query := `
		SELECT 
			s.id,
			s.club_name,
			s.in_game_date,
			s.season_label,
			COALESCE(s.notes, ''),
			COALESCE(s.file_checksum, ''),
			s.created_at,
			COUNT(ps.id) AS total_players
		FROM snapshots s
		LEFT JOIN player_snapshots ps ON ps.snapshot_id = s.id
		GROUP BY s.id
		ORDER BY s.id DESC
	`
	rows, err := d.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query snapshots: %w", err)
	}
	defer rows.Close()

	var snapshots []models.Snapshot
	for rows.Next() {
		var s models.Snapshot
		if err := rows.Scan(
			&s.ID,
			&s.ClubName,
			&s.InGameDate,
			&s.SeasonLabel,
			&s.Notes,
			&s.FileChecksum,
			&s.CreatedAt,
			&s.TotalPlayers,
		); err != nil {
			return nil, fmt.Errorf("failed to scan snapshot row: %w", err)
		}
		snapshots = append(snapshots, s)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}
	return snapshots, nil
}

// GetSnapshotByID returns a snapshot by ID along with its player count.
func (d *DB) GetSnapshotByID(ctx context.Context, id int64) (*models.Snapshot, error) {
	query := `
		SELECT 
			s.id,
			s.club_name,
			s.in_game_date,
			s.season_label,
			COALESCE(s.notes, ''),
			COALESCE(s.file_checksum, ''),
			s.created_at,
			COUNT(ps.id) AS total_players
		FROM snapshots s
		LEFT JOIN player_snapshots ps ON ps.snapshot_id = s.id
		WHERE s.id = ?
		GROUP BY s.id
	`
	var s models.Snapshot
	err := d.QueryRowContext(ctx, query, id).Scan(
		&s.ID,
		&s.ClubName,
		&s.InGameDate,
		&s.SeasonLabel,
		&s.Notes,
		&s.FileChecksum,
		&s.CreatedAt,
		&s.TotalPlayers,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrSnapshotNotFound
		}
		return nil, fmt.Errorf("failed to query snapshot by id: %w", err)
	}
	return &s, nil
}

// RawComparisonRow holds raw comparison query results before rule calculations.
type RawComparisonRow struct {
	PlayerID      int64
	FMUniqueID    string
	Name          string
	Position      string
	Age           int
	SquadCategory string
	BaseCA        int
	TargetCA      int
	DeltaCA       int
	BasePA        int
	TargetPA      int
	WageWeekly    float64
	MarketValue   float64
	Status        string
	Starts        int
	Subs          int
	Mins          int
}

// GetRawComparisonData retrieves player attributes comparing base snapshot and target snapshot with optional category filter.
func (d *DB) GetRawComparisonData(ctx context.Context, baseSnapshotID, targetSnapshotID int64, category string) ([]RawComparisonRow, error) {
	categoryFilter := ""
	switch strings.ToLower(strings.TrimSpace(category)) {
	case "senior":
		categoryFilter = " AND ((tps.squad_category = 'SENIOR') OR (tps.squad_category = 'FIRST_TEAM' AND tps.age >= 21) OR (tps.age >= 21))"
	case "u20":
		categoryFilter = " AND ((tps.squad_category IN ('U20', 'U21')) OR (tps.age >= 19 AND tps.age <= 20))"
	case "u18":
		categoryFilter = " AND ((tps.squad_category = 'U18') OR (tps.age <= 18))"
	}

	query := `
		SELECT 
			p.id AS player_id,
			p.fm_unique_id,
			p.name,
			COALESCE(p.preferred_position, '') AS position,
			tps.age,
			COALESCE(tps.squad_category, 'FIRST_TEAM') AS squad_category,
			COALESCE(bps.ca, tps.ca) AS base_ca,
			tps.ca AS target_ca,
			(tps.ca - COALESCE(bps.ca, tps.ca)) AS delta_ca,
			COALESCE(bps.pa, tps.pa) AS base_pa,
			tps.pa AS target_pa,
			tps.wage_weekly,
			tps.market_value,
			COALESCE(tps.status, '') AS status,
			COALESCE(tps.starts, 0) AS starts,
			COALESCE(tps.subs, 0) AS subs,
			COALESCE(tps.mins, 0) AS mins
		FROM player_snapshots tps
		JOIN players p ON p.id = tps.player_id
		LEFT JOIN player_snapshots bps ON bps.player_id = tps.player_id AND bps.snapshot_id = ?
		WHERE tps.snapshot_id = ?` + categoryFilter + `
		ORDER BY delta_ca DESC, p.name ASC
	`
	rows, err := d.QueryContext(ctx, query, baseSnapshotID, targetSnapshotID)
	if err != nil {
		return nil, fmt.Errorf("failed to execute comparison query: %w", err)
	}
	defer rows.Close()

	var result []RawComparisonRow
	for rows.Next() {
		var r RawComparisonRow
		if err := rows.Scan(
			&r.PlayerID,
			&r.FMUniqueID,
			&r.Name,
			&r.Position,
			&r.Age,
			&r.SquadCategory,
			&r.BaseCA,
			&r.TargetCA,
			&r.DeltaCA,
			&r.BasePA,
			&r.TargetPA,
			&r.WageWeekly,
			&r.MarketValue,
			&r.Status,
			&r.Starts,
			&r.Subs,
			&r.Mins,
		); err != nil {
			return nil, fmt.Errorf("failed to scan comparison row: %w", err)
		}
		result = append(result, r)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}
	return result, nil
}

// GetPlayerHistory returns historical progression data for a single player.
func (d *DB) GetPlayerHistory(ctx context.Context, playerID int64) (*models.PlayerHistoryResponse, error) {
	// First fetch player basic info
	var p models.Player
	playerQuery := `SELECT id, fm_unique_id, name, COALESCE(preferred_position, '') FROM players WHERE id = ?`
	err := d.QueryRowContext(ctx, playerQuery, playerID).Scan(&p.ID, &p.FMUniqueID, &p.Name, &p.PreferredPosition)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrPlayerNotFound
		}
		return nil, fmt.Errorf("failed to query player: %w", err)
	}

	// Fetch historical progression across all snapshots
	historyQuery := `
		SELECT 
			s.id,
			s.in_game_date,
			s.season_label,
			ps.ca,
			ps.pa,
			ps.age,
			COALESCE(ps.squad_category, 'FIRST_TEAM'),
			COALESCE(ps.starts, 0),
			COALESCE(ps.subs, 0),
			COALESCE(ps.mins, 0),
			ps.market_value
		FROM player_snapshots ps
		JOIN snapshots s ON s.id = ps.snapshot_id
		WHERE ps.player_id = ?
		ORDER BY s.id ASC
	`
	rows, err := d.QueryContext(ctx, historyQuery, playerID)
	if err != nil {
		return nil, fmt.Errorf("failed to query player history: %w", err)
	}
	defer rows.Close()

	var history []models.PlayerHistoryEntry
	for rows.Next() {
		var entry models.PlayerHistoryEntry
		var starts, subs, mins int
		if err := rows.Scan(
			&entry.SnapshotID,
			&entry.SnapshotDate,
			&entry.Season,
			&entry.CA,
			&entry.PA,
			&entry.Age,
			&entry.SquadCategory,
			&starts,
			&subs,
			&mins,
			&entry.MarketValue,
		); err != nil {
			return nil, fmt.Errorf("failed to scan player history entry: %w", err)
		}
		entry.Appearances = models.AppearanceStats{
			Starts: starts,
			Subs:   subs,
			Total:  starts + subs,
			Mins:   mins,
		}
		history = append(history, entry)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &models.PlayerHistoryResponse{
		PlayerID:   p.ID,
		FMUniqueID: p.FMUniqueID,
		Name:       p.Name,
		Position:   p.PreferredPosition,
		History:    history,
	}, nil
}
