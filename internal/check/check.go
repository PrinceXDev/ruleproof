// Package check compares explicitly reviewed expectations with HTTP evidence.
package check

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// maxEvidenceBodyBytes bounds how much of a response body is kept as
// evidence after redaction. Assertions evaluate the larger bounded response.
const maxEvidenceBodyBytes = 4096

// Case is a reviewed expectation, not a policy inferred by the runner.
type Case struct {
	ID               string   `json:"id"`
	Rule             string   `json:"rule"`
	Actor            string   `json:"actor"`
	Method           string   `json:"method,omitempty"`
	Path             string   `json:"path"`
	Token            string   `json:"-"`
	RedactionSecrets []string `json:"-"`
	Want             int      `json:"expected_status"`
	// Headers are extra request headers a bypass attempt sends. They are
	// never credentials, so they are kept as evidence.
	Headers     map[string]string `json:"headers,omitempty"`
	Variant     *Variant          `json:"variant,omitempty"`
	RequestBody string            `json:"requestBody,omitempty"`
	Assertions  []Assertion       `json:"assertions,omitempty"`
	State       *StateCheck       `json:"state,omitempty"`
}

// Variant marks a case as a bypass attempt derived from an approved deny case.
// It is judged by Held rather than by exact status: any refusal counts.
type Variant struct {
	Of    string `json:"of"`   // id of the approved case it was derived from
	Kind  string `json:"kind"` // stable catalog key, e.g. "head-method"
	Label string `json:"label"`
	Why   string `json:"why"`
}

type Result struct {
	Case
	Actual     int    `json:"actual_status,omitempty"`
	Verdict    string `json:"verdict"`
	Detail     string `json:"detail"`
	DurationMS int64  `json:"duration_ms"`
	// Body is a bounded, redacted preview, never the unfiltered response.
	Body       string            `json:"body,omitempty"`
	Truncated  bool              `json:"truncated,omitempty"`
	Redacted   bool              `json:"redacted,omitempty"`
	Assertions []AssertionResult `json:"assertionResults,omitempty"`
}

// Held reports whether status is a refusal a denied request may legitimately
// return. A trailing slash can rightly 404 where the original 403s, so
// variants accept any of these; 3xx and 5xx never count as held.
func Held(status int) bool {
	switch status {
	case 401, 403, 404, 405:
		return true
	}
	return false
}

// Run issues the plan's requests against base. Callers own target and
// fixture authorization. Redirects never follow: they must not forward
// test credentials or mask results. The Authorization header (the only
// credential involved) is never captured into the result.
func Run(ctx context.Context, base string, cases []Case) []Result {
	client := &http.Client{Timeout: 2 * time.Second, CheckRedirect: func(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse }}
	return RunWithClient(ctx, client, base, cases)
}

// RunWithClient permits callers to supply a target-restricted transport.
func RunWithClient(ctx context.Context, client *http.Client, base string, cases []Case) []Result {
	results := make([]Result, 0, len(cases))
	for _, c := range cases {
		started := time.Now()
		r := Result{Case: safeCase(c), Verdict: "error"}
		if err := Validate(c); err != nil {
			r.Detail = err.Error()
			results = append(results, r)
			continue
		}
		var before []byte
		if c.State != nil {
			var err error
			before, err = observe(ctx, client, base, c.State)
			if err != nil {
				r.Detail = "state baseline unavailable; mutation was not sent"
				results = append(results, r)
				continue
			}
		}
		method := c.Method
		if method == "" {
			method = http.MethodGet
		}
		req, err := http.NewRequestWithContext(ctx, method, base+c.Path, strings.NewReader(c.RequestBody))
		if err != nil {
			r.Detail = "invalid request"
		} else {
			if c.RequestBody != "" {
				req.Header.Set("Content-Type", "application/json")
			}
			for k, v := range c.Headers {
				req.Header.Set(k, v)
			}
			if c.Token != "" {
				req.Header.Set("Authorization", "Bearer "+c.Token)
			}
			resp, err := client.Do(req)
			if err != nil {
				r.Detail = "request failed or timed out; no authorization conclusion"
			} else {
				r.Actual = resp.StatusCode
				body, readErr := io.ReadAll(io.LimitReader(resp.Body, maxResponseBytes+1))
				_ = resp.Body.Close()
				r.Truncated = len(body) > maxEvidenceBodyBytes
				secrets := append([]string{c.Token, stateToken(c)}, c.RedactionSecrets...)
				r.Body, r.Redacted = evidence(body, secrets...)
				r.Verdict, r.Detail = judge(c, r.Actual)
				if readErr != nil || len(body) > maxResponseBytes {
					r.Verdict, r.Detail = "error", "response incomplete or exceeds 1 MiB; no assertion conclusion"
				} else {
					for _, a := range c.Assertions {
						ar := evaluate(body, a)
						r.Assertions = append(r.Assertions, ar)
						if !ar.Passed {
							r.Verdict = "fail"
							r.Detail = "response assertion failed"
						}
					}
				}
			}
		}
		if c.State != nil && before != nil {
			after, err := observe(ctx, client, base, c.State)
			ar := AssertionResult{Operator: "unchanged", Path: c.State.Pointer, Passed: err == nil && sameState(before, after, c.State.Pointer)}
			r.Assertions = append(r.Assertions, ar)
			if err != nil {
				r.Verdict, r.Detail = "error", "state verification unavailable"
			} else if !ar.Passed {
				r.Verdict, r.Detail = "fail", "request changed protected state"
			}
		}
		r.DurationMS = time.Since(started).Milliseconds()
		results = append(results, r)
	}
	return results
}

func judge(c Case, actual int) (verdict, detail string) {
	if c.Variant == nil {
		detail = fmt.Sprintf("expected HTTP %d; observed HTTP %d", c.Want, actual)
		if actual == c.Want {
			return "pass", detail
		}
		return "fail", detail
	}
	switch {
	case Held(actual):
		return "pass", fmt.Sprintf("bypass attempt refused with HTTP %d", actual)
	case actual >= 200 && actual < 300:
		return "fail", fmt.Sprintf("bypass attempt succeeded with HTTP %d; the denied request got through", actual)
	default:
		return "error", fmt.Sprintf("bypass attempt returned HTTP %d; neither a refusal nor access, so no conclusion", actual)
	}
}

// Tally counts verdicts.
func Tally(results []Result) (pass, fail, errored int) {
	for _, r := range results {
		switch r.Verdict {
		case "pass":
			pass++
		case "fail":
			fail++
		default:
			errored++
		}
	}
	return pass, fail, errored
}
