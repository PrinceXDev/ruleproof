package workbench

import (
	"bytes"
	"encoding/json"
	"sort"
	"strings"
)

type impactNode struct {
	signature    string
	dependencies map[string]string
	dynamic      bool
}
type impactSpec struct {
	root       map[string]any
	nodes      map[string]impactNode
	paths      map[string][]string
	unknown    string
	incomplete bool
}

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

func parseImpactSpec(raw []byte) (impactSpec, error) {
	ops, err := ParseSpec(raw)
	if err != nil {
		return impactSpec{}, err
	}
	d := impactSpec{nodes: map[string]impactNode{}, paths: map[string][]string{}}
	decoder := json.NewDecoder(bytes.NewReader(raw))
	decoder.UseNumber()
	if err := decoder.Decode(&d.root); err != nil {
		return d, err
	}
	unknown := map[string]any{}
	for key, value := range d.root {
		switch key {
		case "paths", "components", "security", "servers", "info", "tags", "externalDocs":
		default:
			unknown[key] = value
		}
	}
	d.unknown = Hash(unknown)
	paths := d.root["paths"].(map[string]any)
	for _, raw := range paths {
		if item, ok := raw.(map[string]any); ok {
			if _, ref := item["$ref"]; ref {
				d.incomplete = true
			}
		}
	}
	for _, op := range ops {
		item := paths[op.Path].(map[string]any)
		definition := item[strings.ToLower(op.Method)].(map[string]any)
		metadata := map[string]any{}
		for key, value := range item {
			if !impactMethod(key) && key != "servers" {
				metadata[key] = value
			}
		}
		security, explicit := definition["security"]
		if explicit && security == nil {
			d.incomplete = true
		}
		if !explicit {
			security = d.root["security"]
			if value, present := d.root["security"]; present && value == nil {
				d.incomplete = true
			}
		}
		servers, explicit := definition["servers"]
		if !explicit {
			servers, explicit = item["servers"]
			if !explicit {
				servers = d.root["servers"]
			}
		}
		deps := impactDependencies(d.root, definition, metadata)
		// Security requirement names refer to schemes without using $ref.
		if requirements, ok := security.([]any); ok {
			for _, requirement := range requirements {
				if names, ok := requirement.(map[string]any); ok {
					for name, scopes := range names {
						if _, ok := scopes.([]any); !ok {
							d.incomplete = true
						}
						ref := "#/components/securitySchemes/" + strings.ReplaceAll(strings.ReplaceAll(name, "~", "~0"), "/", "~1")
						target := impactReference(d.root, ref)
						deps[ref] = Hash(target)
						if target == nil {
							d.incomplete = true
						}
						for key, value := range impactDependencies(d.root, target) {
							deps[key] = value
						}
					}
				} else {
					d.incomplete = true
				}
			}
		}
		if security != nil {
			if _, ok := security.([]any); !ok {
				d.incomplete = true
			}
		}
		dynamic := unmodeledImpact(definition) || unmodeledImpact(metadata)
		for ref := range deps {
			if unmodeledImpact(impactReference(d.root, ref)) {
				dynamic = true
			}
		}
		d.nodes[op.Method+" "+op.Path] = impactNode{signature: Hash([]any{definition, metadata, security, servers}), dependencies: deps, dynamic: dynamic}
		d.paths[op.Method] = append(d.paths[op.Method], op.Path)
	}
	return d, nil
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

func impactMethod(key string) bool {
	switch key {
	case "get", "put", "post", "patch", "delete", "head", "options", "trace":
		return true
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
