package diff

import (
	"strings"
	"testing"

	"ruleproof/internal/rules"
)

const sample = "Viewers can read assets in their own tenant. Editors can also update them. Neither role can access another tenant's assets."

func side(id, text string, approved bool) Side {
	p := rules.Parse(text)
	return Side{ID: id, RuleText: p.RuleText, Cases: p.Cases, Assumptions: p.Assumptions, Hash: rules.Hash(p.Cases), Approved: approved}
}

func join(ops []TextOp, keep string) string {
	var b strings.Builder
	for _, op := range ops {
		if op.Op == "equal" || op.Op == keep {
			b.WriteString(op.Text)
		}
	}
	return b.String()
}

func TestIdenticalPlansHaveNoChanges(t *testing.T) {
	a := side("a", sample, true)
	r := Compare(a, a)
	if r.PlanChanged || r.TextChanged || len(r.Cases) != 0 || r.ApprovalReset {
		t.Fatalf("expected no changes, got %+v", r)
	}
	if r.UnchangedCases != 8 {
		t.Fatalf("unchanged = %d, want 8", r.UnchangedCases)
	}
}

func TestEditedExpectationIsReportedAndResetsApproval(t *testing.T) {
	base := side("a", sample, true)
	head := side("b", sample, false)
	for i := range head.Cases {
		if head.Cases[i].ID == "viewer-a-update-a1" {
			head.Cases[i].Want, head.Cases[i].WantLabel = 200, "allow"
		}
	}
	head.Hash = rules.Hash(head.Cases)

	r := Compare(base, head)
	if len(r.Cases) != 1 {
		t.Fatalf("changes = %+v, want exactly one", r.Cases)
	}
	c := r.Cases[0]
	if c.CaseID != "viewer-a-update-a1" || c.Change != "changed" || c.FromStatus != 403 || c.ToStatus != 200 {
		t.Fatalf("unexpected change %+v", c)
	}
	if r.UnchangedCases != 7 || !r.PlanChanged || !r.ApprovalReset || r.TextChanged {
		t.Fatalf("unexpected summary %+v", r)
	}
}

func TestRevisedWordingProducesWordDiffThatRoundTrips(t *testing.T) {
	revised := "Viewers can read assets in their own tenant. Editors can read and update them."
	r := Compare(side("a", sample, false), side("b", revised, false))
	if !r.TextChanged {
		t.Fatal("expected text change")
	}
	if got := join(r.Text, "delete"); got != sample {
		t.Fatalf("base not reproduced:\n%q", got)
	}
	if got := join(r.Text, "insert"); got != revised {
		t.Fatalf("head not reproduced:\n%q", got)
	}
	var equal int
	for _, op := range r.Text {
		if op.Op == "equal" {
			equal++
		}
	}
	if equal == 0 {
		t.Fatalf("shared words should stay unchanged, got %+v", r.Text)
	}
	// "also" -> "read and" is one phrase swap, not word-by-word churn.
	for i, op := range r.Text {
		if op.Op == "delete" && op.Text == "also " {
			if r.Text[i+1].Op != "insert" || r.Text[i+1].Text != "read and " {
				t.Fatalf("expected grouped phrase replacement, got %+v", r.Text)
			}
			return
		}
	}
	t.Fatalf("expected a deletion of %q, got %+v", "also", r.Text)
}

func TestAssumptionsAddedAndRemoved(t *testing.T) {
	const ambiguous = "Only editors can read or update assets."
	r := Compare(side("a", sample, false), side("b", ambiguous, false))
	if len(r.AssumptionsAdded) == 0 {
		t.Fatalf("expected new assumptions, got %+v", r)
	}
	back := Compare(side("b", ambiguous, false), side("a", sample, false))
	if len(back.AssumptionsRemoved) != len(r.AssumptionsAdded) {
		t.Fatalf("assumptions not symmetric: %v vs %v", back.AssumptionsRemoved, r.AssumptionsAdded)
	}
}
