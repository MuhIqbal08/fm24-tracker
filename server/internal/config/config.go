package config

import (
	"os"
	"path/filepath"
)

type Config struct {
	Port         string
	DBPath       string
	WatchDir     string
	WatchEnabled bool
}

func LoadConfig() *Config {
	port := getEnv("PORT", "8080")
	dbPath := getEnv("DB_PATH", filepath.Join("data", "fm_tracker.db"))
	watchDir := getEnv("WATCH_DIR", "exports")
	watchEnabled := getEnv("WATCH_ENABLED", "true") != "false"

	return &Config{
		Port:         port,
		DBPath:       dbPath,
		WatchDir:     watchDir,
		WatchEnabled: watchEnabled,
	}
}

func getEnv(key, defaultVal string) string {
	if val, ok := os.LookupEnv(key); ok && val != "" {
		return val
	}
	return defaultVal
}
