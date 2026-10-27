//go:build ignore

// Refresh only the repository's synthetic examples after hash format changes.
package main

import (
	"encoding/json"
	"fmt"
	"os"
	"ruleproof/internal/assets"
	"ruleproof/internal/rules"
	"ruleproof/internal/store"
	"ruleproof/internal/workbench"
)

func main() {
	for _, path := range []string{"examples/tenant-isolation.bundle.json", "examples/tenant-isolation-export.bundle.json"} {
		raw, err := os.ReadFile(path)
		must(err)
		var bundle map[string]json.RawMessage
		must(json.Unmarshal(raw, &bundle))
		var plan map[string]json.RawMessage
		must(json.Unmarshal(bundle["plan"], &plan))
		var cases []rules.Case
		must(json.Unmarshal(plan["cases"], &cases))
		plan["hash"], err = json.Marshal(rules.Hash(cases))
		must(err)
		bundle["plan"], err = json.Marshal(plan)
		must(err)
		raw, err = json.MarshalIndent(bundle, "", "  ")
		must(err)
		must(os.WriteFile(path, append(raw, '\n'), 0600))
	}
	suite := workbench.Sample(assets.OpenAPISpec)
	content, err := json.Marshal(suite)
	must(err)
	revision := store.Revision{ID: "synthetic-reviewed-example", Content: content, Hash: workbench.Hash(suite), Author: "Demo author", ApprovedBy: "Demo reviewer", CreatedAt: "2026-10-26T00:00:00Z"}
	raw, err := json.MarshalIndent(map[string]any{"revision": revision}, "", "  ")
	must(err)
	must(os.WriteFile("examples/workbench.bundle.json", append(raw, '\n'), 0600))
}
func must(err error) {
	if err != nil {
		panic(fmt.Sprintf("refresh examples: %v", err))
	}
}
