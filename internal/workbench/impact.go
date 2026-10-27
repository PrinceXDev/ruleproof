package workbench

import (
	"encoding/json"
	"sort"
	"strings"

	"ruleproof/internal/coverage"
)

type ImpactOperation struct {
	Operation    string   `json:"operation"`
	Change       string   `json:"change"`
	Certainty    string   `json:"certainty"`
	Reasons      []string `json:"reasons"`
	CheckIDs     []string `json:"checkIds"`
	Missing      []string `json:"missing"`
	MissingCount int      `json:"missingCount"`
	Exclusion    string   `json:"exclusion,omitempty"`
}
type ImpactCheck struct {
	ID            string   `json:"id"`
	Identity      Identity `json:"identity"`
	Scope         string   `json:"scope"`
	Scenario      string   `json:"scenario,omitempty"`
	Assertions    int      `json:"assertions"`
	ObservesState bool     `json:"observesState"`
	Reasons       []string `json:"reasons"`
}
type ImpactReport struct {
	SuiteHash         string            `json:"suiteHash"`
	BeforeSpecHash    string            `json:"beforeSpecHash"`
	AfterSpecHash     string            `json:"afterSpecHash"`
	RequiresFullRun   bool              `json:"requiresFullRun"`
	Operations        []ImpactOperation `json:"operations"`
	Recommended       []ImpactCheck     `json:"recommended"`
	UnchangedCheckIDs []string          `json:"unchangedCheckIds"`
	OrphanedCheckIDs  []string          `json:"orphanedCheckIds"`
	Warnings          []string          `json:"warnings"`
}

// AnalyzeImpact is advisory and performs no HTTP requests. The saved suite stays
// immutable. Missing static dependencies never establish runtime authorization.
func AnalyzeImpact(s Suite, candidate []byte) (ImpactReport, error) {
	r := ImpactReport{SuiteHash: Hash(s), BeforeSpecHash: Hash(s.Spec), AfterSpecHash: Hash(json.RawMessage(candidate)), Operations: []ImpactOperation{}, Recommended: []ImpactCheck{}, UnchangedCheckIDs: []string{}, OrphanedCheckIDs: []string{}, Warnings: []string{"Specification analysis cannot detect implementation-only permission changes. Review and run the complete suite before release."}}
	if err := Validate(s); err != nil {
		return r, err
	}
	before, err := parseImpactSpec(s.Spec)
	if err != nil {
		return r, err
	}
	after, err := parseImpactSpec(candidate)
	if err != nil {
		return r, err
	}
	keys := map[string]bool{}
	for key := range before.nodes {
		keys[key] = true
	}
	for key := range after.nodes {
		keys[key] = true
	}
	ordered := []string{}
	for key := range keys {
		ordered = append(ordered, key)
	}
	sort.Strings(ordered)
	broader := before.unknown != after.unknown || before.incomplete || after.incomplete
	if broader {
		r.RequiresFullRun = true
		r.Warnings = append(r.Warnings, "Unclassified settings changed or static mappings are incomplete. Review all checks and any endpoints outside the imported paths.")
	}
	byKey := impactCoverage(s, after)
	for _, key := range ordered {
		old, existed := before.nodes[key]
		next, exists := after.nodes[key]
		op := ImpactOperation{Operation: key, Change: "unchanged", Certainty: "unaffected", Reasons: []string{}, CheckIDs: []string{}, Missing: []string{}}
		switch {
		case !existed:
			op.Change = "added"
			op.Reasons = append(op.Reasons, "New API operation requires explicit permission expectations.")
		case !exists:
			op.Change = "removed"
			op.Exclusion = s.Exclusions[key]
			op.Reasons = append(op.Reasons, "Removed API operation; review obsolete checks and exclusions.")
		default:
			if old.signature != next.signature {
				op.Change = "changed"
				op.Reasons = append(op.Reasons, "Operation definition, path settings, or inherited security/servers changed.")
			}
			changes := dependencyChanges(old.dependencies, next.dependencies)
			for i, ref := range changes {
				if i >= 8 {
					op.Reasons = append(op.Reasons, "Additional referenced dependencies changed; review the complete component diff.")
					break
				}
				op.Change = "changed"
				op.Reasons = append(op.Reasons, "Referenced dependency changed: "+ref)
			}
		}
		if op.Change != "unchanged" {
			op.Certainty = "affected"
		}
		if broader || (op.Change != "unchanged" && (old.dynamic || next.dynamic)) {
			op.Certainty = "uncertain"
			r.RequiresFullRun = true
			op.Reasons = append(op.Reasons, "Static request mapping is incomplete; include the full suite in review.")
		}
		if candidateOp, ok := byKey[key]; ok {
			op.Missing = candidateOp.Missing
			op.MissingCount = candidateOp.MissingCount
			op.Exclusion = s.Exclusions[key]
		}
		if len(op.Reasons) == 0 {
			op.Reasons = append(op.Reasons, "No specification dependency changed; runtime behavior remains unverified.")
		}
		r.Operations = append(r.Operations, op)
	}
	mapImpactChecks(&r, s, before, after)
	if len(r.OrphanedCheckIDs) > 0 {
		r.Warnings = append(r.Warnings, "Some saved requests or state observers no longer match the candidate. Repair the flagged routes before approving a new revision.")
	}
	return r, nil
}

// Count the complete identity × scope matrix but materialize only 32 examples
// per operation. Large contracts cannot expand the response into millions of
// duplicated missing-combination strings.
func impactCoverage(s Suite, doc impactSpec) map[string]ImpactOperation {
	scopes := []string{"own", "other"}
	combos := map[string]map[string]bool{}
	for _, c := range s.Cases {
		if !contains(scopes, c.Scope) {
			scopes = append(scopes, c.Scope)
		}
		key := impactRoute(doc, c.Method, c.Path)
		if combos[key] == nil {
			combos[key] = map[string]bool{}
		}
		combos[key][c.IdentityID+" · "+c.Scope] = true
	}
	result := map[string]ImpactOperation{}
	for key := range doc.nodes {
		op := ImpactOperation{Missing: []string{}}
		for _, id := range s.Identities {
			for _, scope := range scopes {
				combo := id.ID + " · " + scope
				if !combos[key][combo] {
					op.MissingCount++
					if len(op.Missing) < 32 {
						op.Missing = append(op.Missing, combo)
					}
				}
			}
		}
		result[key] = op
	}
	return result
}

func impactRoute(spec impactSpec, method, path string) string {
	matched := coverage.BestPath(spec.paths[method], path)
	if matched == "" {
		return ""
	}
	return method + " " + matched
}

func appendImpactReason(reasons []string, reason string) []string {
	if !contains(reasons, reason) {
		return append(reasons, reason)
	}
	return reasons
}

func mapImpactChecks(r *ImpactReport, s Suite, before, after impactSpec) {
	indices := map[string]int{}

	for i, op := range r.Operations {
		indices[op.Operation] = i
	}

	reasons := map[string][]string{}
	scenarios := map[string]bool{}

	for _, c := range s.Cases {
		old, next := impactRoute(before, c.Method, c.Path), impactRoute(after, c.Method, c.Path)
		routes := []string{old, next}
		if next == "" {
			r.OrphanedCheckIDs = append(r.OrphanedCheckIDs, c.ID)
		}
		if old != next {
			reasons[c.ID] = append(reasons[c.ID], "Request route mapping changed; review this check's expectations.")
		}
		if c.State != nil {
			observerBefore, observerAfter := impactRoute(before, "GET", c.State.Path), impactRoute(after, "GET", c.State.Path)
			routes = append(routes, observerBefore, observerAfter)
			if observerBefore != observerAfter {
				reasons[c.ID] = append(reasons[c.ID], "State observer route changed; review the protected-state assertion.")
			}
			if observerAfter == "" && !contains(r.OrphanedCheckIDs, c.ID) {
				r.OrphanedCheckIDs = append(r.OrphanedCheckIDs, c.ID)
			}
		}

		for _, route := range routes {
			if route == "" {
				continue
			}
			op := &r.Operations[indices[route]]
			op.CheckIDs = appendImpactReason(op.CheckIDs, c.ID)
			if op.Certainty != "unaffected" {
				reasons[c.ID] = appendImpactReason(reasons[c.ID], "Depends on "+route+" ("+op.Certainty+").")
			}
		}
		if r.RequiresFullRun {
			reasons[c.ID] = appendImpactReason(reasons[c.ID], "Include in full-suite review because static analysis is uncertain.")
		}
		if len(reasons[c.ID]) > 0 && c.Scenario != "" {
			scenarios[c.Scenario] = true
		}
	}

	identities := map[string]Identity{}

	for _, id := range s.Identities {
		id.Credential = ""
		identities[id.ID] = id
	}

	for _, c := range s.Cases {
		if scenarios[c.Scenario] && c.Scenario != "" {
			reasons[c.ID] = appendImpactReason(reasons[c.ID], "Keep every step in ordered scenario: "+c.Scenario)
		}
		if len(reasons[c.ID]) == 0 {
			r.UnchangedCheckIDs = append(r.UnchangedCheckIDs, c.ID)
			continue
		}
		r.Recommended = append(r.Recommended, ImpactCheck{ID: c.ID, Identity: identities[c.IdentityID], Scope: c.Scope, Scenario: c.Scenario, Assertions: len(c.Assertions), ObservesState: c.State != nil, Reasons: reasons[c.ID]})
	}

	for _, op := range r.Operations {
		if op.Certainty != "unaffected" && strings.TrimSpace(op.Exclusion) != "" {
			r.Warnings = append(r.Warnings, "Re-review exclusion for "+op.Operation+": "+op.Exclusion)
		}
	}
}
