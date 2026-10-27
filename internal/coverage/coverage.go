// Package coverage maps an approved plan onto the target API's OpenAPI spec,
// so reviewers see which object-level endpoints their rule never mentions —
// the endpoint nobody wrote a rule for is where access bugs usually live.
package coverage

import (
	"encoding/json"
	"fmt"
	"sort"
	"strings"

	"ruleproof/internal/rules"
)

type Operation struct {
	Method      string `json:"method"`
	Path        string `json:"path"`
	OperationID string `json:"operationId,omitempty"`
	Summary     string `json:"summary,omitempty"`
	Action      string `json:"action"`
	Checks      int    `json:"checks"`
	Covered     bool   `json:"covered"`
	Snippet     string `json:"snippet,omitempty"`    // rule sentence that covers it
	Supported   bool   `json:"supported"`            // action is in the parser vocabulary
	Suggestion  string `json:"suggestion,omitempty"` // sentence that would cover it
}

type Report struct {
	SpecTitle  string      `json:"specTitle"`
	Operations []Operation `json:"operations"`
	Covered    int         `json:"covered"`
	Total      int         `json:"total"`
}

type spec struct {
	Info struct {
		Title string `json:"title"`
	} `json:"info"`
	Paths map[string]map[string]json.RawMessage `json:"paths"`
}

var methods = []string{"get", "put", "patch", "post", "delete"}

// Analyze lists every object-level operation (a path with a parameter) in
// specJSON and whether cases exercise it. Collection endpoints are skipped:
// they carry no object ID, so object-level authorization does not apply.
func Analyze(specJSON []byte, cases []rules.Case, ruleText string) (Report, error) {
	var s spec
	if err := json.Unmarshal(specJSON, &s); err != nil {
		return Report{}, fmt.Errorf("parse OpenAPI spec: %w", err)
	}

	paths := make([]string, 0, len(s.Paths))
	for p := range s.Paths {
		paths = append(paths, p)
	}
	sort.Strings(paths)

	r := Report{SpecTitle: s.Info.Title}
	for _, path := range paths {
		for _, m := range methods {
			raw, ok := s.Paths[path][m]
			if !ok {
				continue
			}
			var meta struct {
				OperationID string `json:"operationId"`
				Summary     string `json:"summary"`
			}
			_ = json.Unmarshal(raw, &meta)
			op := Operation{
				Method: strings.ToUpper(m), Path: path,
				OperationID: meta.OperationID, Summary: meta.Summary,
				Action: action(m, path),
			}
			for _, c := range cases {
				eligible := []string{}
				for _, candidate := range paths {
					if _, ok := s.Paths[candidate][strings.ToLower(c.Method)]; ok {
						eligible = append(eligible, candidate)
					}
				}
				if c.Method == op.Method && BestPath(eligible, rules.CasePath(c)) == path {
					op.Checks++
				}
			}
			op.Covered = op.Checks > 0
			op.Snippet, op.Supported = rules.ActionSnippet(ruleText, op.Action)
			if !op.Covered {
				op.Suggestion = suggestion(op.Action)
			}
			if op.Covered {
				r.Covered++
			}
			r.Operations = append(r.Operations, op)
		}
	}
	r.Total = len(r.Operations)
	return r, nil
}

// BestPath gives literal routes precedence over parameterized routes.
func BestPath(templates []string, path string) string {
	best, score := "", -1
	for _, template := range templates {
		if !MatchPath(template, path) {
			continue
		}
		literal := 0
		for _, part := range strings.Split(template, "/") {
			if !strings.HasPrefix(part, "{") {
				literal++
			}
		}
		if literal > score || (literal == score && template < best) {
			best, score = template, literal
		}
	}
	return best
}

// MatchPath compares complete segments, never action labels or substrings.
func MatchPath(template, path string) bool {
	path, _, _ = strings.Cut(path, "?")
	a, b := strings.Split(template, "/"), strings.Split(path, "/")
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if strings.HasPrefix(a[i], "{") && strings.HasSuffix(a[i], "}") && b[i] != "" {
			continue
		}
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

// action names what an operation does: a literal segment after the object ID
// ("/assets/{id}/export" → export), otherwise the HTTP method's usual verb.
func action(method, path string) string {
	segs := strings.Split(strings.Trim(path, "/"), "/")
	if last := segs[len(segs)-1]; !strings.Contains(last, "{") {
		return strings.ToLower(last)
	}
	switch method {
	case "get":
		return "read"
	case "put", "patch":
		return "update"
	case "delete":
		return "delete"
	default:
		return "create"
	}
}

func suggestion(action string) string {
	if action == "export" {
		return "Both roles can export assets in their own tenant. Neither role can export another tenant's assets."
	}
	return "Neither role can " + action + " another tenant's assets."
}
