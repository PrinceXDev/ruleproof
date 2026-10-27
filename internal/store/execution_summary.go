package store

import "encoding/json"

// The list projection contains no response bodies, request paths, or assertion
// payloads. Its size is bounded by case identifiers and verdicts, not evidence.
func summarizeEvidence(raw []byte) (string, error) {
	var summary struct {
		SuiteHash   string `json:"suiteHash"`
		DataVersion string `json:"dataVersion"`
		Passed      int    `json:"passed"`
		Failed      int    `json:"failed"`
		Errors      int    `json:"errors"`
		Results     []struct {
			ID      string `json:"id"`
			Verdict string `json:"verdict"`
		} `json:"results"`
	}
	if err := json.Unmarshal(raw, &summary); err != nil {
		return "", err
	}
	content, err := json.Marshal(summary)
	return string(content), err
}
