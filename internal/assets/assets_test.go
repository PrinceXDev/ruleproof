package assets_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"ruleproof/internal/assets"
)

func request(t *testing.T, h http.Handler, method, token, path string) int {
	t.Helper()
	req := httptest.NewRequest(method, path, nil)
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec.Code
}

func TestFixedFixtureEnforcesTenantAndRole(t *testing.T) {
	h := assets.Handler(assets.Fixed)
	cases := []struct {
		method, token, path string
		want                int
	}{
		{"GET", "demo-viewer-a", "/assets/a1", 200},
		{"PUT", "demo-viewer-a", "/assets/a1", 403},
		{"GET", "demo-viewer-a", "/assets/b1", 403},
		{"PUT", "demo-viewer-a", "/assets/b1", 403},
		{"GET", "demo-editor-a", "/assets/a1", 200},
		{"PUT", "demo-editor-a", "/assets/a1", 200},
		{"GET", "demo-editor-a", "/assets/b1", 403},
		{"PUT", "demo-editor-a", "/assets/b1", 403},
		{"GET", "", "/assets/a1", 401},
		{"GET", "demo-invalid", "/assets/a1", 401},
		{"GET", "demo-editor-a", "/assets/missing", 404},
		{"GET", "demo-viewer-a", "/assets/a1/export", 200},
		{"GET", "demo-viewer-a", "/assets/b1/export", 403},
		{"GET", "demo-editor-a", "/assets/b1/export", 403},
		{"PUT", "demo-editor-a", "/assets/a1/export", 405},
	}
	for _, c := range cases {
		if got := request(t, h, c.method, c.token, c.path); got != c.want {
			t.Errorf("%s %s as %q: want %d, got %d", c.method, c.path, c.token, c.want, got)
		}
	}
}

func TestBrokenFixtureLeaksCrossTenantReadsOnly(t *testing.T) {
	h := assets.Handler(assets.Broken)
	// the seeded defect: cross-tenant GET succeeds when it should not.
	if got := request(t, h, "GET", "demo-viewer-a", "/assets/b1"); got != 200 {
		t.Fatalf("expected seeded cross-tenant read leak (200), got %d", got)
	}
	// the forgotten endpoint: cross-tenant export leaks the same way.
	if got := request(t, h, "GET", "demo-viewer-a", "/assets/b1/export"); got != 200 {
		t.Fatalf("expected seeded cross-tenant export leak (200), got %d", got)
	}
	// the role check is untouched by the defect: a viewer still cannot update.
	if got := request(t, h, "PUT", "demo-viewer-a", "/assets/b1"); got != 403 {
		t.Fatalf("role check should still deny viewer update, got %d", got)
	}
	// authentication is untouched by the defect.
	if got := request(t, h, "GET", "", "/assets/a1"); got != 401 {
		t.Fatalf("anonymous request should still be rejected, got %d", got)
	}
}

func TestPartialFixtureLooksFixedButTrustsHeadAndTenantHeader(t *testing.T) {
	partial, fixed := assets.Handler(assets.Partial), assets.Handler(assets.Fixed)
	// the exact approved requests behave like the corrected fixture.
	for _, path := range []string{"/assets/b1", "/assets/b1/export"} {
		if got := request(t, partial, "GET", "demo-viewer-a", path); got != 403 {
			t.Fatalf("GET %s: want 403, got %d", path, got)
		}
	}
	if got := request(t, partial, "HEAD", "demo-viewer-a", "/assets/b1"); got != 200 {
		t.Fatalf("partial HEAD should skip the tenant check, got %d", got)
	}
	if got := request(t, fixed, "HEAD", "demo-viewer-a", "/assets/b1"); got != 405 {
		t.Fatalf("fixed HEAD should be refused, got %d", got)
	}
	spoof := func(h http.Handler, method string) int {
		req := httptest.NewRequest(method, "/assets/b1", nil)
		req.Header.Set("Authorization", "Bearer demo-editor-a")
		req.Header.Set("X-Tenant-ID", "B")
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		return rec.Code
	}
	if got := spoof(partial, "PUT"); got != 200 {
		t.Fatalf("partial should trust a spoofed X-Tenant-ID, got %d", got)
	}
	if got := spoof(fixed, "PUT"); got != 403 {
		t.Fatalf("fixed should ignore X-Tenant-ID, got %d", got)
	}
}

func TestMethodNotAllowed(t *testing.T) {
	h := assets.Handler(assets.Fixed)
	if got := request(t, h, "DELETE", "demo-editor-a", "/assets/a1"); got != http.StatusMethodNotAllowed {
		t.Fatalf("want 405 for unsupported method, got %d", got)
	}
}

func TestExportReturnsValidJSON(t *testing.T) {
	req := httptest.NewRequest("GET", "/assets/a1/export", nil)
	req.Header.Set("Authorization", "Bearer demo-viewer-a")
	rec := httptest.NewRecorder()
	assets.Handler(assets.Fixed).ServeHTTP(rec, req)
	if !json.Valid(rec.Body.Bytes()) {
		t.Fatalf("export body is not valid JSON: %s", rec.Body.String())
	}
}

func TestOpenAPISpecIsValidJSON(t *testing.T) {
	if !json.Valid(assets.OpenAPISpec) {
		t.Fatal("embedded OpenAPI spec is not valid JSON")
	}
}
