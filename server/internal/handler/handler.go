package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"fm-tracker/server/internal/db"
	"fm-tracker/server/internal/engine"
	"fm-tracker/server/internal/models"
	"fm-tracker/server/internal/parser"
)

type Handler struct {
	db     *db.DB
	parser *parser.Parser
}

func NewHandler(database *db.DB, htmlParser *parser.Parser) *Handler {
	return &Handler{
		db:     database,
		parser: htmlParser,
	}
}

// HealthCheck returns a simple status 200 response.
func (h *Handler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"service": "fm-tracker",
	})
}

// ImportSnapshot handles POST /api/v1/snapshots/import
func (h *Handler) ImportSnapshot(w http.ResponseWriter, r *http.Request) {
	// Max upload size 32 MB
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		respondError(w, http.StatusBadRequest, fmt.Sprintf("Failed to parse multipart form: %v", err))
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		respondError(w, http.StatusBadRequest, "Missing 'file' field in multipart form")
		return
	}
	defer file.Close()

	seasonLabel := strings.TrimSpace(r.FormValue("season_label"))
	inGameDate := strings.TrimSpace(r.FormValue("in_game_date"))
	clubName := strings.TrimSpace(r.FormValue("club_name"))
	notes := strings.TrimSpace(r.FormValue("notes"))

	if seasonLabel == "" {
		fileName := strings.TrimSuffix(header.Filename, ".html")
		fileName = strings.TrimSuffix(fileName, ".htm")
		seasonLabel = fileName
	}

	parsed, err := h.parser.ParseHTML(file, clubName, inGameDate, seasonLabel)
	if err != nil {
		respondError(w, http.StatusBadRequest, fmt.Sprintf("Failed to parse squad HTML: %v", err))
		return
	}

	if notes != "" {
		parsed.Notes = notes
	}

	snapshot, err := h.db.CreateSnapshot(r.Context(), parsed)
	if err != nil {
		if errors.Is(err, db.ErrAlreadyImported) {
			respondError(w, http.StatusConflict, err.Error())
			return
		}
		respondError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to save snapshot: %v", err))
		return
	}

	respondJSON(w, http.StatusCreated, models.ImportResponse{
		SnapshotID:           snapshot.ID,
		TotalPlayersImported: snapshot.TotalPlayers,
		Message:              "Snapshot imported successfully",
	})
}

// ListSnapshots handles GET /api/v1/snapshots
func (h *Handler) ListSnapshots(w http.ResponseWriter, r *http.Request) {
	snapshots, err := h.db.GetSnapshots(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to retrieve snapshots: %v", err))
		return
	}
	if snapshots == nil {
		snapshots = make([]models.Snapshot, 0)
	}
	respondJSON(w, http.StatusOK, snapshots)
}

// GetSnapshot handles GET /api/v1/snapshots/{id}
func (h *Handler) GetSnapshot(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid snapshot ID")
		return
	}

	snapshot, err := h.db.GetSnapshotByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, db.ErrSnapshotNotFound) {
			respondError(w, http.StatusNotFound, "Snapshot not found")
			return
		}
		respondError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to retrieve snapshot: %v", err))
		return
	}

	respondJSON(w, http.StatusOK, snapshot)
}

// SquadComparison handles GET /api/v1/squad/comparison?base_snapshot_id={id}&target_snapshot_id={id}
func (h *Handler) SquadComparison(w http.ResponseWriter, r *http.Request) {
	baseStr := r.URL.Query().Get("base_snapshot_id")
	targetStr := r.URL.Query().Get("target_snapshot_id")

	var baseID, targetID int64
	var err error

	// If IDs not specified, dynamically select the earliest and latest snapshots
	if baseStr == "" || targetStr == "" {
		snapshots, err := h.db.GetSnapshots(r.Context())
		if err != nil {
			respondError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to retrieve snapshots: %v", err))
			return
		}
		if len(snapshots) == 0 {
			respondJSON(w, http.StatusOK, []models.ComparisonItem{})
			return
		}

		// Snapshots are ordered DESC (latest first)
		if targetStr == "" {
			targetID = snapshots[0].ID
		} else {
			targetID, _ = strconv.ParseInt(targetStr, 10, 64)
		}

		if baseStr == "" {
			// Earliest snapshot is at the end of the DESC list
			baseID = snapshots[len(snapshots)-1].ID
		} else {
			baseID, _ = strconv.ParseInt(baseStr, 10, 64)
		}
	} else {
		baseID, err = strconv.ParseInt(baseStr, 10, 64)
		if err != nil {
			respondError(w, http.StatusBadRequest, "Invalid base_snapshot_id")
			return
		}
		targetID, err = strconv.ParseInt(targetStr, 10, 64)
		if err != nil {
			respondError(w, http.StatusBadRequest, "Invalid target_snapshot_id")
			return
		}
	}

	category := r.URL.Query().Get("category")
	rawRows, err := h.db.GetRawComparisonData(r.Context(), baseID, targetID, category)
	if err != nil {
		respondError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to calculate comparison: %v", err))
		return
	}

	comparison := engine.BuildComparison(rawRows)
	respondJSON(w, http.StatusOK, comparison)
}

// PlayerHistory handles GET /api/v1/players/{id}/history
func (h *Handler) PlayerHistory(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid player ID")
		return
	}

	history, err := h.db.GetPlayerHistory(r.Context(), id)
	if err != nil {
		if errors.Is(err, db.ErrPlayerNotFound) {
			respondError(w, http.StatusNotFound, "Player not found")
			return
		}
		respondError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to retrieve player history: %v", err))
		return
	}

	respondJSON(w, http.StatusOK, history)
}

func respondJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}
