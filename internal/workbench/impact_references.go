package workbench

import (
	"sort"
	"strings"
)

// Reference expansion uses a visited set, so recursive schemas terminate. Each
// reachable component is fingerprinted independently, including transitive refs.
func impactDependencies(root map[string]any, values ...any) map[string]string {
	result := map[string]string{}
	queue := append([]any{}, values...)
	for len(queue) > 0 {
		value := queue[len(queue)-1]
		queue = queue[:len(queue)-1]
		switch node := value.(type) {
		case map[string]any:
			for key, child := range node {
				if key == "$ref" {
					ref, _ := child.(string)
					if _, visited := result[ref]; !visited {
						target := impactReference(root, ref)
						result[ref] = Hash(target)
						queue = append(queue, target)
					}
				}
				queue = append(queue, child)
			}
		case []any:
			queue = append(queue, node...)
		}
	}
	return result
}

func impactReference(root map[string]any, ref string) any {
	var target any = root
	for _, part := range strings.Split(strings.TrimPrefix(ref, "#/"), "/") {
		object, ok := target.(map[string]any)
		if !ok {
			return nil
		}
		target = object[strings.ReplaceAll(strings.ReplaceAll(part, "~1", "/"), "~0", "~")]
	}
	return target
}

// Callback/link destinations and dynamic JSON Schema references cannot be
// mapped reliably to this suite's concrete request paths.
func unmodeledImpact(value any) bool {
	queue := []any{value}
	for len(queue) > 0 {
		next := queue[len(queue)-1]
		queue = queue[:len(queue)-1]
		switch node := next.(type) {
		case map[string]any:
			for key, child := range node {
				switch key {
				case "callbacks", "links", "$dynamicRef", "$recursiveRef", "$id":
					return true
				}
				queue = append(queue, child)
			}
		case []any:
			queue = append(queue, node...)
		}
	}
	return false
}

func dependencyChanges(before, after map[string]string) []string {
	keys := map[string]bool{}
	for key := range before {
		keys[key] = true
	}
	for key := range after {
		keys[key] = true
	}
	changed := []string{}
	for key := range keys {
		if before[key] != after[key] {
			changed = append(changed, key)
		}
	}
	sort.Strings(changed)
	return changed
}
