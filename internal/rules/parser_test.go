package rules_test

import (
	"testing"

	"ruleproof/internal/rules"
)

const sampleRule = "Viewers can read assets in their own tenant. Editors can also update them. Neither role can access another tenant's assets."

func TestParseCompleteRuleProducesNoAssumptions(t *testing.T) {
	plan := rules.Parse(sampleRule)
	if len(plan.Assumptions) != 0 {
		t.Fatalf("expected no assumptions for a complete rule, got %v", plan.Assumptions)
	}
	if len(plan.Cases) != 8 {
		t.Fatalf("expected 8 cases (2 roles x 2 actions x 2 scopes), got %d", len(plan.Cases))
	}
}

func TestParseExpectedOutcomesMatchPolicy(t *testing.T) {
	plan := rules.Parse(sampleRule)
	want := map[string]string{
		"viewer-read-own":     "allow",
		"viewer-update-own":   "deny",
		"viewer-read-other":   "deny",
		"viewer-update-other": "deny",
		"editor-read-own":     "allow",
		"editor-update-own":   "allow",
		"editor-read-other":   "deny",
		"editor-update-other": "deny",
	}
	got := map[string]string{}
	for _, c := range plan.Cases {
		got[c.Role+"-"+c.Action+"-"+c.Scope] = c.WantLabel
	}
	for key, label := range want {
		if got[key] != label {
			t.Errorf("case %s: want label %q, got %q", key, label, got[key])
		}
	}
}

func TestParseIncompleteRuleSurfacesAssumptions(t *testing.T) {
	plan := rules.Parse("Only editors can read or update assets.")
	if len(plan.Assumptions) == 0 {
		t.Fatal("expected assumptions for a rule that never mentions viewers or tenants")
	}
}

func TestParseNeverInventsOutsideFixedVocabulary(t *testing.T) {
	// A rule naming an unknown role should not create cases for that role —
	// the parser is bounded to the known identity/asset vocabulary.
	plan := rules.Parse("Admins can delete assets in any workspace.")
	for _, c := range plan.Cases {
		if c.Role != "viewer" && c.Role != "editor" {
			t.Fatalf("unexpected role %q invented by parser", c.Role)
		}
	}
}

func TestConceptsCarryProvenanceSnippet(t *testing.T) {
	plan := rules.Parse(sampleRule)
	if len(plan.Concepts) == 0 {
		t.Fatal("expected extracted concepts with provenance for a rule mentioning editors, viewers, and tenants")
	}
	for _, c := range plan.Concepts {
		if c.Snippet == "" {
			t.Errorf("concept %q has no source snippet", c.Label)
		}
	}
}
