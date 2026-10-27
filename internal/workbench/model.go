// Package workbench implements reviewed, portable API authorization suites.
package workbench

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	"ruleproof/internal/check"
	"ruleproof/internal/coverage"
	"ruleproof/internal/rules"
)

type Identity struct {
	ID         string `json:"id"`
	Label      string `json:"label"`
	Role       string `json:"role"`
	Tenant     string `json:"tenant"`
	Credential string `json:"credential,omitempty"`
}
type Case struct {
	ID             string            `json:"id"`
	IdentityID     string            `json:"identityId"`
	Scope          string            `json:"scope"`
	Method         string            `json:"method"`
	Path           string            `json:"path"`
	ExpectedStatus int               `json:"expectedStatus"`
	Body           string            `json:"body,omitempty"`
	Assertions     []check.Assertion `json:"assertions,omitempty"`
	State          *check.StateCheck `json:"state,omitempty"`
	Scenario       string            `json:"scenario,omitempty"`
}
type Suite struct {
	Name        string            `json:"name"`
	RuleText    string            `json:"ruleText"`
	Environment string            `json:"environment"`
	Identities  []Identity        `json:"identities"`
	Cases       []Case            `json:"cases"`
	Spec        json.RawMessage   `json:"spec"`
	Exclusions  map[string]string `json:"exclusions,omitempty"`
	BuildCommit string            `json:"buildCommit,omitempty"`
	DataVersion string            `json:"dataVersion,omitempty"`
}
type Operation struct {
	Method       string   `json:"method"`
	Path         string   `json:"path"`
	Summary      string   `json:"summary"`
	Fingerprint  string   `json:"fingerprint"`
	Checks       int      `json:"checks"`
	Combinations []string `json:"combinations"`
	Missing      []string `json:"missing"`
	Exclusion    string   `json:"exclusion,omitempty"`
}
type Analysis struct {
	ValidationError string      `json:"validationError,omitempty"`
	Operations      []Operation `json:"operations"`
	Conflicts       []string    `json:"conflicts"`
	Gaps            int         `json:"gaps"`
	Covered         int         `json:"covered"`
	SpecHash        string      `json:"specHash"`
}

var identifier = regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,79}$`)

func Hash(v any) string {
	b, _ := json.Marshal(v)
	var normalized any
	decoder := json.NewDecoder(bytes.NewReader(b))
	decoder.UseNumber()
	if decoder.Decode(&normalized) == nil {
		b, _ = json.Marshal(normalized)
	}
	h := sha256.Sum256(b)
	return hex.EncodeToString(h[:])
}

func Validate(s Suite) error {
	if strings.TrimSpace(s.Name) == "" || len(s.Name) > 120 || len(s.RuleText) > 16000 {
		return fmt.Errorf("provide a suite name (up to 120 characters) and a rule of at most 16,000 characters")
	}
	if !identifier.MatchString(s.Environment) {
		return fmt.Errorf("select a configured environment")
	}
	if len(s.Identities) == 0 || len(s.Identities) > 32 || len(s.Cases) == 0 || len(s.Cases) > 256 {
		return fmt.Errorf("a suite needs 1–32 identities and 1–256 checks")
	}
	identities := map[string]bool{}
	for _, id := range s.Identities {
		if !identifier.MatchString(id.ID) || identities[id.ID] || strings.TrimSpace(id.Label) == "" || len(id.Label) > 120 {
			return fmt.Errorf("identity IDs must be unique identifiers with a label")
		}
		if id.Credential != "" && !identifier.MatchString(id.Credential) {
			return fmt.Errorf("invalid credential reference")
		}
		identities[id.ID] = true
	}
	seen := map[string]bool{}
	for _, c := range s.Cases {
		if !identifier.MatchString(c.ID) || seen[c.ID] || !identities[c.IdentityID] {
			return fmt.Errorf("check IDs must be unique and reference an existing identity")
		}
		seen[c.ID] = true
		if len(c.Scope) == 0 || len(c.Scope) > 80 || len(c.Scenario) > 80 {
			return fmt.Errorf("checks require a scope; scope and scenario labels are limited to 80 characters")
		}
		if err := check.Validate(c.Request()); err != nil {
			return fmt.Errorf("check %s: %w", c.ID, err)
		}
		if c.State != nil && !identities[c.State.IdentityID] {
			return fmt.Errorf("check %s: select an observer identity", c.ID)
		}
	}
	_, err := Analyze(s)
	return err
}

func (c Case) Request() check.Case {
	return check.Case{ID: c.ID, Actor: c.IdentityID, Method: c.Method, Path: c.Path, Want: c.ExpectedStatus, RequestBody: c.Body, Assertions: c.Assertions, State: c.State}
}

func Analyze(s Suite) (Analysis, error) {
	ops, err := ParseSpec(s.Spec)
	if err != nil {
		return Analysis{}, err
	}
	a := Analysis{Operations: ops, Conflicts: []string{}, SpecHash: Hash(json.RawMessage(s.Spec))}
	for _, conflict := range rules.Conflicts(s.RuleText) {
		a.Conflicts = append(a.Conflicts, fmt.Sprintf("%s / %s / %s: %s", conflict.Role, conflict.Action, conflict.Scope, strings.Join(conflict.Sentences, " ↔ ")))
	}
	expectations := map[string]int{}
	scopes := []string{"own", "other"}
	for _, c := range s.Cases {
		if c.Scenario != "" {
			continue
		} // ordered steps may intentionally change permission
		key := c.IdentityID + "|" + c.Method + "|" + c.Path + "|" + c.Body
		if want, ok := expectations[key]; ok && want != c.ExpectedStatus {
			a.Conflicts = append(a.Conflicts, "Contradictory expectations for "+c.IdentityID+" "+c.Method+" "+c.Path)
		}
		expectations[key] = c.ExpectedStatus
		if !contains(scopes, c.Scope) {
			scopes = append(scopes, c.Scope)
		}
	}
	if len(scopes) == 0 {
		scopes = []string{"own", "other"}
	}
	known := map[string]bool{}
	pathsByMethod := map[string][]string{}
	for _, op := range ops {
		pathsByMethod[op.Method] = append(pathsByMethod[op.Method], op.Path)
	}
	for i := range a.Operations {
		op := &a.Operations[i]
		key := op.Method + " " + op.Path
		known[key] = true
		op.Exclusion = s.Exclusions[key]
		for _, c := range s.Cases {
			if c.Method == op.Method && coverage.BestPath(pathsByMethod[c.Method], c.Path) == op.Path {
				op.Checks++
				combo := c.IdentityID + " · " + c.Scope
				if !contains(op.Combinations, combo) {
					op.Combinations = append(op.Combinations, combo)
				}
			}
		}
		for _, id := range s.Identities {
			for _, scope := range scopes {
				combo := id.ID + " · " + scope
				if !contains(op.Combinations, combo) {
					op.Missing = append(op.Missing, combo)
				}
			}
		}
		if op.Checks > 0 {
			a.Covered++
		} else if strings.TrimSpace(op.Exclusion) == "" {
			a.Gaps++
		}
	}
	for key, reason := range s.Exclusions {
		if !known[key] || len(strings.TrimSpace(reason)) < 8 {
			return a, fmt.Errorf("exclusion %q must name an operation and explain why (at least 8 characters)", key)
		}
	}
	for _, c := range s.Cases {
		if strings.ContainsAny(c.Path, "{}") {
			return a, fmt.Errorf("check %s needs a concrete resource path", c.ID)
		}
		if c.State != nil && coverage.BestPath(pathsByMethod["GET"], c.State.Path) == "" {
			return a, fmt.Errorf("check %s observer must match a GET operation", c.ID)
		}
		matched := false
		for _, op := range ops {
			if op.Method == c.Method && coverage.MatchPath(op.Path, c.Path) {
				matched = true
				break
			}
		}
		if !matched {
			return a, fmt.Errorf("check %s does not match an imported operation", c.ID)
		}
	}
	return a, nil
}
func contains(xs []string, x string) bool {
	for _, v := range xs {
		if v == x {
			return true
		}
	}
	return false
}
