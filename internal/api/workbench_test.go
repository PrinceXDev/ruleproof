package api_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"ruleproof/internal/api"
	"ruleproof/internal/assets"
	"ruleproof/internal/store"
	"ruleproof/internal/workbench"
)

func TestWorkspaceApprovalIsolationAndEvidence(t *testing.T) {
	st, err := store.Open(filepath.Join(t.TempDir(), "team.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer st.Close()
	fixture := httptest.NewServer(assets.Handler(assets.Fixed))
	defer fixture.Close()
	cfg := api.WorkbenchConfig{SeparateReviewer: true, Environments: []api.Environment{{ID: "fixed", Workspace: "team", Label: "Staging", BaseURL: fixture.URL, Credentials: map[string]string{"editor-a": "TEST_EDITOR", "viewer-a": "TEST_VIEWER"}}}}
	t.Setenv("TEST_EDITOR", "demo-editor-a")
	t.Setenv("TEST_VIEWER", "demo-viewer-a")
	for _, row := range []struct{ name, role, workspace string }{{"author", "author", "team"}, {"reviewer", "reviewer", "team"}, {"peer", "reviewer", "team"}, {"viewer", "viewer", "team"}, {"outsider", "reviewer", "other"}} {
		env := "TEST_ACCOUNT_" + row.name
		t.Setenv(env, strings.Repeat(row.name, 32))
		cfg.Accounts = append(cfg.Accounts, api.Account{Name: row.name, Role: row.role, Workspace: row.workspace, TokenEnv: env})
	}
	raw, _ := json.Marshal(&cfg)
	server := api.New(st, nil)
	if err := server.ConfigureWorkbench(string(raw)); err != nil {
		t.Fatal(err)
	}
	handler := server.Routes()
	request := func(actor, method, path string, body any, want int) []byte {
		t.Helper()
		data, _ := json.Marshal(body)
		req := httptest.NewRequest(method, "/api/workbench/"+path, bytes.NewReader(data))
		if actor != "" {
			req.Header.Set("Authorization", "Bearer "+strings.Repeat(actor, 32))
		}
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
		if rec.Code != want {
			t.Fatalf("%s %s as %s: got %d want %d: %s", method, path, actor, rec.Code, want, rec.Body.String())
		}
		return rec.Body.Bytes()
	}
	request("", "GET", "session", nil, 401)
	session := request("author", "GET", "session", nil, 200)
	if strings.Contains(string(session), "demo-editor-a") || strings.Contains(string(session), fixture.URL) {
		t.Fatal("session exposed secrets or target URL")
	}
	suite := workbench.Sample(assets.OpenAPISpec)
	create := func(actor, parent string) store.Revision {
		var revision store.Revision
		_ = json.Unmarshal(request(actor, "POST", "revisions", map[string]any{"suite": suite, "parentId": parent}, 201), &revision)
		return revision
	}
	request("viewer", "POST", "revisions", map[string]any{"suite": suite}, 403)
	revision := create("reviewer", "")
	base := "revisions/" + revision.ID
	request("outsider", "GET", base, nil, 404)
	request("outsider", "POST", "revisions", map[string]any{"suite": suite, "parentId": revision.ID}, 400)
	request("author", "POST", base+"/approve", nil, 403)
	request("reviewer", "POST", base+"/approve", nil, 400)
	request("viewer", "POST", base+"/run", nil, 403)
	request("author", "POST", base+"/run", nil, 409)
	request("peer", "POST", base+"/approve", nil, 200)
	var job store.Execution
	_ = json.Unmarshal(request("author", "POST", base+"/run", map[string]string{"requestKey": "workspace-lifecycle-request"}, 202), &job)
	deadline := time.Now().Add(5 * time.Second)
	for time.Now().Before(deadline) {
		_ = json.Unmarshal(request("viewer", "GET", "executions/"+job.ID, nil, 200), &job)
		if job.Status != "running" {
			break
		}
		time.Sleep(10 * time.Millisecond)
	}
	request("outsider", "GET", "executions/"+job.ID, nil, 404)
	request("viewer", "POST", "executions/"+job.ID+"/cancel", nil, 403)
	var evidence workbench.Evidence
	_ = json.Unmarshal(job.Evidence, &evidence)
	if job.Status != "completed" || evidence.Passed != 8 || evidence.Failed+evidence.Errors != 0 {
		t.Fatalf("unexpected evidence: %+v", evidence)
	}
	exported := request("viewer", "GET", base+"/export", nil, 200)
	if strings.Contains(string(exported), "demo-editor-a") || strings.Contains(string(exported), "demo-viewer-a") {
		t.Fatal("credential leaked in export")
	}
	var events []store.AuditEvent
	_ = json.Unmarshal(request("viewer", "GET", base+"/events", nil, 200), &events)
	if len(events) != 3 {
		t.Fatalf("want create, approve, run; got %d", len(events))
	}
	child := create("author", revision.ID)
	if child.ApprovedBy != "" {
		t.Fatal("approval carried into a new revision")
	}
	request("author", "POST", "revisions/"+child.ID+"/run", nil, 409)
	// Even a storage-level modification cannot acquire approval with an old hash.
	tampered, _ := st.SaveRevision(context.Background(), "team", "", "author", "wrong-hash", revision.Content)
	request("peer", "POST", "revisions/"+tampered.ID+"/approve", nil, 409)
}

func TestWorkbenchRequiresCoverageAndConflictResolution(t *testing.T) {
	env := newTestEnv(t)
	suite := workbench.Sample(assets.OpenAPISpec)
	suite.Exclusions = nil
	_, revision := env.do(t, "POST", "/api/workbench/revisions", map[string]any{"suite": suite})
	id := revision["id"].(string)
	resp, _ := env.do(t, "POST", "/api/workbench/revisions/"+id+"/approve", nil)
	if resp.StatusCode != 409 {
		t.Fatal("approved uncovered operation")
	}
	suite = workbench.Sample(assets.OpenAPISpec)
	suite.RuleText = "Viewers can update their own assets. Viewers cannot update their own assets."
	_, revision = env.do(t, "POST", "/api/workbench/revisions", map[string]any{"suite": suite})
	resp, _ = env.do(t, "POST", "/api/workbench/revisions/"+revision["id"].(string)+"/approve", nil)
	if resp.StatusCode != 409 {
		t.Fatal("approved contradictory rule")
	}
}

func TestConfigurationFailsClosed(t *testing.T) {
	server := api.New(nil, nil)
	for _, config := range []string{`{`, `{}`, `{"accounts":[],"environments":[]}`, `{"accounts":[{"name":"x","role":"reviewer","workspace":"a","tokenEnv":"ABSENT_TEST_TOKEN"}],"environments":[{"id":"x","workspace":"a","baseUrl":"https://api.example.test"}]}`} {
		if err := server.ConfigureWorkbench(config); err == nil {
			t.Fatal("accepted invalid team config")
		}
	}
}

func TestDraftAnalysisPreservesCatalogWhileSaveRejectsInvalidChecks(t *testing.T) {
	env := newTestEnv(t)
	suite := workbench.Sample(assets.OpenAPISpec)
	suite.Cases[0].Path = "/not-in-the-imported-spec"
	resp, report := env.do(t, "POST", "/api/workbench/analyze", suite)
	if resp.StatusCode != 200 || report["validationError"] == nil || len(report["operations"].([]any)) == 0 {
		t.Fatalf("invalid draft must still expose imported operations: %+v", report)
	}
	resp, _ = env.do(t, "POST", "/api/workbench/revisions", map[string]any{"suite": suite})
	if resp.StatusCode != 400 {
		t.Fatal("invalid draft was saved")
	}
	suite.Spec = json.RawMessage(`{"openapi":"2.0"}`)
	resp, _ = env.do(t, "POST", "/api/workbench/analyze", suite)
	if resp.StatusCode != 400 {
		t.Fatal("invalid specification was analyzed")
	}
}

func TestLegacyConflictApprovalIsBlocked(t *testing.T) {
	env := newTestEnv(t)
	_, plan := env.do(t, "POST", "/api/plans", map[string]string{"text": "Viewers can update their own assets. Viewers cannot update their own assets."})
	id := plan["id"].(string)
	env.do(t, "POST", "/api/plans/"+id+"/acknowledge", nil)
	resp, _ := env.do(t, "POST", "/api/plans/"+id+"/approve", nil)
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatal("conflicting plan approved")
	}
}
