// Package store persists RuleProof's plans and runs behind the standard
// database/sql interface. It runs on embedded SQLite by default (zero setup)
// and on PostgreSQL when given a postgres:// DSN — the same query text works
// against either, via sqlx's placeholder rebinding. Plans are immutable once
// created: revising wording or editing an expected outcome always produces a
// new child plan rather than mutating history, so an approval and the runs
// executed against it can never silently drift.
package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	_ "github.com/jackc/pgx/v5/stdlib"
	_ "modernc.org/sqlite"

	"ruleproof/internal/bypass"
	"ruleproof/internal/check"
	"ruleproof/internal/rules"
)

var (
	ErrNotFound   = errors.New("not found")
	ErrConflict   = errors.New("conflict")
	ErrValidation = errors.New("validation")
)

// PlanKind records why a plan exists, for the lineage/history view.
type PlanKind string

const (
	KindRoot     PlanKind = "root"     // first interpretation of a freshly dictated rule
	KindRevision PlanKind = "revision" // the rule's wording was re-dictated/edited
	KindEdit     PlanKind = "edit"     // a reviewer overrode one or more expected outcomes
)

type Plan struct {
	ID                      string
	RootPlanID              string
	ParentPlanID            string // empty for the root of a lineage
	Kind                    PlanKind
	RuleText                string
	Cases                   []rules.Case
	Assumptions             []string
	Hash                    string
	AssumptionsAcknowledged bool
	Approved                bool
	ApprovedAt              *time.Time
	CreatedAt               time.Time
}

type Run struct {
	ID         string
	PlanID     string
	PlanHash   string
	Fixture    string
	Results    []check.Result
	PassCount  int
	FailCount  int
	ErrorCount int
	CreatedAt  time.Time
	// Variants are bypass attempts derived from the plan's deny cases, empty
	// unless the run asked for them. They never count toward the totals above.
	Variants      []check.Result
	BypassCatalog string // catalog version the variants came from; "" when not run
}

// allowedStatuses is the bounded, explicit set of outcomes a reviewer may
// assign to a case. Anything else is rejected rather than silently accepted.
var allowedStatuses = map[int]string{
	200: "allow",
	401: "unauthenticated",
	403: "deny",
	404: "not found",
}

type Store struct {
	db     *sqlx.DB
	driver string
}

// Open connects to dsn. A postgres:// or postgresql:// DSN uses the pure-Go
// pgx driver; anything else (including empty, which defaults to a local
// file) is treated as a SQLite path. Every query in this package is written
// with '?' placeholders and rebound per-driver via sqlx, so the same SQL
// runs unchanged against either engine.
func Open(dsn string) (*Store, error) {
	driver := "sqlite"
	connStr := dsn
	if connStr == "" {
		connStr = "ruleproof.db"
	}
	if strings.HasPrefix(connStr, "postgres://") || strings.HasPrefix(connStr, "postgresql://") {
		driver = "pgx"
	} else {
		connStr += "?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)&_pragma=foreign_keys(1)"
	}

	db, err := sqlx.Open(driver, connStr)
	if err != nil {
		return nil, err
	}
	if driver == "sqlite" {
		db.SetMaxOpenConns(1) // modernc.org/sqlite: keep writes serialized, simplest correct option for this scale
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &Store{db: db, driver: driver}
	if err := s.migrate(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *Store) Close() error { return s.db.Close() }

// Driver reports which engine this store is backed by ("sqlite" or "pgx"),
// for surfacing in diagnostics.
func (s *Store) Driver() string { return s.driver }

// migrations are applied in order and recorded in schema_migrations, so a
// column added later reaches databases created earlier; version N is
// migrations[N-1]. Never edit or reorder an applied entry, only append.
// Each statement is its own entry: pgx's default extended query protocol
// rejects multiple commands in one Exec, while SQLite tolerates either.
var migrations = [][]string{
	// 1: initial schema. IF NOT EXISTS lets it adopt databases created before
	// migrations were versioned.
	{`CREATE TABLE IF NOT EXISTS plans (
	id TEXT PRIMARY KEY,
	root_plan_id TEXT NOT NULL,
	parent_plan_id TEXT NOT NULL DEFAULT '',
	kind TEXT NOT NULL,
	rule_text TEXT NOT NULL,
	cases_json TEXT NOT NULL,
	assumptions_json TEXT NOT NULL,
	hash TEXT NOT NULL,
	assumptions_acknowledged INTEGER NOT NULL DEFAULT 0,
	approved INTEGER NOT NULL DEFAULT 0,
	approved_at TEXT,
	created_at TEXT NOT NULL
)`,
		`CREATE INDEX IF NOT EXISTS idx_plans_root ON plans(root_plan_id)`,
		`CREATE INDEX IF NOT EXISTS idx_plans_parent ON plans(parent_plan_id)`,
		`CREATE TABLE IF NOT EXISTS runs (
	id TEXT PRIMARY KEY,
	plan_id TEXT NOT NULL,
	plan_hash TEXT NOT NULL,
	fixture TEXT NOT NULL,
	results_json TEXT NOT NULL,
	pass_count INTEGER NOT NULL,
	fail_count INTEGER NOT NULL,
	error_count INTEGER NOT NULL,
	created_at TEXT NOT NULL
)`,
		`CREATE INDEX IF NOT EXISTS idx_runs_plan ON runs(plan_id)`},
	// 2: bypass attempts, kept apart from the approved checks.
	{`ALTER TABLE runs ADD COLUMN variants_json TEXT NOT NULL DEFAULT '[]'`,
		`ALTER TABLE runs ADD COLUMN bypass_catalog TEXT NOT NULL DEFAULT ''`},
}

func (s *Store) migrate() error {
	if _, err := s.db.Exec(`CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)`); err != nil {
		return fmt.Errorf("migrate: %w", err)
	}
	current, err := s.SchemaVersion(context.Background())
	if err != nil {
		return fmt.Errorf("migrate: read version: %w", err)
	}
	for i := current; i < len(migrations); i++ {
		if err := s.applyMigration(i+1, migrations[i]); err != nil {
			return err
		}
	}
	return nil
}

// applyMigration runs one version in a transaction (DDL is transactional on
// both engines), so a failed step leaves the version unrecorded and retryable.
func (s *Store) applyMigration(version int, stmts []string) error {
	tx, err := s.db.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	for _, stmt := range stmts {
		if _, err := tx.Exec(stmt); err != nil {
			return fmt.Errorf("migrate %d: %s: %w", version, stmt, err)
		}
	}
	if _, err := tx.Exec(s.db.Rebind(`INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)`), version, time.Now().UTC().Format(time.RFC3339Nano)); err != nil {
		return fmt.Errorf("migrate %d: %w", version, err)
	}
	return tx.Commit()
}

// SchemaVersion reports the highest applied migration.
func (s *Store) SchemaVersion(ctx context.Context) (int, error) {
	var v int
	err := s.db.GetContext(ctx, &v, `SELECT COALESCE(MAX(version), 0) FROM schema_migrations`)
	return v, err
}

// exec/queryRow/query rebind '?' placeholders for the active driver (a
// no-op for SQLite, '?' -> '$1'... for Postgres) before delegating.
func (s *Store) exec(ctx context.Context, query string, args ...any) (sql.Result, error) {
	return s.db.ExecContext(ctx, s.db.Rebind(query), args...)
}

func (s *Store) queryRow(ctx context.Context, query string, args ...any) *sql.Row {
	return s.db.QueryRowContext(ctx, s.db.Rebind(query), args...)
}

func (s *Store) query(ctx context.Context, query string, args ...any) (*sql.Rows, error) {
	return s.db.QueryContext(ctx, s.db.Rebind(query), args...)
}

// caseDTO is the on-disk shape of a case. It keeps the fixture token
// (a public demo label, never a real credential) so an approved plan can be
// re-executed after a restart, without exposing that token through the
// rules.Case JSON tag used by HTTP responses.
type caseDTO struct {
	ID         string `json:"id"`
	Actor      string `json:"actor"`
	Role       string `json:"role"`
	Action     string `json:"action"`
	Method     string `json:"method"`
	Scope      string `json:"scope"`
	AssetID    string `json:"assetId"`
	AssetOwner string `json:"assetOwner"`
	Want       int    `json:"want"`
	WantLabel  string `json:"wantLabel"`
	Token      string `json:"token"`
}

func encodeCases(cases []rules.Case) (string, error) {
	dtos := make([]caseDTO, len(cases))
	for i, c := range cases {
		dtos[i] = caseDTO{c.ID, c.Actor, c.Role, c.Action, c.Method, c.Scope, c.AssetID, c.AssetOwner, c.Want, c.WantLabel, c.Token}
	}
	b, err := json.Marshal(dtos)
	return string(b), err
}

func decodeCases(raw string) ([]rules.Case, error) {
	var dtos []caseDTO
	if err := json.Unmarshal([]byte(raw), &dtos); err != nil {
		return nil, err
	}
	cases := make([]rules.Case, len(dtos))
	for i, d := range dtos {
		cases[i] = rules.Case{
			ID: d.ID, Actor: d.Actor, Role: d.Role, Action: d.Action, Method: d.Method, Scope: d.Scope,
			AssetID: d.AssetID, AssetOwner: d.AssetOwner, Want: d.Want, WantLabel: d.WantLabel, Token: d.Token,
		}
	}
	return cases, nil
}

// CreateRootPlan interprets freshly dictated or typed text into a brand new
// plan lineage.
func (s *Store) CreateRootPlan(ctx context.Context, text string) (*Plan, error) {
	if len(text) == 0 {
		return nil, fmt.Errorf("%w: text is required", ErrValidation)
	}
	parsed := rules.Parse(text)
	id := uuid.NewString()
	p := &Plan{
		ID: id, RootPlanID: id, Kind: KindRoot,
		RuleText: parsed.RuleText, Cases: parsed.Cases, Assumptions: parsed.Assumptions,
		Hash: rules.Hash(parsed.Cases), CreatedAt: time.Now().UTC(),
	}
	if err := s.insertPlan(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

// RevisePlan re-interprets new wording for the same rule, keeping it in the
// same lineage as its parent so the history view can show how the rule's
// phrasing evolved.
func (s *Store) RevisePlan(ctx context.Context, parentID, text string) (*Plan, error) {
	if len(text) == 0 {
		return nil, fmt.Errorf("%w: text is required", ErrValidation)
	}
	parent, err := s.GetPlan(ctx, parentID)
	if err != nil {
		return nil, err
	}
	parsed := rules.Parse(text)
	id := uuid.NewString()
	p := &Plan{
		ID: id, RootPlanID: parent.RootPlanID, ParentPlanID: parent.ID, Kind: KindRevision,
		RuleText: parsed.RuleText, Cases: parsed.Cases, Assumptions: parsed.Assumptions,
		Hash: rules.Hash(parsed.Cases), CreatedAt: time.Now().UTC(),
	}
	if err := s.insertPlan(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

// EditCases overrides one or more expected outcomes on the given plan,
// producing a new child plan. overrides maps case ID to the new expected
// HTTP status; both must be from the bounded, known vocabulary.
func (s *Store) EditCases(ctx context.Context, parentID string, overrides map[string]int) (*Plan, error) {
	parent, err := s.GetPlan(ctx, parentID)
	if err != nil {
		return nil, err
	}
	known := make(map[string]int, len(parent.Cases))
	for i, c := range parent.Cases {
		known[c.ID] = i
	}
	cases := make([]rules.Case, len(parent.Cases))
	copy(cases, parent.Cases)
	changed := false
	for caseID, want := range overrides {
		idx, ok := known[caseID]
		if !ok {
			return nil, fmt.Errorf("%w: unknown case id %q", ErrValidation, caseID)
		}
		label, ok := allowedStatuses[want]
		if !ok {
			return nil, fmt.Errorf("%w: unsupported expected status %d", ErrValidation, want)
		}
		if cases[idx].Want != want {
			changed = true
		}
		cases[idx].Want = want
		cases[idx].WantLabel = label
	}
	if !changed {
		return parent, nil
	}
	id := uuid.NewString()
	p := &Plan{
		ID: id, RootPlanID: parent.RootPlanID, ParentPlanID: parent.ID, Kind: KindEdit,
		RuleText: parent.RuleText, Cases: cases, Assumptions: parent.Assumptions,
		Hash: rules.Hash(cases), AssumptionsAcknowledged: parent.AssumptionsAcknowledged, CreatedAt: time.Now().UTC(),
	}
	if err := s.insertPlan(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *Store) insertPlan(ctx context.Context, p *Plan) error {
	casesJSON, err := encodeCases(p.Cases)
	if err != nil {
		return err
	}
	assumptionsJSON, err := json.Marshal(p.Assumptions)
	if err != nil {
		return err
	}
	_, err = s.exec(ctx, `INSERT INTO plans
		(id, root_plan_id, parent_plan_id, kind, rule_text, cases_json, assumptions_json, hash, assumptions_acknowledged, approved, approved_at, created_at)
		VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
		p.ID, p.RootPlanID, p.ParentPlanID, string(p.Kind), p.RuleText, casesJSON, string(assumptionsJSON), p.Hash,
		boolToInt(p.AssumptionsAcknowledged), boolToInt(p.Approved), nullableTime(p.ApprovedAt), p.CreatedAt.Format(time.RFC3339Nano))
	return err
}

func (s *Store) GetPlan(ctx context.Context, id string) (*Plan, error) {
	row := s.queryRow(ctx, `SELECT id, root_plan_id, parent_plan_id, kind, rule_text, cases_json, assumptions_json, hash, assumptions_acknowledged, approved, approved_at, created_at FROM plans WHERE id = ?`, id)
	return scanPlan(row)
}

func scanPlan(row *sql.Row) (*Plan, error) {
	var (
		p                       Plan
		kind                    string
		casesJSON, assumptionsJ string
		acknowledged, approved  int
		approvedAt              sql.NullString
		createdAt               string
	)
	if err := row.Scan(&p.ID, &p.RootPlanID, &p.ParentPlanID, &kind, &p.RuleText, &casesJSON, &assumptionsJ, &p.Hash, &acknowledged, &approved, &approvedAt, &createdAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	cases, err := decodeCases(casesJSON)
	if err != nil {
		return nil, err
	}
	var assumptions []string
	if err := json.Unmarshal([]byte(assumptionsJ), &assumptions); err != nil {
		return nil, err
	}
	p.Kind = PlanKind(kind)
	p.Cases = cases
	p.Assumptions = assumptions
	p.AssumptionsAcknowledged = acknowledged != 0
	p.Approved = approved != 0
	if approvedAt.Valid {
		t, err := time.Parse(time.RFC3339Nano, approvedAt.String)
		if err == nil {
			p.ApprovedAt = &t
		}
	}
	t, err := time.Parse(time.RFC3339Nano, createdAt)
	if err == nil {
		p.CreatedAt = t
	}
	return &p, nil
}

func (s *Store) AcknowledgeAssumptions(ctx context.Context, id string) (*Plan, error) {
	res, err := s.exec(ctx, `UPDATE plans SET assumptions_acknowledged = 1 WHERE id = ?`, id)
	if err != nil {
		return nil, err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return nil, ErrNotFound
	}
	return s.GetPlan(ctx, id)
}

func (s *Store) ApprovePlan(ctx context.Context, id string) (*Plan, error) {
	p, err := s.GetPlan(ctx, id)
	if err != nil {
		return nil, err
	}
	if p.Approved {
		return p, nil
	}
	if len(p.Assumptions) > 0 && !p.AssumptionsAcknowledged {
		return nil, fmt.Errorf("%w: assumptions must be acknowledged before approval", ErrValidation)
	}
	now := time.Now().UTC()
	if _, err := s.exec(ctx, `UPDATE plans SET approved = 1, approved_at = ? WHERE id = ?`, now.Format(time.RFC3339Nano), id); err != nil {
		return nil, err
	}
	p.Approved = true
	p.ApprovedAt = &now
	return p, nil
}

// ListLineage returns every plan sharing the given root, oldest first — the
// full revision/edit history of one dictated rule.
func (s *Store) ListLineage(ctx context.Context, rootID string) ([]*Plan, error) {
	rows, err := s.query(ctx, `SELECT id, root_plan_id, parent_plan_id, kind, rule_text, cases_json, assumptions_json, hash, assumptions_acknowledged, approved, approved_at, created_at FROM plans WHERE root_plan_id = ? ORDER BY created_at ASC`, rootID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var plans []*Plan
	for rows.Next() {
		p, err := scanPlanRows(rows)
		if err != nil {
			return nil, err
		}
		plans = append(plans, p)
	}
	return plans, rows.Err()
}

func scanPlanRows(rows *sql.Rows) (*Plan, error) {
	var (
		p                       Plan
		kind                    string
		casesJSON, assumptionsJ string
		acknowledged, approved  int
		approvedAt              sql.NullString
		createdAt               string
	)
	if err := rows.Scan(&p.ID, &p.RootPlanID, &p.ParentPlanID, &kind, &p.RuleText, &casesJSON, &assumptionsJ, &p.Hash, &acknowledged, &approved, &approvedAt, &createdAt); err != nil {
		return nil, err
	}
	cases, err := decodeCases(casesJSON)
	if err != nil {
		return nil, err
	}
	var assumptions []string
	if err := json.Unmarshal([]byte(assumptionsJ), &assumptions); err != nil {
		return nil, err
	}
	p.Kind = PlanKind(kind)
	p.Cases = cases
	p.Assumptions = assumptions
	p.AssumptionsAcknowledged = acknowledged != 0
	p.Approved = approved != 0
	if approvedAt.Valid {
		if t, err := time.Parse(time.RFC3339Nano, approvedAt.String); err == nil {
			p.ApprovedAt = &t
		}
	}
	if t, err := time.Parse(time.RFC3339Nano, createdAt); err == nil {
		p.CreatedAt = t
	}
	return &p, nil
}

// RunOptions tunes a run beyond the approved plan itself.
type RunOptions struct {
	Bypass bool // also try bypass variants of every deny case
}

// RunPlan executes an approved plan's cases against baseURL and persists the
// evidence. fixture is a label only ("broken"/"partial"/"fixed"); baseURL
// decides what actually gets called.
func (s *Store) RunPlan(ctx context.Context, planID, fixture, baseURL string, opts RunOptions) (*Run, error) {
	p, err := s.GetPlan(ctx, planID)
	if err != nil {
		return nil, err
	}
	if !p.Approved {
		return nil, fmt.Errorf("%w: plan is not approved", ErrConflict)
	}
	cases := make([]check.Case, 0, len(p.Cases))
	for _, c := range p.Cases {
		cases = append(cases, check.Case{
			ID: c.ID, Rule: p.RuleText, Actor: c.Actor, Method: c.Method,
			Path: rules.CasePath(c), Token: c.Token, Want: c.Want,
		})
	}
	results := check.Run(ctx, baseURL, cases)
	pass, fail, errCount := check.Tally(results)
	run := &Run{
		ID: uuid.NewString(), PlanID: p.ID, PlanHash: p.Hash, Fixture: fixture,
		Results: results, PassCount: pass, FailCount: fail, ErrorCount: errCount, CreatedAt: time.Now().UTC(),
		Variants: []check.Result{},
	}
	if opts.Bypass {
		run.Variants = check.Run(ctx, baseURL, bypass.Expand(p.Cases, cases))
		run.BypassCatalog = bypass.Catalog
	}
	resultsJSON, err := json.Marshal(run.Results)
	if err != nil {
		return nil, err
	}
	variantsJSON, err := json.Marshal(run.Variants)
	if err != nil {
		return nil, err
	}
	_, err = s.exec(ctx, `INSERT INTO runs (`+runColumns+`) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
		run.ID, run.PlanID, run.PlanHash, run.Fixture, string(resultsJSON), run.PassCount, run.FailCount, run.ErrorCount, run.CreatedAt.Format(time.RFC3339Nano),
		string(variantsJSON), run.BypassCatalog)
	if err != nil {
		return nil, err
	}
	return run, nil
}

const runColumns = `id, plan_id, plan_hash, fixture, results_json, pass_count, fail_count, error_count, created_at, variants_json, bypass_catalog`

func (s *Store) GetRun(ctx context.Context, id string) (*Run, error) {
	row := s.queryRow(ctx, `SELECT `+runColumns+` FROM runs WHERE id = ?`, id)
	return scanRun(row)
}

// ListRunsForLineage returns every run executed against any plan in the
// given root's lineage, most recent first — the full history a reviewer
// needs to compare today's result against yesterday's, across edits.
func (s *Store) ListRunsForLineage(ctx context.Context, rootID string) ([]*Run, error) {
	rows, err := s.query(ctx, `
		SELECT r.id, r.plan_id, r.plan_hash, r.fixture, r.results_json, r.pass_count, r.fail_count, r.error_count, r.created_at, r.variants_json, r.bypass_catalog
		FROM runs r JOIN plans p ON p.id = r.plan_id
		WHERE p.root_plan_id = ?
		ORDER BY r.created_at DESC`, rootID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var runs []*Run
	for rows.Next() {
		r, err := scanRunRows(rows)
		if err != nil {
			return nil, err
		}
		runs = append(runs, r)
	}
	return runs, rows.Err()
}

func scanRun(row *sql.Row) (*Run, error) {
	r, err := scanRunFrom(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return r, err
}

func scanRunRows(rows *sql.Rows) (*Run, error) { return scanRunFrom(rows) }

func scanRunFrom(sc interface{ Scan(...any) error }) (*Run, error) {
	var r Run
	var resultsJSON, variantsJSON, createdAt string
	if err := sc.Scan(&r.ID, &r.PlanID, &r.PlanHash, &r.Fixture, &resultsJSON, &r.PassCount, &r.FailCount, &r.ErrorCount, &createdAt, &variantsJSON, &r.BypassCatalog); err != nil {
		return nil, err
	}
	if err := json.Unmarshal([]byte(resultsJSON), &r.Results); err != nil {
		return nil, err
	}
	if err := json.Unmarshal([]byte(variantsJSON), &r.Variants); err != nil {
		return nil, err
	}
	if t, err := time.Parse(time.RFC3339Nano, createdAt); err == nil {
		r.CreatedAt = t
	}
	return &r, nil
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}

func nullableTime(t *time.Time) any {
	if t == nil {
		return nil
	}
	return t.Format(time.RFC3339Nano)
}
