// Package diff explains what changed between two revisions of a plan, so a
// reviewer re-approving a revision can see exactly what they are approving
// instead of re-reading all eight cases.
package diff

import (
	"regexp"
	"strings"

	"ruleproof/internal/rules"
)

// Side is one revision being compared. It is decoupled from store.Plan so the
// CLI and tests can diff plans that never touched the database.
type Side struct {
	ID          string
	RuleText    string
	Cases       []rules.Case
	Assumptions []string
	Hash        string
	Approved    bool
}

type TextOp struct {
	Op   string `json:"op"` // "equal" | "insert" | "delete"
	Text string `json:"text"`
}

type CaseChange struct {
	CaseID     string `json:"caseId"`
	Role       string `json:"role"`
	Action     string `json:"action"`
	Scope      string `json:"scope"`
	Method     string `json:"method"`
	AssetID    string `json:"assetId"`
	Change     string `json:"change"` // "changed" | "added" | "removed"
	FromStatus int    `json:"fromStatus,omitempty"`
	ToStatus   int    `json:"toStatus,omitempty"`
	FromLabel  string `json:"fromLabel,omitempty"`
	ToLabel    string `json:"toLabel,omitempty"`
}

type Result struct {
	BaseID             string          `json:"baseId"`
	HeadID             string          `json:"headId"`
	TextChanged        bool            `json:"textChanged"`
	Text               []TextOp        `json:"text"`
	Cases              []CaseChange    `json:"cases"`
	UnchangedCases     int             `json:"unchangedCases"`
	AssumptionsAdded   []string        `json:"assumptionsAdded"`
	AssumptionsRemoved []string        `json:"assumptionsRemoved"`
	ConceptsAdded      []rules.Concept `json:"conceptsAdded"`
	ConceptsRemoved    []rules.Concept `json:"conceptsRemoved"`
	PlanChanged        bool            `json:"planChanged"`
	// ApprovalReset is true when the base was approved but the head is a
	// different plan that is not: the old approval deliberately did not carry over.
	ApprovalReset bool `json:"approvalReset"`
}

func Compare(base, head Side) Result {
	r := Result{
		BaseID:             base.ID,
		HeadID:             head.ID,
		TextChanged:        base.RuleText != head.RuleText,
		Text:               words(base.RuleText, head.RuleText),
		Cases:              []CaseChange{},
		AssumptionsAdded:   setDiff(head.Assumptions, base.Assumptions),
		AssumptionsRemoved: setDiff(base.Assumptions, head.Assumptions),
	}

	baseByID := make(map[string]rules.Case, len(base.Cases))
	for _, c := range base.Cases {
		baseByID[c.ID] = c
	}
	seen := make(map[string]bool, len(head.Cases))
	for _, h := range head.Cases {
		seen[h.ID] = true
		b, ok := baseByID[h.ID]
		switch {
		case !ok:
			r.Cases = append(r.Cases, change(h, "added", 0, "", h.Want, h.WantLabel))
		case b.Want != h.Want:
			r.Cases = append(r.Cases, change(h, "changed", b.Want, b.WantLabel, h.Want, h.WantLabel))
		default:
			r.UnchangedCases++
		}
	}
	for _, b := range base.Cases {
		if !seen[b.ID] {
			r.Cases = append(r.Cases, change(b, "removed", b.Want, b.WantLabel, 0, ""))
		}
	}

	bc, hc := rules.Parse(base.RuleText).Concepts, rules.Parse(head.RuleText).Concepts
	r.ConceptsAdded = conceptDiff(hc, bc)
	r.ConceptsRemoved = conceptDiff(bc, hc)

	r.PlanChanged = base.Hash != head.Hash || r.TextChanged || len(r.Cases) > 0
	r.ApprovalReset = base.Approved && !head.Approved && base.ID != head.ID
	return r
}

func change(c rules.Case, kind string, from int, fromLabel string, to int, toLabel string) CaseChange {
	return CaseChange{
		CaseID: c.ID, Role: c.Role, Action: c.Action, Scope: c.Scope, Method: c.Method, AssetID: c.AssetID,
		Change: kind, FromStatus: from, FromLabel: fromLabel, ToStatus: to, ToLabel: toLabel,
	}
}

// setDiff returns items of a that are not in b, preserving a's order.
func setDiff(a, b []string) []string {
	in := make(map[string]bool, len(b))
	for _, s := range b {
		in[s] = true
	}
	out := []string{}
	for _, s := range a {
		if !in[s] {
			out = append(out, s)
		}
	}
	return out
}

func conceptDiff(a, b []rules.Concept) []rules.Concept {
	in := make(map[string]bool, len(b))
	for _, c := range b {
		in[c.Label+"\x00"+c.Value] = true
	}
	out := []rules.Concept{}
	for _, c := range a {
		if !in[c.Label+"\x00"+c.Value] {
			out = append(out, c)
		}
	}
	return out
}

var tokenRe = regexp.MustCompile(`\s+|[^\s]+`)

// maxTokens bounds the O(n·m) LCS table. Rules are a few sentences; anything
// larger falls back to "everything removed, everything added".
const maxTokens = 1500

// words is a word-level LCS diff that keeps whitespace tokens, so joining the
// ops' text reproduces either side exactly.
func words(a, b string) []TextOp {
	x, y := tokenRe.FindAllString(a, -1), tokenRe.FindAllString(b, -1)
	if len(x) > maxTokens || len(y) > maxTokens {
		return merge([]TextOp{{"delete", a}, {"insert", b}})
	}
	n, m := len(x), len(y)
	lcs := make([][]int, n+1)
	for i := range lcs {
		lcs[i] = make([]int, m+1)
	}
	for i := n - 1; i >= 0; i-- {
		for j := m - 1; j >= 0; j-- {
			if x[i] == y[j] {
				lcs[i][j] = lcs[i+1][j+1] + 1
			} else {
				lcs[i][j] = max(lcs[i+1][j], lcs[i][j+1])
			}
		}
	}
	var ops []TextOp
	i, j := 0, 0
	for i < n && j < m {
		switch {
		case x[i] == y[j]:
			ops = append(ops, TextOp{"equal", x[i]})
			i++
			j++
		case lcs[i+1][j] >= lcs[i][j+1]:
			ops = append(ops, TextOp{"delete", x[i]})
			i++
		default:
			ops = append(ops, TextOp{"insert", y[j]})
			j++
		}
	}
	for ; i < n; i++ {
		ops = append(ops, TextOp{"delete", x[i]})
	}
	for ; j < m; j++ {
		ops = append(ops, TextOp{"insert", y[j]})
	}
	return merge(group(ops))
}

// group turns word-by-word churn ("also"→"read", " ", "them."→"and update")
// into one deleted phrase followed by one inserted phrase. A whitespace-only
// match between two changes is absorbed into both sides, so each side still
// reproduces exactly.
func group(ops []TextOp) []TextOp {
	isWS := func(s string) bool { return strings.TrimSpace(s) == "" }
	var out []TextOp
	for i := 0; i < len(ops); {
		if ops[i].Op == "equal" {
			out = append(out, ops[i])
			i++
			continue
		}
		var del, ins strings.Builder
		j := i
		for j < len(ops) {
			op := ops[j]
			if op.Op == "equal" {
				if !isWS(op.Text) || j+1 >= len(ops) || ops[j+1].Op == "equal" {
					break
				}
				del.WriteString(op.Text)
				ins.WriteString(op.Text)
			} else if op.Op == "delete" {
				del.WriteString(op.Text)
			} else {
				ins.WriteString(op.Text)
			}
			j++
		}
		out = append(out, TextOp{"delete", del.String()}, TextOp{"insert", ins.String()})
		i = j
	}
	return out
}

// merge joins adjacent ops of the same kind and drops empty ones.
func merge(ops []TextOp) []TextOp {
	out := []TextOp{}
	for _, op := range ops {
		if op.Text == "" {
			continue
		}
		if k := len(out) - 1; k >= 0 && out[k].Op == op.Op {
			out[k].Text += op.Text
			continue
		}
		out = append(out, op)
	}
	return out
}
