package workbench

type ImpactOperation struct {
	Operation    string   `json:"operation"`
	Change       string   `json:"change"`
	Certainty    string   `json:"certainty"`
	Reasons      []string `json:"reasons"`
	CheckIDs     []string `json:"checkIds"`
	Missing      []string `json:"missing"`
	MissingCount int      `json:"missingCount"`
	Exclusion    string   `json:"exclusion,omitempty"`
}

type ImpactCheck struct {
	ID            string   `json:"id"`
	Identity      Identity `json:"identity"`
	Scope         string   `json:"scope"`
	Scenario      string   `json:"scenario,omitempty"`
	Assertions    int      `json:"assertions"`
	ObservesState bool     `json:"observesState"`
	Reasons       []string `json:"reasons"`
}

type ImpactReport struct {
	SuiteHash         string            `json:"suiteHash"`
	BeforeSpecHash    string            `json:"beforeSpecHash"`
	AfterSpecHash     string            `json:"afterSpecHash"`
	RequiresFullRun   bool              `json:"requiresFullRun"`
	Operations        []ImpactOperation `json:"operations"`
	Recommended       []ImpactCheck     `json:"recommended"`
	UnchangedCheckIDs []string          `json:"unchangedCheckIds"`
	OrphanedCheckIDs  []string          `json:"orphanedCheckIds"`
	Warnings          []string          `json:"warnings"`
}
