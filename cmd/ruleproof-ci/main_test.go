package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"ruleproof/internal/api"
	"ruleproof/internal/assets"
	"ruleproof/internal/rules"
	"ruleproof/internal/store"
)

const sampleRule = "Viewers can read assets in their own tenant. Editors can also update them. Neither role can access another tenant's assets."

func writeBundle(t *testing.T, approved bool, tamper bool) string {
	t.Helper()
	p := rules.Parse(sampleRule)
	var b bundle
	b.Plan.ID = "plan-1"
	b.Plan.RuleText = p.RuleText
	b.Plan.Cases = p.Cases
	b.Plan.Hash = rules.Hash(p.Cases)
	b.Plan.Approved = approved
	if tamper {
		b.Plan.Cases[0].Want = 403
	}
	raw, err := json.Marshal(b)
	if err != nil {
		t.Fatal(err)
	}
	path := filepath.Join(t.TempDir(), "bundle.json")
	if err := os.WriteFile(path, raw, 0o644); err != nil {
		t.Fatal(err)
	}
	return path
}

func noEnv(string) string { return "" }

func exec(t *testing.T, env func(string) string, args ...string) (int, string, string) {
	t.Helper()
	var out, errOut bytes.Buffer
	code := run(args, &out, &errOut, env)
	return code, out.String(), errOut.String()
}

func TestCorrectedFixturePasses(t *testing.T) {
	code, out, _ := exec(t, noEnv, "-bundle", writeBundle(t, true, false), "-fixture", "fixed")
	if code != 0 {
		t.Fatalf("exit %d, want 0\n%s", code, out)
	}
	if !strings.Contains(out, "8 passed · 0 failed") {
		t.Fatalf("unexpected output:\n%s", out)
	}
}

func TestSeededDefectFailsTheBuild(t *testing.T) {
	code, out, _ := exec(t, noEnv, "-bundle", writeBundle(t, true, false), "-fixture", "broken")
	if code != 1 {
		t.Fatalf("exit %d, want 1\n%s", code, out)
	}
	if strings.Count(out, "FAIL ") != 2 || !strings.Contains(out, "6 passed · 2 failed") {
		t.Fatalf("expected the two cross-tenant reads to fail:\n%s", out)
	}
}

func TestRefusesUnapprovedOrTamperedPlans(t *testing.T) {
	code, _, errOut := exec(t, noEnv, "-bundle", writeBundle(t, false, false), "-fixture", "fixed")
	if code != 2 || !strings.Contains(errOut, "not approved") {
		t.Fatalf("unapproved: exit %d, stderr %q", code, errOut)
	}
	code, _, errOut = exec(t, noEnv, "-bundle", writeBundle(t, true, true), "-fixture", "fixed")
	if code != 2 || !strings.Contains(errOut, "modified after approval") {
		t.Fatalf("tampered: exit %d, stderr %q", code, errOut)
	}
}

func TestFlagValidation(t *testing.T) {
	for _, args := range [][]string{
		{"-fixture", "fixed"},
		{"-bundle", "x.json"},
		{"-bundle", "x.json", "-fixture", "fixed", "-base-url", "http://x"},
		{"-bundle", "x.json", "-fixture", "staging"},
		{"-server", "http://x", "-fixture", "fixed"},
	} {
		if code, _, _ := exec(t, noEnv, args...); code != 2 {
			t.Errorf("%v: exit %d, want 2", args, code)
		}
	}
}

func TestGitHubAnnotationsSummaryAndJUnit(t *testing.T) {
	dir := t.TempDir()
	summary := filepath.Join(dir, "summary.md")
	junit := filepath.Join(dir, "junit.xml")
	env := func(k string) string {
		return map[string]string{"GITHUB_ACTIONS": "true", "GITHUB_STEP_SUMMARY": summary}[k]
	}
	code, out, _ := exec(t, env, "-bundle", writeBundle(t, true, false), "-fixture", "broken", "-junit", junit)
	if code != 1 {
		t.Fatalf("exit %d, want 1", code)
	}
	if strings.Count(out, "::error title=RuleProof:") != 2 {
		t.Fatalf("expected two annotations:\n%s", out)
	}
	md, err := os.ReadFile(summary)
	if err != nil || strings.Count(string(md), "❌") != 2 {
		t.Fatalf("summary missing failures (err %v):\n%s", err, md)
	}
	xmlOut, err := os.ReadFile(junit)
	if err != nil || !strings.Contains(string(xmlOut), `failures="2"`) {
		t.Fatalf("junit missing failures (err %v):\n%s", err, xmlOut)
	}
}

func TestBaseURLWithTokenOverride(t *testing.T) {
	// The fixture only knows demo tokens, so a wrong override must surface as
	// failures rather than being silently ignored.
	srv := httptest.NewServer(assets.Handler(assets.Fixed))
	defer srv.Close()
	code, out, _ := exec(t, noEnv, "-bundle", writeBundle(t, true, false), "-base-url", srv.URL, "-token", "viewer=wrong")
	if code != 1 || !strings.Contains(out, "want 200  got 401") {
		t.Fatalf("exit %d, want 1 with a 401 for the viewer:\n%s", code, out)
	}
}

func TestFetchesApprovedPlanFromServer(t *testing.T) {
	st, err := store.Open(filepath.Join(t.TempDir(), "ci.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer st.Close()
	ts := httptest.NewServer(api.New(st, nil).Routes())
	defer ts.Close()

	resp, err := http.Post(ts.URL+"/api/plans", "application/json", strings.NewReader(`{"text":"`+sampleRule+`"}`))
	if err != nil {
		t.Fatal(err)
	}
	var plan struct{ ID string }
	_ = json.NewDecoder(resp.Body).Decode(&plan)
	resp.Body.Close()

	if code, _, errOut := exec(t, noEnv, "-server", ts.URL, "-plan", plan.ID, "-fixture", "fixed"); code != 2 || !strings.Contains(errOut, "not approved") {
		t.Fatalf("unapproved via server: exit %d, stderr %q", code, errOut)
	}
	resp, err = http.Post(ts.URL+"/api/plans/"+plan.ID+"/approve", "application/json", nil)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if code, out, errOut := exec(t, noEnv, "-server", ts.URL, "-plan", plan.ID, "-fixture", "fixed"); code != 0 {
		t.Fatalf("approved via server: exit %d\n%s%s", code, out, errOut)
	}
}

func TestBypassCatchesWhatApprovedChecksMiss(t *testing.T) {
	bundle := writeBundle(t, true, false)
	if code, out, _ := exec(t, noEnv, "-bundle", bundle, "-fixture", "partial"); code != 0 {
		t.Fatalf("partial fix without -bypass: exit %d, want 0\n%s", code, out)
	}
	code, out, _ := exec(t, noEnv, "-bundle", bundle, "-fixture", "partial", "-bypass")
	if code != 1 || !strings.Contains(out, "14 held · 5 leaked · 0 inconclusive") || !strings.Contains(out, "LEAKED  viewer read other tenant") {
		t.Fatalf("partial fix with -bypass: exit %d, want 1\n%s", code, out)
	}
	if code, out, _ := exec(t, noEnv, "-bundle", bundle, "-fixture", "fixed", "-bypass"); code != 0 || !strings.Contains(out, "19 held · 0 leaked") {
		t.Fatalf("fixed with -bypass: exit %d, want 0\n%s", code, out)
	}
}

func TestBypassLeaksBecomeJUnitFailures(t *testing.T) {
	junit := filepath.Join(t.TempDir(), "junit.xml")
	exec(t, noEnv, "-bundle", writeBundle(t, true, false), "-fixture", "partial", "-bypass", "-junit", junit)
	xmlOut, err := os.ReadFile(junit)
	if err != nil || !strings.Contains(string(xmlOut), `tests="27" failures="5"`) || !strings.Contains(string(xmlOut), "~head-method") {
		t.Fatalf("junit should list 8 checks + 19 attempts with 5 failures (err %v):\n%s", err, xmlOut)
	}
}
