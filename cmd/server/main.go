// Command server runs RuleProof's API alongside its synthetic fixture
// instances (broken, partial and fixed), so the web UI can run the same
// approved plan against any of them and compare evidence.
//
// Storage: set DATABASE_URL to a postgres:// DSN to use PostgreSQL; otherwise
// a local SQLite file (./ruleproof.db, or RULEPROOF_DB_PATH) is used — no
// setup required for local development.
package main

import (
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"time"

	"ruleproof/internal/api"
	"ruleproof/internal/assets"
	"ruleproof/internal/store"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = os.Getenv("RULEPROOF_DB_PATH")
	}
	db, err := store.Open(dsn)
	if err != nil {
		log.Fatalf("open store: %v", err)
	}
	defer db.Close()

	fixtures := map[string]string{}
	for name, mode := range assets.Modes {
		fixture := httptest.NewServer(assets.Handler(mode))
		defer fixture.Close()
		fixtures[name] = fixture.URL
	}

	srv := api.New(db, fixtures)
	if err := srv.ConfigureWorkbench(os.Getenv("RULEPROOF_WORKBENCH_CONFIG")); err != nil {
		log.Fatalf("configure workbench: %v", err)
	}
	if origin := os.Getenv("RULEPROOF_ALLOWED_ORIGIN"); origin != "" {
		srv.AllowedOrigin = origin
	}

	addr := os.Getenv("RULEPROOF_ADDR")
	if addr == "" {
		// Hosting platforms (Render, Fly, Railway) inject PORT.
		if port := os.Getenv("PORT"); port != "" {
			addr = ":" + port
		} else {
			addr = ":8080"
		}
	}

	// In a single-container deploy the statically exported UI is served from
	// the same origin as the API. Locally `next dev` serves it instead.
	webDir := os.Getenv("RULEPROOF_WEB_DIR")
	if webDir == "" {
		webDir = "web/out"
	}
	mux := http.NewServeMux()
	mux.Handle("/api/", srv.Routes())
	if info, err := os.Stat(webDir); err == nil && info.IsDir() {
		mux.Handle("/", http.FileServer(http.Dir(webDir)))
	} else {
		webDir = "(not found; run `npm run build` in web/ or use `npm run dev`)"
	}

	fmt.Println("RuleProof API listening on", addr)
	fmt.Println("  storage:       ", db.Driver())
	fmt.Println("  web UI:        ", webDir)
	fmt.Println("  broken fixture: ", fixtures["broken"])
	fmt.Println("  partial fixture:", fixtures["partial"])
	fmt.Println("  fixed fixture:  ", fixtures["fixed"])

	httpServer := &http.Server{
		Addr:              addr,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      70 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	log.Fatal(httpServer.ListenAndServe())
}
