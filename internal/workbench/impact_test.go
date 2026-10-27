package workbench

import (
	"encoding/json"
	"fmt"
	"ruleproof/internal/check"
	"strings"
	"testing"
)

const impactFixture = `{"openapi":"3.0.3","paths":{"/assets/{id}":{"get":{"responses":{"200":{"$ref":"#/components/responses/Asset"}}},"put":{"responses":{"200":{"description":"Updated"}}}},"/health":{"get":{"security":[],"responses":{"200":{"description":"Healthy"}}}}},"security":[{"Bearer":[]}],"components":{"securitySchemes":{"Bearer":{"type":"http","scheme":"bearer"}},"responses":{"Asset":{"description":"asset","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Asset"}}}}},"schemas":{"Asset":{"type":"object","properties":{"tenant":{"type":"string"},"next":{"$ref":"#/components/schemas/Asset"}}},"Unused":{"type":"string"}}}}`

func impactSuite() Suite {
	return Suite{Name: "Impact", Environment: "staging", Spec: json.RawMessage(impactFixture), Identities: []Identity{{ID: "editor", Label: "Editor", Role: "editor", Tenant: "A", Credential: "private-ref"}}, Cases: []Case{
		{ID: "read", IdentityID: "editor", Scope: "own", Method: "GET", Path: "/assets/a1", ExpectedStatus: 200},
		{ID: "write", IdentityID: "editor", Scope: "own", Method: "PUT", Path: "/assets/a1", ExpectedStatus: 200, Scenario: "lifecycle"},
		{ID: "observe", IdentityID: "editor", Scope: "other", Method: "GET", Path: "/health", ExpectedStatus: 200, Scenario: "lifecycle"},
	}}
}
func impactChange(t *testing.T, s Suite, from, to string) ImpactReport {
	t.Helper()
	candidate := strings.Replace(string(s.Spec), from, to, 1)
	if candidate == string(s.Spec) {
		t.Fatal("fixture edit did not match")
	}
	r, err := AnalyzeImpact(s, []byte(candidate))
	if err != nil {
		t.Fatal(err)
	}
	return r
}
func impactOperation(t *testing.T, r ImpactReport, key string) ImpactOperation {
	t.Helper()
	for _, op := range r.Operations {
		if op.Operation == key {
			return op
		}
	}
	t.Fatal("missing operation " + key)
	return ImpactOperation{}
}
func TestImpactTransitiveDependenciesAndRecursiveSchemas(t *testing.T) {
	s := impactSuite()
	r := impactChange(t, s, `"tenant":{"type":"string"}`, `"tenant":{"type":"integer"}`)
	if len(r.Recommended) != 1 || r.Recommended[0].ID != "read" || r.RequiresFullRun {
		t.Fatalf("dependency recommendation: %+v", r)
	}
	op := impactOperation(t, r, "GET /assets/{id}")
	if op.Certainty != "affected" || !strings.Contains(strings.Join(op.Reasons, " "), "#/components/schemas/Asset") {
		t.Fatalf("missing dependency reason: %+v", op)
	}
	if impactOperation(t, r, "PUT /assets/{id}").Certainty != "unaffected" {
		t.Fatal("unrelated operation marked changed")
	}
	unused := impactChange(t, s, `"Unused":{"type":"string"}`, `"Unused":{"type":"integer"}`)
	if len(unused.Recommended) != 0 {
		t.Fatal("unused schema affected checks")
	}
	raw, _ := json.Marshal(r)
	if strings.Contains(string(raw), "private-ref") {
		t.Fatal("credential reference leaked into planning report")
	}
}
func TestImpactInheritedSecurityAndScenarioClosure(t *testing.T) {
	r := impactChange(t, impactSuite(), `"scheme":"bearer"`, `"scheme":"basic"`)
	if len(r.Recommended) != 3 {
		t.Fatalf("scenario closure lost: %+v", r.Recommended)
	}
	if impactOperation(t, r, "GET /health").Certainty != "unaffected" {
		t.Fatal("explicit anonymous operation inherited global security")
	}
	if !strings.Contains(strings.Join(r.Recommended[2].Reasons, " "), "ordered scenario") {
		t.Fatal("missing scenario explanation")
	}
}
func TestImpactStateObserverAndLiteralRouteRemapping(t *testing.T) {
	s := impactSuite()
	s.Cases[1].State = &check.StateCheck{Path: "/assets/a1", Pointer: "/tenant", IdentityID: "editor"}
	r := impactChange(t, s, `"tenant":{"type":"string"}`, `"tenant":{"type":"integer"}`)
	if len(r.Recommended) != 3 || !r.Recommended[1].ObservesState {
		t.Fatal("state observer dependency was lost")
	}
	s = impactSuite()
	r = impactChange(t, s, `"/health":`, `"/assets/a1":{"get":{"responses":{"200":{"description":"literal override"}}}},"/health":`)
	if len(r.Recommended) != 1 || !strings.Contains(strings.Join(r.Recommended[0].Reasons, " "), "route mapping") {
		t.Fatalf("literal shadowing: %+v", r)
	}
}
func TestImpactRemovalExclusionsAndUncertainty(t *testing.T) {
	s := impactSuite()
	s.Exclusions = map[string]string{"GET /health": "Operational endpoint reviewed separately"}
	r := impactChange(t, s, `"/health":{"get":{"security":[],"responses":{"200":{"description":"Healthy"}}}}`, `"/new":{"get":{"responses":{"200":{"description":"New"}}}}`)
	if len(r.OrphanedCheckIDs) != 1 || r.OrphanedCheckIDs[0] != "observe" {
		t.Fatal("removed route not orphaned")
	}
	if len(impactOperation(t, r, "GET /new").Missing) == 0 {
		t.Fatal("new operation has no coverage gaps")
	}
	r = impactChange(t, s, `"openapi":"3.0.3"`, `"openapi":"3.0.3","x-policy-engine":"changed"`)
	if !r.RequiresFullRun || len(r.Recommended) != len(s.Cases) {
		t.Fatal("unclassified settings did not broaden review")
	}
	if impactOperation(t, r, "GET /health").Certainty != "uncertain" {
		t.Fatal("uncertainty hidden")
	}
}
func TestImpactCanonicalAndInvalidInput(t *testing.T) {
	s := impactSuite()
	var doc any
	_ = json.Unmarshal(s.Spec, &doc)
	formatted, _ := json.MarshalIndent(doc, "", "  ")
	r, err := AnalyzeImpact(s, formatted)
	if err != nil || len(r.Recommended) != 0 || r.BeforeSpecHash != r.AfterSpecHash {
		t.Fatal("formatting created impact")
	}
	for _, candidate := range []string{`{`, `{"openapi":"3.0.3","paths":{}}`, strings.Replace(impactFixture, "#/components/schemas/Asset", "https://example.test/schema", 1)} {
		if _, err := AnalyzeImpact(s, []byte(candidate)); err == nil {
			t.Fatal("accepted invalid candidate")
		}
	}
}

func TestImpactSharedPathSettingsAndDynamicDestinations(t *testing.T) {
	s := impactSuite()
	r := impactChange(t, s, `"/assets/{id}":{`, `"/assets/{id}":{"parameters":[{"name":"id","in":"path","required":true,"schema":{"type":"string"}}],`)
	if len(r.Recommended) != 3 {
		t.Fatal("path-level parameter change missed operations")
	}
	r = impactChange(t, s, `"/health":{"get":{`, `"/health":{"get":{"callbacks":{},`)
	if !r.RequiresFullRun || len(r.Recommended) != 3 || impactOperation(t, r, "GET /health").Certainty != "uncertain" {
		t.Fatal("callbacks did not broaden review")
	}
	r = impactChange(t, s, `"type":"object","properties"`, `"type":"object","$dynamicRef":"#tenant","properties"`)
	if !r.RequiresFullRun || impactOperation(t, r, "GET /assets/{id}").Certainty != "uncertain" {
		t.Fatal("dynamic references treated as fully mapped")
	}
}

func TestImpactDeterministicAndLargeIntegers(t *testing.T) {
	s := impactSuite()
	first := impactChange(t, s, `"tenant":{"type":"string"}`, `"tenant":{"type":"integer","minimum":9007199254740992}`)
	second := impactChange(t, s, `"tenant":{"type":"string"}`, `"tenant":{"type":"integer","minimum":9007199254740993}`)
	if first.AfterSpecHash == second.AfterSpecHash {
		t.Fatal("large integer precision lost")
	}
	if len(second.Recommended) == 0 {
		t.Fatal("large integer schema change missed")
	}
	a, _ := json.Marshal(first)
	for i := 0; i < 5; i++ {
		r := impactChange(t, s, `"tenant":{"type":"string"}`, `"tenant":{"type":"integer","minimum":9007199254740992}`)
		b, _ := json.Marshal(r)
		if string(a) != string(b) {
			t.Fatal("nondeterministic report")
		}
	}
}

func TestImpactBoundsMissingCombinationExamples(t *testing.T) {
	s := impactSuite()
	for i := 0; i < 19; i++ {
		s.Identities = append(s.Identities, Identity{ID: fmt.Sprintf("identity-%d", i), Label: "Reviewer"})
	}
	for i := 0; i < 5; i++ {
		c := s.Cases[0]
		c.ID = fmt.Sprintf("scope-case-%d", i)
		c.Scope = fmt.Sprintf("scope-%d", i)
		s.Cases = append(s.Cases, c)
	}
	r := impactChange(t, s, `"/health":`, `"/new":{"get":{"responses":{"200":{"description":"New"}}}},"/health":`)
	op := impactOperation(t, r, "GET /new")
	if op.MissingCount != 140 || len(op.Missing) != 32 {
		t.Fatalf("bounded gaps: total %d sample %d", op.MissingCount, len(op.Missing))
	}
}
