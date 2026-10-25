# RuleProof

Speak an access rule, review the test cases it produces, approve them, then watch whether an API actually enforces them — with request/response evidence for every mismatch.

> Example: "Viewers can read assets in their own tenant. Editors can also update them. Neither role can access another tenant's assets."

A passing matrix means the approved scenarios passed. It does not prove the whole application is secure.

## What's implemented

**Backend (Go)**

- **Bounded rule parser** (`internal/rules`) — turns reviewed free text into an explicit 8-case test plan (viewer/editor × read/update × own/other tenant) using a fixed, known vocabulary. Sentence-scoped analysis (not whole-text keyword co-occurrence) so unrelated clauses are never conflated. Anything outside its vocabulary is surfaced as a visible, reviewer-acknowledgeable assumption instead of being silently guessed, and every extracted concept carries the source sentence it came from.
- **Synthetic asset API fixture** (`internal/assets`) — a project/tenant-scoped asset API with two modes: `fixed` (correct) and `broken` (a seeded defect: the cross-tenant ownership check is skipped on reads, so a UI-hidden action can still be bypassed at the API).
- **HTTP runner** (`internal/check`) — issues the approved requests with per-request timeouts, exact status matching (a 500 or redirect never silently counts as a denial), and captures the (synthetic, non-sensitive) response body as evidence — credentials are never captured.
- **Persistence** (`internal/store`) — plans are immutable: revising wording or editing an expected outcome always creates a new child plan linked into the same lineage, so an approval can never silently apply to a changed rule. Runs persist can be replayed/compared across the whole revision history. Works on embedded SQLite out of the box; set `DATABASE_URL` to a `postgres://` DSN to run on PostgreSQL instead — the same SQL runs on either via `sqlx` placeholder rebinding.
- **API server** (`internal/api`, `cmd/server`) — explain → revise → edit → acknowledge → approve → run → history → export, all over a small REST surface with structured JSON errors.

**Frontend (Next.js + TypeScript + Tailwind + GSAP)**

- A full "Evidence Studio" design system: dark graphite/ivory palette with an electric-lime action accent, Geist type, tabular numerals, an app shell (sidebar, top bar, workflow stepper).
- **Explain** — requirement editor with a fixture-vocabulary reference, extracted concepts with source-sentence provenance, and clarification prompts for anything the parser couldn't resolve.
- **Review** — the 8-row permission matrix with per-row editable expectations, expandable request details, and a sticky approval bar. Editing anything after approval creates a new revision and visibly invalidates the old approval.
- **Verify** — run the approved plan against either fixture, see per-case Passed/Failed/Error, and open the evidence inspector on any row.
- **Evidence inspector** — an accessible drawer (focus trap, Escape to close, focus restoration, full-width on mobile) with the requirement excerpt, plan/revision identifiers, expected vs. actual, redacted request headers, syntax-highlighted response body, a plain-language explanation of cross-tenant leaks, and copy/download actions.
- **Run history** and **Fixtures** sections, GSAP-driven entrance/stagger/Flip transitions (all gated behind `prefers-reduced-motion`), and a responsive layout from 1440px down to 390px (mobile card lists instead of tables, an overlay nav drawer instead of a fixed sidebar).
- **CLI demo** (`cmd/ruleproof`) — the original standalone invoice-tenant fixture, kept as a minimal Go-only example independent of the web app.

## Run it

Terminal 1 — API + fixtures (SQLite by default; set `DATABASE_URL=postgres://...` to use Postgres instead):

```sh
go run ./cmd/server
```

Terminal 2 — web UI:

```sh
cd web
npm install   # first time only
npm run dev
```

Open http://localhost:3000, approve the sample rule, then switch between "Seeded defect" and "Corrected" to see the cross-tenant leak and its fix.

Tests:

```sh
go test ./...               # backend: store, api, rules, assets, check
cd web && npx tsc --noEmit  # frontend typecheck
cd web && npx eslint .      # frontend lint
```

## Product contract

1. User explains the rule in plain language (no simulated microphone UI — dictate into the normal textarea with Wispr, or type).
2. The bounded parser proposes a matrix and lists any assumptions it had to make; assumptions must be acknowledged before approval.
3. The user reviews, can edit any expected outcome, and approves the exact revision — any later edit invalidates that approval and requires re-approval.
4. The approved plan runs against a chosen fixture; every result links back to its expectation, the raw request, and the captured response.

## Scope boundaries

- Two fixed identities (editor/viewer in tenant A) and two fixed assets (tenant A/B) — the parser's vocabulary is intentionally small for this demo, not a general policy language.
- Execution only ever targets the two bundled synthetic fixtures; there is no arbitrary-URL testing.
- No authentication or team approvals yet — see the research/plan document for the full roadmap.
- `Access-Control-Allow-Origin` defaults to `*` for local development (the Next.js dev server proxies `/api/*` server-side, so the browser never calls port 8080 cross-origin anyway). Set `RULEPROOF_ALLOWED_ORIGIN` to a specific origin before any real deployment. Request bodies are capped at 1MB and the HTTP server sets read/write/idle timeouts.

## Two-minute demo outline

1. Explain the recurring problem: checking who can actually access what, beyond what the UI shows.
2. Dictate the rule, review the generated matrix, approve it.
3. Run against the seeded-defect fixture — reveal the cross-tenant read leak with evidence.
4. Switch to the corrected fixture with the same approved plan — all eight cases pass.
5. Show genuine Wispr build usage and the Insights usage card.

Built for **No Hands: The Wispr Challenge** (WeMakeDevs × Wispr Flow). Official challenge: https://www.wemakedevs.org/wispr
