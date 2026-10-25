// Package demo contains synthetic fixtures only; its tokens are not real credentials.
package demo

import (
	"net/http"
	"ruleproof/internal/check"
)

func Matrix() []check.Case {
	const rule = "Authenticated users may read invoices only in their own tenant."
	return []check.Case{
		{ID: "A-own", Rule: rule, Actor: "Alice / tenant A", Path: "/invoices/A", Token: "demo-alice", Want: 200},
		{ID: "A-cross", Rule: rule, Actor: "Alice / tenant A", Path: "/invoices/B", Token: "demo-alice", Want: 403},
		{ID: "B-own", Rule: rule, Actor: "Bob / tenant B", Path: "/invoices/B", Token: "demo-bob", Want: 200},
		{ID: "B-cross", Rule: rule, Actor: "Bob / tenant B", Path: "/invoices/A", Token: "demo-bob", Want: 403},
		{ID: "anonymous", Rule: rule, Actor: "Anonymous", Path: "/invoices/A", Want: 401},
		{ID: "invalid-token", Rule: rule, Actor: "Unknown", Path: "/invoices/A", Token: "demo-invalid", Want: 401},
		{ID: "missing", Rule: rule, Actor: "Alice / tenant A", Path: "/invoices/missing", Token: "demo-alice", Want: 404},
	}
}

// Handler intentionally omits the tenant check when broken is true.
func Handler(broken bool) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.WriteHeader(405)
			return
		}
		tenant := ""
		switch r.Header.Get("Authorization") {
		case "Bearer demo-alice":
			tenant = "A"
		case "Bearer demo-bob":
			tenant = "B"
		default:
			w.WriteHeader(401)
			return
		}
		owner := ""
		switch r.URL.Path {
		case "/invoices/A":
			owner = "A"
		case "/invoices/B":
			owner = "B"
		default:
			w.WriteHeader(404)
			return
		}
		if !broken && tenant != owner {
			w.WriteHeader(403)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"invoice":"synthetic-demo"}`))
	})
}
