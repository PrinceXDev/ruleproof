package workbench

import "strings"

// Security requirement names refer to schemes without using $ref. Return true
// when any requirement cannot be mapped, preserving conservative full review.
func impactSecurityDependencies(root map[string]any, security any, dependencies map[string]string) bool {
	if security == nil {
		return false
	}

	requirements, valid := security.([]any)
	if !valid {
		return true
	}

	incomplete := false
	for _, requirement := range requirements {
		names, valid := requirement.(map[string]any)
		if !valid {
			incomplete = true
			continue
		}

		for name, scopes := range names {
			if _, valid := scopes.([]any); !valid {
				incomplete = true
			}
			ref := "#/components/securitySchemes/" + strings.ReplaceAll(strings.ReplaceAll(name, "~", "~0"), "/", "~1")
			target := impactReference(root, ref)
			dependencies[ref] = Hash(target)
			if target == nil {
				incomplete = true
			}
			for key, value := range impactDependencies(root, target) {
				dependencies[key] = value
			}
		}
	}
	return incomplete
}
