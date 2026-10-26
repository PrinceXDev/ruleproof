# Spec: Endpoint coverage ("the endpoint you forgot")

## Problem

A rule can be tested perfectly and still miss the endpoint that leaks. Access-control
bugs usually live on the endpoint nobody wrote a rule for — an export, a download, a
bulk action — not on the one everyone was looking at.

## What it does

RuleProof reads the target API's OpenAPI spec and maps the approved rule onto it:

- **Covered** — an object-level operation the plan has checks for, with the rule sentence it came from.
- **Uncovered** — an object-level operation the rule says nothing about. RuleProof shows a
  suggested sentence; the user adds it (or dictates their own) and generates a new revision.

Only operations with an object ID in the path (`/assets/{id}...`) are in scope — those are
where object-level authorization (BOLA) bugs live.

## Demo story

1. Speak the sample rule → 8 checks, coverage shows **2 of 3 endpoints covered**.
   `GET /assets/{id}/export` is flagged as uncovered.
2. Click **Add to rule** (or dictate) → "Neither role can export another tenant's assets."
3. New revision → 12 checks, 3 of 3 covered → approve → run on the seeded defect:
   cross-tenant export leaks tenant B's data. Corrected API: 12 passed.

## Scope

| In | Out |
|---|---|
| OpenAPI 3 spec shipped with the bundled fixture | Uploading or fetching arbitrary specs |
| Action inferred from method + trailing path segment | Request bodies, query params, auth schemes |
| New `export` action in the parser vocabulary | General action vocabulary |
| Coverage panel on the Review step | Coverage in CI output (later) |

## Design

- `internal/assets/openapi.json` — embedded spec for the fixture (read, update, export).
- `internal/assets` — new `GET /assets/{id}/export`; the seeded defect skips the tenant check
  on it, the corrected fixture enforces it.
- `internal/rules` — `export`/`download` vocabulary. Export cases are added only when the rule
  mentions export, so existing 8-case plans and approvals are unchanged. Cross-tenant export
  is always denied; own-tenant export is allowed unless a sentence negates it.
  `rules.CasePath` replaces the hard-coded `/assets/{id}` path in the store and CI.
- `internal/coverage` — `Analyze(spec, cases, ruleText)` returns each operation with
  `covered`, check count, source snippet and, when uncovered, a suggested sentence.
- `GET /api/plans/{id}/coverage` and `GET /api/fixtures/openapi.json`.
- Web: `CoveragePanel` on the Review screen; **Add to rule** appends the suggestion and
  returns to Explain for editing or dictation.

## Done when

- Sample rule shows 2/3 covered with export flagged; adding the suggested sentence yields
  12 cases, 3/3 covered; seeded defect fails the 2 cross-tenant reads and 2 cross-tenant exports;
  corrected passes 12/12.
- Existing tests, the example CI bundle and its workflow still pass unchanged.
