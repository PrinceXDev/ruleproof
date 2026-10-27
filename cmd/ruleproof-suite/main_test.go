package main

import (
	"bytes"
	"encoding/json"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"ruleproof/internal/assets"
	"ruleproof/internal/store"
	"ruleproof/internal/workbench"
)

func TestSuiteGate(t *testing.T) {
	for _, mode := range []assets.Mode{assets.Fixed, assets.Broken} {
		fixture := httptest.NewServer(assets.Handler(mode))
		suite := workbench.Sample(assets.OpenAPISpec)
		content, _ := json.Marshal(suite)
		revision := store.Revision{ID: "approved", Content: content, Hash: workbench.Hash(suite), ApprovedBy: "reviewer"}
		raw, _ := json.Marshal(map[string]any{"revision": revision})
		dir := t.TempDir()
		bundle := filepath.Join(dir, "suite.json")
		_ = os.WriteFile(bundle, raw, 0600)
		junit := filepath.Join(dir, "report.xml")
		args := []string{"-bundle", bundle, "-base-url", fixture.URL, "-credential-env", "editor-a=EDITOR", "-credential-env", "viewer-a=VIEWER", "-junit", junit}
		var out, stderr bytes.Buffer
		code := run(args, &out, &stderr, func(key string) string {
			return map[string]string{"EDITOR": "demo-editor-a", "VIEWER": "demo-viewer-a"}[key]
		})
		fixture.Close()
		want := 0
		if mode == assets.Broken {
			want = 1
		}
		if code != want {
			t.Fatalf("got %d want %d: %s %s", code, want, out.String(), stderr.String())
		}
		report, err := os.ReadFile(junit)
		if err != nil || !strings.Contains(string(report), `tests="8"`) {
			t.Fatalf("invalid JUnit: %s %v", report, err)
		}
		if strings.Contains(out.String(), "demo-editor-a") {
			t.Fatal("secret in CI output")
		}
		revision.ApprovedBy = ""
		raw, _ = json.Marshal(map[string]any{"revision": revision})
		_ = os.WriteFile(bundle, raw, 0600)
		if run(args, &out, &stderr, func(string) string { return "" }) != 2 {
			t.Fatal("unapproved bundle executed")
		}
	}
}

func TestDriftFailsBeforeRequests(t *testing.T) {
	suite := workbench.Sample(assets.OpenAPISpec)
	content, _ := json.Marshal(suite)
	revision := store.Revision{ID: "approved", Content: content, Hash: workbench.Hash(suite), ApprovedBy: "reviewer"}
	raw, _ := json.Marshal(map[string]any{"revision": revision})
	dir := t.TempDir()
	bundle := filepath.Join(dir, "suite.json")
	_ = os.WriteFile(bundle, raw, 0600)
	spec := filepath.Join(dir, "current.json")
	_ = os.WriteFile(spec, []byte(`{"openapi":"3.0.3","paths":{"/new":{"get":{}}}}`), 0600)
	var out, stderr bytes.Buffer
	code := run([]string{"-bundle", bundle, "-base-url", "http://127.0.0.1:1", "-spec", spec}, &out, &stderr, func(string) string { return "" })
	if code != 1 || !strings.Contains(out.String(), "GET /new") {
		t.Fatalf("drift not caught before requests: %d %s %s", code, out.String(), stderr.String())
	}
}
