package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

// RegisterRoutes sets up middleware and mounts all API routes onto a Chi router.
func RegisterRoutes(h *Handler) http.Handler {
	r := chi.NewRouter()

	// Global Middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// CORS configuration for local Next.js frontend
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Base health check
	r.Get("/health", h.HealthCheck)

	// API v1 routes
	r.Route("/api/v1", func(api chi.Router) {
		api.Get("/health", h.HealthCheck)

		// Snapshot ingestion and retrieval
		api.Post("/snapshots/import", h.ImportSnapshot)
		api.Get("/snapshots", h.ListSnapshots)
		api.Get("/snapshots/{id}", h.GetSnapshot)

		// Squad comparison & decision advice
		api.Get("/squad/comparison", h.SquadComparison)

		// Player historical progression
		api.Get("/players/{id}/history", h.PlayerHistory)
	})

	return r
}
