// Command ruleproof-suite verifies a reviewed workbench suite in CI.
package main

import (
	"context"
	"encoding/json"
	"encoding/xml"
	"flag"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"ruleproof/internal/store"
	"ruleproof/internal/workbench"
)

type credentialFlags map[string]string

func (f credentialFlags) String() string { return "" }
func (f credentialFlags) Set(v string) error {
	ref, env, ok := strings.Cut(v, "=")
	if !ok || ref == "" || env == "" {
		return fmt.Errorf("use reference=ENVIRONMENT_VARIABLE")
	}
	f[ref] = env
	return nil
}

func main() { os.Exit(run(os.Args[1:], os.Stdout, os.Stderr, os.Getenv)) }
func run(args []string, out, stderr io.Writer, getenv func(string) string) int {
	fs := flag.NewFlagSet("ruleproof-suite", flag.ContinueOnError)
	fs.SetOutput(stderr)
	bundle := fs.String("bundle", "", "approved workbench export JSON")
	base := fs.String("base-url", "", "authorized staging API base URL")
	currentSpec := fs.String("spec", "", "current OpenAPI JSON; fails on added, changed, or removed operations")
	junit := fs.String("junit", "", "JUnit report output file")
	timeout := fs.Duration("timeout", 60*time.Second, "overall execution timeout")
	credentials := credentialFlags{}
	fs.Var(credentials, "credential-env", "credential reference=ENV_VAR (repeatable; values are never arguments)")
	if fs.Parse(args) != nil {
		return 2
	}
	fail := func(err error) int { fmt.Fprintln(stderr, err); return 2 }
	u, err := url.Parse(*base)
	if err != nil || u.Host == "" || (u.Scheme != "https" && u.Scheme != "http") || u.User != nil || u.RawQuery != "" || u.Fragment != "" || *bundle == "" || *timeout <= 0 {
		return fail(fmt.Errorf("provide -bundle and an authorized http(s) -base-url with a positive timeout"))
	}
	raw, err := os.ReadFile(*bundle)
	if err != nil {
		return fail(err)
	}
	var b struct {
		Revision store.Revision `json:"revision"`
	}
	if err := json.Unmarshal(raw, &b); err != nil {
		return fail(err)
	}
	var suite workbench.Suite
	if err := json.Unmarshal(b.Revision.Content, &suite); err != nil {
		return fail(err)
	}
	if b.Revision.ID == "" || b.Revision.ApprovedBy == "" || b.Revision.Hash != workbench.Hash(suite) {
		return fail(fmt.Errorf("export must contain an approved, unchanged revision"))
	}
	if err := workbench.Validate(suite); err != nil {
		return fail(err)
	}
	analysis, _ := workbench.Analyze(suite)
	if analysis.Gaps > 0 || len(analysis.Conflicts) > 0 {
		return fail(fmt.Errorf("resolve conflicts and uncovered operations before CI"))
	}
	if *currentSpec != "" {
		current, err := os.ReadFile(*currentSpec)
		if err != nil {
			return fail(err)
		}
		drift, err := workbench.CompareSpecs(suite.Spec, current)
		if err != nil {
			return fail(err)
		}
		if len(drift.Added)+len(drift.Changed)+len(drift.Removed) > 0 {
			_ = json.NewEncoder(out).Encode(map[string]any{"drift": drift, "verdict": "fail", "detail": "API contract changed; save and approve a new revision"})
			return 1
		}
	}
	secrets := map[string]string{}
	for ref, env := range credentials {
		value := getenv(env)
		if value == "" {
			return fail(fmt.Errorf("credential reference %q is unavailable", ref))
		}
		secrets[ref] = value
	}
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.Proxy = nil
	defer transport.CloseIdleConnections()
	client := &http.Client{Timeout: 3 * time.Second, Transport: transport, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
	ctx, cancel := context.WithTimeout(context.Background(), *timeout)
	defer cancel()
	evidence, err := workbench.Execute(ctx, suite, *base, client, secrets)
	if err != nil {
		return fail(err)
	}
	if *junit != "" {
		if err := writeJUnit(*junit, evidence); err != nil {
			return fail(err)
		}
	}
	if err := json.NewEncoder(out).Encode(evidence); err != nil {
		return fail(err)
	}
	if evidence.Failed+evidence.Errors > 0 {
		return 1
	}
	return 0
}

func writeJUnit(path string, e workbench.Evidence) error {
	type failure struct {
		Message string `xml:"message,attr"`
	}
	type testCase struct {
		Name    string   `xml:"name,attr"`
		Time    float64  `xml:"time,attr"`
		Failure *failure `xml:"failure,omitempty"`
		Error   *failure `xml:"error,omitempty"`
	}
	report := struct {
		XMLName  xml.Name   `xml:"testsuite"`
		Name     string     `xml:"name,attr"`
		Tests    int        `xml:"tests,attr"`
		Failures int        `xml:"failures,attr"`
		Errors   int        `xml:"errors,attr"`
		Cases    []testCase `xml:"testcase"`
	}{Name: "RuleProof workbench", Tests: len(e.Results), Failures: e.Failed, Errors: e.Errors}
	for _, r := range e.Results {
		c := testCase{Name: r.ID, Time: float64(r.DurationMS) / 1000}
		if r.Verdict == "fail" {
			c.Failure = &failure{r.Detail}
		}
		if r.Verdict == "error" {
			c.Error = &failure{r.Detail}
		}
		report.Cases = append(report.Cases, c)
	}
	data, err := xml.MarshalIndent(report, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, append([]byte(xml.Header), data...), 0600)
}
