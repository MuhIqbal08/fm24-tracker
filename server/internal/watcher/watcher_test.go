package watcher

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"

	"fm-tracker/server/internal/db"
	"fm-tracker/server/internal/parser"
)

func TestWatcherAutoImport(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "fm-watcher-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	dbPath := filepath.Join(tmpDir, "watcher.db")
	database, err := db.NewDB(dbPath)
	if err != nil {
		t.Fatalf("failed to create db: %v", err)
	}
	defer database.Close()

	watchDir := filepath.Join(tmpDir, "exports")
	htmlParser := parser.NewParser()
	w := NewWatcher(watchDir, database, htmlParser)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	if err := w.Start(ctx); err != nil {
		t.Fatalf("failed to start watcher: %v", err)
	}
	defer w.Stop()

	// Write an export HTML file to the watch directory
	htmlContent := `
<!DOCTYPE html>
<html>
<head><title>Arsenal - Squad</title></head>
<body>
    <table>
        <tr><th>UID</th><th>Name</th><th>Nat</th><th>Position</th><th>Age</th><th>CA</th><th>PA</th><th>Wage</th><th>Value</th><th>Status</th></tr>
        <tr><td>201</td><td>Bukayo Saka</td><td>ENG</td><td>AM (R)</td><td>22</td><td>168</td><td>180</td><td>£195,000 p/w</td><td>£110M</td><td>Fit</td></tr>
    </table>
</body>
</html>
`
	exportFile := filepath.Join(watchDir, "arsenal_squad.html")
	if err := os.WriteFile(exportFile, []byte(htmlContent), 0644); err != nil {
		t.Fatalf("failed to write export file: %v", err)
	}

	// Wait for debounce and processing (500ms debounce + buffer)
	var snapshotsCount int
	for i := 0; i < 20; i++ {
		time.Sleep(100 * time.Millisecond)
		snapshots, err := database.GetSnapshots(ctx)
		if err == nil && len(snapshots) > 0 {
			snapshotsCount = len(snapshots)
			break
		}
	}

	if snapshotsCount == 0 {
		t.Fatalf("expected watcher to auto-import snapshot, but none found")
	}
}
