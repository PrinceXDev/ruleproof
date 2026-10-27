package check_test

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"

	"ruleproof/internal/check"
)

func TestResponseAssertions(t *testing.T) {
	tests := []struct{ name, body, path, op, value, want string }{
		{"tenant match", `{"tenant":"A"}`, "/tenant", "equals", `"A"`, "pass"},
		{"tenant leak", `{"tenant":"B"}`, "/tenant", "equals", `"A"`, "fail"},
		{"null is present", `{"secret":null}`, "/secret", "absent", "", "fail"},
		{"absent", `{}`, "/secret", "absent", "", "pass"},
		{"missing equality", `{}`, "/secret", "equals", "null", "fail"},
		{"exists null", `{"secret":null}`, "/secret", "exists", "", "pass"},
		{"collection isolation", `{"items":[{"tenant":"A"},{"tenant":"B"}]}`, "/items/*/tenant", "allEqual", `"A"`, "fail"},
		{"collection okay", `{"items":[{"tenant":"A"}]}`, "/items/*/tenant", "allEqual", `"A"`, "pass"},
		{"empty is not proof", `{"items":[]}`, "/items/*/tenant", "allEqual", `"A"`, "fail"},
		{"explicit empty", `{"items":[]}`, "/items", "equals", `[]`, "pass"},
		{"escaped pointer", `{"a/b":{"~key":7}}`, "/a~1b/~0key", "equals", `7`, "pass"},
		{"malformed JSON", `{`, "/tenant", "absent", "", "fail"},
		{"trailing JSON", `{} {}`, "/tenant", "absent", "", "fail"},
		{"array index", `[1,2]`, "/1", "equals", `2`, "pass"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { fmt.Fprint(w, tt.body) }))
			defer server.Close()
			r := check.Run(context.Background(), server.URL, []check.Case{{Path: "/", Want: 200, Assertions: []check.Assertion{{Path: tt.path, Operator: tt.op, Value: json.RawMessage(tt.value)}}}})[0]
			if r.Verdict != tt.want {
				t.Fatalf("got %+v", r)
			}
		})
	}
}

func TestDeniedMutationStillFails(t *testing.T) {
	var value atomic.Int64
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "PUT" {
			value.Add(1)
			w.WriteHeader(403)
			return
		}
		fmt.Fprintf(w, `{"version":%d}`, value.Load())
	}))
	defer server.Close()
	r := check.Run(context.Background(), server.URL, []check.Case{{Path: "/asset", Method: "PUT", Want: 403, RequestBody: `{"name":"mutate"}`, State: &check.StateCheck{Path: "/asset", Pointer: "/version"}}})[0]
	if r.Actual != 403 || r.Verdict != "fail" || r.Detail != "request changed protected state" {
		t.Fatalf("false pass: %+v", r)
	}
}

func TestUnavailableBaselinePreventsMutation(t *testing.T) {
	var writes atomic.Int64
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "PUT" {
			writes.Add(1)
		}
		w.WriteHeader(401)
	}))
	defer server.Close()
	r := check.Run(context.Background(), server.URL, []check.Case{{Path: "/", Method: "PUT", Want: 403, State: &check.StateCheck{Path: "/"}}})[0]
	if writes.Load() != 0 || r.Verdict != "error" {
		t.Fatalf("mutation sent without baseline: %+v", r)
	}
}

func TestEvidenceRedactionAndBounds(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, `{"password":"sensitive","nested":{"api_key":"secret"},"echo":"bearer-value","text":%q}`, strings.Repeat("x", 5000))
	}))
	defer server.Close()
	r := check.Run(context.Background(), server.URL, []check.Case{{Path: "/", Want: 200, Token: "bearer-value", Assertions: []check.Assertion{{Path: "/password", Operator: "equals", Value: json.RawMessage(`"sensitive"`)}}}})[0]
	if !r.Redacted || !r.Truncated || r.Verdict != "pass" || strings.Contains(r.Body, "sensitive") || strings.Contains(r.Body, "bearer-value") || len(r.Body) > 4200 {
		t.Fatalf("unsafe evidence: %+v", r)
	}
}

func TestOversizeAndTruncatedBodiesAreErrors(t *testing.T) {
	for _, mode := range []string{"oversize", "short"} {
		t.Run(mode, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if mode == "short" {
					w.Header().Set("Content-Length", "900")
					fmt.Fprint(w, `{}`)
				} else {
					fmt.Fprint(w, strings.Repeat("x", (1<<20)+1))
				}
			}))
			defer server.Close()
			r := check.Run(context.Background(), server.URL, []check.Case{{Path: "/", Want: 200}})[0]
			if r.Verdict != "error" {
				t.Fatalf("incomplete response passed: %+v", r)
			}
		})
	}
}

func TestRejectInvalidRequestsBeforeSending(t *testing.T) {
	for _, path := range []string{"https://other.test/", "//other.test/", "/a/../private", "/%2e%2e/private", "/a\\b", "/a#fragment"} {
		if check.Validate(check.Case{Path: path, Want: 200}) == nil {
			t.Errorf("accepted %q", path)
		}
	}
	if check.Validate(check.Case{Path: "/", Want: 200, Headers: map[string]string{"Authorization": "secret"}}) == nil {
		t.Fatal("accepted stored credential header")
	}
}

func TestRedirectDoesNotForwardCredential(t *testing.T) {
	var hits atomic.Int64
	destination := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { hits.Add(1) }))
	defer destination.Close()
	origin := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { http.Redirect(w, r, destination.URL, 302) }))
	defer origin.Close()
	r := check.Run(context.Background(), origin.URL, []check.Case{{Path: "/", Want: 403, Token: "secret"}})[0]
	if hits.Load() != 0 || r.Actual != 302 || r.Verdict != "fail" {
		t.Fatal("redirect followed or misclassified")
	}
}
