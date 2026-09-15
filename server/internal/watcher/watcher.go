package watcher

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
	"fm-tracker/server/internal/db"
	"fm-tracker/server/internal/parser"
)

type Watcher struct {
	watchDir string
	db       *db.DB
	parser   *parser.Parser
	watcher  *fsnotify.Watcher
	mu       sync.Mutex
	timers   map[string]*time.Timer
}

func NewWatcher(watchDir string, database *db.DB, htmlParser *parser.Parser) *Watcher {
	return &Watcher{
		watchDir: watchDir,
		db:       database,
		parser:   htmlParser,
		timers:   make(map[string]*time.Timer),
	}
}

// Start begins monitoring the watch directory for new or modified HTML files.
func (w *Watcher) Start(ctx context.Context) error {
	if err := os.MkdirAll(w.watchDir, 0755); err != nil {
		return fmt.Errorf("failed to create watch directory %s: %w", w.watchDir, err)
	}

	fsw, err := fsnotify.NewWatcher()
	if err != nil {
		return fmt.Errorf("failed to create fsnotify watcher: %w", err)
	}
	w.watcher = fsw

	if err := w.watcher.Add(w.watchDir); err != nil {
		return fmt.Errorf("failed to add watch directory %s to fsnotify: %w", w.watchDir, err)
	}

	log.Printf("[Watcher] Listening for FM24 HTML exports in: %s", w.watchDir)

	// Scan existing files on startup
	if err := w.scanExistingFiles(ctx); err != nil {
		log.Printf("[Watcher] Warning during initial scan: %v", err)
	}

	go w.eventLoop(ctx)
	return nil
}

// Stop stops the file watcher.
func (w *Watcher) Stop() error {
	w.mu.Lock()
	defer w.mu.Unlock()
	for _, timer := range w.timers {
		timer.Stop()
	}
	w.timers = make(map[string]*time.Timer)

	if w.watcher != nil {
		return w.watcher.Close()
	}
	return nil
}

func (w *Watcher) eventLoop(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			log.Printf("[Watcher] Stopping event loop...")
			return
		case event, ok := <-w.watcher.Events:
			if !ok {
				return
			}
			if event.Has(fsnotify.Create) || event.Has(fsnotify.Write) {
				w.scheduleProcessing(ctx, event.Name)
			}
		case err, ok := <-w.watcher.Errors:
			if !ok {
				return
			}
			log.Printf("[Watcher] Error from fsnotify: %v", err)
		}
	}
}

func (w *Watcher) scheduleProcessing(ctx context.Context, filePath string) {
	ext := strings.ToLower(filepath.Ext(filePath))
	if ext != ".html" && ext != ".htm" {
		return
	}

	baseName := filepath.Base(filePath)
	if strings.HasPrefix(baseName, ".") || strings.HasPrefix(baseName, "~") || strings.HasSuffix(baseName, ".tmp") {
		return
	}

	w.mu.Lock()
	defer w.mu.Unlock()

	// Debounce 500ms to ensure file write completes
	if timer, exists := w.timers[filePath]; exists {
		timer.Stop()
	}

	w.timers[filePath] = time.AfterFunc(500*time.Millisecond, func() {
		w.mu.Lock()
		delete(w.timers, filePath)
		w.mu.Unlock()

		if err := w.processFile(ctx, filePath); err != nil {
			if errors.Is(err, db.ErrAlreadyImported) {
				log.Printf("[Watcher] File already imported, skipping: %s", filepath.Base(filePath))
			} else {
				log.Printf("[Watcher] Error processing file %s: %v", filepath.Base(filePath), err)
			}
		}
	})
}

func (w *Watcher) processFile(ctx context.Context, filePath string) error {
	file, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("failed to open file %s: %w", filePath, err)
	}
	defer file.Close()

	fileInfo, err := file.Stat()
	if err != nil {
		return fmt.Errorf("failed to stat file %s: %w", filePath, err)
	}

	if fileInfo.Size() == 0 {
		return fmt.Errorf("file %s is empty", filePath)
	}

	// Derive fallback labels from filename and file modification date
	fileName := strings.TrimSuffix(filepath.Base(filePath), filepath.Ext(filePath))
	defaultDate := fileInfo.ModTime().Format("2006-01-02")
	defaultSeason := fmt.Sprintf("Season (%s)", fileName)

	parsed, err := w.parser.ParseHTML(file, "", defaultDate, defaultSeason)
	if err != nil {
		return fmt.Errorf("failed to parse HTML export: %w", err)
	}

	snapshot, err := w.db.CreateSnapshot(ctx, parsed)
	if err != nil {
		return err
	}

	log.Printf("[Watcher] Successfully auto-imported '%s' -> Snapshot #%d (%s, %s, %d players)",
		filepath.Base(filePath), snapshot.ID, snapshot.ClubName, snapshot.SeasonLabel, snapshot.TotalPlayers)
	return nil
}

func (w *Watcher) scanExistingFiles(ctx context.Context) error {
	entries, err := os.ReadDir(w.watchDir)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		ext := strings.ToLower(filepath.Ext(entry.Name()))
		if ext == ".html" || ext == ".htm" {
			filePath := filepath.Join(w.watchDir, entry.Name())
			if err := w.processFile(ctx, filePath); err != nil {
				if !errors.Is(err, db.ErrAlreadyImported) {
					log.Printf("[Watcher] Could not import existing file %s: %v", entry.Name(), err)
				}
			}
		}
	}
	return nil
}
