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
