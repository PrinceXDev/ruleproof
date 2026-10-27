package store_test

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"

	"ruleproof/internal/store"

	"github.com/google/uuid"
)

func TestExecutionCoordinationSQLite(t *testing.T) {
	dsn := filepath.Join(t.TempDir(), "shared.db")
	a, err := store.Open(dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer a.Close()
	b, err := store.Open(dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer b.Close()
	testExecutionCoordination(t, a, b)
}
func TestExecutionCoordinationPostgres(t *testing.T) {
	dsn := os.Getenv("RULEPROOF_TEST_POSTGRES")
	if dsn == "" {
		t.Skip("PostgreSQL integration is opt-in")
	}
	a, err := store.Open(dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer a.Close()
	b, err := store.Open(dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer b.Close()
	testExecutionCoordination(t, a, b)
}
func testExecutionCoordination(t *testing.T, a, b *store.Store) {
	t.Helper()
	ctx := context.Background()
	workspace := uuid.NewString()
	r, err := a.SaveRevision(ctx, workspace, "", "author", "hash", []byte(`{}`))
	if err != nil {
		t.Fatal(err)
	}
	if _, err = a.ApproveRevision(ctx, workspace, r.ID, "reviewer", true); err != nil {
		t.Fatal(err)
	}
	var wg sync.WaitGroup
	type outcome struct {
		job     *store.Execution
		created bool
		err     error
	}
	results := make(chan outcome, 2)
	for _, st := range []*store.Store{a, b} {
		wg.Add(1)
		go func(st *store.Store) {
			defer wg.Done()
			job, created, err := st.StartExecution(ctx, workspace, r.ID, "staging", "author", "same-submission-key", time.Now().Add(time.Minute))
			results <- outcome{job, created, err}
		}(st)
	}
	wg.Wait()
	close(results)
	winners := 0
	var job *store.Execution
	for result := range results {
		if result.err != nil {
			t.Fatal(result.err)
		}
		if result.created {
			winners++
		}
		if job != nil && job.ID != result.job.ID {
			t.Fatal("duplicate receipt")
		}
		job = result.job
	}
	if winners != 1 {
		t.Fatalf("workers started: %d", winners)
	}
	if _, _, err = b.StartExecution(ctx, workspace, r.ID, "other-target", "author", "same-submission-key", time.Now().Add(time.Minute)); !errors.Is(err, store.ErrConflict) {
		t.Fatal("idempotency key was retargeted")
	}
	if _, _, err = b.StartExecution(ctx, workspace, r.ID, "staging", "author", "different-submission", time.Now().Add(time.Minute)); !errors.Is(err, store.ErrConflict) {
		t.Fatalf("reservation bypass: %v", err)
	}
	if _, err = b.GetExecution(ctx, "another", job.ID); err != store.ErrNotFound {
		t.Fatal("workspace leak")
	}
	if err = b.CheckpointExecution(ctx, workspace, job.ID, "write-step", []byte(`{"passed":1,"results":[{"id":"case","verdict":"pass","body":"large-private-preview"}]}`)); err != nil {
		t.Fatal(err)
	}
	summaries, err := b.ListExecutions(ctx, workspace)
	if err != nil || len(summaries) != 1 || strings.Contains(string(summaries[0].Evidence), "large-private-preview") {
		t.Fatalf("summary leaked response preview: %v", err)
	}
	if err = b.CancelExecution(ctx, workspace, job.ID, "reviewer"); err != nil {
		t.Fatal(err)
	}
	if err = a.CheckpointExecution(ctx, workspace, job.ID, "next-step", []byte(`{}`)); !errors.Is(err, store.ErrConflict) {
		t.Fatal("cancelled worker sent next step")
	}
	if err = a.FinishExecution(ctx, workspace, job.ID, []byte(`{"passed":1}`), false); err != nil {
		t.Fatal(err)
	}
	job, err = a.GetExecution(ctx, workspace, job.ID)
	if err != nil || job.Status != "cancelled" || !job.RecoveryRequired {
		t.Fatalf("cancellation race lost: %+v %v", job, err)
	}
	if err = b.RecoverExecution(ctx, workspace, job.ID, "reviewer", "Target inspected and worker stopped"); !errors.Is(err, store.ErrConflict) {
		t.Fatal("premature recovery")
	}
	// Expired receipts survive process loss and continue blocking the environment.
	expired, _, err := a.StartExecution(ctx, workspace, r.ID, "expired", "author", "expired-submission-key", time.Now().Add(-time.Second))
	if err != nil {
		t.Fatal(err)
	}
	expired, err = b.GetExecution(ctx, workspace, expired.ID)
	if err != nil || expired.Status != "interrupted" {
		t.Fatal("expired run appears active")
	}
	if err = b.CheckpointExecution(ctx, workspace, expired.ID, "write", []byte(`{}`)); !errors.Is(err, store.ErrConflict) {
		t.Fatal("expired worker checkpointed")
	}
	if err = b.RecoverExecution(ctx, workspace, expired.ID, "reviewer", "Target inspected and old worker stopped"); err != nil {
		t.Fatal(err)
	}
	if err = a.FinishExecution(ctx, workspace, expired.ID, []byte(`{}`), false); !errors.Is(err, store.ErrConflict) {
		t.Fatal("recovered worker overwrote history")
	}
	next, created, err := b.StartExecution(ctx, workspace, r.ID, "expired", "author", "fresh-submission-key", time.Now().Add(time.Minute))
	if err != nil || !created {
		t.Fatalf("recovery did not release: %v", err)
	}
	if err = b.FinishExecution(ctx, workspace, next.ID, []byte(`{"passed":8}`), false); err != nil {
		t.Fatal(err)
	}
	if _, created, err = a.StartExecution(ctx, workspace, r.ID, "expired", "author", "completed-next-submission", time.Now().Add(time.Minute)); err != nil || !created {
		t.Fatal("completed run retained reservation")
	}
}
