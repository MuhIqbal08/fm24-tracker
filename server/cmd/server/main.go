package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"fm-tracker/server/internal/config"
	"fm-tracker/server/internal/db"
	"fm-tracker/server/internal/handler"
	"fm-tracker/server/internal/parser"
	"fm-tracker/server/internal/watcher"
)

func main() {
	cfg := config.LoadConfig()

	log.Printf("==============================================")
	log.Printf("  FM24 Squad Ability Tracker (SAT-24) Backend")
	log.Printf("==============================================")
	log.Printf("Port:         %s", cfg.Port)
	log.Printf("Database:     %s", cfg.DBPath)
	log.Printf("Watcher Dir:  %s", cfg.WatchDir)
	log.Printf("Watcher On:   %v", cfg.WatchEnabled)

	// Initialize SQLite Database
	database, err := db.NewDB(cfg.DBPath)
	if err != nil {
		log.Fatalf("Fatal: Database initialization failed: %v", err)
	}
	defer database.Close()
	log.Printf("Database initialized and SQLite WAL mode enabled.")

	// Initialize Parser and Handlers
	htmlParser := parser.NewParser()
	apiHandler := handler.NewHandler(database, htmlParser)
	routes := handler.RegisterRoutes(apiHandler)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Initialize and start Watcher if enabled
	var fw *watcher.Watcher
	if cfg.WatchEnabled {
		fw = watcher.NewWatcher(cfg.WatchDir, database, htmlParser)
		if err := fw.Start(ctx); err != nil {
			log.Printf("Warning: Failed to start folder watcher: %v", err)
		}
	}

	// Setup HTTP Server
	server := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      routes,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Server runner goroutine
	serverErrChan := make(chan error, 1)
	go func() {
		log.Printf("SAT-24 Backend server listening on http://localhost:%s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErrChan <- err
		}
	}()

	// Listen for OS interrupt signals
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	select {
	case sig := <-quit:
		log.Printf("Received signal: %v. Initiating graceful shutdown...", sig)
	case err := <-serverErrChan:
		log.Fatalf("Server error: %v", err)
	}

	// Stop Watcher
	if fw != nil {
		_ = fw.Stop()
	}

	// Graceful shutdown context
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited cleanly.")
}
