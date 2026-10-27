package workbench

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"ruleproof/internal/check"
)

type Evidence struct {
	SuiteHash   string         `json:"suiteHash"`
	SpecHash    string         `json:"specHash"`
	Environment string         `json:"environment"`
	BuildCommit string         `json:"buildCommit"`
	DataVersion string         `json:"dataVersion"`
	CreatedAt   time.Time      `json:"createdAt"`
	Results     []check.Result `json:"results"`
	Passed      int            `json:"passed"`
	Failed      int            `json:"failed"`
	Errors      int            `json:"errors"`
}

// Execute preflights all credentials before making any requests. Ordered
// scenarios stop after their first failure; unrelated scenarios still run.
// There are no automatic retries of writes or permission transitions.
func Execute(ctx context.Context, s Suite, base string, client *http.Client, credentials map[string]string) (Evidence, error) {
	return ExecuteWithProgress(ctx, s, base, client, credentials, nil)
}

// ExecuteWithProgress persists progress before and after each case. A failed
// checkpoint stops execution rather than replaying an uncertain request.
func ExecuteWithProgress(ctx context.Context, s Suite, base string, client *http.Client, credentials map[string]string, progress func(Evidence, string) error) (Evidence, error) {
	e := Evidence{SuiteHash: Hash(s), SpecHash: Hash(s.Spec), Environment: s.Environment, BuildCommit: s.BuildCommit, DataVersion: s.DataVersion, CreatedAt: time.Now().UTC(), Results: []check.Result{}}
	if err := Validate(s); err != nil {
		return e, err
	}
	a, _ := Analyze(s)
	if len(a.Conflicts) > 0 {
		return e, fmt.Errorf("resolve rule conflicts before execution")
	}
	tokens := map[string]string{}
	for _, id := range s.Identities {
		if id.Credential == "" {
			tokens[id.ID] = ""
			continue
		}
		token, ok := credentials[id.Credential]
		if !ok || token == "" {
			return e, fmt.Errorf("credential reference %q is unavailable", id.Credential)
		}
		tokens[id.ID] = token
	}
	blocked := map[string]bool{}
	secrets := make([]string, 0, len(credentials))
	for _, secret := range credentials {
		secrets = append(secrets, secret)
	}
	for _, c := range s.Cases {
		if err := ctx.Err(); err != nil {
			return e, err
		}
		if progress != nil {
			if err := progress(e, c.ID); err != nil {
				return e, err
			}
		}
		request := c.Request()
		request.Rule = s.RuleText
		request.Token = tokens[c.IdentityID]
		request.RedactionSecrets = secrets
		if c.State != nil {
			state := *c.State
			state.Token = tokens[state.IdentityID]
			request.State = &state
		}
		if c.Scenario != "" && blocked[c.Scenario] {
			// A skipped step remains an error, never an authorization pass.
			request.Token = ""
			request.RedactionSecrets = nil
			request.RequestBody = ""
			request.State = nil
			e.Results = append(e.Results, check.Result{Case: request, Verdict: "error", Detail: "not executed: an earlier step in this scenario failed"})
			e.Passed, e.Failed, e.Errors = check.Tally(e.Results)
			continue
		}
		result := check.RunWithClient(ctx, client, strings.TrimRight(base, "/"), []check.Case{request})[0]
		e.Results = append(e.Results, result)
		e.Passed, e.Failed, e.Errors = check.Tally(e.Results)
		if progress != nil {
			if err := progress(e, ""); err != nil {
				return e, err
			}
		}
		if c.Scenario != "" && result.Verdict != "pass" {
			blocked[c.Scenario] = true
		}
	}
	e.Passed, e.Failed, e.Errors = check.Tally(e.Results)
	return e, nil
}
