package workbench

import "ruleproof/internal/coverage"

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
					if len(op.Missing) < impactMissingExampleLimit {
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
