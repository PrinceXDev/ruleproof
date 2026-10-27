package store_test

import (
	"context"
	"os"
	"testing"

	"github.com/google/uuid"
	"ruleproof/internal/store"
)

func TestWorkbenchPersistence(t *testing.T) { testWorkbenchPersistence(t, openTestStore(t)) }

func TestPostgresWorkbenchPersistence(t *testing.T) {
	dsn := os.Getenv("RULEPROOF_TEST_POSTGRES")
	if dsn == "" {
		t.Skip("set RULEPROOF_TEST_POSTGRES to run PostgreSQL integration")
	}
	st, err := store.Open(dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer st.Close()
	testWorkbenchPersistence(t, st)
}

func testWorkbenchPersistence(t *testing.T, st *store.Store) {
	t.Helper()
	ctx := context.Background()
	workspace := uuid.NewString()
	revision, err := st.SaveRevision(ctx, workspace, "", "author", "hash", []byte(`{"name":"suite"}`))
	if err != nil {
		t.Fatal(err)
	}
	if _, err := st.GetRevision(ctx, "other", revision.ID); err != store.ErrNotFound {
		t.Fatal("cross-workspace read")
	}
	if _, err := st.ApproveRevision(ctx, workspace, revision.ID, "author", true); err == nil {
		t.Fatal("self approved")
	}
	approved, err := st.ApproveRevision(ctx, workspace, revision.ID, "reviewer", true)
	if err != nil || approved.ApprovedBy != "reviewer" {
		t.Fatalf("approval: %+v %v", approved, err)
	}
	again, err := st.ApproveRevision(ctx, workspace, revision.ID, "different-reviewer", true)
	if err != nil || again.ApprovedBy != "reviewer" {
		t.Fatal("approval attribution changed")
	}
	child, err := st.SaveRevision(ctx, workspace, revision.ID, "author", "new-hash", []byte(`{"name":"revised"}`))
	if err != nil || child.ApprovedBy != "" {
		t.Fatal("child inherited approval")
	}
	if _, err := st.SaveRevision(ctx, "other", revision.ID, "author", "hash", []byte(`{}`)); err != store.ErrNotFound {
		t.Fatal("cross-workspace parent")
	}
	_, err = st.RecordEvent(ctx, workspace, revision.ID, "runner", "run", []byte(`{"passed":1}`))
	if err != nil {
		t.Fatal(err)
	}
	events, err := st.ListEvents(ctx, workspace, revision.ID)
	if err != nil || len(events) != 3 {
		t.Fatalf("events %+v %v", events, err)
	}
	revisions, err := st.ListRevisions(ctx, workspace)
	if err != nil || len(revisions) != 2 {
		t.Fatalf("revisions %+v %v", revisions, err)
	}
}
