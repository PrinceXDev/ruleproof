package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

// Execution is a durable receipt. A reservation is never reclaimed automatically:
// a disconnected worker may have sent a write whose downstream outcome is unknown.
type Execution struct {
	ID                string          `json:"id"`
	RevisionID        string          `json:"revisionId"`
	Environment       string          `json:"environment"`
	Actor             string          `json:"actor"`
	Status            string          `json:"status"`
	CurrentCase       string          `json:"currentCase"`
	Evidence          json.RawMessage `json:"evidence"`
	CreatedAt         string          `json:"createdAt"`
	Deadline          int64           `json:"deadline"`
	RecoveryRequired  bool            `json:"recoveryRequired"`
	RecoveryAvailable bool            `json:"recoveryAvailable"`
}

const executionColumns = `id,revision_id,environment,actor,status,current_case,evidence,created_at,deadline,recovery_required`

func scanExecution(row interface{ Scan(...any) error }) (*Execution, error) {
	var e Execution
	var raw string
	var recovery int
	err := row.Scan(&e.ID, &e.RevisionID, &e.Environment, &e.Actor, &e.Status, &e.CurrentCase, &raw, &e.CreatedAt, &e.Deadline, &recovery)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	e.Evidence = json.RawMessage(raw)
	e.RecoveryRequired = recovery != 0
	e.RecoveryAvailable = e.RecoveryRequired && time.Now().UnixMilli() >= e.Deadline
	// Project an expired worker as interrupted without clearing its reservation.
	if (e.Status == "running" || e.Status == "cancelling") && time.Now().UnixMilli() >= e.Deadline {
		e.Status = "interrupted"
	}
	return &e, err
}

func (s *Store) GetExecution(ctx context.Context, workspace, id string) (*Execution, error) {
	return scanExecution(s.queryRow(ctx, `SELECT `+executionColumns+` FROM executions WHERE workspace=? AND id=?`, workspace, id))
}

func (s *Store) ListExecutions(ctx context.Context, workspace string) ([]Execution, error) {
	// Poll a compact projection; response previews are fetched only on inspection.
	columns := strings.Replace(executionColumns, "evidence", "summary", 1)
	rows, err := s.query(ctx, `SELECT `+columns+` FROM executions WHERE workspace=? AND (recovery_required=1 OR id IN (SELECT id FROM executions WHERE workspace=? ORDER BY created_at DESC,id DESC LIMIT 50)) ORDER BY created_at DESC,id DESC`, workspace, workspace)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := []Execution{}
	for rows.Next() {
		e, err := scanExecution(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, *e)
	}
	return result, rows.Err()
}

// StartExecution atomically deduplicates submissions and reserves an environment
// across every server sharing this database. Only the insertion winner may run.
func (s *Store) StartExecution(ctx context.Context, workspace, revision, environment, actor, key string, deadline time.Time) (*Execution, bool, error) {
	if len(key) < 16 || len(key) > 128 {
		return nil, false, fmt.Errorf("%w: request key must contain 16–128 characters", ErrValidation)
	}
	r, err := s.GetRevision(ctx, workspace, revision)
	if err != nil {
		return nil, false, err
	}
	if r.ApprovedBy == "" {
		return nil, false, ErrConflict
	}
	id := uuid.NewString()
	tx, err := s.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, false, err
	}
	defer tx.Rollback()
	res, err := tx.ExecContext(ctx, s.db.Rebind(`INSERT INTO executions (id,workspace,revision_id,environment,actor,request_key,status,current_case,evidence,summary,created_at,deadline,recovery_required) VALUES (?,?,?,?,?,?,'running','','null','null',?,?,1) ON CONFLICT(workspace,actor,request_key) DO NOTHING`), id, workspace, revision, environment, actor, key, time.Now().UTC().Format(time.RFC3339Nano), deadline.UnixMilli())
	if err != nil {
		return nil, false, err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		e, err := scanExecution(tx.QueryRowContext(ctx, s.db.Rebind(`SELECT `+executionColumns+` FROM executions WHERE workspace=? AND actor=? AND request_key=?`), workspace, actor, key))
		if err != nil {
			return nil, false, err
		}
		if e.RevisionID != revision || e.Environment != environment {
			return nil, false, fmt.Errorf("%w: request key already belongs to another execution", ErrConflict)
		}
		return e, false, tx.Commit()
	}
	res, err = tx.ExecContext(ctx, s.db.Rebind(`INSERT INTO execution_reservations (workspace,environment,execution_id) VALUES (?,?,?) ON CONFLICT(workspace,environment) DO NOTHING`), workspace, environment, id)
	if err != nil {
		return nil, false, err
	}
	n, _ = res.RowsAffected()
	if n == 0 {
		return nil, false, fmt.Errorf("%w: environment is reserved; inspect active runs or complete recovery", ErrConflict)
	}
	if err := tx.Commit(); err != nil {
		return nil, false, err
	}
	e, err := s.GetExecution(ctx, workspace, id)
	return e, true, err
}

// Checkpoint persists redacted evidence before the next request is sent. The
// conditional write fences cancelled, expired, or recovered workers.
func (s *Store) CheckpointExecution(ctx context.Context, workspace, id, current string, evidence []byte) error {
	summary, err := summarizeEvidence(evidence)
	if err != nil {
		return err
	}
	res, err := s.exec(ctx, `UPDATE executions SET current_case=?,evidence=?,summary=? WHERE workspace=? AND id=? AND status='running' AND deadline>?`, current, string(evidence), summary, workspace, id, time.Now().UnixMilli())
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n != 1 {
		return ErrConflict
	}
	return nil
}

func (s *Store) CancelExecution(ctx context.Context, workspace, id, actor string) error {
	return s.changeExecution(ctx, workspace, id, actor, "cancel_requested", "", false)
}

func (s *Store) RecoverExecution(ctx context.Context, workspace, id, actor, reason string) error {
	if len(reason) < 10 || len(reason) > 1000 {
		return fmt.Errorf("%w: document recovery in 10–1000 characters", ErrValidation)
	}
	return s.changeExecution(ctx, workspace, id, actor, "recovered", reason, true)
}
