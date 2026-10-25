// Package rules turns a reviewed natural-language access rule into a bounded,
// explicit test plan. It never invents identities, endpoints, or operators
// outside the fixed vocabulary below, and it surfaces its assumptions instead
// of silently guessing — the human approves the plan before anything runs.
package rules

import "strings"

type Identity struct {
	ID     string `json:"id"`
	Label  string `json:"label"`
	Tenant string `json:"tenant"`
	Role   string `json:"role"`
	Token  string `json:"-"`
}

// Case is one reviewable row of the permission matrix. Want/WantLabel are a
// neutral *policy* expectation ("allow"/"deny") — never conflated with a
// run's pass/fail/error *result*, which lives in check.Result.
type Case struct {
	ID         string `json:"id"`
	Actor      string `json:"actor"`
	Role       string `json:"role"`   // "viewer" | "editor"
	Action     string `json:"action"` // "read" | "update"
	Method     string `json:"method"`
	Scope      string `json:"scope"` // "own" | "other" tenant
	AssetID    string `json:"assetId"`
	AssetOwner string `json:"assetOwner"`
	Want       int    `json:"expectedStatus"`
	WantLabel  string `json:"expectedLabel"` // "allow" | "deny"
	Token      string `json:"-"`
}

// Concept is one extracted piece of policy shown back to the reviewer with a
// pointer into the source text it came from, so nothing is invented silently.
type Concept struct {
	Label   string `json:"label"`
	Value   string `json:"value"`
	Snippet string `json:"snippet,omitempty"` // the phrase in ruleText this was read from, if any
}

type Plan struct {
	RuleText    string    `json:"ruleText"`
	Cases       []Case    `json:"cases"`
	Assumptions []string  `json:"assumptions"`
	Concepts    []Concept `json:"concepts"`
}

var fixedIdentities = []Identity{
	{ID: "editor-a", Label: "Editor · tenant A", Tenant: "A", Role: "editor", Token: "demo-editor-a"},
	{ID: "viewer-a", Label: "Viewer · tenant A", Tenant: "A", Role: "viewer", Token: "demo-viewer-a"},
}

var fixedAssets = []struct{ ID, Owner string }{
	{"a1", "A"},
	{"b1", "B"},
}

// scope classifies what a rule states about one role's update permission,
// scanning sentence-by-sentence so two unrelated clauses (e.g. "viewers can
// read..." and "...editors can update...") are never conflated just because
// both words appear somewhere in the text.
type scope int

const (
	scopeUnknown scope = iota // role never mentioned, or mentioned with no action verb at all
	scopeGranted              // role explicitly tied to an update/edit/write verb, un-negated
	scopeDenied               // role's sentence closes its own scope: either negated, or states only read
)

func updateScope(sentences []string, role string) scope {
	mentioned := false
	for _, s := range sentences {
		if !strings.Contains(s, role) {
			continue
		}
		mentioned = true
		hasUpdateWord := containsAny(s, "update", "edit", "write")
		hasReadWord := containsAny(s, "read", "view", "access")
		negated := containsAny(s, "cannot", "can't", "may not", "not update", "not edit", "not write")
		switch {
		case hasUpdateWord && negated:
			return scopeDenied
		case hasUpdateWord:
			return scopeGranted
		case hasReadWord:
			return scopeDenied // the sentence states a closed read-only scope for this role
		}
	}
	if mentioned {
		return scopeUnknown // role appears, but never tied to any recognized action verb
	}
	return scopeUnknown
}

// Parse extracts a bounded policy from free text dictated or typed by the
// user. Supported vocabulary: roles "editor"/"viewer", actions
// "update"/"edit"/"write" and "read"/"view"/"access", and tenant/project
// ownership phrasing. Anything outside that vocabulary is surfaced as an
// assumption, not invented silently, and the exact phrase that grounded each
// extracted concept is kept so the reviewer can trace it back.
func Parse(text string) Plan {
	t := strings.ToLower(text)
	sentences := splitSentences(t)

	var assumptions []string
	var concepts []Concept

	editorsCanUpdate := true
	switch updateScope(sentences, "editor") {
	case scopeGranted:
		editorsCanUpdate = true
	case scopeDenied:
		editorsCanUpdate = false
	case scopeUnknown:
		editorsCanUpdate = true // default bias: an editor role is assumed to manage its own tenant's assets
		assumptions = append(assumptions, "Assumed editors can update assets in their own tenant (rule did not explicitly say so).")
	}
	if snippet, ok := findSnippet(text, "editor"); ok {
		verdict := "cannot update"
		if editorsCanUpdate {
			verdict = "can update"
		}
		concepts = append(concepts, Concept{Label: "Editors", Value: verdict, Snippet: snippet})
	}

	viewersCanUpdate := false
	switch updateScope(sentences, "viewer") {
	case scopeGranted:
		viewersCanUpdate = true
	case scopeDenied:
		viewersCanUpdate = false
	case scopeUnknown:
		viewersCanUpdate = false // default bias: a viewer role is assumed read-only unless stated otherwise
		assumptions = append(assumptions, "Assumed viewers cannot update assets (rule did not mention viewers explicitly).")
	}
	if snippet, ok := findSnippet(text, "viewer"); ok {
		verdict := "cannot update"
		if viewersCanUpdate {
			verdict = "can update"
		}
		concepts = append(concepts, Concept{Label: "Viewers", Value: verdict, Snippet: snippet})
	}

	crossTenantDenied := true
	if snippet, ok := findSnippetAny(text, "tenant", "project"); ok {
		concepts = append(concepts, Concept{Label: "Cross-tenant access", Value: "always denied", Snippet: snippet})
	} else {
		assumptions = append(assumptions, "Assumed access to another tenant's assets is always denied (rule did not mention tenants explicitly).")
	}

	plan := Plan{RuleText: text, Assumptions: assumptions, Concepts: concepts}

	for _, id := range fixedIdentities {
		canUpdate := editorsCanUpdate
		if id.Role == "viewer" {
			canUpdate = viewersCanUpdate
		}
		for _, asset := range fixedAssets {
			crossTenant := id.Tenant != asset.Owner
			scope := "own"
			if crossTenant {
				scope = "other"
			}

			readWant := 200
			if crossTenant && crossTenantDenied {
				readWant = 403
			}
			plan.Cases = append(plan.Cases, buildCase(id, asset.ID, asset.Owner, scope, "read", "GET", readWant))

			updateWant := 200
			if crossTenant && crossTenantDenied {
				updateWant = 403
			} else if !canUpdate {
				updateWant = 403
			}
			plan.Cases = append(plan.Cases, buildCase(id, asset.ID, asset.Owner, scope, "update", "PUT", updateWant))
		}
	}

	return plan
}

func buildCase(id Identity, assetID, owner, scope, action, method string, want int) Case {
	return Case{
		ID:         id.ID + "-" + action + "-" + assetID,
		Actor:      id.Label,
		Role:       id.Role,
		Action:     action,
		Method:     method,
		Scope:      scope,
		AssetID:    assetID,
		AssetOwner: owner,
		Want:       want,
		WantLabel:  label(want),
		Token:      id.Token,
	}
}

func label(status int) string {
	switch status {
	case 200:
		return "allow"
	case 401:
		return "unauthenticated"
	case 403:
		return "deny"
	case 404:
		return "not found"
	default:
		return "unexpected"
	}
}

// splitSentences breaks lowercased text on '.', '!', and '?' for the
// sentence-scoped checks in updateScope. It deliberately does not handle
// abbreviations or quotes — the input is a short, reviewed access rule, not
// arbitrary prose.
func splitSentences(lower string) []string {
	var sentences []string
	start := 0
	for i, r := range lower {
		if r == '.' || r == '!' || r == '?' {
			sentences = append(sentences, lower[start:i])
			start = i + 1
		}
	}
	if start < len(lower) {
		sentences = append(sentences, lower[start:])
	}
	return sentences
}

func containsAny(s string, subs ...string) bool {
	for _, sub := range subs {
		if strings.Contains(s, sub) {
			return true
		}
	}
	return false
}

// findSnippet returns the sentence of text containing the first
// case-insensitive occurrence of word, for provenance display.
func findSnippet(text, word string) (string, bool) {
	return findSnippetAny(text, word)
}

func findSnippetAny(text string, words ...string) (string, bool) {
	lower := strings.ToLower(text)
	for _, w := range words {
		idx := strings.Index(lower, w)
		if idx == -1 {
			continue
		}
		start := strings.LastIndexAny(text[:idx], ".!?") + 1
		end := len(text)
		if rel := strings.IndexAny(text[idx:], ".!?"); rel != -1 {
			end = idx + rel + 1
		}
		snippet := strings.TrimSpace(text[start:end])
		if snippet != "" {
			return snippet, true
		}
	}
	return "", false
}
