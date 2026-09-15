package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"fm-tracker/server/internal/db"
	"fm-tracker/server/internal/models"
	"fm-tracker/server/internal/parser"
)

func setupTestServer(t *testing.T) (http.Handler, *db.DB, func()) {
	tmpDir, err := os.MkdirTemp("", "fm-tracker-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}

	dbPath := filepath.Join(tmpDir, "test.db")
	database, err := db.NewDB(dbPath)
	if err != nil {
		t.Fatalf("failed to create test db: %v", err)
	}

	htmlParser := parser.NewParser()
	h := NewHandler(database, htmlParser)
	router := RegisterRoutes(h)

	cleanup := func() {
		database.Close()
		os.RemoveAll(tmpDir)
	}

	return router, database, cleanup
}

func createMultipartRequest(url string, fields map[string]string, fileFieldName, filename, fileContent string) (*http.Request, error) {
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	for k, v := range fields {
		if err := writer.WriteField(k, v); err != nil {
			return nil, err
		}
	}

	part, err := writer.CreateFormFile(fileFieldName, filename)
	if err != nil {
		return nil, err
	}
	if _, err := part.Write([]byte(fileContent)); err != nil {
		return nil, err
	}

	if err := writer.Close(); err != nil {
		return nil, err
	}

	req := httptest.NewRequest("POST", url, body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	return req, nil
}

func TestAPIFullWorkflow(t *testing.T) {
	router, _, cleanup := setupTestServer(t)
	defer cleanup()

	// Snapshot 1 HTML (Pre-season)
	snapshot1HTML := `
<!DOCTYPE html>
<html>
<head><title>Arsenal - Squad - Players</title></head>
<body>
    <table>
        <tr>
            <th>UID</th><th>Name</th><th>Nat</th><th>Position</th><th>Age</th><th>CA</th><th>PA</th><th>Wage</th><th>Value</th><th>Status</th>
        </tr>
        <tr>
            <td>101</td><td>Thomas Partey</td><td>GHA</td><td>DM</td><td>31</td><td>154</td><td>160</td><td>£160,000 p/w</td><td>£15M</td><td>Fit</td>
        </tr>
        <tr>
            <td>102</td><td>Ethan Nwaneri</td><td>ENG</td><td>AM (C)</td><td>17</td><td>122</td><td>175</td><td>£5,000 p/w</td><td>£30M</td><td>Fit</td>
        </tr>
        <tr>
            <td>103</td><td>Reiss Nelson</td><td>ENG</td><td>AM (R)</td><td>24</td><td>135</td><td>145</td><td>£60,000 p/w</td><td>£18M</td><td>Fit</td>
        </tr>
    </table>
</body>
</html>
`

	// 1. Import Snapshot 1
	req1, err := createMultipartRequest("/api/v1/snapshots/import", map[string]string{
		"club_name":    "Arsenal",
		"in_game_date": "2024-07-01",
		"season_label": "2024/2025 Pre-season",
	}, "file", "pre_season.html", snapshot1HTML)
	if err != nil {
		t.Fatalf("failed to create req1: %v", err)
	}

	rec1 := httptest.NewRecorder()
	router.ServeHTTP(rec1, req1)
	if rec1.Code != http.StatusCreated {
		t.Fatalf("import 1 failed with status %d: %s", rec1.Code, rec1.Body.String())
	}

	var resp1 models.ImportResponse
	if err := json.Unmarshal(rec1.Body.Bytes(), &resp1); err != nil {
		t.Fatalf("failed to parse import 1 response: %v", err)
	}
	if resp1.SnapshotID != 1 || resp1.TotalPlayersImported != 3 {
		t.Errorf("expected snapshot ID 1 and 3 players, got ID %d and %d players", resp1.SnapshotID, resp1.TotalPlayersImported)
	}

	// Snapshot 2 HTML (Mid-season with CA changes)
	// Partey drops CA 154 -> 151 (-3, Age 31 -> MUST SELL)
	// Nwaneri jumps CA 122 -> 130 (+8, Age 17 -> WONDERKID SPIKE)
	// Nelson stagnates CA 135 -> 135 (0, Age 24 -> CONSIDER LOAN / SELL)
	snapshot2HTML := `
<!DOCTYPE html>
<html>
<head><title>Arsenal - Squad - Players</title></head>
<body>
    <table>
        <tr>
            <th>UID</th><th>Name</th><th>Nat</th><th>Position</th><th>Age</th><th>CA</th><th>PA</th><th>Wage</th><th>Value</th><th>Status</th>
        </tr>
        <tr>
            <td>101</td><td>Thomas Partey</td><td>GHA</td><td>DM</td><td>31</td><td>151</td><td>160</td><td>£160,000 p/w</td><td>£12M</td><td>Fit</td>
        </tr>
        <tr>
            <td>102</td><td>Ethan Nwaneri</td><td>ENG</td><td>AM (C)</td><td>17</td><td>130</td><td>175</td><td>£15,000 p/w</td><td>£45M</td><td>Fit</td>
        </tr>
        <tr>
            <td>103</td><td>Reiss Nelson</td><td>ENG</td><td>AM (R)</td><td>24</td><td>135</td><td>145</td><td>£60,000 p/w</td><td>£16M</td><td>Fit</td>
        </tr>
    </table>
</body>
</html>
`

	// 2. Import Snapshot 2
	req2, err := createMultipartRequest("/api/v1/snapshots/import", map[string]string{
		"club_name":    "Arsenal",
		"in_game_date": "2025-01-01",
		"season_label": "2024/2025 Mid-season",
	}, "file", "mid_season.html", snapshot2HTML)
	if err != nil {
		t.Fatalf("failed to create req2: %v", err)
	}

	rec2 := httptest.NewRecorder()
	router.ServeHTTP(rec2, req2)
	if rec2.Code != http.StatusCreated {
		t.Fatalf("import 2 failed with status %d: %s", rec2.Code, rec2.Body.String())
	}

	// 3. Test GET /api/v1/snapshots
	reqList := httptest.NewRequest("GET", "/api/v1/snapshots", nil)
	recList := httptest.NewRecorder()
	router.ServeHTTP(recList, reqList)
	if recList.Code != http.StatusOK {
		t.Fatalf("snapshots list failed: %d", recList.Code)
	}

	var snapshots []models.Snapshot
	if err := json.Unmarshal(recList.Body.Bytes(), &snapshots); err != nil {
		t.Fatalf("failed to parse snapshots list: %v", err)
	}
	if len(snapshots) != 2 {
		t.Fatalf("expected 2 snapshots, got %d", len(snapshots))
	}

	// 4. Test GET /api/v1/squad/comparison?base_snapshot_id=1&target_snapshot_id=2
	reqComp := httptest.NewRequest("GET", "/api/v1/squad/comparison?base_snapshot_id=1&target_snapshot_id=2", nil)
	recComp := httptest.NewRecorder()
	router.ServeHTTP(recComp, reqComp)
	if recComp.Code != http.StatusOK {
		t.Fatalf("comparison failed: %d: %s", recComp.Code, recComp.Body.String())
	}

	var comparison []models.ComparisonItem
	if err := json.Unmarshal(recComp.Body.Bytes(), &comparison); err != nil {
		t.Fatalf("failed to parse comparison response: %v", err)
	}
	if len(comparison) != 3 {
		t.Fatalf("expected 3 comparison items, got %d", len(comparison))
	}

	// Verify each player's delta and recommendation
	compMap := make(map[string]models.ComparisonItem)
	for _, item := range comparison {
		compMap[item.Name] = item
	}

	partey := compMap["Thomas Partey"]
	if partey.DeltaCA != -3 || partey.Recommendation != "SELL" {
		t.Errorf("Partey comparison mismatch: DeltaCA=%d, Rec=%s", partey.DeltaCA, partey.Recommendation)
	}

	nwaneri := compMap["Ethan Nwaneri"]
	if nwaneri.DeltaCA != 8 || nwaneri.Recommendation != "PROMOTE" {
		t.Errorf("Nwaneri comparison mismatch: DeltaCA=%d, Rec=%s", nwaneri.DeltaCA, nwaneri.Recommendation)
	}

	nelson := compMap["Reiss Nelson"]
	if nelson.DeltaCA != 0 || nelson.Recommendation != "MONITOR/LOAN" {
		t.Errorf("Nelson comparison mismatch: DeltaCA=%d, Rec=%s", nelson.DeltaCA, nelson.Recommendation)
	}

	// Test category=senior (Partey: 31, Nelson: 24)
	reqSenior := httptest.NewRequest("GET", "/api/v1/squad/comparison?base_snapshot_id=1&target_snapshot_id=2&category=senior", nil)
	recSenior := httptest.NewRecorder()
	router.ServeHTTP(recSenior, reqSenior)
	if recSenior.Code != http.StatusOK {
		t.Fatalf("senior comparison failed: %d", recSenior.Code)
	}
	var compSenior []models.ComparisonItem
	_ = json.Unmarshal(recSenior.Body.Bytes(), &compSenior)
	if len(compSenior) != 2 {
		t.Errorf("expected 2 senior players, got %d", len(compSenior))
	}

	// Test category=u18 (Nwaneri: 17)
	reqU18 := httptest.NewRequest("GET", "/api/v1/squad/comparison?base_snapshot_id=1&target_snapshot_id=2&category=u18", nil)
	recU18 := httptest.NewRecorder()
	router.ServeHTTP(recU18, reqU18)
	if recU18.Code != http.StatusOK {
		t.Fatalf("u18 comparison failed: %d", recU18.Code)
	}
	var compU18 []models.ComparisonItem
	_ = json.Unmarshal(recU18.Body.Bytes(), &compU18)
	if len(compU18) != 1 || compU18[0].Name != "Ethan Nwaneri" {
		t.Errorf("expected 1 U18 player (Nwaneri), got %+v", compU18)
	}

	// 5. Test GET /api/v1/players/{id}/history
	playerID := partey.PlayerID
	reqHistory := httptest.NewRequest("GET", fmt.Sprintf("/api/v1/players/%d/history", playerID), nil)
	recHistory := httptest.NewRecorder()
	router.ServeHTTP(recHistory, reqHistory)
	if recHistory.Code != http.StatusOK {
		t.Fatalf("player history failed: %d: %s", recHistory.Code, recHistory.Body.String())
	}

	var historyResp models.PlayerHistoryResponse
	if err := json.Unmarshal(recHistory.Body.Bytes(), &historyResp); err != nil {
		t.Fatalf("failed to parse history response: %v", err)
	}
	if len(historyResp.History) != 2 {
		t.Fatalf("expected 2 historical snapshots for Partey, got %d", len(historyResp.History))
	}
	if historyResp.History[0].CA != 154 || historyResp.History[1].CA != 151 {
		t.Errorf("expected Partey history CA 154 and 151, got %d and %d", historyResp.History[0].CA, historyResp.History[1].CA)
	}
}
