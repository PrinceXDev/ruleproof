package bypass_test

import (
	"context"
	"net/http/httptest"
	"sort"
	"strings"
	"testing"

	"ruleproof/internal/assets"
	"ruleproof/internal/bypass"
	"ruleproof/internal/check"
	"ruleproof/internal/rules"
)

const exportRule = "Viewers can read assets in their own tenant. Editors can also update them. Neither role can access another tenant's assets. Both roles can export assets in their own tenant. Neither role can export another tenant's assets."

func approved(t *testing.T) ([]rules.Case, []check.Case) {
	t.Helper()
	plan := rules.Parse(exportRule)
	base := make([]check.Case, len(plan.Cases))
	for i, c := range plan.Cases {
		base[i] = check.Case{ID: c.ID, Rule: plan.RuleText, Actor: c.Actor, Method: c.Method, Path: rules.CasePath(c), Token: c.Token, Want: c.Want}
	}
	return plan.Cases, base
}

func TestExpandDerivesAttemptsFromDenyCasesOnly(t *testing.T) {
	cases, base := approved(t)
	attempts := bypass.Expand(cases, base)

	byKind := map[string]int{}
	want := map[string]int{}
	for _, c := range cases {
		want[c.ID] = c.Want
	}
	for _, a := range attempts {
		byKind[a.Variant.Kind]++
		if want[a.Variant.Of] == 200 {
			t.Errorf("%s derived from an allow case", a.ID)
		}
		if a.ID != a.Variant.Of+"~"+a.Variant.Kind || a.Token == "" || a.Want != want[a.Variant.Of] {
			t.Errorf("attempt does not inherit its approved case: %+v", a)
		}
	}
	// 7 deny cases: 4 cross-tenant GETs, 2 cross-tenant PUTs, 1 own-tenant viewer PUT.
	expected := map[string]int{"head-method": 4, "trailing-slash": 7, "id-case": 7, "tenant-header": 6, "method-override": 3}
	for kind, n := range expected {
		if byKind[kind] != n {
			t.Errorf("%s: %d attempts, want %d", kind, byKind[kind], n)
		}
	}
	if len(attempts) != 27 {
		t.Errorf("%d attempts, want 27", len(attempts))
	}
	for _, b := range base {
		if b.Variant != nil || b.Headers != nil {
			t.Fatalf("Expand mutated the approved case %s", b.ID)
		}
	}
}

func TestAttemptShapes(t *testing.T) {
	cases, base := approved(t)
	got := map[string]check.Case{}
	for _, a := range bypass.Expand(cases, base) {
		got[a.ID] = a
	}
	checks := []struct {
		id, method, path string
		headers          map[string]string
	}{
		{"viewer-a-read-b1~head-method", "HEAD", "/assets/b1", nil},
		{"viewer-a-export-b1~trailing-slash", "GET", "/assets/b1/export/", nil},
		{"viewer-a-export-b1~id-case", "GET", "/assets/B1/export", nil},
		{"editor-a-read-b1~tenant-header", "GET", "/assets/b1", map[string]string{"X-Tenant-ID": "B"}},
		{"viewer-a-update-a1~method-override", "POST", "/assets/a1", map[string]string{"X-HTTP-Method-Override": "PUT"}},
	}
	for _, c := range checks {
		a, ok := got[c.id]
		if !ok {
			t.Errorf("missing attempt %s", c.id)
			continue
		}
		if a.Method != c.method || a.Path != c.path || len(a.Headers) != len(c.headers) {
			t.Errorf("%s: got %s %s %v", c.id, a.Method, a.Path, a.Headers)
		}
		for k, v := range c.headers {
			if a.Headers[k] != v {
				t.Errorf("%s: header %s=%q, want %q", c.id, k, a.Headers[k], v)
			}
		}
	}
}

// TestFixtureMatrix pins what each fixture leaks, so the demo's story (the
// partial fix passes every approved check yet leaks) can't silently drift.
func TestFixtureMatrix(t *testing.T) {
	cases, base := approved(t)
	attempts := bypass.Expand(cases, base)
	matrix := map[assets.Mode]struct {
		baseFailures int
		leaked       []string
	}{
		assets.Fixed:  {0, nil},
		assets.Broken: {4, []string{"editor-a-export-b1~tenant-header", "editor-a-read-b1~tenant-header", "viewer-a-export-b1~tenant-header", "viewer-a-read-b1~tenant-header"}},
		assets.Partial: {0, []string{
			"editor-a-export-b1~head-method", "editor-a-export-b1~tenant-header",
			"editor-a-read-b1~head-method", "editor-a-read-b1~tenant-header",
			"editor-a-update-b1~tenant-header",
			"viewer-a-export-b1~head-method", "viewer-a-export-b1~tenant-header",
			"viewer-a-read-b1~head-method", "viewer-a-read-b1~tenant-header",
		}},
	}
	for name, mode := range assets.Modes {
		srv := httptest.NewServer(assets.Handler(mode))
		_, baseFail, baseErr := check.Tally(check.Run(context.Background(), srv.URL, base))
		results := check.Run(context.Background(), srv.URL, attempts)
		srv.Close()

		var leaked []string
		for _, r := range results {
			switch r.Verdict {
			case "fail":
				leaked = append(leaked, r.ID)
			case "error":
				t.Errorf("%s: %s inconclusive: %s", name, r.ID, r.Detail)
			}
		}
		sort.Strings(leaked)
		want := matrix[mode]
		if baseFail != want.baseFailures || baseErr != 0 {
			t.Errorf("%s: %d approved checks failed (%d errors), want %d", name, baseFail, baseErr, want.baseFailures)
		}
		if strings.Join(leaked, ",") != strings.Join(want.leaked, ",") {
			t.Errorf("%s leaked:\n  got  %v\n  want %v", name, leaked, want.leaked)
		}
	}
}
