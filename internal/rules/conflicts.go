package rules

import (
	"regexp"
	"strings"
)

func hasAction(text string, words ...string) bool {
	for _, word := range words {
		if regexp.MustCompile(`\b` + regexp.QuoteMeta(word) + `(?:s|ing|ed)?\b`).MatchString(text) {
			return true
		}
	}
	return false
}

type Conflict struct {
	Role      string   `json:"role"`
	Action    string   `json:"action"`
	Scope     string   `json:"scope"`
	Sentences []string `json:"sentences"`
}

// Conflicts detects explicit contradictory statements within the bounded demo
// vocabulary. It is deliberately not a general natural-language policy solver.
func Conflicts(text string) []Conflict {
	type claim struct{ allow, deny string }

	claims := map[string]claim{}
	result := []Conflict{}

	for _, role := range []string{"editor", "viewer"} {
		for _, action := range []string{"read", "update", "export"} {
			for _, sentence := range splitSentences(strings.ToLower(text)) {
				s := strings.TrimSpace(sentence)
				if !containsAny(s, role, "both roles", "neither role", "everyone", "nobody") || !hasAction(s, actionWords[action]...) {
					continue
				}
				denied := containsAny(s, "cannot", "can't", "may not", "must not", "neither", "nobody", "not "+action)
				granted := containsAny(s, "can ", "may ", "allowed to") && !denied
				if !denied && !granted {
					continue
				}
				scope := "own"
				if containsAny(s, "another", "other tenant", "cross-tenant") {
					scope = "other"
				}
				key := role + "|" + action + "|" + scope
				c := claims[key]
				if denied {
					c.deny = s
				} else {
					c.allow = s
				}
				claims[key] = c
			}
			for _, scope := range []string{"own", "other"} {
				c := claims[role+"|"+action+"|"+scope]
				if c.allow != "" && c.deny != "" {
					result = append(result, Conflict{role, action, scope, []string{c.allow, c.deny}})
				}
			}
		}
	}
	return result
}
