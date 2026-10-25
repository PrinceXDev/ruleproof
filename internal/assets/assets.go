// Package assets is a synthetic project-asset API used as RuleProof's fixture target.
// Tokens are public demo labels, not real credentials.
package assets

import "net/http"

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

// Handler serves GET (read) and PUT (update) on /assets/{id}.
// When broken is true, the cross-tenant ownership check on reads is skipped —
// the seeded defect this demo is built to expose. The role check (viewers
// cannot update) is always enforced, so some cells still pass even when broken.
func Handler(broken bool) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet && r.Method != http.MethodPut {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		id, ok := identities[authToken(r)]
		if !ok {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		assetID := r.URL.Path[len("/assets/"):]
		owner, ok := owners[assetID]
		if !ok {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		crossTenant := id.Tenant != owner
		if crossTenant && !(broken && r.Method == http.MethodGet) {
			w.WriteHeader(http.StatusForbidden)
			return
		}
		if r.Method == http.MethodPut && id.Role != "editor" {
			w.WriteHeader(http.StatusForbidden)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
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
