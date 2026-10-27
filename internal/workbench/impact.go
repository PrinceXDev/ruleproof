package workbench

import (
	"encoding/json"
	"strings"
)

// AnalyzeImpact is advisory and performs no HTTP requests. The saved suite stays
// immutable. Missing static dependencies never establish runtime authorization.
func AnalyzeImpact(s Suite, candidate []byte) (ImpactReport, error) {
	report := newImpactReport(s, candidate)
	if err := Validate(s); err != nil {
		return report, err
	}
	before, err := parseImpactSpec(s.Spec)
	if err != nil {
		return report, err
	}
	after, err := parseImpactSpec(candidate)
	if err != nil {
		return report, err
	}
	broader := before.unknown != after.unknown || before.incomplete || after.incomplete
	if broader {
		report.RequiresFullRun = true
		report.Warnings = append(report.Warnings, "Unclassified settings changed or static mappings are incomplete. Review all checks and any endpoints outside the imported paths.")
	}
	gaps := impactCoverage(s, after)
	for _, key := range impactOperationKeys(before, after) {
		op := compareImpactOperation(key, before, after, broader)
		op.Exclusion = s.Exclusions[key]
		if candidateGaps, exists := gaps[key]; exists {
			op.Missing = candidateGaps.Missing
			op.MissingCount = candidateGaps.MissingCount
		}
		if op.Certainty == "uncertain" {
			report.RequiresFullRun = true
		}
		report.Operations = append(report.Operations, op)
	}
	mapImpactChecks(&report, s, before, after)
	appendImpactWarnings(&report)
	return report, nil
}

func newImpactReport(s Suite, candidate []byte) ImpactReport {
	return ImpactReport{
		SuiteHash: Hash(s), BeforeSpecHash: Hash(s.Spec), AfterSpecHash: Hash(json.RawMessage(candidate)),
		Operations: []ImpactOperation{}, Recommended: []ImpactCheck{},
		UnchangedCheckIDs: []string{}, OrphanedCheckIDs: []string{},
		Warnings: []string{"Specification analysis cannot detect implementation-only permission changes. Review and run the complete suite before release."},
	}
}

func appendImpactWarnings(report *ImpactReport) {
	for _, op := range report.Operations {
		if op.Certainty != "unaffected" && strings.TrimSpace(op.Exclusion) != "" {
			report.Warnings = append(report.Warnings, "Re-review exclusion for "+op.Operation+": "+op.Exclusion)
		}
	}
	if len(report.OrphanedCheckIDs) > 0 {
		report.Warnings = append(report.Warnings, "Some saved requests or state observers no longer match the candidate. Repair the flagged routes before approving a new revision.")
	}
}
