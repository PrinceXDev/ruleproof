package workbench

type impactCheckRoutes struct {
	routes   []string
	reasons  []string
	orphaned bool
}

func appendImpactReason(reasons []string, reason string) []string {
	if !contains(reasons, reason) {
		return append(reasons, reason)
	}
	return reasons
}

func mapImpactCheckRoutes(c Case, before, after impactSpec) impactCheckRoutes {
	previous, current := impactRoute(before, c.Method, c.Path), impactRoute(after, c.Method, c.Path)
	mapping := impactCheckRoutes{routes: []string{previous, current}, orphaned: current == ""}
	if previous != current {
		mapping.reasons = append(mapping.reasons, "Request route mapping changed; review this check's expectations.")
	}
	if c.State == nil {
		return mapping
	}
	observerBefore := impactRoute(before, "GET", c.State.Path)
	observerAfter := impactRoute(after, "GET", c.State.Path)
	mapping.routes = append(mapping.routes, observerBefore, observerAfter)
	if observerBefore != observerAfter {
		mapping.reasons = append(mapping.reasons, "State observer route changed; review the protected-state assertion.")
	}
	mapping.orphaned = mapping.orphaned || observerAfter == ""
	return mapping
}

func mapImpactChecks(report *ImpactReport, s Suite, before, after impactSpec) {
	indices := map[string]int{}
	for index, op := range report.Operations {
		indices[op.Operation] = index
	}
	reasons := map[string][]string{}
	scenarios := map[string]bool{}
	for _, c := range s.Cases {
		mapping := mapImpactCheckRoutes(c, before, after)
		reasons[c.ID] = mapping.reasons
		if mapping.orphaned {
			report.OrphanedCheckIDs = append(report.OrphanedCheckIDs, c.ID)
		}
		for _, route := range mapping.routes {
			if route == "" {
				continue
			}
			op := &report.Operations[indices[route]]
			op.CheckIDs = appendImpactReason(op.CheckIDs, c.ID)
			if op.Certainty != "unaffected" {
				reasons[c.ID] = appendImpactReason(reasons[c.ID], "Depends on "+route+" ("+op.Certainty+").")
			}
		}
		if report.RequiresFullRun {
			reasons[c.ID] = appendImpactReason(reasons[c.ID], "Include in full-suite review because static analysis is uncertain.")
		}
		if len(reasons[c.ID]) > 0 && c.Scenario != "" {
			scenarios[c.Scenario] = true
		}
	}
	appendImpactRecommendations(report, s, reasons, scenarios)
}

func appendImpactRecommendations(report *ImpactReport, s Suite, reasons map[string][]string, scenarios map[string]bool) {
	identities := map[string]Identity{}
	for _, identity := range s.Identities {
		identity.Credential = ""
		identities[identity.ID] = identity
	}
	for _, c := range s.Cases {
		if scenarios[c.Scenario] && c.Scenario != "" {
			reasons[c.ID] = appendImpactReason(reasons[c.ID], "Keep every step in ordered scenario: "+c.Scenario)
		}
		if len(reasons[c.ID]) == 0 {
			report.UnchangedCheckIDs = append(report.UnchangedCheckIDs, c.ID)
			continue
		}
		report.Recommended = append(report.Recommended, ImpactCheck{
			ID: c.ID, Identity: identities[c.IdentityID], Scope: c.Scope, Scenario: c.Scenario,
			Assertions: len(c.Assertions), ObservesState: c.State != nil, Reasons: reasons[c.ID],
		})
	}
}
