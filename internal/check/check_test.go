package check_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"ruleproof/internal/check"
	"ruleproof/internal/demo"
	"strings"
	"testing"
)

func TestTenantIsolation(t *testing.T) {
	for _, broken := range []bool{true, false} {
		s := httptest.NewServer(demo.Handler(broken))
		results := check.Run(context.Background(), s.URL, demo.Matrix())
		s.Close()
		for _, r := range results {
			want := "pass"
			if broken && (r.ID == "A-cross" || r.ID == "B-cross") {
				want = "fail"
			}
			if r.Verdict != want {
				t.Errorf("broken=%v case=%s: got %s want %s", broken, r.ID, r.Verdict, want)
			}
		}
		data, err := json.Marshal(results)
		if err != nil {
			t.Fatal(err)
		}
		if strings.Contains(string(data), "demo-alice") {
			t.Fatal("credential leaked into evidence")
		}
	}
}

func TestErrorsAreNotDenials(t *testing.T) {
	for _, status := range []int{302, 500, 401, 404} {
		s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Location", "/login")
			w.WriteHeader(status)
		}))
		r := check.Run(context.Background(), s.URL, []check.Case{{Path: "/", Want: 403}})[0]
		s.Close()
		if r.Verdict != "fail" || r.Actual != status {
			t.Fatalf("status %d misclassified: %+v", status, r)
		}
	}
}

func TestVariantsAcceptAnyRefusal(t *testing.T) {
	cases := map[int]string{200: "fail", 204: "fail", 401: "pass", 403: "pass", 404: "pass", 405: "pass", 302: "error", 500: "error"}
	for status, want := range cases {
		var gotHeader string
		s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			gotHeader = r.Header.Get("X-Tenant-ID")
			w.WriteHeader(status)
		}))
		c := check.Case{Path: "/", Want: 403, Headers: map[string]string{"X-Tenant-ID": "B"}, Variant: &check.Variant{Of: "x", Kind: "tenant-header"}}
		r := check.Run(context.Background(), s.URL, []check.Case{c})[0]
		s.Close()
		if r.Verdict != want {
			t.Errorf("variant got %d: verdict %s, want %s", status, r.Verdict, want)
		}
		if gotHeader != "B" {
			t.Errorf("variant header not sent, got %q", gotHeader)
		}
	}
}

func TestCancellation(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	s := httptest.NewServer(demo.Handler(false))
	defer s.Close()
	r := check.Run(ctx, s.URL, demo.Matrix())[0]
	if r.Verdict != "error" {
		t.Fatalf("cancelled request classified as %s", r.Verdict)
	}
}
