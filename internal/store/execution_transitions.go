package store

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// FinishExecution commits evidence and releases only a known-complete run. A
// cancellation racing completion wins conservatively and keeps the reservation.
func (s *Store) FinishExecution(ctx context.Context, workspace, id string, evidence []byte, interrupted bool) error {
	summary, err := summarizeEvidence(evidence)
	if err != nil {
		return err
	}
	tx, err := s.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	status, recovery := "completed", 0
	if interrupted {
		status, recovery = "interrupted", 1
	}
	res, err := tx.ExecContext(ctx, s.db.Rebind(`UPDATE executions SET status=CASE WHEN status='cancelling' THEN 'cancelled' ELSE ? END, recovery_required=CASE WHEN status='cancelling' THEN 1 ELSE ? END, evidence=?,summary=?,current_case='' WHERE workspace=? AND id=? AND status IN ('running','cancelling') AND deadline>?`), status, recovery, string(evidence), summary, workspace, id, time.Now().UnixMilli())
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n != 1 {
		return ErrConflict
	}
	e, err := scanExecution(tx.QueryRowContext(ctx, s.db.Rebind(`SELECT `+executionColumns+` FROM executions WHERE workspace=? AND id=?`), workspace, id))
	if err != nil {
		return err
	}
	if !e.RecoveryRequired {
		if _, err = tx.ExecContext(ctx, s.db.Rebind(`DELETE FROM execution_reservations WHERE workspace=? AND execution_id=?`), workspace, id); err != nil {
			return err
		}
	}
	kind := "run"
	if e.Status != "completed" {
		kind = "execution_" + e.Status
	}
	_, err = tx.ExecContext(ctx, s.db.Rebind(`INSERT INTO suite_events (id,workspace,revision_id,actor,kind,content,created_at) VALUES (?,?,?,?,?,?,?)`), uuid.NewString(), workspace, e.RevisionID, e.Actor, kind, string(evidence), time.Now().UTC().Format(time.RFC3339Nano))
	if err != nil {
		return err
	}
	return tx.Commit()
}

func (s *Store) changeExecution(ctx context.Context, workspace, id, actor, kind, reason string, recover bool) error {
	tx, err := s.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	query := `UPDATE executions SET status='cancelling' WHERE workspace=? AND id=? AND status='running' AND deadline>?`
	if recover {
		query = `UPDATE executions SET status=CASE WHEN status IN ('running','cancelling') THEN 'interrupted' ELSE status END,recovery_required=0 WHERE workspace=? AND id=? AND recovery_required=1 AND deadline<=?`
	}
	res, err := tx.ExecContext(ctx, s.db.Rebind(query), workspace, id, time.Now().UnixMilli())
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	e, err := scanExecution(tx.QueryRowContext(ctx, s.db.Rebind(`SELECT `+executionColumns+` FROM executions WHERE workspace=? AND id=?`), workspace, id))
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrConflict
	}
	if recover {
		if _, err = tx.ExecContext(ctx, s.db.Rebind(`DELETE FROM execution_reservations WHERE workspace=? AND execution_id=?`), workspace, id); err != nil {
			return err
		}
	}
	content, _ := json.Marshal(map[string]string{"executionId": id, "reason": reason})
	_, err = tx.ExecContext(ctx, s.db.Rebind(`INSERT INTO suite_events (id,workspace,revision_id,actor,kind,content,created_at) VALUES (?,?,?,?,?,?,?)`), uuid.NewString(), workspace, e.RevisionID, actor, kind, string(content), time.Now().UTC().Format(time.RFC3339Nano))
	if err != nil {
		return err
	}
	return tx.Commit()
}
