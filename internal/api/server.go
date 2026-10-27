// Package api exposes RuleProof's explain -> review -> verify workflow over
// HTTP, backed by internal/store for persistence.
package api

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"time"

	"ruleproof/internal/assets"
	"ruleproof/internal/check"
	"ruleproof/internal/coverage"
	"ruleproof/internal/diff"
	"ruleproof/internal/rules"
	"ruleproof/internal/store"
)

// maxRequestBodyBytes bounds every request body this API reads. Requests are
// a handful of short fields (rule text, case-id-to-status overrides); 1MB is
// generous headroom against an oversized or malformed body, not a real limit
// in practice.
const maxRequestBodyBytes = 1 << 20

// Server holds the base URLs of the fixture instances this demo can run
// checks against, keyed by fixture name ("broken", "partial", "fixed"). All
// are synthetic and started locally — never an arbitrary user-supplied target.
type Server struct {
	Workbench     *WorkbenchConfig
	Fixtures      map[string]string
	Store         *store.Store
	AllowedOrigin string // CORS origin; "*" is fine for this local demo, tighten before any real deployment
}

func New(st *store.Store, fixtures map[string]string) *Server {
	s := &Server{Store: st, Fixtures: fixtures, AllowedOrigin: "*"}
	_ = s.ConfigureWorkbench("")
	return s
}

func (s *Server) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/workbench/", s.handleWorkbench)
	mux.HandleFunc("GET /api/health", s.handleHealth)
	mux.HandleFunc("POST /api/plans", s.handleCreatePlan)
	mux.HandleFunc("GET /api/plans/{id}", s.handleGetPlan)
	mux.HandleFunc("GET /api/plans/{id}/history", s.handleHistory)
	mux.HandleFunc("GET /api/plans/{id}/export", s.handleExport)
	mux.HandleFunc("GET /api/plans/{id}/diff", s.handleDiff)
	mux.HandleFunc("GET /api/plans/{id}/coverage", s.handleCoverage)
	mux.HandleFunc("GET /api/fixtures/openapi.json", s.handleOpenAPI)
	mux.HandleFunc("POST /api/plans/{id}/revise", s.handleRevise)
	mux.HandleFunc("PATCH /api/plans/{id}/cases", s.handleEditCases)
	mux.HandleFunc("POST /api/plans/{id}/acknowledge", s.handleAcknowledge)
	mux.HandleFunc("POST /api/plans/{id}/approve", s.handleApprove)
	mux.HandleFunc("POST /api/runs", s.handleCreateRun)
	mux.HandleFunc("GET /api/runs/{id}", s.handleGetRun)
	return s.cors(mux)
}

func (s *Server) cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", s.AllowedOrigin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// decodeJSON caps the request body before decoding, so an oversized or
// malformed body can't force unbounded reads.
func decodeJSON(w http.ResponseWriter, r *http.Request, v any) error {
	r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodyBytes)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(v); err != nil {
		return err
	}
	if err := decoder.Decode(new(any)); err != io.EOF {
		return errors.New("request must contain exactly one JSON value")
	}
	return nil
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "driver": s.Store.Driver()})
}

// --- response shapes ---

type planResponse struct {
	ID                      string           `json:"id"`
	RootPlanID              string           `json:"rootPlanId"`
	ParentPlanID            string           `json:"parentPlanId,omitempty"`
	Kind                    string           `json:"kind"`
	RuleText                string           `json:"ruleText"`
	Cases                   []rules.Case     `json:"cases"`
	Assumptions             []string         `json:"assumptions"`
	Concepts                []rules.Concept  `json:"concepts"`
	Conflicts               []rules.Conflict `json:"conflicts"`
	Hash                    string           `json:"hash"`
	AssumptionsAcknowledged bool             `json:"assumptionsAcknowledged"`
	Approved                bool             `json:"approved"`
	ApprovedAt              *time.Time       `json:"approvedAt,omitempty"`
	CreatedAt               time.Time        `json:"createdAt"`
}

func toPlanResponse(p *store.Plan) planResponse {
	return planResponse{
		ID: p.ID, RootPlanID: p.RootPlanID, ParentPlanID: p.ParentPlanID, Kind: string(p.Kind),
		RuleText: p.RuleText, Cases: p.Cases, Assumptions: p.Assumptions,
		Concepts:  rules.Parse(p.RuleText).Concepts,
		Conflicts: rules.Conflicts(p.RuleText),
		Hash:      p.Hash, AssumptionsAcknowledged: p.AssumptionsAcknowledged,
		Approved: p.Approved && p.Hash == rules.Hash(p.Cases), ApprovedAt: p.ApprovedAt, CreatedAt: p.CreatedAt,
	}
}

type runResponse struct {
	ID         string         `json:"id"`
	PlanID     string         `json:"planId"`
	PlanHash   string         `json:"planHash"`
	Fixture    string         `json:"fixture"`
	Results    []check.Result `json:"results"`
	PassCount  int            `json:"passCount"`
	FailCount  int            `json:"failCount"`
	ErrorCount int            `json:"errorCount"`
	Variants   []check.Result `json:"variants"`
	Bypass     *bypassSummary `json:"bypass,omitempty"` // nil when the run did not try bypass variants
	CreatedAt  time.Time      `json:"createdAt"`
}

type bypassSummary struct {
	Catalog      string `json:"catalog"`
	Held         int    `json:"held"`
	Leaked       int    `json:"leaked"`
	Inconclusive int    `json:"inconclusive"`
}

func toRunResponse(r *store.Run) runResponse {
	resp := runResponse{
		ID: r.ID, PlanID: r.PlanID, PlanHash: r.PlanHash, Fixture: r.Fixture,
		Results: r.Results, PassCount: r.PassCount, FailCount: r.FailCount, ErrorCount: r.ErrorCount,
		Variants: r.Variants, CreatedAt: r.CreatedAt,
	}
	if resp.Variants == nil {
		resp.Variants = []check.Result{}
	}
	if r.BypassCatalog != "" {
		held, leaked, inconclusive := check.Tally(r.Variants)
		resp.Bypass = &bypassSummary{Catalog: r.BypassCatalog, Held: held, Leaked: leaked, Inconclusive: inconclusive}
	}
	return resp
}

// --- plans ---

func (s *Server) handleCreatePlan(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Text string `json:"text"`
	}
	if err := decodeJSON(w, r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	p, err := s.Store.CreateRootPlan(r.Context(), body.Text)
	if !writeStoreErr(w, err) {
		return
	}
	writeJSON(w, http.StatusOK, toPlanResponse(p))
}

func (s *Server) handleGetPlan(w http.ResponseWriter, r *http.Request) {
	p, err := s.Store.GetPlan(r.Context(), r.PathValue("id"))
	if !writeStoreErr(w, err) {
		return
	}
	writeJSON(w, http.StatusOK, toPlanResponse(p))
}

func (s *Server) handleRevise(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Text string `json:"text"`
	}
	if err := decodeJSON(w, r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	p, err := s.Store.RevisePlan(r.Context(), r.PathValue("id"), body.Text)
	if !writeStoreErr(w, err) {
		return
	}
	writeJSON(w, http.StatusOK, toPlanResponse(p))
}

func (s *Server) handleEditCases(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Overrides map[string]int `json:"overrides"`
	}
	if err := decodeJSON(w, r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if len(body.Overrides) == 0 {
		writeError(w, http.StatusBadRequest, "overrides must include at least one case")
		return
	}
	p, err := s.Store.EditCases(r.Context(), r.PathValue("id"), body.Overrides)
	if !writeStoreErr(w, err) {
		return
	}
	writeJSON(w, http.StatusOK, toPlanResponse(p))
}

func (s *Server) handleAcknowledge(w http.ResponseWriter, r *http.Request) {
	p, err := s.Store.AcknowledgeAssumptions(r.Context(), r.PathValue("id"))
	if !writeStoreErr(w, err) {
		return
	}
	writeJSON(w, http.StatusOK, toPlanResponse(p))
}

func (s *Server) handleApprove(w http.ResponseWriter, r *http.Request) {
	p, err := s.Store.ApprovePlan(r.Context(), r.PathValue("id"))
	if !writeStoreErr(w, err) {
		return
	}
	writeJSON(w, http.StatusOK, toPlanResponse(p))
}

func (s *Server) handleHistory(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	p, err := s.Store.GetPlan(r.Context(), id)
	if !writeStoreErr(w, err) {
		return
	}
	lineage, err := s.Store.ListLineage(r.Context(), p.RootPlanID)
	if !writeStoreErr(w, err) {
		return
	}
	runs, err := s.Store.ListRunsForLineage(r.Context(), p.RootPlanID)
	if !writeStoreErr(w, err) {
		return
	}
	lineageResp := make([]planResponse, len(lineage))
	for i, lp := range lineage {
		lineageResp[i] = toPlanResponse(lp)
	}
	runsResp := make([]runResponse, len(runs))
	for i, run := range runs {
		runsResp[i] = toRunResponse(run)
	}
	writeJSON(w, http.StatusOK, map[string]any{"lineage": lineageResp, "runs": runsResp})
}

func (s *Server) handleExport(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	p, err := s.Store.GetPlan(r.Context(), id)
	if !writeStoreErr(w, err) {
		return
	}
	runs, err := s.Store.ListRunsForLineage(r.Context(), p.RootPlanID)
	if !writeStoreErr(w, err) {
		return
	}
	var planRuns []runResponse
	for _, run := range runs {
		if run.PlanID == p.ID {
			planRuns = append(planRuns, toRunResponse(run))
		}
	}
	bundle := map[string]any{
		"plan":       toPlanResponse(p),
		"runs":       planRuns,
		"exportedAt": time.Now().UTC(),
		"disclaimer": "A passing result means the approved scenarios passed. It does not prove the whole application is secure.",
	}
	w.Header().Set("Content-Disposition", `attachment; filename="ruleproof-`+p.ID+`.json"`)
	writeJSON(w, http.StatusOK, bundle)
}

// handleDiff compares a revision (the path id) against ?base=, defaulting to
// its parent. Both must belong to the same lineage.
func (s *Server) handleDiff(w http.ResponseWriter, r *http.Request) {
	head, err := s.Store.GetPlan(r.Context(), r.PathValue("id"))
	if !writeStoreErr(w, err) {
		return
	}
	baseID := r.URL.Query().Get("base")
	if baseID == "" {
		baseID = head.ParentPlanID
	}
	if baseID == "" {
		writeError(w, http.StatusBadRequest, "plan has no parent revision; pass ?base=<plan id>")
		return
	}
	base, err := s.Store.GetPlan(r.Context(), baseID)
	if !writeStoreErr(w, err) {
		return
	}
	if base.RootPlanID != head.RootPlanID {
		writeError(w, http.StatusBadRequest, "plans belong to different rules and cannot be compared")
		return
	}
	writeJSON(w, http.StatusOK, diff.Compare(toDiffSide(base), toDiffSide(head)))
}

// handleCoverage maps a plan onto the fixture's OpenAPI spec. Both fixtures
// share one spec, so there is nothing to choose here.
func (s *Server) handleCoverage(w http.ResponseWriter, r *http.Request) {
	p, err := s.Store.GetPlan(r.Context(), r.PathValue("id"))
	if !writeStoreErr(w, err) {
		return
	}
	report, err := coverage.Analyze(assets.OpenAPISpec, p.Cases, p.RuleText)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusOK, report)
}

func (s *Server) handleOpenAPI(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_, _ = w.Write(assets.OpenAPISpec)
}

func toDiffSide(p *store.Plan) diff.Side {
	return diff.Side{ID: p.ID, RuleText: p.RuleText, Cases: p.Cases, Assumptions: p.Assumptions, Hash: p.Hash, Approved: p.Approved}
}

// --- runs ---

func (s *Server) handleCreateRun(w http.ResponseWriter, r *http.Request) {
	var body struct {
		PlanID  string `json:"planId"`
		Fixture string `json:"fixture"`
		Bypass  bool   `json:"bypass"`
	}
	if err := decodeJSON(w, r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	base, ok := s.Fixtures[body.Fixture]
	if !ok || base == "" {
		writeError(w, http.StatusBadRequest, "fixture must be \"broken\", \"partial\" or \"fixed\"")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	run, err := s.Store.RunPlan(ctx, body.PlanID, body.Fixture, base, store.RunOptions{Bypass: body.Bypass})
	if !writeStoreErr(w, err) {
		return
	}
	writeJSON(w, http.StatusOK, toRunResponse(run))
}

func (s *Server) handleGetRun(w http.ResponseWriter, r *http.Request) {
	run, err := s.Store.GetRun(r.Context(), r.PathValue("id"))
	if !writeStoreErr(w, err) {
		return
	}
	writeJSON(w, http.StatusOK, toRunResponse(run))
}

// --- helpers ---

// writeStoreErr maps a store error to the right HTTP status and writes a
// structured {"error": "..."} body. It returns false when it wrote a
// response (so the caller should stop), true when err was nil.
func writeStoreErr(w http.ResponseWriter, err error) bool {
	if err == nil {
		return true
	}
	switch {
	case errors.Is(err, store.ErrNotFound):
		writeError(w, http.StatusNotFound, err.Error())
	case errors.Is(err, store.ErrConflict):
		writeError(w, http.StatusConflict, err.Error())
	case errors.Is(err, store.ErrValidation):
		writeError(w, http.StatusBadRequest, err.Error())
	default:
		writeError(w, http.StatusInternalServerError, "internal error")
	}
	return false
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
