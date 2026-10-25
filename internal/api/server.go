// Package api exposes RuleProof's explain -> review -> verify workflow over
// HTTP, backed by internal/store for persistence.
package api

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"ruleproof/internal/check"
	"ruleproof/internal/rules"
	"ruleproof/internal/store"
)

// maxRequestBodyBytes bounds every request body this API reads. Requests are
// a handful of short fields (rule text, case-id-to-status overrides); 1MB is
// generous headroom against an oversized or malformed body, not a real limit
// in practice.
const maxRequestBodyBytes = 1 << 20

// Server holds the base URLs of the two fixture instances this demo can run
// checks against. Both are synthetic and started locally — never an
// arbitrary user-supplied target.
type Server struct {
	BrokenURL     string
	FixedURL      string
	Store         *store.Store
	AllowedOrigin string // CORS origin; "*" is fine for this local demo, tighten before any real deployment
}

func New(st *store.Store, brokenURL, fixedURL string) *Server {
	return &Server{Store: st, BrokenURL: brokenURL, FixedURL: fixedURL, AllowedOrigin: "*"}
}

func (s *Server) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", s.handleHealth)
	mux.HandleFunc("POST /api/plans", s.handleCreatePlan)
	mux.HandleFunc("GET /api/plans/{id}", s.handleGetPlan)
	mux.HandleFunc("GET /api/plans/{id}/history", s.handleHistory)
	mux.HandleFunc("GET /api/plans/{id}/export", s.handleExport)
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
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
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
	return json.NewDecoder(r.Body).Decode(v)
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "driver": s.Store.Driver()})
}

// --- response shapes ---

type planResponse struct {
	ID                      string          `json:"id"`
	RootPlanID              string          `json:"rootPlanId"`
	ParentPlanID            string          `json:"parentPlanId,omitempty"`
	Kind                    string          `json:"kind"`
	RuleText                string          `json:"ruleText"`
	Cases                   []rules.Case    `json:"cases"`
	Assumptions             []string        `json:"assumptions"`
	Concepts                []rules.Concept `json:"concepts"`
	Hash                    string          `json:"hash"`
	AssumptionsAcknowledged bool            `json:"assumptionsAcknowledged"`
	Approved                bool            `json:"approved"`
	ApprovedAt              *time.Time      `json:"approvedAt,omitempty"`
	CreatedAt               time.Time       `json:"createdAt"`
}

func toPlanResponse(p *store.Plan) planResponse {
	return planResponse{
		ID: p.ID, RootPlanID: p.RootPlanID, ParentPlanID: p.ParentPlanID, Kind: string(p.Kind),
		RuleText: p.RuleText, Cases: p.Cases, Assumptions: p.Assumptions,
		Concepts: rules.Parse(p.RuleText).Concepts,
		Hash:     p.Hash, AssumptionsAcknowledged: p.AssumptionsAcknowledged,
		Approved: p.Approved, ApprovedAt: p.ApprovedAt, CreatedAt: p.CreatedAt,
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
	CreatedAt  time.Time      `json:"createdAt"`
}

func toRunResponse(r *store.Run) runResponse {
	return runResponse{
		ID: r.ID, PlanID: r.PlanID, PlanHash: r.PlanHash, Fixture: r.Fixture,
		Results: r.Results, PassCount: r.PassCount, FailCount: r.FailCount, ErrorCount: r.ErrorCount,
		CreatedAt: r.CreatedAt,
	}
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

// --- runs ---

func (s *Server) handleCreateRun(w http.ResponseWriter, r *http.Request) {
	var body struct {
		PlanID  string `json:"planId"`
		Fixture string `json:"fixture"`
	}
	if err := decodeJSON(w, r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	var base string
	switch body.Fixture {
	case "broken":
		base = s.BrokenURL
	case "fixed":
		base = s.FixedURL
	default:
		writeError(w, http.StatusBadRequest, "fixture must be \"broken\" or \"fixed\"")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	run, err := s.Store.RunPlan(ctx, body.PlanID, body.Fixture, base)
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
