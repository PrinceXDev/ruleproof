package workbench

import (
	"encoding/json"
	"fmt"
	"sort"
	"strings"
)

// ParseSpec accepts OpenAPI 3 JSON and hashes both operation definitions and
// shared components. A component change conservatively flags every operation.
// Remote refs are rejected; this importer never fetches URLs from a document.
func ParseSpec(raw []byte) ([]Operation, error) {
	if len(raw) > 512*1024 {
		return nil, fmt.Errorf("OpenAPI document exceeds 512 KiB")
	}
	var s struct {
		OpenAPI    string                                `json:"openapi"`
		Paths      map[string]map[string]json.RawMessage `json:"paths"`
		Components json.RawMessage                       `json:"components"`
		Security   json.RawMessage                       `json:"security"`
	}
	if err := json.Unmarshal(raw, &s); err != nil || !strings.HasPrefix(s.OpenAPI, "3.") || len(s.Paths) == 0 {
		return nil, fmt.Errorf("import an OpenAPI 3 JSON document with paths")
	}
	var root any
	_ = json.Unmarshal(raw, &root)
	var inspect func(any) error
	inspect = func(v any) error {
		switch n := v.(type) {
		case map[string]any:
			for k, x := range n {
				if k == "$ref" {
					ref, ok := x.(string)
					if !ok || !strings.HasPrefix(ref, "#/components/") {
						return fmt.Errorf("only local #/components/ references are supported")
					}
					var target any = root
					for _, part := range strings.Split(strings.TrimPrefix(ref, "#/"), "/") {
						part = strings.ReplaceAll(strings.ReplaceAll(part, "~1", "/"), "~0", "~")
						object, ok := target.(map[string]any)
						if !ok {
							return fmt.Errorf("unresolved local reference %s", ref)
						}
						target, ok = object[part]
						if !ok {
							return fmt.Errorf("unresolved local reference %s", ref)
						}
					}
				}
				if err := inspect(x); err != nil {
					return err
				}
			}
		case []any:
			for _, x := range n {
				if err := inspect(x); err != nil {
					return err
				}
			}
		}
		return nil
	}
	if err := inspect(root); err != nil {
		return nil, err
	}
	ops := []Operation{}
	templates := map[string]bool{}
	for path, items := range s.Paths {
		if !strings.HasPrefix(path, "/") || strings.ContainsAny(path, "?#\\") {
			return nil, fmt.Errorf("invalid OpenAPI path")
		}
		parts := strings.Split(path, "/")
		for i, part := range parts {
			if strings.HasPrefix(part, "{") && strings.HasSuffix(part, "}") {
				parts[i] = "{}"
			}
		}
		normalized := strings.Join(parts, "/")
		if templates[normalized] {
			return nil, fmt.Errorf("ambiguous OpenAPI path templates")
		}
		templates[normalized] = true
		for _, method := range []string{"get", "post", "put", "patch", "delete", "head", "options", "trace"} {
			def, ok := items[method]
			if !ok {
				continue
			}
			var meta struct {
				Summary string `json:"summary"`
			}
			if err := json.Unmarshal(def, &meta); err != nil || string(def) == "null" {
				return nil, fmt.Errorf("invalid operation %s %s", method, path)
			}
			ops = append(ops, Operation{Method: strings.ToUpper(method), Path: path, Summary: meta.Summary, Fingerprint: Hash([]json.RawMessage{def, items["parameters"], s.Components, s.Security}), Combinations: []string{}, Missing: []string{}})
		}
	}
	if len(ops) == 0 || len(ops) > 1000 {
		return nil, fmt.Errorf("spec must contain 1–1,000 operations")
	}
	sort.Slice(ops, func(i, j int) bool { return ops[i].Path+ops[i].Method < ops[j].Path+ops[j].Method })
	return ops, nil
}

type Drift struct {
	Added   []string `json:"added"`
	Changed []string `json:"changed"`
	Removed []string `json:"removed"`
}

func CompareSpecs(before, after []byte) (Drift, error) {
	d := Drift{Added: []string{}, Changed: []string{}, Removed: []string{}}
	b, err := ParseSpec(before)
	if err != nil {
		return d, err
	}
	a, err := ParseSpec(after)
	if err != nil {
		return d, err
	}
	previous := map[string]string{}
	for _, op := range b {
		previous[op.Method+" "+op.Path] = op.Fingerprint
	}
	for _, op := range a {
		key := op.Method + " " + op.Path
		if old, ok := previous[key]; !ok {
			d.Added = append(d.Added, key)
		} else if old != op.Fingerprint {
			d.Changed = append(d.Changed, key)
		}
		delete(previous, key)
	}
	for key := range previous {
		d.Removed = append(d.Removed, key)
	}
	sort.Strings(d.Removed)
	return d, nil
}
