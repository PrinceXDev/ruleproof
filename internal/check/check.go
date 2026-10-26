// Package check compares explicitly reviewed expectations with HTTP evidence.
package check

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"time"
)

// maxEvidenceBodyBytes bounds how much of a response body is kept as
// evidence. The fixture API only ever returns small synthetic JSON, so this
// is generous headroom, not a real truncation limit in practice.
const maxEvidenceBodyBytes = 4096

// Case is a reviewed expectation, not a policy inferred by the runner.
type Case struct {
	ID     string `json:"id"`
	Rule   string `json:"rule"`
	Actor  string `json:"actor"`
	Method string `json:"method,omitempty"`
	Path   string `json:"path"`
	Token  string `json:"-"`
	Want   int    `json:"expected_status"`
	// Headers are extra request headers a bypass attempt sends. They are
	// never credentials, so they are kept as evidence.
	Headers map[string]string `json:"headers,omitempty"`
	Variant *Variant          `json:"variant,omitempty"`
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
	// Body is the raw response body, kept only because the fixture API
	// returns nothing but small synthetic asset data — never credentials.
	// A real integration target would redact this before it reaches here.
	Body string `json:"body,omitempty"`
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
	results := make([]Result, 0, len(cases))
	for _, c := range cases {
		started := time.Now()
		r := Result{Case: c, Verdict: "error"}
		if c.Want != 200 && c.Want != 401 && c.Want != 403 && c.Want != 404 {
			r.Detail = "unsupported expected status"
			results = append(results, r)
			continue
		}
		method := c.Method
		if method == "" {
			method = http.MethodGet
		}
		req, err := http.NewRequestWithContext(ctx, method, base+c.Path, nil)
		if err != nil {
			r.Detail = "invalid request"
		} else {
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
				body, _ := io.ReadAll(io.LimitReader(resp.Body, maxEvidenceBodyBytes))
				_ = resp.Body.Close()
				r.Body = string(body)
				r.Verdict, r.Detail = judge(c, r.Actual)
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
