// Command ruleproof-ci re-runs an approved RuleProof plan in CI and fails the
// build on any mismatch between the approved expectations and the API.
//
// The plan comes from an exported evidence bundle (Export JSON in the studio)
// or straight from a running RuleProof server. It refuses to run a plan that
// is unapproved or was edited after approval.
//
// Exit codes: 0 all checks passed, 1 at least one check failed or errored,
// 2 bad input (flags, unapproved or tampered plan, unreachable server).
package main

import (
	"context"
	"encoding/json"
	"encoding/xml"
	"errors"
	"flag"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"time"

	"ruleproof/internal/assets"
	"ruleproof/internal/check"
	"ruleproof/internal/rules"
)

func main() {
	os.Exit(run(os.Args[1:], os.Stdout, os.Stderr, os.Getenv))
}

type bundle struct {
	Plan struct {
		ID       string       `json:"id"`
		RuleText string       `json:"ruleText"`
		Cases    []rules.Case `json:"cases"`
		Hash     string       `json:"hash"`
		Approved bool         `json:"approved"`
	} `json:"plan"`
}

type tokenFlags map[string]string

func (t tokenFlags) String() string { return "" }
func (t tokenFlags) Set(v string) error {
	role, token, ok := strings.Cut(v, "=")
	if !ok || role == "" || token == "" {
		return errors.New("want role=token, e.g. viewer=$VIEWER_TOKEN")
	}
	t[role] = token
	return nil
}

type usageError struct{ msg string }

func (e usageError) Error() string { return e.msg }

func run(args []string, stdout, stderr io.Writer, getenv func(string) string) int {
	fs := flag.NewFlagSet("ruleproof-ci", flag.ContinueOnError)
	fs.SetOutput(stderr)
	bundlePath := fs.String("bundle", "", "path to an exported evidence bundle (JSON)")
	server := fs.String("server", "", "RuleProof server to fetch the plan from, e.g. http://localhost:8080")
	planID := fs.String("plan", "", "plan id to fetch from -server")
	fixture := fs.String("fixture", "", `run against a bundled fixture: "broken" or "fixed"`)
	baseURL := fs.String("base-url", "", "run against your own API at this base URL instead of a fixture")
	junitPath := fs.String("junit", "", "also write a JUnit XML report to this path")
	asJSON := fs.Bool("json", false, "print results as JSON instead of a table")
	timeout := fs.Duration("timeout", 30*time.Second, "overall time limit for the run")
	tokens := tokenFlags{}
	fs.Var(tokens, "token", "override the bearer token for a role (repeatable): -token viewer=...")
	if err := fs.Parse(args); err != nil {
		return 2
	}

	fail := func(err error) int {
		fmt.Fprintln(stderr, "ruleproof-ci:", err)
		return 2
	}

	if (*bundlePath == "") == (*server == "") {
		return fail(usageError{"pass exactly one of -bundle or -server (with -plan)"})
	}
	if (*fixture == "") == (*baseURL == "") {
		return fail(usageError{"pass exactly one of -fixture or -base-url"})
	}
	if *fixture != "" && *fixture != "broken" && *fixture != "fixed" {
		return fail(usageError{`-fixture must be "broken" or "fixed"`})
	}

	ctx, cancel := context.WithTimeout(context.Background(), *timeout)
	defer cancel()

	var b bundle
	var err error
	if *bundlePath != "" {
		err = readBundleFile(*bundlePath, &b)
	} else {
		if *planID == "" {
			return fail(usageError{"-server needs -plan"})
		}
		err = fetchBundle(ctx, *server, *planID, &b)
	}
	if err != nil {
		return fail(err)
	}
	if err := verify(&b); err != nil {
		return fail(err)
	}

	cases := make([]check.Case, 0, len(b.Plan.Cases))
	for _, c := range b.Plan.Cases {
		token, ok := tokens[c.Role]
		if !ok {
			token, ok = rules.TokenForRole(c.Role)
		}
		if !ok {
			return fail(fmt.Errorf("no token for role %q; pass -token %s=...", c.Role, c.Role))
		}
		cases = append(cases, check.Case{
			ID: c.ID, Rule: b.Plan.RuleText, Actor: c.Actor, Method: c.Method,
			Path: rules.CasePath(c), Token: token, Want: c.Want,
		})
	}

	target := *baseURL
	label := "base URL " + target
	if *fixture != "" {
		srv := httptest.NewServer(assets.Handler(*fixture == "broken"))
		defer srv.Close()
		target = srv.URL
		label = map[string]string{"broken": "seeded-defect fixture", "fixed": "corrected fixture"}[*fixture]
	}

	results := check.Run(ctx, strings.TrimRight(target, "/"), cases)
	byID := make(map[string]rules.Case, len(b.Plan.Cases))
	for _, c := range b.Plan.Cases {
		byID[c.ID] = c
	}

	if *asJSON {
		enc := json.NewEncoder(stdout)
		enc.SetIndent("", "  ")
		_ = enc.Encode(results)
	} else {
		printTable(stdout, &b, label, results, byID)
	}
	if *junitPath != "" {
		if err := writeJUnit(*junitPath, &b, results); err != nil {
			return fail(err)
		}
	}
	if getenv("GITHUB_ACTIONS") == "true" {
		annotate(stdout, results, byID)
		if path := getenv("GITHUB_STEP_SUMMARY"); path != "" {
			if err := appendSummary(path, &b, label, results, byID); err != nil {
				fmt.Fprintln(stderr, "ruleproof-ci: could not write step summary:", err)
			}
		}
	}

	for _, r := range results {
		if r.Verdict != "pass" {
			return 1
		}
	}
	return 0
}

func readBundleFile(path string, b *bundle) error {
	raw, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	if err := json.Unmarshal(raw, b); err != nil {
		return fmt.Errorf("%s is not an evidence bundle: %w", path, err)
	}
	return nil
}

func fetchBundle(ctx context.Context, server, planID string, b *bundle) error {
	url := strings.TrimRight(server, "/") + "/api/plans/" + planID + "/export"
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return err
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("fetch plan: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("fetch plan: %s returned %s", url, resp.Status)
	}
	return json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(b)
}

// verify enforces the product contract: only an approved plan runs, and only
// if its cases still hash to what was approved.
func verify(b *bundle) error {
	p := b.Plan
	switch {
	case p.ID == "" || len(p.Cases) == 0:
		return errors.New("bundle has no plan or no cases")
	case !p.Approved:
		return fmt.Errorf("plan %s is not approved; approve it in the studio before running it in CI", p.ID)
	case rules.Hash(p.Cases) != p.Hash:
		return fmt.Errorf("plan %s was modified after approval (hash %s, cases hash to %s)", p.ID, p.Hash, rules.Hash(p.Cases))
	}
	return nil
}

func describe(c rules.Case) string {
	return fmt.Sprintf("%s %s %s tenant", c.Role, c.Action, c.Scope)
}

func printTable(w io.Writer, b *bundle, label string, results []check.Result, byID map[string]rules.Case) {
	fmt.Fprintf(w, "RuleProof CI · plan %s · hash %s · %s\n", b.Plan.ID, b.Plan.Hash, label)
	fmt.Fprintf(w, "Rule: %q\n\n", b.Plan.RuleText)
	pathWidth := 12
	for _, r := range results {
		pathWidth = max(pathWidth, len(r.Path))
	}
	var pass, failed, errored int
	for _, r := range results {
		status := "-"
		if r.Actual != 0 {
			status = fmt.Sprint(r.Actual)
		}
		mark := map[string]string{"pass": "PASS ", "fail": "FAIL ", "error": "ERROR"}[r.Verdict]
		fmt.Fprintf(w, "  %s  %-26s %-4s %-*s want %d  got %s\n", mark, describe(byID[r.ID]), r.Method, pathWidth, r.Path, r.Want, status)
		switch r.Verdict {
		case "pass":
			pass++
		case "fail":
			failed++
		default:
			errored++
		}
	}
	fmt.Fprintf(w, "\n%d passed · %d failed · %d errors\n", pass, failed, errored)
	if failed+errored > 0 {
		fmt.Fprintln(w, "The API does not enforce the approved rule.")
	}
}

// annotate emits GitHub Actions workflow commands so failures show up on the
// run page without reading the log.
func annotate(w io.Writer, results []check.Result, byID map[string]rules.Case) {
	for _, r := range results {
		if r.Verdict == "pass" {
			continue
		}
		got := "no response"
		if r.Actual != 0 {
			got = fmt.Sprint(r.Actual)
		}
		fmt.Fprintf(w, "::error title=RuleProof: %s::Expected %d, got %s for %s %s (%s)\n",
			describe(byID[r.ID]), r.Want, got, r.Method, r.Path, escape(r.Detail))
	}
}

func escape(s string) string {
	return strings.NewReplacer("%", "%25", "\r", "%0D", "\n", "%0A").Replace(s)
}

func appendSummary(path string, b *bundle, label string, results []check.Result, byID map[string]rules.Case) error {
	f, err := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644)
	if err != nil {
		return err
	}
	defer f.Close()
	var sb strings.Builder
	fmt.Fprintf(&sb, "## RuleProof · %s\n\n> %s\n\n", label, b.Plan.RuleText)
	sb.WriteString("| Result | Check | Request | Expected | Actual |\n|---|---|---|---|---|\n")
	for _, r := range results {
		icon := map[string]string{"pass": "✅", "fail": "❌", "error": "⚠️"}[r.Verdict]
		actual := "—"
		if r.Actual != 0 {
			actual = fmt.Sprint(r.Actual)
		}
		fmt.Fprintf(&sb, "| %s %s | %s | `%s %s` | %d | %s |\n", icon, r.Verdict, describe(byID[r.ID]), r.Method, r.Path, r.Want, actual)
	}
	fmt.Fprintf(&sb, "\nPlan `%s` · hash `%s`. A passing run means the approved scenarios passed; it does not prove the whole application is secure.\n\n", b.Plan.ID, b.Plan.Hash)
	_, err = f.WriteString(sb.String())
	return err
}

type junitSuite struct {
	XMLName  xml.Name    `xml:"testsuite"`
	Name     string      `xml:"name,attr"`
	Tests    int         `xml:"tests,attr"`
	Failures int         `xml:"failures,attr"`
	Errors   int         `xml:"errors,attr"`
	Cases    []junitCase `xml:"testcase"`
}

type junitCase struct {
	Name      string        `xml:"name,attr"`
	ClassName string        `xml:"classname,attr"`
	Time      float64       `xml:"time,attr"`
	Failure   *junitMessage `xml:"failure,omitempty"`
	Error     *junitMessage `xml:"error,omitempty"`
}

type junitMessage struct {
	Message string `xml:"message,attr"`
	Body    string `xml:",chardata"`
}

func writeJUnit(path string, b *bundle, results []check.Result) error {
	s := junitSuite{Name: "ruleproof", Tests: len(results)}
	for _, r := range results {
		c := junitCase{Name: r.ID, ClassName: "ruleproof." + b.Plan.ID, Time: float64(r.DurationMS) / 1000}
		msg := &junitMessage{Message: fmt.Sprintf("expected %d, got %d", r.Want, r.Actual), Body: r.Detail}
		switch r.Verdict {
		case "fail":
			c.Failure = msg
			s.Failures++
		case "error":
			c.Error = msg
			s.Errors++
		}
		s.Cases = append(s.Cases, c)
	}
	out, err := xml.MarshalIndent(s, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, append([]byte(xml.Header), out...), 0o644)
}
