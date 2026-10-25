// Command server runs RuleProof's API alongside its two synthetic fixture
// instances (broken and fixed), so the web UI can run the same approved plan
// against either one and compare evidence.
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

	broken := httptest.NewServer(assets.Handler(true))
	fixed := httptest.NewServer(assets.Handler(false))
	defer broken.Close()
	defer fixed.Close()

	srv := api.New(db, broken.URL, fixed.URL)
	if origin := os.Getenv("RULEPROOF_ALLOWED_ORIGIN"); origin != "" {
		srv.AllowedOrigin = origin
	}

	addr := os.Getenv("RULEPROOF_ADDR")
	if addr == "" {
		addr = ":8080"
	}

	fmt.Println("RuleProof API listening on", addr)
	fmt.Println("  storage:       ", db.Driver())
	fmt.Println("  broken fixture:", broken.URL)
	fmt.Println("  fixed fixture: ", fixed.URL)

	httpServer := &http.Server{
		Addr:              addr,
		Handler:           srv.Routes(),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	log.Fatal(httpServer.ListenAndServe())
}
