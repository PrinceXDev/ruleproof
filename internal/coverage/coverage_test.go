package coverage_test

import (
	"testing"

	"ruleproof/internal/assets"
	"ruleproof/internal/coverage"
	"ruleproof/internal/rules"
)

const sampleRule = "Viewers can read assets in their own tenant. Editors can also update them. Neither role can access another tenant's assets."

func TestSampleRuleLeavesExportUncovered(t *testing.T) {
	r, err := coverage.Analyze(assets.OpenAPISpec, rules.Parse(sampleRule).Cases, sampleRule)
	if err != nil {
		t.Fatal(err)
	}
	if r.Total != 3 || r.Covered != 2 {
		t.Fatalf("want 2 of 3 covered, got %d of %d", r.Covered, r.Total)
	}
	for _, op := range r.Operations {
		if op.Action == "export" {
			if op.Covered || op.Suggestion == "" || !op.Supported {
				t.Fatalf("export should be uncovered with a suggestion: %+v", op)
			}
		} else if !op.Covered || op.Snippet == "" {
			t.Fatalf("%s %s should be covered with a source sentence: %+v", op.Method, op.Path, op)
		}
	}
}

func TestSuggestionClosesTheGap(t *testing.T) {
	r, _ := coverage.Analyze(assets.OpenAPISpec, rules.Parse(sampleRule).Cases, sampleRule)
	var suggestion string
	for _, op := range r.Operations {
		if !op.Covered {
			suggestion = op.Suggestion
		}
	}
	revised := sampleRule + " " + suggestion
	plan := rules.Parse(revised)
	r, _ = coverage.Analyze(assets.OpenAPISpec, plan.Cases, revised)
	if r.Covered != r.Total {
		t.Fatalf("suggested sentence should cover every endpoint, got %d of %d", r.Covered, r.Total)
	}
	if len(plan.Assumptions) != 0 {
		t.Fatalf("suggested sentence should not introduce assumptions: %v", plan.Assumptions)
	}
}

func TestUnknownActionIsUnsupported(t *testing.T) {
	spec := []byte(`{"info":{"title":"t"},"paths":{"/assets":{"get":{}},"/assets/{id}":{"delete":{}}}}`)
	r, err := coverage.Analyze(spec, nil, "")
	if err != nil {
		t.Fatal(err)
	}
	if r.Total != 1 || r.Operations[0].Action != "delete" || r.Operations[0].Supported {
		t.Fatalf("want one unsupported delete operation (collection skipped), got %+v", r)
	}
}
