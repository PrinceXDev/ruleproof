package workbench

import (
	"bytes"
	"encoding/json"
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

func parseImpactSpec(raw []byte) (impactSpec, error) {
	ops, err := ParseSpec(raw)
	if err != nil {
		return impactSpec{}, err
	}
	doc := impactSpec{nodes: map[string]impactNode{}, paths: map[string][]string{}}
	decoder := json.NewDecoder(bytes.NewReader(raw))
	decoder.UseNumber()
	if err := decoder.Decode(&doc.root); err != nil {
		return doc, err
	}
	doc.unknown = impactUnknownSettings(doc.root)
	paths := doc.root["paths"].(map[string]any)
	for _, raw := range paths {
		if item, ok := raw.(map[string]any); ok {
			if _, referenced := item["$ref"]; referenced {
				doc.incomplete = true
			}
		}
	}
	for _, op := range ops {
		item := paths[op.Path].(map[string]any)
		definition := item[strings.ToLower(op.Method)].(map[string]any)
		node, incomplete := buildImpactNode(doc.root, item, definition)
		doc.nodes[op.Method+" "+op.Path] = node
		doc.paths[op.Method] = append(doc.paths[op.Method], op.Path)
		doc.incomplete = doc.incomplete || incomplete
	}
	return doc, nil
}

func impactUnknownSettings(root map[string]any) string {
	unknown := map[string]any{}
	for key, value := range root {
		switch key {
		case "paths", "components", "security", "servers", "info", "tags", "externalDocs":
		default:
			unknown[key] = value
		}
	}
	return Hash(unknown)
}

func buildImpactNode(root, item, definition map[string]any) (impactNode, bool) {
	metadata := map[string]any{}
	for key, value := range item {
		if !impactMethod(key) && key != "servers" {
			metadata[key] = value
		}
	}
	security, declared := inheritedImpactSetting("security", definition, root)
	servers, _ := inheritedImpactSetting("servers", definition, item, root)
	dependencies := impactDependencies(root, definition, metadata)
	incomplete := impactSecurityDependencies(root, security, dependencies) || (declared && security == nil)
	dynamic := unmodeledImpact(definition) || unmodeledImpact(metadata)
	for ref := range dependencies {
		if unmodeledImpact(impactReference(root, ref)) {
			dynamic = true
		}
	}
	return impactNode{
		signature:    Hash([]any{definition, metadata, security, servers}),
		dependencies: dependencies, dynamic: dynamic,
	}, incomplete
}

// Presence matters: explicit empty/null values must not inherit parent values.
func inheritedImpactSetting(key string, levels ...map[string]any) (any, bool) {
	for _, level := range levels {
		if value, present := level[key]; present {
			return value, true
		}
	}
	return nil, false
}

func impactMethod(key string) bool {
	switch key {
	case "get", "put", "post", "patch", "delete", "head", "options", "trace":
		return true
	}
	return false
}
