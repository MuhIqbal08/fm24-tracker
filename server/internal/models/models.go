package models

import "time"

// Player represents the master player record.
type Player struct {
	ID                int64     `json:"id"`
	FMUniqueID        string    `json:"fm_unique_id"`
	Name              string    `json:"name"`
	Nationality       string    `json:"nationality"`
	PreferredPosition string    `json:"preferred_position"`
	CreatedAt         time.Time `json:"created_at"`
}

// Snapshot represents a squad snapshot taken at an in-game date.
type Snapshot struct {
	ID           int64     `json:"id"`
	ClubName     string    `json:"club_name"`
	InGameDate   string    `json:"in_game_date"`
	SeasonLabel  string    `json:"season_label"`
	Notes        string    `json:"notes,omitempty"`
	FileChecksum string    `json:"file_checksum,omitempty"`
	TotalPlayers int       `json:"total_players"`
	CreatedAt    time.Time `json:"created_at"`
}

// PlayerSnapshot represents a player's attributes at a specific snapshot.
type PlayerSnapshot struct {
	ID          int64     `json:"id"`
	SnapshotID  int64     `json:"snapshot_id"`
	PlayerID    int64     `json:"player_id"`
	Age         int       `json:"age"`
	CA          int       `json:"ca"`
	PA          int       `json:"pa"`
	WageWeekly  float64   `json:"wage_weekly"`
	MarketValue float64   `json:"market_value"`
	Status      string    `json:"status,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

// ParsedPlayer holds the raw player attributes parsed from HTML export.
type ParsedPlayer struct {
	FMUniqueID  string  `json:"fm_unique_id"`
	Name        string  `json:"name"`
	Nationality string  `json:"nationality"`
	Position    string  `json:"position"`
	Age         int     `json:"age"`
	CA          int     `json:"ca"`
	PA          int     `json:"pa"`
	WageWeekly  float64 `json:"wage_weekly"`
	MarketValue float64 `json:"market_value"`
	Status      string  `json:"status"`
}

// ParsedSnapshot holds the parsed snapshot metadata and player list.
type ParsedSnapshot struct {
	ClubName     string         `json:"club_name"`
	InGameDate   string         `json:"in_game_date"`
	SeasonLabel  string         `json:"season_label"`
	Notes        string         `json:"notes"`
	FileChecksum string         `json:"file_checksum"`
	Players      []ParsedPlayer `json:"players"`
}

// ComparisonItem represents the comparison result for a player between two snapshots.
type ComparisonItem struct {
	PlayerID             int64   `json:"player_id"`
	FMUniqueID           string  `json:"fm_unique_id"`
	Name                 string  `json:"name"`
	Position             string  `json:"position"`
	Age                  int     `json:"age"`
	BaseCA               int     `json:"base_ca"`
	TargetCA             int     `json:"target_ca"`
	DeltaCA              int     `json:"delta_ca"`
	BasePA               int     `json:"base_pa"`
	TargetPA             int     `json:"target_pa"`
	WageWeekly           float64 `json:"wage_weekly,omitempty"`
	MarketValue          float64 `json:"market_value"`
	Status               string  `json:"status,omitempty"`
	Recommendation       string  `json:"recommendation"`
	RecommendationReason string  `json:"recommendation_reason"`
}

// PlayerHistoryEntry represents a single historical point for a player.
type PlayerHistoryEntry struct {
	SnapshotID   int64   `json:"snapshot_id"`
	SnapshotDate string  `json:"snapshot_date"`
	Season       string  `json:"season"`
	CA           int     `json:"ca"`
	PA           int     `json:"pa"`
	Age          int     `json:"age"`
	MarketValue  float64 `json:"market_value"`
}

// PlayerHistoryResponse is the API response for player historical progression.
type PlayerHistoryResponse struct {
	PlayerID   int64                `json:"player_id"`
	FMUniqueID string               `json:"fm_unique_id"`
	Name       string               `json:"name"`
	Position   string               `json:"position"`
	History    []PlayerHistoryEntry `json:"history"`
}

// ImportResponse is returned when a snapshot is uploaded or ingested.
type ImportResponse struct {
	SnapshotID           int64  `json:"snapshot_id"`
	TotalPlayersImported int    `json:"total_players_imported"`
	Message              string `json:"message"`
}
