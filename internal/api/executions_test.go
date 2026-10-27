package api_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"sync/atomic"
	"testing"
	"time"

	"ruleproof/internal/api"
	"ruleproof/internal/assets"
	"ruleproof/internal/store"
	"ruleproof/internal/workbench"
)

func TestExecutionOutlivesBrowserAndCancelsBeforeNextRequest(t *testing.T) {
	st, err := store.Open(filepath.Join(t.TempDir(), "executions.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer st.Close()
	entered, release := make(chan struct{}), make(chan struct{})
	var hits atomic.Int32
	fixture := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if hits.Add(1) == 1 {
			close(entered)
			select {
			case <-release:
			case <-r.Context().Done():
				return
			}
		}
		assets.Handler(assets.Fixed).ServeHTTP(w, r)
	}))
	defer fixture.Close()
	s := api.New(st, map[string]string{"fixed": fixture.URL})
	handler := s.Routes()
	suite := workbench.Sample(assets.OpenAPISpec)
	raw, _ := json.Marshal(suite)
	revision, err := st.SaveRevision(context.Background(), "demo", "", "author", workbench.Hash(suite), raw)
	if err != nil {
		t.Fatal(err)
	}
	if _, err = st.ApproveRevision(context.Background(), "demo", revision.ID, "reviewer", true); err != nil {
		t.Fatal(err)
	}
	submit := func(ctx context.Context, key string, want int) store.Execution {
		t.Helper()
		body, _ := json.Marshal(map[string]string{"requestKey": key})
		req := httptest.NewRequest("POST", "/api/workbench/revisions/"+revision.ID+"/run", bytes.NewReader(body)).WithContext(ctx)
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
		if rec.Code != want {
			t.Fatalf("submit: %d %s", rec.Code, rec.Body.String())
		}
		var job store.Execution
		_ = json.Unmarshal(rec.Body.Bytes(), &job)
		return job
	}
	browser, cancelBrowser := context.WithCancel(context.Background())
	job := submit(browser, "browser-disconnect-key", 202)
	cancelBrowser()
	select {
	case <-entered:
	case <-time.After(3 * time.Second):
		t.Fatal("detached worker did not run")
	}
	duplicate := submit(context.Background(), "browser-disconnect-key", 202)
	if job.ID != duplicate.ID {
		t.Fatal("retry created a second execution")
	}
	submit(context.Background(), "different-run-key", 409)
	// Cancellation is persisted, so another server sharing the DB can stop it.
	other := api.New(st, map[string]string{"fixed": fixture.URL})
	rec := httptest.NewRecorder()
	other.Routes().ServeHTTP(rec, httptest.NewRequest("POST", "/api/workbench/executions/"+job.ID+"/cancel", nil))
	if rec.Code != 200 {
		t.Fatalf("cancel %d %s", rec.Code, rec.Body.String())
	}
	close(release)
	deadline := time.Now().Add(4 * time.Second)
	for time.Now().Before(deadline) {
		stored, readErr := st.GetExecution(context.Background(), "demo", job.ID)
		err = readErr
		if err != nil {
			t.Fatal(err)
		}
		job = *stored
		if job.Status == "cancelled" {
			break
		}
		time.Sleep(10 * time.Millisecond)
	}
	if job.Status != "cancelled" || !job.RecoveryRequired || hits.Load() != 1 {
		t.Fatalf("unsafe cancellation: %+v hits=%d", job, hits.Load())
	}
	drain, stopDrain := context.WithTimeout(context.Background(), time.Second)
	defer stopDrain()
	if err = s.ShutdownExecutions(drain); err != nil {
		t.Fatal(err)
	}
	submit(context.Background(), "after-shutdown-request-key", 503)
}
