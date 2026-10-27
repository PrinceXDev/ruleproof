package api

import (
	"crypto/sha256"
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"

	"ruleproof/internal/assets"
	"ruleproof/internal/workbench"
)

type Account struct {
	Name      string `json:"name"`
	Workspace string `json:"workspace"`
	Role      string `json:"role"`
	TokenEnv  string `json:"tokenEnv"`
	tokenHash [32]byte
}
type Environment struct {
	ID          string            `json:"id"`
	Label       string            `json:"label"`
	Workspace   string            `json:"workspace"`
	BaseURL     string            `json:"baseUrl"`
	Credentials map[string]string `json:"credentials"` // reference -> environment variable name
	secrets     map[string]string
}
type WorkbenchConfig struct {
	Accounts         []Account     `json:"accounts"`
	Environments     []Environment `json:"environments"`
	SeparateReviewer bool          `json:"separateReviewer"`
}

// ConfigureWorkbench loads operator-managed targets and credentials. Unconfigured
// mode exposes only synthetic fixtures. No URL or secret submitted by a browser
// becomes an execution target or a persisted credential.
func (s *Server) ConfigureWorkbench(raw string) error {
	cfg := &WorkbenchConfig{}
	if raw == "" {
		for _, id := range []string{"fixed", "broken", "partial"} {
			if base := s.Fixtures[id]; base != "" {
				cfg.Environments = append(cfg.Environments, Environment{ID: id, Label: id + " fixture", Workspace: "demo", BaseURL: base, secrets: map[string]string{"editor-a": "demo-editor-a", "viewer-a": "demo-viewer-a", "editor-b": "demo-editor-b", "expired": "demo-expired"}})
			}
		}
	} else {
		if err := json.Unmarshal([]byte(raw), cfg); err != nil {
			return fmt.Errorf("invalid workbench configuration")
		}
		if len(cfg.Accounts) == 0 || len(cfg.Environments) == 0 {
			return fmt.Errorf("configured workbench requires accounts and environments")
		}
		if len(cfg.Environments) > 128 {
			return fmt.Errorf("at most 128 execution environments may be configured per server")
		}
		names := map[string]bool{}
		tokens := map[[32]byte]bool{}
		for i := range cfg.Accounts {
			a := &cfg.Accounts[i]
			token := os.Getenv(a.TokenEnv)
			if a.Name == "" || a.Workspace == "" || len(token) < 32 || (a.Role != "author" && a.Role != "reviewer" && a.Role != "viewer") {
				return fmt.Errorf("accounts require a unique name, workspace, valid role and a token of at least 32 characters")
			}
			a.tokenHash = sha256.Sum256([]byte(token))
			key := a.Workspace + "/" + a.Name
			if names[key] || tokens[a.tokenHash] {
				return fmt.Errorf("duplicate account or credential")
			}
			names[key] = true
			tokens[a.tokenHash] = true
		}
		targets := map[string]bool{}
		for i := range cfg.Environments {
			e := &cfg.Environments[i]
			u, err := url.Parse(e.BaseURL)
			if err != nil || (u.Scheme != "https" && u.Scheme != "http") || u.Host == "" || u.User != nil || u.RawQuery != "" || u.Fragment != "" || e.ID == "" || e.Workspace == "" {
				return fmt.Errorf("invalid environment target")
			}
			key := e.Workspace + "/" + e.ID
			if targets[key] {
				return fmt.Errorf("duplicate environment")
			}
			targets[key] = true
			e.BaseURL = strings.TrimRight(e.BaseURL, "/")
			e.secrets = map[string]string{}
			for ref, env := range e.Credentials {
				value := os.Getenv(env)
				if value == "" {
					return fmt.Errorf("credential reference %q is unavailable", ref)
				}
				e.secrets[ref] = value
			}
		}
	}
	s.Workbench = cfg
	return nil
}

func (s *Server) workbenchPrincipal(r *http.Request) (Account, bool) {
	if len(s.Workbench.Accounts) == 0 {
		return Account{Name: "Local reviewer", Workspace: "demo", Role: "reviewer"}, true
	}
	header := r.Header.Get("Authorization")
	if !strings.HasPrefix(header, "Bearer ") {
		return Account{}, false
	}
	hash := sha256.Sum256([]byte(strings.TrimPrefix(header, "Bearer ")))
	for _, a := range s.Workbench.Accounts {
		if subtle.ConstantTimeCompare(hash[:], a.tokenHash[:]) == 1 {
			return a, true
		}
	}
	return Account{}, false
}
func (s *Server) environment(workspace, id string) (Environment, bool) {
	for _, e := range s.Workbench.Environments {
		if e.Workspace == workspace && e.ID == id {
			return e, true
		}
	}
	return Environment{}, false
}

func (s *Server) handleWorkbench(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-store")
	a, ok := s.workbenchPrincipal(r)
	if !ok {
		writeError(w, 401, "Sign in with a workspace access token")
		return
	}
	path := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/workbench"), "/")
	if path == "session" && r.Method == "GET" {
		envs := []map[string]any{}
		for _, e := range s.Workbench.Environments {
			if e.Workspace != a.Workspace {
				continue
			}
			refs := []string{}
			for ref := range e.secrets {
				refs = append(refs, ref)
			}
			envs = append(envs, map[string]any{"id": e.ID, "label": e.Label, "credentials": refs})
		}
		writeJSON(w, 200, map[string]any{"name": a.Name, "workspace": a.Workspace, "role": a.Role, "demo": len(s.Workbench.Accounts) == 0, "separateReviewer": s.Workbench.SeparateReviewer, "environments": envs})
		return
	}
	if path == "sample" && r.Method == "GET" {
		writeJSON(w, 200, workbench.Sample(assets.OpenAPISpec))
		return
	}
	if path == "analyze" && r.Method == "POST" {
		var suite workbench.Suite
		if err := decodeJSON(w, r, &suite); err != nil {
			writeError(w, 400, "invalid suite JSON")
			return
		}
		report, err := workbench.Analyze(suite)
		if err != nil && report.Operations == nil {
			writeError(w, 400, err.Error())
			return
		}
		if err := workbench.Validate(suite); err != nil {
			report.ValidationError = err.Error()
		}
		writeJSON(w, 200, report)
		return
	}
	if path == "revisions" {
		if r.Method == "GET" {
			revisions, err := s.Store.ListRevisions(r.Context(), a.Workspace)
			if writeStoreErr(w, err) {
				writeJSON(w, 200, revisions)
			}
			return
		}
		if r.Method == "POST" {
			if a.Role == "viewer" {
				writeError(w, 403, "author or reviewer access required")
				return
			}
			var b struct {
				ParentID string          `json:"parentId"`
				Suite    workbench.Suite `json:"suite"`
			}
			if err := decodeJSON(w, r, &b); err != nil {
				writeError(w, 400, "invalid revision JSON")
				return
			}
			if err := workbench.Validate(b.Suite); err != nil {
				writeError(w, 400, err.Error())
				return
			}
			env, ok := s.environment(a.Workspace, b.Suite.Environment)
			if !ok {
				writeError(w, 400, "environment is unavailable in this workspace")
				return
			}
			for _, id := range b.Suite.Identities {
				if id.Credential != "" {
					if _, ok := env.secrets[id.Credential]; !ok {
						writeError(w, 400, "identity references an unavailable credential")
						return
					}
				}
			}
			content, _ := json.Marshal(b.Suite)
			revision, err := s.Store.SaveRevision(r.Context(), a.Workspace, b.ParentID, a.Name, workbench.Hash(b.Suite), content)
			if writeStoreErr(w, err) {
				writeJSON(w, 201, revision)
			}
			return
		}
	}
	if path == "executions" || strings.HasPrefix(path, "executions/") {
		s.handleExecutions(w, r, a, path)
		return
	}
	parts := strings.Split(path, "/")
	if len(parts) < 2 || parts[0] != "revisions" {
		writeError(w, 404, "not found")
		return
	}
	revision, err := s.Store.GetRevision(r.Context(), a.Workspace, parts[1])
	if !writeStoreErr(w, err) {
		return
	}
	var suite workbench.Suite
	if json.Unmarshal(revision.Content, &suite) != nil || workbench.Hash(suite) != revision.Hash {
		writeError(w, 409, "revision integrity check failed")
		return
	}
	action := ""
	if len(parts) == 3 {
		action = parts[2]
	}
	if r.Method == "GET" {
		switch action {
		case "":
			writeJSON(w, 200, revision)
		case "events":
			events, err := s.Store.ListEvents(r.Context(), a.Workspace, revision.ID)
			if writeStoreErr(w, err) {
				writeJSON(w, 200, events)
			}
		case "export":
			events, err := s.Store.ListEvents(r.Context(), a.Workspace, revision.ID)
			if writeStoreErr(w, err) {
				w.Header().Set("Content-Disposition", `attachment; filename="ruleproof-suite.json"`)
				writeJSON(w, 200, map[string]any{"revision": revision, "events": events})
			}
		default:
			writeError(w, 404, "not found")
		}
		return
	}
	if r.Method != "POST" {
		writeError(w, 405, "method not allowed")
		return
	}
	if action == "drift" {
		var b struct {
			Spec json.RawMessage `json:"spec"`
		}
		if decodeJSON(w, r, &b) != nil {
			writeError(w, 400, "invalid OpenAPI JSON")
			return
		}
		drift, err := workbench.CompareSpecs(suite.Spec, b.Spec)
		if err != nil {
			writeError(w, 400, err.Error())
			return
		}
		writeJSON(w, 200, drift)
		return
	}
	if a.Role == "viewer" {
		writeError(w, 403, "author or reviewer access required")
		return
	}
	switch action {
	case "approve":
		if a.Role != "reviewer" {
			writeError(w, 403, "reviewer access required")
			return
		}
		analysis, err := workbench.Analyze(suite)
		if err != nil || len(analysis.Conflicts) > 0 || analysis.Gaps > 0 {
			writeError(w, 409, "resolve conflicts and cover or explicitly exclude every operation before approval")
			return
		}
		approved, err := s.Store.ApproveRevision(r.Context(), a.Workspace, revision.ID, a.Name, s.Workbench.SeparateReviewer)
		if writeStoreErr(w, err) {
			writeJSON(w, 200, approved)
		}
	case "run":
		s.startExecution(w, r, a, revision, suite)
	default:
		writeError(w, 404, "not found")
	}
}
