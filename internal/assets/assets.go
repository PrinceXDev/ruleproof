// Package assets is a synthetic project-asset API used as RuleProof's fixture target.
// Tokens are public demo labels, not real credentials.
package assets

import (
	_ "embed"
	"net/http"
	"strings"
)

// OpenAPISpec describes the fixture's endpoints. RuleProof maps approved rules
// onto it to find object-level endpoints no rule covers.
//
//go:embed openapi.json
var OpenAPISpec []byte

type identity struct {
	Tenant string
	Role   string // "editor" or "viewer"
}

var identities = map[string]identity{
	"demo-editor-a": {Tenant: "A", Role: "editor"},
	"demo-viewer-a": {Tenant: "A", Role: "viewer"},
	"demo-editor-b": {Tenant: "B", Role: "editor"},
}

var owners = map[string]string{
	"a1": "A",
	"b1": "B",
}

// Mode selects how the fixture enforces tenant isolation.
type Mode int

const (
	// Fixed checks tenant ownership on every request.
	Fixed Mode = iota
	// Broken skips the cross-tenant ownership check on GETs (read and export),
	// the seeded defect this demo is built to expose.
	Broken
	// Partial passes every approved check but carries two real-world slips:
	// HEAD reuses the GET handler without the tenant check, and a client-sent
	// X-Tenant-ID header overrides the caller's tenant.
	Partial
)

// Modes maps fixture names, as used by the API and CI, to their mode.
var Modes = map[string]Mode{"broken": Broken, "partial": Partial, "fixed": Fixed}

// Handler serves GET (read) and PUT (update) on /assets/{id}, and GET
// (export) on /assets/{id}/export. The role check (viewers cannot update) is
// always enforced, so some cells still pass even when broken.
func Handler(mode Mode) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assetID, export := strings.CutSuffix(strings.TrimPrefix(r.URL.Path, "/assets/"), "/export")
		read := r.Method == http.MethodGet || (mode == Partial && r.Method == http.MethodHead)
		if !read && (export || r.Method != http.MethodPut) {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		id, ok := identities[authToken(r)]
		if !ok {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		if t := r.Header.Get("X-Tenant-ID"); mode == Partial && t != "" {
			id.Tenant = t
		}
		owner, ok := owners[assetID]
		if !ok {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		skipTenant := (mode == Broken && r.Method == http.MethodGet) || (mode == Partial && r.Method == http.MethodHead)
		if id.Tenant != owner && !skipTenant {
			w.WriteHeader(http.StatusForbidden)
			return
		}
		if r.Method == http.MethodPut && id.Role != "editor" {
			w.WriteHeader(http.StatusForbidden)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		if export {
			_, _ = w.Write([]byte(`{"export":"` + assetID + `.csv","tenant":"` + owner + `","rows":["id,name,owner","` + assetID + `,Synthetic asset,tenant ` + owner + `"]}`))
			return
		}
		_, _ = w.Write([]byte(`{"asset":"` + assetID + `","tenant":"` + owner + `"}`))
	})
}

func authToken(r *http.Request) string {
	const prefix = "Bearer "
	h := r.Header.Get("Authorization")
	if len(h) > len(prefix) && h[:len(prefix)] == prefix {
		return h[len(prefix):]
	}
	return ""
}
