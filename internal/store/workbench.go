package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Revision struct {
	ID         string          `json:"id"`
	ParentID   string          `json:"parentId,omitempty"`
	Content    json.RawMessage `json:"suite"`
	Hash       string          `json:"hash"`
	Author     string          `json:"author"`
	ApprovedBy string          `json:"approvedBy,omitempty"`
	CreatedAt  string          `json:"createdAt"`
}
type AuditEvent struct {
	ID         string          `json:"id"`
	RevisionID string          `json:"revisionId"`
	Actor      string          `json:"actor"`
	Kind       string          `json:"kind"`
	Content    json.RawMessage `json:"content"`
	CreatedAt  string          `json:"createdAt"`
}

func (s *Store) SaveRevision(ctx context.Context, workspace, parent, author, hash string, content []byte) (*Revision, error) {
	r := &Revision{ID: uuid.NewString(), ParentID: parent, Content: content, Hash: hash, Author: author, CreatedAt: time.Now().UTC().Format(time.RFC3339Nano)}
	tx, err := s.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()
	if parent != "" {
		var exists string
		if err := tx.GetContext(ctx, &exists, s.db.Rebind(`SELECT id FROM suite_revisions WHERE id=? AND workspace=?`), parent, workspace); err != nil {
			return nil, ErrNotFound
		}
	}
	_, err = tx.ExecContext(ctx, s.db.Rebind(`INSERT INTO suite_revisions (id,workspace,parent_id,content,hash,author,approved_by,created_at) VALUES (?,?,?,?,?,?,?,?)`), r.ID, workspace, parent, string(content), hash, author, "", r.CreatedAt)
	if err != nil {
		return nil, err
	}
	_, err = tx.ExecContext(ctx, s.db.Rebind(`INSERT INTO suite_events (id,workspace,revision_id,actor,kind,content,created_at) VALUES (?,?,?,?,?,?,?)`), uuid.NewString(), workspace, r.ID, author, "created", `{}`, r.CreatedAt)
	if err != nil {
		return nil, err
	}
	return r, tx.Commit()
}
func (s *Store) GetRevision(ctx context.Context, workspace, id string) (*Revision, error) {
	var r Revision
	var content string
	err := s.queryRow(ctx, `SELECT id,parent_id,content,hash,author,approved_by,created_at FROM suite_revisions WHERE workspace=? AND id=?`, workspace, id).Scan(&r.ID, &r.ParentID, &content, &r.Hash, &r.Author, &r.ApprovedBy, &r.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	r.Content = json.RawMessage(content)
	return &r, err
}
func (s *Store) ListRevisions(ctx context.Context, workspace string) ([]Revision, error) {
	rows, err := s.query(ctx, `SELECT id,parent_id,content,hash,author,approved_by,created_at FROM suite_revisions WHERE workspace=? ORDER BY created_at DESC LIMIT 100`, workspace)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := []Revision{}
	for rows.Next() {
		var r Revision
		var content string
		if err := rows.Scan(&r.ID, &r.ParentID, &content, &r.Hash, &r.Author, &r.ApprovedBy, &r.CreatedAt); err != nil {
			return nil, err
		}
		r.Content = json.RawMessage(content)
		result = append(result, r)
	}
	return result, rows.Err()
}
func (s *Store) ApproveRevision(ctx context.Context, workspace, id, reviewer string, separate bool) (*Revision, error) {
	r, err := s.GetRevision(ctx, workspace, id)
	if err != nil {
		return nil, err
	}
	if separate && r.Author == reviewer {
		return nil, fmt.Errorf("%w: a different reviewer must approve this revision", ErrValidation)
	}
	tx, err := s.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()
	res, err := tx.ExecContext(ctx, s.db.Rebind(`UPDATE suite_revisions SET approved_by=? WHERE workspace=? AND id=? AND approved_by=''`), reviewer, workspace, id)
	if err != nil {
		return nil, err
	}
	count, _ := res.RowsAffected()
	if count > 0 {
		_, err = tx.ExecContext(ctx, s.db.Rebind(`INSERT INTO suite_events (id,workspace,revision_id,actor,kind,content,created_at) VALUES (?,?,?,?,?,?,?)`), uuid.NewString(), workspace, id, reviewer, "approved", `{}`, time.Now().UTC().Format(time.RFC3339Nano))
		if err != nil {
			return nil, err
		}
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return s.GetRevision(ctx, workspace, id)
}
func (s *Store) RecordEvent(ctx context.Context, workspace, id, actor, kind string, content []byte) (*AuditEvent, error) {
	if _, err := s.GetRevision(ctx, workspace, id); err != nil {
		return nil, err
	}
	e := &AuditEvent{ID: uuid.NewString(), RevisionID: id, Actor: actor, Kind: kind, Content: content, CreatedAt: time.Now().UTC().Format(time.RFC3339Nano)}
	_, err := s.exec(ctx, `INSERT INTO suite_events (id,workspace,revision_id,actor,kind,content,created_at) VALUES (?,?,?,?,?,?,?)`, e.ID, workspace, id, actor, kind, string(content), e.CreatedAt)
	return e, err
}
func (s *Store) ListEvents(ctx context.Context, workspace, id string) ([]AuditEvent, error) {
	rows, err := s.query(ctx, `SELECT id,revision_id,actor,kind,content,created_at FROM suite_events WHERE workspace=? AND revision_id=? ORDER BY created_at DESC LIMIT 100`, workspace, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	events := []AuditEvent{}
	for rows.Next() {
		var e AuditEvent
		var content string
		if err := rows.Scan(&e.ID, &e.RevisionID, &e.Actor, &e.Kind, &content, &e.CreatedAt); err != nil {
			return nil, err
		}
		e.Content = json.RawMessage(content)
		events = append(events, e)
	}
	return events, rows.Err()
}
