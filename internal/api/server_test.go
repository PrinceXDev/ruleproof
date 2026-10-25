package api_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"ruleproof/internal/api"
	"ruleproof/internal/assets"
	"ruleproof/internal/store"
)

const sampleRule = "Viewers can read assets in their own tenant. Editors can also update them. Neither role can access another tenant's assets."

type testEnv struct {
	server *httptest.Server
}

func newTestEnv(t *testing.T) *testEnv {
	t.Helper()
	st, err := store.Open(filepath.Join(t.TempDir(), "api-test.db"))
	if err != nil {
		t.Fatalf("open store: %v", err)
	}
	t.Cleanup(func() { st.Close() })

	broken := httptest.NewServer(assets.Handler(true))
	fixed := httptest.NewServer(assets.Handler(false))
	t.Cleanup(broken.Close)
	t.Cleanup(fixed.Close)

	srv := api.New(st, broken.URL, fixed.URL)
	ts := httptest.NewServer(srv.Routes())
	t.Cleanup(ts.Close)
	return &testEnv{server: ts}
}

func (e *testEnv) do(t *testing.T, method, path string, body any) (*http.Response, map[string]any) {
	t.Helper()
	var buf bytes.Buffer
	if body != nil {
		if err := json.NewEncoder(&buf).Encode(body); err != nil {
			t.Fatalf("encode body: %v", err)
		}
	}
	req, err := http.NewRequest(method, e.server.URL+path, &buf)
	if err != nil {
		t.Fatalf("new request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := e.server.Client().Do(req)
	if err != nil {
		t.Fatalf("do request: %v", err)
	}
	defer resp.Body.Close()
	var decoded map[string]any
	_ = json.NewDecoder(resp.Body).Decode(&decoded)
	return resp, decoded
}

func TestFullWorkflowOverHTTP(t *testing.T) {
	env := newTestEnv(t)

	resp, plan := env.do(t, http.MethodPost, "/api/plans", map[string]string{"text": sampleRule})
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("create plan: want 200, got %d (%v)", resp.StatusCode, plan)
	}
	planID := plan["id"].(string)

	// Running before approval must be rejected.
	resp, _ = env.do(t, http.MethodPost, "/api/runs", map[string]string{"planId": planID, "fixture": "fixed"})
	if resp.StatusCode != http.StatusConflict {
		t.Fatalf("run before approval: want 409, got %d", resp.StatusCode)
	}

	resp, approved := env.do(t, http.MethodPost, "/api/plans/"+planID+"/approve", nil)
	if resp.StatusCode != http.StatusOK || approved["approved"] != true {
		t.Fatalf("approve: want 200+approved, got %d (%v)", resp.StatusCode, approved)
	}

	resp, brokenRun := env.do(t, http.MethodPost, "/api/runs", map[string]string{"planId": planID, "fixture": "broken"})
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("run broken: want 200, got %d", resp.StatusCode)
	}
	if brokenRun["failCount"].(float64) == 0 {
		t.Fatal("expected the broken fixture run to report at least one failure")
	}

	resp, fixedRun := env.do(t, http.MethodPost, "/api/runs", map[string]string{"planId": planID, "fixture": "fixed"})
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("run fixed: want 200, got %d", resp.StatusCode)
	}
	if fixedRun["failCount"].(float64) != 0 {
		t.Fatalf("expected zero failures against the fixed fixture, got %v", fixedRun["failCount"])
	}

	// Editing a case creates a new plan that requires its own approval.
	cases := plan["cases"].([]any)
	firstCase := cases[0].(map[string]any)
	caseID := firstCase["id"].(string)
	resp, edited := env.do(t, http.MethodPatch, "/api/plans/"+planID+"/cases", map[string]any{
		"overrides": map[string]int{caseID: 403},
	})
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("edit cases: want 200, got %d (%v)", resp.StatusCode, edited)
	}
	editedID := edited["id"].(string)
	if editedID == planID {
		t.Fatal("editing a case must produce a new plan id")
	}
	if edited["approved"] != false {
		t.Fatal("the edited plan must start unapproved")
	}

	resp, _ = env.do(t, http.MethodPost, "/api/runs", map[string]string{"planId": editedID, "fixture": "fixed"})
	if resp.StatusCode != http.StatusConflict {
		t.Fatalf("run edited-but-unapproved plan: want 409, got %d", resp.StatusCode)
	}

	// History covers both plans in the lineage plus the two runs against the root.
	resp, history := env.do(t, http.MethodGet, "/api/plans/"+editedID+"/history", nil)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("history: want 200, got %d", resp.StatusCode)
	}
	lineage := history["lineage"].([]any)
	runs := history["runs"].([]any)
	if len(lineage) != 2 {
		t.Fatalf("expected 2 plans in lineage, got %d", len(lineage))
	}
	if len(runs) != 2 {
		t.Fatalf("expected 2 runs in lineage history, got %d", len(runs))
	}
}

func TestApprovalBlockedByUnacknowledgedAssumptions(t *testing.T) {
	env := newTestEnv(t)
	_, plan := env.do(t, http.MethodPost, "/api/plans", map[string]string{"text": "Only editors can read or update assets."})
	planID := plan["id"].(string)

	resp, _ := env.do(t, http.MethodPost, "/api/plans/"+planID+"/approve", nil)
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("approve with unacknowledged assumptions: want 400, got %d", resp.StatusCode)
	}

	resp, _ = env.do(t, http.MethodPost, "/api/plans/"+planID+"/acknowledge", nil)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("acknowledge: want 200, got %d", resp.StatusCode)
	}

	resp, _ = env.do(t, http.MethodPost, "/api/plans/"+planID+"/approve", nil)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("approve after acknowledging: want 200, got %d", resp.StatusCode)
	}
}

func TestExportBundleMatchesApprovedPlan(t *testing.T) {
	env := newTestEnv(t)
	_, plan := env.do(t, http.MethodPost, "/api/plans", map[string]string{"text": sampleRule})
	planID := plan["id"].(string)
	env.do(t, http.MethodPost, "/api/plans/"+planID+"/approve", nil)
	env.do(t, http.MethodPost, "/api/runs", map[string]string{"planId": planID, "fixture": "fixed"})

	resp, bundle := env.do(t, http.MethodGet, "/api/plans/"+planID+"/export", nil)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("export: want 200, got %d", resp.StatusCode)
	}
	exportedPlan := bundle["plan"].(map[string]any)
	if exportedPlan["id"] != planID {
		t.Fatalf("export bundle plan id mismatch: want %s, got %v", planID, exportedPlan["id"])
	}
	runs := bundle["runs"].([]any)
	if len(runs) != 1 {
		t.Fatalf("expected 1 run attached to the export, got %d", len(runs))
	}
}

func TestUnknownPlanReturns404(t *testing.T) {
	env := newTestEnv(t)
	resp, _ := env.do(t, http.MethodGet, "/api/plans/does-not-exist", nil)
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("want 404, got %d", resp.StatusCode)
	}
}

func TestGetRunByID(t *testing.T) {
	env := newTestEnv(t)
	_, plan := env.do(t, http.MethodPost, "/api/plans", map[string]string{"text": sampleRule})
	planID := plan["id"].(string)
	env.do(t, http.MethodPost, "/api/plans/"+planID+"/approve", nil)
	_, created := env.do(t, http.MethodPost, "/api/runs", map[string]string{"planId": planID, "fixture": "fixed"})
	runID := created["id"].(string)

	resp, fetched := env.do(t, http.MethodGet, "/api/runs/"+runID, nil)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("get run: want 200, got %d", resp.StatusCode)
	}
	if fetched["id"] != runID || fetched["planId"] != planID {
		t.Fatalf("fetched run mismatch: %v", fetched)
	}

	resp, _ = env.do(t, http.MethodGet, "/api/runs/does-not-exist", nil)
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("unknown run: want 404, got %d", resp.StatusCode)
	}
}

func TestHealthEndpoint(t *testing.T) {
	env := newTestEnv(t)
	resp, body := env.do(t, http.MethodGet, "/api/health", nil)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("health: want 200, got %d", resp.StatusCode)
	}
	if body["status"] != "ok" || body["driver"] != "sqlite" {
		t.Fatalf("unexpected health body: %v", body)
	}
}

func TestOversizedRequestBodyRejected(t *testing.T) {
	env := newTestEnv(t)
	huge := make([]byte, 2<<20) // 2MB, over the 1MB cap
	for i := range huge {
		huge[i] = 'a'
	}
	body := `{"text":"` + string(huge) + `"}`
	req, err := http.NewRequest(http.MethodPost, env.server.URL+"/api/plans", bytes.NewReader([]byte(body)))
	if err != nil {
		t.Fatalf("new request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := env.server.Client().Do(req)
	if err != nil {
		t.Fatalf("do request: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("oversized body: want 400, got %d", resp.StatusCode)
	}
}
