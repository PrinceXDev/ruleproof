package workbench_test

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"

	"ruleproof/internal/assets"
	"ruleproof/internal/workbench"
)

func TestSampleAnalysisAndExecution(t *testing.T) {
	suite := workbench.Sample(assets.OpenAPISpec)
	if err := workbench.Validate(suite); err != nil {
		t.Fatal(err)
	}
	a, err := workbench.Analyze(suite)
	if err != nil || a.Covered != 2 || a.Gaps != 0 || len(a.Conflicts) != 0 {
		t.Fatalf("bad analysis: %+v %v", a, err)
	}
	for _, mode := range []assets.Mode{assets.Fixed, assets.Broken} {
		server := httptest.NewServer(assets.Handler(mode))
		e, err := workbench.Execute(context.Background(), suite, server.URL, server.Client(), map[string]string{"editor-a": "demo-editor-a", "viewer-a": "demo-viewer-a"})
		server.Close()
		if err != nil || e.Errors != 0 {
			t.Fatalf("run error: %+v %v", e, err)
		}
		if mode == assets.Fixed && e.Passed != 8 {
			t.Fatalf("fixed failed: %+v", e)
		}
		if mode == assets.Broken && e.Failed != 2 {
			t.Fatalf("defect escaped: %+v", e)
		}
	}
}

func TestSuiteValidation(t *testing.T) {
	tests := map[string]func(*workbench.Suite){
		"duplicate identity": func(s *workbench.Suite) { s.Identities = append(s.Identities, s.Identities[0]) },
		"duplicate check":    func(s *workbench.Suite) { s.Cases = append(s.Cases, s.Cases[0]) },
		"missing identity":   func(s *workbench.Suite) { s.Cases[0].IdentityID = "missing" },
		"unknown route":      func(s *workbench.Suite) { s.Cases[0].Path = "/users/1" },
		"invalid body":       func(s *workbench.Suite) { s.Cases[0].Body = "{" },
		"invalid exclusion":  func(s *workbench.Suite) { s.Exclusions["GET /missing"] = "Not applicable" },
		"empty exclusion":    func(s *workbench.Suite) { s.Exclusions["GET /assets/{id}/export"] = " " },
		"unknown observer":   func(s *workbench.Suite) { s.Cases[5].State.IdentityID = "missing" },
	}
	for name, mutate := range tests {
		t.Run(name, func(t *testing.T) {
			s := workbench.Sample(assets.OpenAPISpec)
			mutate(&s)
			if workbench.Validate(s) == nil {
				t.Fatal("accepted invalid suite")
			}
		})
	}
}

func TestContradictoryChecksAndRules(t *testing.T) {
	s := workbench.Sample(assets.OpenAPISpec)
	c := s.Cases[0]
	c.ID = "contradiction"
	c.ExpectedStatus = 403
	s.Cases = append(s.Cases, c)
	s.RuleText = "Viewers can update their own assets. Viewers cannot update their own assets."
	a, err := workbench.Analyze(s)
	if err != nil || len(a.Conflicts) < 2 {
		t.Fatalf("missing conflicts: %+v %v", a, err)
	}
}

func TestSpecDriftIncludesSchemaAndCollections(t *testing.T) {
	before := []byte(`{"openapi":"3.0.3","paths":{"/items":{"get":{"responses":{"200":{"description":"ok"}}}}}}`)
	after := []byte(`{"openapi":"3.0.3","paths":{"/items":{"get":{"responses":{"200":{"description":"changed"}}},"post":{}},"/bulk":{"post":{}}}}`)
	d, err := workbench.CompareSpecs(before, after)
	if err != nil || len(d.Added) != 2 || len(d.Changed) != 1 {
		t.Fatalf("bad drift: %+v %v", d, err)
	}
	d, err = workbench.CompareSpecs(after, before)
	if err != nil || len(d.Removed) != 2 {
		t.Fatalf("missing removed operations: %+v", d)
	}
	for _, bad := range []string{`{}`, `{"openapi":"2.0","paths":{}}`, `{"openapi":"3.0.3","paths":{"/x":{"get":{"$ref":"https://untrusted.test/spec"}}}}`} {
		if _, err := workbench.ParseSpec([]byte(bad)); err == nil {
			t.Errorf("accepted %s", bad)
		}
	}
}

func TestCredentialPreflightAndScenarioStop(t *testing.T) {
	var hits atomic.Int64
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hits.Add(1)
		w.WriteHeader(403)
		fmt.Fprint(w, `{"tenant":"A"}`)
	}))
	defer server.Close()
	s := workbench.Sample(assets.OpenAPISpec)
	if _, err := workbench.Execute(context.Background(), s, server.URL, server.Client(), nil); err == nil || hits.Load() != 0 {
		t.Fatal("sent requests before credential preflight")
	}
	for i := range s.Cases {
		s.Cases[i].Scenario = "permission-transition"
	}
	e, err := workbench.Execute(context.Background(), s, server.URL, server.Client(), map[string]string{"editor-a": "x", "viewer-a": "y"})
	if err != nil || hits.Load() != 1 || e.Failed != 1 || e.Errors != 7 {
		t.Fatalf("scenario not stopped: %+v %v hits=%d", e, err, hits.Load())
	}
}

func TestApprovalHashCoversEveryExecutionField(t *testing.T) {
	s := workbench.Sample(assets.OpenAPISpec)
	original := workbench.Hash(s)
	raw, _ := json.Marshal(s)
	mutations := []func(*workbench.Suite){func(s *workbench.Suite) { s.Cases[0].Path = "/assets/b1" }, func(s *workbench.Suite) { s.Identities[0].Credential = "different" }, func(s *workbench.Suite) { s.Environment = "broken" }, func(s *workbench.Suite) { s.Cases[0].Assertions = nil }, func(s *workbench.Suite) { s.Cases[0].Scenario = "different" }, func(s *workbench.Suite) { s.RuleText += " Changed." }}
	for _, mutate := range mutations {
		var changed workbench.Suite
		_ = json.Unmarshal(raw, &changed)
		mutate(&changed)
		if workbench.Hash(changed) == original {
			t.Fatal("execution field not bound to approval")
		}
	}
}

func TestAllConfiguredSecretsAreRedacted(t *testing.T) {
	secret := "other-credential\"<&>"
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]string{"tenant": "A", "unexpected": secret})
	}))
	defer server.Close()
	s := workbench.Sample(assets.OpenAPISpec)
	s.Cases = s.Cases[:1]
	e, err := workbench.Execute(context.Background(), s, server.URL, server.Client(), map[string]string{"editor-a": "current-credential", "viewer-a": secret})
	if err != nil {
		t.Fatal(err)
	}
	raw, _ := json.Marshal(e)
	if strings.Contains(string(raw), "other-credential") {
		t.Fatal("credential leaked")
	}
	if !e.Results[0].Redacted || !strings.Contains(e.Results[0].Body, "[REDACTED]") {
		t.Fatal("escaped secret was not redacted")
	}
}
