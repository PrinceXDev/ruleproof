package workbench

import (
	"encoding/json"
	"ruleproof/internal/check"
)

func Sample(spec []byte) Suite {
	s := Suite{Name: "Tenant isolation", RuleText: "Viewers can read assets in their own tenant. Editors can update their own assets. Neither role can access another tenant's assets.", Environment: "fixed", Spec: json.RawMessage(spec), DataVersion: "synthetic-v1", Identities: []Identity{{ID: "editor-a", Label: "Editor · tenant A", Role: "editor", Tenant: "A", Credential: "editor-a"}, {ID: "viewer-a", Label: "Viewer · tenant A", Role: "viewer", Tenant: "A", Credential: "viewer-a"}}, Exclusions: map[string]string{"GET /assets/{id}/export": "Export is reviewed in a separate suite."}}
	for _, id := range s.Identities {
		for _, asset := range []string{"a1", "b1"} {
			for _, method := range []string{"GET", "PUT"} {
				scope := "own"
				want := 200
				if asset == "b1" {
					scope = "other"
					want = 403
				}
				if method == "PUT" && id.Role == "viewer" {
					want = 403
				}
				c := Case{ID: id.ID + "-" + method + "-" + asset, IdentityID: id.ID, Scope: scope, Method: method, Path: "/assets/" + asset, ExpectedStatus: want}
				if want == 200 {
					c.Assertions = []check.Assertion{{Path: "/tenant", Operator: "equals", Value: json.RawMessage(`"A"`)}, {Path: "/password", Operator: "absent"}}
				}
				if method == "PUT" {
					c.Body = `{"name":"Reviewed update"}`
					if want == 403 && asset == "a1" {
						c.State = &check.StateCheck{Path: "/assets/a1", Pointer: "", IdentityID: "editor-a"}
					}
				}
				s.Cases = append(s.Cases, c)
			}
		}
	}
	return s
}
