package workbench

import "sort"

const impactDependencyExampleLimit = 8
const impactMissingExampleLimit = 32

func impactOperationKeys(before, after impactSpec) []string {
	keys := map[string]bool{}
	for key := range before.nodes {
		keys[key] = true
	}
	for key := range after.nodes {
		keys[key] = true
	}
	ordered := make([]string, 0, len(keys))
	for key := range keys {
		ordered = append(ordered, key)
	}
	sort.Strings(ordered)
	return ordered
}

func compareImpactOperation(key string, before, after impactSpec, broader bool) ImpactOperation {
	previous, existed := before.nodes[key]
	current, exists := after.nodes[key]
	op := ImpactOperation{
		Operation: key, Change: "unchanged", Certainty: "unaffected",
		Reasons: []string{}, CheckIDs: []string{}, Missing: []string{},
	}
	switch {
	case !existed:
		op.Change = "added"
		op.Reasons = append(op.Reasons, "New API operation requires explicit permission expectations.")
	case !exists:
		op.Change = "removed"
		op.Reasons = append(op.Reasons, "Removed API operation; review obsolete checks and exclusions.")
	default:
		op.Reasons = impactOperationChanges(previous, current)
		if len(op.Reasons) > 0 {
			op.Change = "changed"
		}
	}
	if op.Change != "unchanged" {
		op.Certainty = "affected"
	}
	if broader || (op.Change != "unchanged" && (previous.dynamic || current.dynamic)) {
		op.Certainty = "uncertain"
		op.Reasons = append(op.Reasons, "Static request mapping is incomplete; include the full suite in review.")
	}
	if len(op.Reasons) == 0 {
		op.Reasons = append(op.Reasons, "No specification dependency changed; runtime behavior remains unverified.")
	}
	return op
}

func impactOperationChanges(previous, current impactNode) []string {
	reasons := []string{}
	if previous.signature != current.signature {
		reasons = append(reasons, "Operation definition, path settings, or inherited security/servers changed.")
	}
	for index, ref := range dependencyChanges(previous.dependencies, current.dependencies) {
		if index >= impactDependencyExampleLimit {
			reasons = append(reasons, "Additional referenced dependencies changed; review the complete component diff.")
			break
		}
		reasons = append(reasons, "Referenced dependency changed: "+ref)
	}
	return reasons
}
