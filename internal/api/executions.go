package api

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"ruleproof/internal/store"
	"ruleproof/internal/workbench"
)

const executionTimeout = 60 * time.Second
const reservationGrace = 30 * time.Second

func (s *Server) startExecution(w http.ResponseWriter, r *http.Request, a Account, revision *store.Revision, suite workbench.Suite) {
	s.executionMu.Lock()
	defer s.executionMu.Unlock()
	if s.draining {
		writeError(w, 503, "server is draining; retry this request key on another instance")
		return
	}
	if revision.ApprovedBy == "" {
		writeError(w, 409, "approve this exact revision before execution")
		return
	}
	env, ok := s.environment(a.Workspace, suite.Environment)
	if !ok {
		writeError(w, 409, "environment no longer available")
		return
	}
	var body struct {
		RequestKey string `json:"requestKey"`
	}
	if decodeJSON(w, r, &body) != nil {
		writeError(w, 400, "provide an execution request key")
		return
	}
	job, created, err := s.Store.StartExecution(r.Context(), a.Workspace, revision.ID, env.ID, a.Name, body.RequestKey, time.Now().Add(executionTimeout+reservationGrace))
	if !writeStoreErr(w, err) {
		return
	}
	if created {
		s.executionWorkers.Add(1)
		go func() { defer s.executionWorkers.Done(); s.executeDetached(a.Workspace, job, suite, env) }()
	}
	w.Header().Set("Location", "/api/workbench/executions/"+job.ID)
	writeJSON(w, http.StatusAccepted, job)
}

// ShutdownExecutions stops admissions and waits for accepted work to commit its
// evidence. Abrupt termination still leaves reservations requiring recovery.
func (s *Server) ShutdownExecutions(ctx context.Context) error {
	s.executionMu.Lock()
	s.draining = true
	s.executionMu.Unlock()
	done := make(chan struct{})
	go func() { s.executionWorkers.Wait(); close(done) }()
	select {
	case <-done:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

func (s *Server) handleExecutions(w http.ResponseWriter, r *http.Request, a Account, path string) {
	parts := strings.Split(path, "/")
	if len(parts) == 1 && r.Method == "GET" {
		jobs, err := s.Store.ListExecutions(r.Context(), a.Workspace)
		if writeStoreErr(w, err) {
			writeJSON(w, 200, jobs)
		}
		return
	}
	if len(parts) < 2 || len(parts) > 3 {
		writeError(w, 404, "not found")
		return
	}
	job, err := s.Store.GetExecution(r.Context(), a.Workspace, parts[1])
	if !writeStoreErr(w, err) {
		return
	}
	if len(parts) == 2 && r.Method == "GET" {
		writeJSON(w, 200, job)
		return
	}
	if len(parts) != 3 || r.Method != "POST" {
		writeError(w, 405, "method not allowed")
		return
	}
	if a.Role == "viewer" {
		writeError(w, 403, "author or reviewer access required")
		return
	}
	switch parts[2] {
	case "cancel":
		err = s.Store.CancelExecution(r.Context(), a.Workspace, job.ID, a.Name)
	case "recover":
		if a.Role != "reviewer" {
			writeError(w, 403, "reviewer access required")
			return
		}
		var body struct {
			Reason string `json:"reason"`
		}
		if decodeJSON(w, r, &body) != nil {
			writeError(w, 400, "document the recovery decision")
			return
		}
		err = s.Store.RecoverExecution(r.Context(), a.Workspace, job.ID, a.Name, strings.TrimSpace(body.Reason))
	default:
		writeError(w, 404, "not found")
		return
	}
	if writeStoreErr(w, err) {
		job, err = s.Store.GetExecution(r.Context(), a.Workspace, job.ID)
		if writeStoreErr(w, err) {
			writeJSON(w, 200, job)
		}
	}
}

// This worker belongs to the accepted receipt, not the browser request. The DB
// reservation prevents another instance from running against the same target.
// A process crash leaves an interrupted receipt for explicit reviewer recovery.
func (s *Server) executeDetached(workspace string, job *store.Execution, suite workbench.Suite, env Environment) {
	ctx, cancel := context.WithTimeout(context.Background(), executionTimeout)
	defer cancel()
	defer func() {
		if recovered := recover(); recovered != nil {
			log.Printf("execution %s interrupted by worker panic", job.ID)
		}
	}()
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.Proxy = nil
	defer transport.CloseIdleConnections()
	client := &http.Client{Timeout: 3 * time.Second, Transport: transport, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
	// Polling persisted cancellation also reaches workers on other instances.
	watchDone := make(chan struct{})
	defer close(watchDone)
	go func() {
		ticker := time.NewTicker(200 * time.Millisecond)
		defer ticker.Stop()
		for {
			select {
			case <-watchDone:
				return
			case <-ctx.Done():
				return
			case <-ticker.C:
				state, err := s.Store.GetExecution(ctx, workspace, job.ID)
				if err != nil || state.Status != "running" {
					cancel()
					return
				}
			}
		}
	}()
	evidence, err := workbench.ExecuteWithProgress(ctx, suite, env.BaseURL, client, env.secrets, func(e workbench.Evidence, current string) error {
		raw, err := json.Marshal(e)
		if err != nil {
			return err
		}
		return s.Store.CheckpointExecution(ctx, workspace, job.ID, current, raw)
	})
	raw, marshalErr := json.Marshal(evidence)
	if marshalErr != nil {
		log.Printf("execution %s evidence serialization failed", job.ID)
		return
	}
	saveCtx, saveCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer saveCancel()
	if saveErr := s.Store.FinishExecution(saveCtx, workspace, job.ID, raw, err != nil || ctx.Err() != nil || evidence.Errors > 0); saveErr != nil {
		log.Printf("execution %s finalization failed: %v", job.ID, saveErr)
	}
}
