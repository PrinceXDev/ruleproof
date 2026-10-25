package store_test

import (
	"context"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"ruleproof/internal/assets"
	"ruleproof/internal/store"
)

const sampleRule = "Viewers can read assets in their own tenant. Editors can also update them. Neither role can access another tenant's assets."

func openTestStore(t *testing.T) *store.Store {
	t.Helper()
	path := filepath.Join(t.TempDir(), "test.db")
	st, err := store.Open(path)
	if err != nil {
		t.Fatalf("open store: %v", err)
	}
	t.Cleanup(func() { st.Close() })
	return st
}

func TestCreateApproveRunLifecycle(t *testing.T) {
	ctx := context.Background()
	st := openTestStore(t)

	p, err := st.CreateRootPlan(ctx, sampleRule)
	if err != nil {
		t.Fatalf("CreateRootPlan: %v", err)
	}
	if p.Approved {
		t.Fatal("a freshly created plan must not be approved")
	}

	fixed := httptest.NewServer(assets.Handler(false))
	defer fixed.Close()

	if _, err := st.RunPlan(ctx, p.ID, "fixed", fixed.URL); err == nil {
		t.Fatal("running an unapproved plan must be rejected")
	}

	approved, err := st.ApprovePlan(ctx, p.ID)
	if err != nil {
		t.Fatalf("ApprovePlan: %v", err)
	}
	if !approved.Approved || approved.ApprovedAt == nil {
		t.Fatal("plan should be marked approved with a timestamp")
	}

	run, err := st.RunPlan(ctx, p.ID, "fixed", fixed.URL)
	if err != nil {
		t.Fatalf("RunPlan: %v", err)
	}
	if run.FailCount != 0 || run.PassCount != len(p.Cases) {
		t.Fatalf("expected all %d cases to pass against the fixed fixture, got pass=%d fail=%d", len(p.Cases), run.PassCount, run.FailCount)
	}
}

func TestBrokenFixtureSurfacesTheSeededLeak(t *testing.T) {
	ctx := context.Background()
	st := openTestStore(t)

	p, _ := st.CreateRootPlan(ctx, sampleRule)
	st.ApprovePlan(ctx, p.ID)

	broken := httptest.NewServer(assets.Handler(true))
	defer broken.Close()

	run, err := st.RunPlan(ctx, p.ID, "broken", broken.URL)
	if err != nil {
		t.Fatalf("RunPlan: %v", err)
	}
	if run.FailCount == 0 {
		t.Fatal("expected the broken fixture to fail at least the cross-tenant read case")
	}
}

func TestEditingCasesInvalidatesApproval(t *testing.T) {
	ctx := context.Background()
	st := openTestStore(t)

	p, _ := st.CreateRootPlan(ctx, sampleRule)
	st.ApprovePlan(ctx, p.ID)

	target := p.Cases[0]
	overrideWant := 403
	if target.Want == 403 {
		overrideWant = 200
	}
	edited, err := st.EditCases(ctx, p.ID, map[string]int{target.ID: overrideWant})
	if err != nil {
		t.Fatalf("EditCases: %v", err)
	}
	if edited.ID == p.ID {
		t.Fatal("editing a case must create a new plan, not mutate the approved one")
	}
	if edited.Approved {
		t.Fatal("a freshly edited plan must start unapproved")
	}
	if edited.ParentPlanID != p.ID || edited.RootPlanID != p.RootPlanID {
		t.Fatal("edited plan should be linked into the same lineage")
	}

	// The original approved plan is untouched and still runnable on its own.
	original, err := st.GetPlan(ctx, p.ID)
	if err != nil {
		t.Fatalf("GetPlan: %v", err)
	}
	if !original.Approved {
		t.Fatal("original plan's approval must survive an edit to its child")
	}
}

func TestEditCasesRejectsUnknownCaseOrStatus(t *testing.T) {
	ctx := context.Background()
	st := openTestStore(t)
	p, _ := st.CreateRootPlan(ctx, sampleRule)

	if _, err := st.EditCases(ctx, p.ID, map[string]int{"does-not-exist": 200}); err == nil {
		t.Fatal("expected an error for an unknown case id")
	}
	if _, err := st.EditCases(ctx, p.ID, map[string]int{p.Cases[0].ID: 500}); err == nil {
		t.Fatal("expected an error for a status outside the bounded vocabulary")
	}
}

func TestApprovalRequiresAcknowledgedAssumptions(t *testing.T) {
	ctx := context.Background()
	st := openTestStore(t)

	p, err := st.CreateRootPlan(ctx, "Only editors can read or update assets.")
	if err != nil {
		t.Fatalf("CreateRootPlan: %v", err)
	}
	if len(p.Assumptions) == 0 {
		t.Fatal("test setup expects this rule to produce assumptions")
	}
	if _, err := st.ApprovePlan(ctx, p.ID); err == nil {
		t.Fatal("approval must be rejected until assumptions are acknowledged")
	}
	if _, err := st.AcknowledgeAssumptions(ctx, p.ID); err != nil {
		t.Fatalf("AcknowledgeAssumptions: %v", err)
	}
	if _, err := st.ApprovePlan(ctx, p.ID); err != nil {
		t.Fatalf("approval should succeed after acknowledging assumptions: %v", err)
	}
}

func TestReviseRecomputesAssumptionsIndependentlyOfParent(t *testing.T) {
	ctx := context.Background()
	st := openTestStore(t)

	// Start from a rule that leaves viewers and tenants unmentioned, so it
	// carries assumptions that must be acknowledged before approval.
	ambiguous, err := st.CreateRootPlan(ctx, "Only editors can read or update assets.")
	if err != nil {
		t.Fatalf("CreateRootPlan: %v", err)
	}
	if len(ambiguous.Assumptions) == 0 {
		t.Fatal("test setup expects this rule to produce assumptions")
	}
	if _, err := st.AcknowledgeAssumptions(ctx, ambiguous.ID); err != nil {
		t.Fatalf("AcknowledgeAssumptions: %v", err)
	}
	if _, err := st.ApprovePlan(ctx, ambiguous.ID); err != nil {
		t.Fatalf("ApprovePlan: %v", err)
	}

	// Revising to a fully-specified rule must not require acknowledging
	// anything — the new plan simply has no assumptions to acknowledge.
	resolved, err := st.RevisePlan(ctx, ambiguous.ID, sampleRule)
	if err != nil {
		t.Fatalf("RevisePlan: %v", err)
	}
	if len(resolved.Assumptions) != 0 {
		t.Fatal("test setup expects the revised rule to leave no assumptions")
	}
	if resolved.AssumptionsAcknowledged {
		t.Fatal("a freshly revised plan should not inherit its parent's acknowledgment")
	}
	if _, err := st.ApprovePlan(ctx, resolved.ID); err != nil {
		t.Fatalf("approving a revision with no assumptions should need no acknowledgment: %v", err)
	}

	// Revising a fully-specified, already-approved plan back to an
	// ambiguous one must re-require acknowledgment — approval history does
	// not carry over to a plan with new, unacknowledged assumptions.
	backToAmbiguous, err := st.RevisePlan(ctx, resolved.ID, "Only editors can read or update assets.")
	if err != nil {
		t.Fatalf("RevisePlan: %v", err)
	}
	if _, err := st.ApprovePlan(ctx, backToAmbiguous.ID); err == nil {
		t.Fatal("approving a revision with new, unacknowledged assumptions must be rejected")
	}
}

func TestLineageAndRunHistorySpanRevisions(t *testing.T) {
	ctx := context.Background()
	st := openTestStore(t)

	root, _ := st.CreateRootPlan(ctx, sampleRule)
	st.ApprovePlan(ctx, root.ID)

	fixed := httptest.NewServer(assets.Handler(false))
	defer fixed.Close()
	if _, err := st.RunPlan(ctx, root.ID, "fixed", fixed.URL); err != nil {
		t.Fatalf("RunPlan: %v", err)
	}

	revised, err := st.RevisePlan(ctx, root.ID, sampleRule+" Admins have no special access.")
	if err != nil {
		t.Fatalf("RevisePlan: %v", err)
	}
	if revised.RootPlanID != root.RootPlanID {
		t.Fatal("a revision must stay in the same lineage")
	}

	lineage, err := st.ListLineage(ctx, root.RootPlanID)
	if err != nil {
		t.Fatalf("ListLineage: %v", err)
	}
	if len(lineage) != 2 {
		t.Fatalf("expected 2 plans in lineage (root + revision), got %d", len(lineage))
	}

	runs, err := st.ListRunsForLineage(ctx, root.RootPlanID)
	if err != nil {
		t.Fatalf("ListRunsForLineage: %v", err)
	}
	if len(runs) != 1 {
		t.Fatalf("expected the run against the root plan to show up in lineage history, got %d", len(runs))
	}
}

func TestPersistsAcrossReopen(t *testing.T) {
	ctx := context.Background()
	path := filepath.Join(t.TempDir(), "reopen.db")

	st1, err := store.Open(path)
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	p, err := st1.CreateRootPlan(ctx, sampleRule)
	if err != nil {
		t.Fatalf("CreateRootPlan: %v", err)
	}
	st1.ApprovePlan(ctx, p.ID)
	st1.Close()

	st2, err := store.Open(path)
	if err != nil {
		t.Fatalf("reopen: %v", err)
	}
	defer st2.Close()
	reopened, err := st2.GetPlan(ctx, p.ID)
	if err != nil {
		t.Fatalf("GetPlan after reopen: %v", err)
	}
	if !reopened.Approved {
		t.Fatal("approval state must survive a restart")
	}
	if len(reopened.Cases) != len(p.Cases) {
		t.Fatal("cases (including fixture tokens needed to re-run) must survive a restart")
	}
}
