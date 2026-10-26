// Package bypass derives bypass attempts from an approved plan's deny cases:
// the same request in shapes that commonly slip past an access check.
//
// Attempts are generated at run time, never stored in the plan, so they don't
// change what a reviewer approved or the plan's hash. The reasoning: an
// approved "viewer cannot read b1" is one claim, and a variant only knocks on
// a different door of the same claim.
package bypass

import (
	"net/http"
	"strings"

	"ruleproof/internal/check"
	"ruleproof/internal/rules"
)

// Catalog versions the variant list below. Runs record it so an old run can be
// explained after the list grows.
const Catalog = "v1"

type variant struct {
	kind, label, why string
	applies          func(rules.Case) bool
	mutate           func(rules.Case, *check.Case)
}

var catalog = []variant{
	{
		kind:    "head-method",
		label:   "HEAD instead of GET",
		why:     "Checks registered only for GET often let HEAD through, which still confirms the object and can carry its headers.",
		applies: func(c rules.Case) bool { return c.Method == http.MethodGet },
		mutate:  func(_ rules.Case, v *check.Case) { v.Method = http.MethodHead },
	},
	{
		kind:    "trailing-slash",
		label:   "Trailing slash",
		why:     "The router and the access check can normalise /assets/b1/ differently, so one matches and the other doesn't.",
		applies: func(rules.Case) bool { return true },
		mutate:  func(_ rules.Case, v *check.Case) { v.Path += "/" },
	},
	{
		kind:    "id-case",
		label:   "Upper-case object ID",
		why:     "A case-insensitive lookup paired with a case-sensitive ownership check lets B1 reach the asset b1 is protected from.",
		applies: func(c rules.Case) bool { return strings.ToUpper(c.AssetID) != c.AssetID },
		mutate: func(c rules.Case, v *check.Case) {
			v.Path = strings.Replace(v.Path, "/"+c.AssetID, "/"+strings.ToUpper(c.AssetID), 1)
		},
	},
	{
		kind:    "tenant-header",
		label:   "Spoofed X-Tenant-ID header",
		why:     "Servers that trust a client-sent tenant header let a caller claim to belong to the asset owner's tenant.",
		applies: func(c rules.Case) bool { return c.Scope == "other" },
		mutate:  func(c rules.Case, v *check.Case) { setHeader(v, "X-Tenant-ID", c.AssetOwner) },
	},
	{
		kind:    "method-override",
		label:   "POST with X-HTTP-Method-Override: PUT",
		why:     "Override middleware can rewrite the method after the access check has already looked at POST.",
		applies: func(c rules.Case) bool { return c.Method == http.MethodPut },
		mutate: func(_ rules.Case, v *check.Case) {
			v.Method = http.MethodPost
			setHeader(v, "X-HTTP-Method-Override", http.MethodPut)
		},
	},
}

// Expand returns the bypass attempts for every deny case in cases. base[i]
// must be the check built from cases[i]; attempts inherit its token, rule
// and expected status.
func Expand(cases []rules.Case, base []check.Case) []check.Case {
	var out []check.Case
	for i, c := range cases {
		if c.Want == http.StatusOK {
			continue // allowed requests have nothing to bypass
		}
		for _, v := range catalog {
			if !v.applies(c) {
				continue
			}
			attempt := base[i]
			attempt.ID = base[i].ID + "~" + v.kind
			attempt.Headers = nil
			attempt.Variant = &check.Variant{Of: base[i].ID, Kind: v.kind, Label: v.label, Why: v.why}
			v.mutate(c, &attempt)
			out = append(out, attempt)
		}
	}
	return out
}

func setHeader(c *check.Case, key, value string) {
	if c.Headers == nil {
		c.Headers = map[string]string{}
	}
	c.Headers[key] = value
}
