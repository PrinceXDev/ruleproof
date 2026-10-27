<div align="center">

<img src="docs/media/logo.svg" width="64" alt="RuleProof logo" />

# RuleProof

**Your UI says no. Does your API?**

Define and approve an authorization contract, test real API permissions, and trace OpenAPI changes to the checks that need review. Start with a plain-language guided demo or build a configurable suite in the authorization workbench.

[![RuleProof CI](https://github.com/PrinceXDev/ruleproof/actions/workflows/ruleproof.yml/badge.svg)](https://github.com/PrinceXDev/ruleproof/actions/workflows/ruleproof.yml)
![Go](https://img.shields.io/badge/Go-1.26-00ADD8?logo=go&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?logo=tailwindcss&logoColor=white)
![SQLite | Postgres](https://img.shields.io/badge/SQLite%20%7C%20Postgres-ready-4169E1?logo=postgresql&logoColor=white)
![Wispr Flow](https://img.shields.io/badge/Dictated%20with-Wispr%20Flow-D5F879)

<a href="docs/media/workbench-matrix.jpg"><img src="docs/media/workbench-matrix.jpg" width="708" alt="Authorization workbench permission matrix with identities, tenant scopes, exact expected statuses, and response and state assertions" /></a>

<p><sub>The current workbench: explicit permission expectations tied to a reviewed revision.</sub></p>

[Quickstart](#get-started) · [Workbench](#authorization-workbench) · [Durable runs](#durable-executions) · [Change impact](#authorization-impact-analysis) · [Screenshots](#explore-the-product) · [CI gate](#ci-gate) · [API](#api) · [Architecture](#architecture) · [Scope](#guided-demo-scope-and-limits) · [Contributing](#contributing)

</div>

---

## Why RuleProof

Authorization bugs can hide behind a missing button while the underlying API still returns protected data. RuleProof makes the question explicit — **an identity, an action, a tenant, an expected status** — and records request and response evidence when the answer is wrong.

> Example rule: _"Viewers can read assets in their own tenant. Editors can also update them. Neither role can access another tenant's assets."_

|     | Feature                            | What it does                                                                                                                                                                             |
| --- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🗣️  | **Plain-language rules**           | Type or dictate a rule with Wispr Flow. No policy language to learn.                                                                                                                     |
| 🧩  | **Bounded parser with provenance** | Extracts roles, actions and tenant scope sentence by sentence. Every concept links to the sentence it came from.                                                                         |
| ⚠️  | **Assumptions, never guesses**     | Wording outside the vocabulary becomes a visible assumption that must be acknowledged before approval.                                                                                   |
| 🧮  | **Permission matrix**              | The guided sample starts with 2 roles × 2 actions × 2 scopes. Workbench supports named identities, custom operations, and visible identity/scope coverage gaps.                          |
| ✅  | **Approve the exact revision**     | Plans are immutable. Any edit creates a new revision, and the old approval does not carry over.                                                                                          |
| 🎯  | **Exact status matching**          | Want 403, got 500? That's a failure. Crashes and redirects never pass as a "deny".                                                                                                       |
| 🔍  | **Evidence inspector**             | Rule excerpt → expectation → request (redacted headers) → response body, plus a plain-language explanation.                                                                              |
| 🗺️  | **Endpoint coverage**              | Maps the rule onto the API's OpenAPI spec and flags object-level endpoints it never mentions, with a sentence that closes the gap.                                                       |
| 🚪  | **Bypass variants**                | For every denied request, also tries HEAD, a trailing slash, an upper-case ID, a spoofed `X-Tenant-ID` header and a method override. Catches the fix that only covers the exact request. |
| 🔀  | **Revision diff**                  | Before re-approving, see word-level rule edits, every flipped expectation, new or resolved assumptions, and whether an old approval was reset.                                           |
| 🚦  | **CI gate**                        | `ruleproof-ci` re-runs an approved plan on every push and fails the build on any mismatch. Refuses unapproved or edited plans.                                                           |
| 🕓  | **Run history and replay**         | Every run is stored against the revision it tested. Compare seeded-defect vs corrected side by side.                                                                                     |
| 📦  | **Exportable evidence bundle**     | One JSON file with the rule, every revision, approvals and runs.                                                                                                                         |
| 🗄️  | **SQLite or Postgres**             | Embedded SQLite by default. Set `DATABASE_URL` and the same SQL runs on Postgres.                                                                                                        |
| 🧪  | **Response and state assertions**  | Check JSON fields and collections, or verify that a denied write left protected state unchanged.                                                                                         |
| 👥  | **Workspace review**               | Author, reviewer, and viewer access; optional independent approval; server-managed targets and credential references.                                                                    |
| 🛡️  | **Durable executions**             | Runs survive browser disconnects, deduplicate submissions, checkpoint evidence, and reserve environments across server instances sharing a database.                                     |
| 📊  | **Operational dashboard**          | Recorded run outcomes, active work, recovery status, evidence inspection, and comparisons between matching contracts, environments, and data versions.                                   |
| 🔗  | **Authorization impact analysis**  | Follow changed operations, schemas, and security schemes to affected checks, state observers, scenarios, and coverage gaps. Export the review plan with its source hashes.               |

## How it works

### Authorization workbench

Open **Studio → Workbench** for configurable identities, OpenAPI import, precise
endpoint coverage, response and state assertions, ordered scenarios, independent
team review, durable runs, and authorization impact analysis. The original guided demo remains
available under **Checks**.

1. **Define** the environment, identities, concrete requests, expected statuses, and assertions. Import an OpenAPI 3 JSON document under **API coverage**.
2. **Review** missing operations and identity/scope combinations. Save a revision and approve its exact fingerprint; a changed contract requires a new approval.
3. **Verify** against an operator-configured test API. Follow progress, cancellation, and recorded evidence under **Runs**.
4. **Assess changes** under **Change impact** before adopting a candidate specification and reviewing the next revision.

The workbench includes a dedicated CI command with OpenAPI drift gating and JUnit
reports. See the [workbench guide](docs/specs/authorization-workbench.md) for the
feature contract, team/environment configuration, execution limits, and examples.

```sh
go run ./cmd/ruleproof-suite -bundle approved-suite.json -base-url https://staging.example.com \
  -credential-env viewer-a=VIEWER_TOKEN -credential-env editor-a=EDITOR_TOKEN \
  -spec openapi-current.json -junit ruleproof-suite.xml
```

Existing legacy approvals need review and re-export after upgrading to the full
case fingerprint. Stored plans and run history are retained.

### Durable executions

Accepted workbench runs continue after the browser closes. A database-backed
reservation prevents overlapping runs against the same workspace/environment,
including across replicas sharing that database. Retrying the same request key
returns the same execution receipt. Progress and redacted evidence are stored
before the next request starts.

The **Runs** dashboard shows completed, failing, active, and recovery counts;
recorded outcome history; and per-check evidence. Regression watch compares only
completed runs with the same suite hash, environment, and nonempty data version.
The data version is operator-supplied provenance, not a verified database snapshot.

Authors and reviewers can request cancellation. A cancelled or interrupted run
may have changed the target, so its environment remains reserved until a reviewer
verifies the target and previous worker, then records a recovery decision after
the reservation deadline. Interrupted requests are never replayed automatically.
CLI executions remain operator-coordinated and do not share Studio reservations.

### Authorization impact analysis

Upload a candidate OpenAPI document in **Change impact** to compare it with a
saved suite. The report follows transitive local component references, inherited
security settings, and security scheme dependencies. Changed state-observer reads
also implicate the protected write; ordered scenarios stay together in the review
plan. Removed routes, new identity/scope gaps, and exclusions needing renewed
review remain visible.

The report distinguishes **Affected**, **Uncertain**, and **Unchanged in spec**.
Incomplete static mappings broaden review to the full suite. Analysis sends no
requests to the target, changes no saved contract, and grants no approval.
Implementation-only permission changes still require full-suite verification.
Export the report as JSON to retain its baseline suite and specification hashes.

Try [the sample candidate specification](examples/tenant-isolation-impact.openapi.json)
against the bundled tenant suite: it introduces bearer authentication on asset
reads and an uncovered search endpoint. The report identifies **2 affected
operations, 5 checks to review, and 4 identity/scope gaps** on the new operation.

### Guided demo walkthrough

<div align="center">
<img src="docs/media/how-it-works.gif" width="900" alt="Studio walkthrough: type the rule, generate checks, approve, run against the seeded defect, inspect evidence, switch to the corrected API" />
</div>

1. **Explain** — describe who can do what. The parser extracts concepts and flags anything it can't resolve.
2. **Review and approve** — see which API endpoints the rule covers, inspect the 8 proposed checks, edit any expected outcome, acknowledge assumptions, approve.
3. **Run** — send the approved requests to the _seeded-defect_ or _corrected_ fixture API.
4. **Inspect** — open any result to trace it from the rule sentence to the raw response.

With the sample rule, the seeded-defect API returns **6 passed, 2 failed** (both cross-tenant reads leak data). The same approved plan against the corrected API returns **8 passed**.

### Under the hood: guided demo

One rule, from dictation to evidence:

```mermaid
sequenceDiagram
    autonumber
    actor R as Reviewer
    participant S as Studio
    participant A as API
    participant D as Store
    participant P as Parser
    participant C as Runner
    participant F as Fixture API

    R->>S: Dictate or type the rule
    S->>A: POST /api/plans
    A->>D: CreateRootPlan(text)
    D->>P: Parse(text)
    P-->>D: cases, assumptions, concepts
    D-->>A: immutable revision + hash
    A-->>S: plan
    S->>A: GET /api/plans/:id/coverage
    A-->>S: covered endpoints and gaps
    R->>S: Edit expectations, acknowledge assumptions
    Note over S,D: Every edit creates a new revision. Approval never carries over.
    S->>A: POST /api/plans/:id/approve
    A->>D: ApprovePlan(this exact revision)
    R->>S: Run against a fixture
    S->>A: POST /api/runs (fixture, bypass)
    A->>D: RunPlan
    D->>C: Run(approved cases)
    C->>F: one request per case, no redirects followed
    F-->>C: status + body
    opt bypass variants on
        D->>C: Run(Expand(deny cases))
        C->>F: HEAD, trailing slash, spoofed header, ...
        F-->>C: status + body
    end
    D->>D: persist run and evidence
    A-->>S: verdicts, counts, evidence
    R->>S: Inspect a failure, trace it back to the rule sentence
```

## Endpoint coverage

Access bugs rarely live on the endpoint everyone is looking at. They live on the one nobody wrote a rule for. On the Review step, RuleProof reads the target API's OpenAPI spec and maps the rule onto every object-level operation (a path with an ID in it):

```
API coverage · 2 of 3 endpoints
  GET  /assets/{id}          4 checks   "Viewers can read assets in their own tenant."
  PUT  /assets/{id}          4 checks   "Editors can also update them."
  GET  /assets/{id}/export   no rule    → "Both roles can export assets in their own tenant.
                                           Neither role can export another tenant's assets."
```

**Add to rule** appends the suggested sentence and puts the cursor at the end of the rule, so you can generate as-is or dictate your own wording. The new revision has 12 checks, and the seeded-defect API now fails 4 of them: cross-tenant reads **and** cross-tenant exports, with the leaked CSV as evidence. The corrected API passes all 12.

- The action comes from the path's last literal segment (`/export`), or from the HTTP method (`GET` read, `PUT`/`PATCH` update).
- Actions outside the parser's vocabulary are still listed as gaps, marked as not testable yet, rather than silently ignored.
- The guided demo uses the fixture spec (`GET /api/fixtures/openapi.json`). Workbench supports imported OpenAPI 3 JSON, including collection, search, export, and bulk operations, plus explicit identity/scope gaps.

```sh
curl localhost:8080/api/plans/<revision id>/coverage
```

## Bypass variants

A fix that passes every approved check can still leave a side door open. With bypass variants on, every check that expects a deny is also tried in the shapes attackers use:

| Variant                              | Applies to               | What it catches                                         |
| ------------------------------------ | ------------------------ | ------------------------------------------------------- |
| HEAD instead of GET                  | denied reads and exports | access checks registered only for GET                   |
| Trailing slash                       | every denied check       | router and access check normalising paths differently   |
| Upper-case object ID                 | every denied check       | case-insensitive lookup, case-sensitive ownership check |
| Spoofed `X-Tenant-ID`                | cross-tenant checks      | trusting a tenant the client claims                     |
| POST + `X-HTTP-Method-Override: PUT` | denied updates           | method rewritten after the access check                 |

Variants are generated at run time from the approved plan, so they never change what was approved or the plan's hash. A variant **holds** if the API refuses it with 401, 403, 404 or 405, and **leaks** on any 2xx; a redirect, crash or timeout is inconclusive and never counts as safe.

```mermaid
flowchart LR
    A[Approved case] --> B{Expects deny?}
    B -- "no, allow" --> N[No variants]
    B -- yes --> C[Expand catalog v1]
    C --> D[Send each variant]
    D --> E{Response}
    E -- "401, 403, 404, 405" --> H([Held])
    E -- 2xx --> L([Leaked: fails the run])
    E -- "3xx, 5xx, timeout" --> I([Inconclusive: never safe])
```

The third fixture, **Partial fix**, is the case this exists for. It passes all 12 approved checks, yet 9 of 27 attempts get through: HEAD skips its tenant check, and it trusts `X-Tenant-ID` — including an editor updating another tenant's asset.

```
Bypass attempts · catalog v1 · 27 tried

  LEAKED  editor update other tenant Spoofed X-Tenant-ID header   PUT  /assets/b1          got 200
  LEAKED  viewer read other tenant   HEAD instead of GET          HEAD /assets/b1          got 200
  LEAKED  viewer export other tenant Spoofed X-Tenant-ID header   GET  /assets/b1/export   got 200
  ...
18 held · 9 leaked · 0 inconclusive
```

```sh
curl -X POST localhost:8080/api/runs -d '{"planId":"<id>","fixture":"partial","bypass":true}'
go run ./cmd/ruleproof-ci -bundle examples/tenant-isolation-export.bundle.json -fixture partial -bypass
```

## Revision diff

Plans are immutable, so every change creates a new revision that must be approved again. The diff shows exactly what you are re-approving — on the Review screen automatically, and between any two revisions in Run history.

<table>
  <tr>
    <td width="50%"><a href="docs/media/studio-diff-wording.png"><img src="docs/media/studio-diff-wording.png" alt="Diff of reworded rule" /></a><p align="center"><sub><b>Reworded rule</b> — phrase-level highlights, approval reset</sub></p></td>
    <td width="50%"><a href="docs/media/studio-diff-expectation.png"><img src="docs/media/studio-diff-expectation.png" alt="Diff of an edited expectation" /></a><p align="center"><sub><b>Edited expectation</b> — Deny 403 → Allow 200, 7 unchanged</sub></p></td>
  </tr>
  <tr>
    <td colspan="2"><a href="docs/media/studio-history-compare.png"><img src="docs/media/studio-history-compare.png" alt="Compare any two revisions in run history" /></a><p align="center"><sub><b>Run history</b> — compare any two revisions of a rule</sub></p></td>
  </tr>
</table>

```sh
curl localhost:8080/api/plans/<revision id>/diff              # vs. its parent
curl "localhost:8080/api/plans/<revision id>/diff?base=<id>"  # vs. any revision of the same rule
```

## Guided demo evidence report

Every run has a read-only report page that anyone can open from a link, with no sign-in: the rule, the fixture, the revision, every check with its exact request and captured response, and the bypass attempts. **Share report** on the Verify screen copies the link; each run in Run history has an **Open report** button.

```
/report/?run=<run id>
```

The report checks that the run's plan hash matches the approved revision, so the evidence is tied to exactly what was reviewed. **Print / PDF** switches to a light layout and expands every check, ready to attach to a ticket or an audit.

## CI gate

The guided demo uses `ruleproof-ci`. Workbench exports use `ruleproof-suite`, as
shown in the [workbench workflow](#authorization-workbench), with credential
references, specification drift checks, and response/state assertions.

A rule you checked once can regress tomorrow. Export the approved plan from the studio (**Export JSON**), commit it, and let CI re-run it on every push.

```sh
go run ./cmd/ruleproof-ci -bundle examples/tenant-isolation.bundle.json -fixture broken
```

```
RuleProof CI · plan 79ffb19b-… · hash 1af0de86ba13a018 · seeded-defect fixture

  PASS   editor read own tenant     GET  /assets/a1   want 200  got 200
  FAIL   editor read other tenant   GET  /assets/b1   want 403  got 200
  ...
  FAIL   viewer read other tenant   GET  /assets/b1   want 403  got 200

6 passed · 2 failed · 0 errors
The API does not enforce the approved rule.
```

```mermaid
flowchart TD
    S([ruleproof-ci]) --> L[Load plan from -bundle or -server]
    L --> V{Approved, and cases still hash to the approved hash?}
    V -- no --> X2([exit 2: refuse to run])
    V -- yes --> R[Run approved checks on -fixture or -base-url]
    R --> B{-bypass?}
    B -- yes --> RV[Run bypass variants]
    B -- no --> REP
    RV --> REP[Table, GitHub annotations, job summary, JUnit]
    REP --> P{Every check passed and nothing leaked?}
    P -- yes --> X0([exit 0])
    P -- no --> X1([exit 1: fail the build])
```

|                 |                                                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Plan source** | `-bundle plan.json` (exported from the studio) or `-server http://host:8080 -plan <id>`                                    |
| **Target**      | `-fixture broken\|partial\|fixed` (bundled), or `-base-url https://staging.example.com` for your own API                   |
| **Credentials** | Demo tokens by default; override per role with `-token viewer=$VIEWER_TOKEN`                                               |
| **Bypass**      | `-bypass` also tries bypass variants of every denied check; any leak fails the build                                       |
| **Integrity**   | Refuses plans that are unapproved, or whose cases no longer match the approved hash                                        |
| **Exit codes**  | `0` all passed · `1` mismatch or error · `2` invalid input or plan                                                         |
| **Reports**     | GitHub Actions error annotations and job summary (automatic), JUnit XML with `-junit report.xml`, raw results with `-json` |

This repository dogfoods it: [`.github/workflows/ruleproof.yml`](.github/workflows/ruleproof.yml) requires the example plans to pass on the corrected API with bypass variants, to fail on the seeded defect, and to fail on the partial fix **only** with `-bypass` — so the gate is proven to catch both leaks.

<div align="center">
<a href="docs/media/studio-ci-hint.png"><img src="docs/media/studio-ci-hint.png" width="900" alt="Verify screen with copy-ready CI commands" /></a>
<p><sub>The Verify screen hands you the exact command for the plan you just approved.</sub></p>
</div>

## Explore the product

### Current workbench

These screenshots use the bundled synthetic environment and the sample candidate
specification; the dashboard counts are recorded demo results.

<table>
  <tr>
    <td width="50%"><a href="docs/media/workbench-matrix.jpg"><img src="docs/media/workbench-matrix.jpg" alt="Workbench permission matrix with eight reviewed checks" /></a><p align="center"><sub><b>Permission matrix</b> — identities, tenant scopes, expected statuses, and assertions</sub></p></td>
    <td width="50%"><a href="docs/media/workbench-runs.jpg"><img src="docs/media/workbench-runs.jpg" alt="Runs dashboard showing two completed executions, outcome history, and recovery status" /></a><p align="center"><sub><b>Execution control</b> — durable run history, live status, and recovery visibility</sub></p></td>
  </tr>
  <tr>
    <td colspan="2"><a href="docs/media/workbench-impact.jpg"><img src="docs/media/workbench-impact.jpg" width="708" alt="Authorization impact report tracing an asset-read security scheme change to five permission checks and a new search coverage gap" /></a><p align="center"><sub><b>Change impact</b> — explain affected dependencies and checks before reviewing the next revision</sub></p></td>
  </tr>
</table>

### Guided demo and landing page

<table>
  <tr>
    <td width="50%"><a href="docs/media/landing-hero.png"><img src="docs/media/landing-hero.png" alt="Landing page hero" /></a><p align="center"><sub><b>Landing page</b> — the whole loop in one animated console</sub></p></td>
    <td width="50%"><a href="docs/media/landing-problem.png"><img src="docs/media/landing-problem.png" alt="Hidden is not forbidden" /></a><p align="center"><sub><b>The problem</b> — what the UI shows vs. what the API returns</sub></p></td>
  </tr>
  <tr>
    <td><a href="docs/media/studio-explain.png"><img src="docs/media/studio-explain.png" alt="Explain step" /></a><p align="center"><sub><b>Explain</b> — write or dictate the rule, or start from an example</sub></p></td>
    <td><a href="docs/media/studio-review.png"><img src="docs/media/studio-review.png" alt="Review step" /></a><p align="center"><sub><b>Review</b> — 8 explicit expectations you can edit before approval</sub></p></td>
  </tr>
  <tr>
    <td><a href="docs/media/studio-verify.png"><img src="docs/media/studio-verify.png" alt="Verify against seeded defect" /></a><p align="center"><sub><b>Verify</b> — seeded defect: 6 passed, 2 failed</sub></p></td>
    <td><a href="docs/media/studio-evidence.png"><img src="docs/media/studio-evidence.png" alt="Evidence drawer" /></a><p align="center"><sub><b>Evidence</b> — expected 403, observed 200, with the leaked body</sub></p></td>
  </tr>
  <tr>
    <td><a href="docs/media/studio-corrected.png"><img src="docs/media/studio-corrected.png" alt="Verify against corrected API" /></a><p align="center"><sub><b>Corrected</b> — same approved plan, 8 passed</sub></p></td>
    <td><a href="docs/media/landing-demo.png"><img src="docs/media/landing-demo.png" alt="Interactive landing demo" /></a><p align="center"><sub><b>Try it on the landing page</b> — an in-browser sample, no backend needed</sub></p></td>
  </tr>
  <tr>
    <td><a href="docs/media/landing-features.png"><img src="docs/media/landing-features.png" alt="Feature overview" /></a><p align="center"><sub><b>Features</b> — built for evidence</sub></p></td>
    <td><a href="docs/media/landing-architecture.png"><img src="docs/media/landing-architecture.png" alt="Architecture section" /></a><p align="center"><sub><b>Architecture</b> — one Go binary, three fixtures, one static UI</sub></p></td>
  </tr>
</table>

## Get started

### Local development

```sh
# Terminal 1 — API + all three fixtures (SQLite by default)
go run ./cmd/server

# Terminal 2 — web UI with hot reload
cd web
npm install
npm run dev
```

Open http://localhost:3000 for the landing page and interactive sample, and http://localhost:3000/studio/ for Studio. Choose **Workbench** for configurable suites, **Runs** for execution control, and **Change impact** for candidate-spec analysis. The **Checks** guided demo lets you approve a sample rule and compare the **Seeded defect** and **Corrected** fixtures.

Without configuration, Workbench uses synthetic fixtures and a local demo reviewer.
For workspace accounts, separate reviewers, and custom test APIs, follow the
[team configuration guide](docs/specs/authorization-workbench.md#configure-a-team-workspace).

> If Turbopack cannot start its CSS worker on Windows, use `npx next dev --webpack` (or `npx next build --webpack`) from `web/`.

### Single process (production-style)

```sh
cd web && npm run build && cd ..
go run ./cmd/server   # UI + API on http://localhost:8080
```

`npm run build` writes a static export to `web/out/`, which the Go server serves on the same origin as the API.

### Docker

```sh
docker build -t ruleproof .
docker run -p 8080:8080 ruleproof
```

The server listens on `$PORT` when set. SQLite lives in `/tmp` inside the default
container, so demo data resets on restart. Use PostgreSQL or a persistent SQLite
volume when retaining approved suites, audit history, and execution receipts.

### Postgres

```sh
DATABASE_URL=postgres://user:password@localhost:5432/ruleproof go run ./cmd/server
```

### Tests

```sh
go test -race ./internal/... ./cmd/...
go vet ./internal/... ./cmd/...
cd web
npm run format:check
npm run typecheck           # generates Next.js types before checking TypeScript
npm run lint
npm test
npm run build
```

CI also runs the persistence tests against PostgreSQL. To include them locally,
set `RULEPROOF_TEST_POSTGRES` to a dedicated PostgreSQL test database DSN. Frontend
checks enforce Airbnb/Next ESLint, arrow functions, and the 200-line source-file
limit. Shared constants live in `web/constants/`; formatting follows EditorConfig
and Prettier.

## Architecture

```
Browser (Next.js 16 static export · React 19 · Tailwind v4 · GSAP · Radix UI)
   │  same origin
   ▼
cmd/server (Go)
   ├── internal/api     workspace access, REST handlers, durable execution workers
   ├── internal/workbench  suite validation, assertions, spec drift, impact analysis
   ├── internal/rules   bounded, sentence-scoped rule parser
   ├── internal/store   revisions, audit events, runs, environment reservations, migrations
   ├── internal/diff    revision diff: wording, expectations, assumptions
   ├── internal/coverage  rule → OpenAPI endpoint coverage and gaps
   ├── internal/bypass  run-time bypass variants of every denied check
   └── internal/check   HTTP runner: per-request timeouts, exact status match
          │
          ▼
internal/assets — synthetic asset API, started three times:
   ├── seeded defect  skips the cross-tenant ownership check on reads and exports
   ├── partial fix    passes every approved check; HEAD skips the check, X-Tenant-ID is trusted
   └── corrected      checks tenant ownership on every request
```

| Package               | Responsibility                                                                                                                                                                                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `internal/rules`      | Turns reviewed text into an 8-case plan (12 when the rule mentions export) using a fixed vocabulary. Out-of-vocabulary wording becomes an assumption; every concept keeps its source sentence.                                                              |
| `internal/assets`     | Project/tenant-scoped asset API (read, update, export) with its OpenAPI spec and `fixed`, `partial` and `broken` modes, so a UI-hidden action can still be bypassed at the API.                                                                             |
| `internal/bypass`     | Derives bypass attempts from an approved plan's deny cases at run time. Versioned catalog; never changes the approved plan.                                                                                                                                 |
| `internal/check`      | Issues approved requests with timeouts and exact status matching, and captures the synthetic response body. Credentials are never captured.                                                                                                                 |
| `internal/workbench`  | Validates suites, resolves operation coverage, runs ordered cases and state assertions, compares specifications, and maps changes to affected checks. Impact parsing, references, security inheritance, coverage, and recommendations are separate modules. |
| `internal/store`      | Immutable plans and suite revisions, audit events, durable execution receipts, checkpoints, and environment reservations. SQLite and PostgreSQL share versioned migrations.                                                                                 |
| `internal/api`        | Workspace-scoped workbench access, revision review, impact reports, execution admission, cancellation, recovery, and the separate guided demo routes.                                                                                                       |
| `internal/diff`       | Compares two revisions: phrase-level wording diff, changed/added/removed cases, assumptions and concepts, approval reset.                                                                                                                                   |
| `internal/coverage`   | Maps a plan onto an OpenAPI spec: covered object-level operations with their source sentence, and uncovered ones with a suggested sentence.                                                                                                                 |
| `cmd/ruleproof-ci`    | CI gate: verifies an approved, untampered plan, runs it, fails the build on any mismatch.                                                                                                                                                                   |
| `cmd/ruleproof-suite` | Runs an exported approved workbench suite against a configured CI target, resolves credential references, checks OpenAPI drift, and emits JUnit evidence.                                                                                                   |
| `cmd/ruleproof`       | The original standalone CLI demo (invoice-tenant fixture), Go only.                                                                                                                                                                                         |

### Guided demo plan lifecycle

A revision never changes after it is created. Rewording a rule or editing an expectation makes a new child revision, which starts unapproved, so an approval always refers to exactly what was reviewed.

```mermaid
stateDiagram-v2
    direction LR
    state "New child revision" as Child
    [*] --> Proposed: parse rule
    Proposed --> Acknowledged: acknowledge assumptions
    Proposed --> Approved: approve, when there are no assumptions
    Acknowledged --> Approved: approve
    Approved --> Approved: run or replay, any fixture
    Proposed --> Child: revise or edit
    Acknowledged --> Child: revise or edit
    Approved --> Child: revise or edit
    Child --> Proposed: starts unapproved
    note right of Approved
        Runs are stored against this
        revision and its hash.
    end note
```

### Guided demo data model

```mermaid
erDiagram
    PLANS ||--o{ PLANS : "parent of"
    PLANS ||--o{ RUNS : "tested by"
    PLANS {
        text id PK
        text root_plan_id "first revision of the rule"
        text parent_plan_id "empty for the root"
        text kind "root, revision or edit"
        text rule_text
        text cases_json
        text assumptions_json
        text hash "fingerprint of the approved cases"
        int assumptions_acknowledged
        int approved
        text approved_at
        text created_at
    }
    RUNS {
        text id PK
        text plan_id FK
        text plan_hash "hash the run was made against"
        text fixture "broken, partial or fixed"
        text results_json "approved checks"
        int pass_count
        int fail_count
        int error_count
        text variants_json "bypass attempts"
        text bypass_catalog "empty when bypass was off"
        text created_at
    }
    SCHEMA_MIGRATIONS {
        int version PK
        text applied_at
    }
```

Schema changes are append-only migrations in [`internal/store/store.go`](internal/store/store.go), applied in a transaction and recorded in `schema_migrations`, so databases created by older versions upgrade on start.

### Workbench storage and execution

`suite_revisions` stores immutable contracts and approval provenance;
`suite_events` records review, execution, cancellation, and recovery events.
`executions` stores durable status, the current case, redacted evidence, compact
dashboard summaries, and deadlines. `execution_reservations` enforces one active
reservation per workspace/environment across database connections.

```mermaid
flowchart LR
    S[Saved revision] --> A[Exact revision approved]
    A --> R[Request key and environment reservation]
    R --> E[202 execution receipt]
    E --> W[Detached worker checkpoints evidence]
    W --> C{Outcome known?}
    C -- Completed --> D[Commit evidence and release reservation]
    C -- Interrupted or cancelled --> Q[Keep reservation for reviewer recovery]
    Q --> V[Verify target state and stop former worker]
    V --> N[Record recovery after deadline and release]
```

Impact analysis is a read-only operation over the saved contract and candidate
specification. It does not reserve a target, execute checks, or modify approvals.

### Project structure

<details>
<summary>Show the repository layout</summary>

```
ruleproof/
├── cmd/
│   ├── server/          API + three fixture APIs + static UI, one process
│   ├── ruleproof-ci/    CI gate (approved-plan runner, JUnit, GitHub annotations)
│   ├── ruleproof-suite/ Workbench suite runner, credential references, spec drift, JUnit
│   └── ruleproof/       original standalone CLI demo
├── internal/
│   ├── api/             REST handlers and JSON errors
│   ├── rules/           bounded rule parser and plan hash
│   ├── workbench/       suite validation, coverage, ordered execution, drift and impact
│   ├── store/           plans, suite revisions, audit, durable runs, reservations, migrations
│   ├── check/           HTTP runner and verdicts
│   ├── bypass/          bypass variant catalog
│   ├── coverage/        rule → OpenAPI coverage
│   ├── diff/            revision diff
│   ├── assets/          synthetic asset API + OpenAPI spec
│   └── demo/            fixtures for the standalone CLI
├── web/
│   ├── components/workbench/  focused editors, run dashboard, impact upload and results
│   ├── hooks/workbench/       revision, analysis, request, and execution state
│   └── constants/            shared frontend constants
├── examples/            approved CI bundles and an impact-analysis candidate spec
├── docs/                specs and README media
└── .github/             CI workflow and PR template
```

</details>

**Frontend:** Next.js 16 + TypeScript, styled entirely with Tailwind CSS v4 utilities and theme tokens. Radix UI primitives (select, tabs, accordion), `class-variance-authority` + `tailwind-merge` for variants, GSAP (ScrollTrigger, SplitText, Flip) and Lenis for motion, `@number-flow/react` for animated counts, Lucide icons. All motion respects `prefers-reduced-motion`, and the layout works from 1440px down to 375px.

## Guided demo contract

1. The user explains the rule in plain language (no simulated microphone UI — dictate into the normal textarea with Wispr Flow, or type).
2. The bounded parser proposes a matrix and lists any assumptions; assumptions must be acknowledged before approval.
3. The user reviews, can edit any expected outcome, and approves the exact revision — any later edit invalidates that approval.
4. The approved plan runs against a chosen fixture; every result links back to its expectation, the raw request, and the captured response.

## Guided demo scope and limits

A passing matrix means **the approved scenarios passed**. It does not prove the whole application is secure.

- Two fixed identities (editor/viewer in tenant A) and two fixed assets (tenant A/B). The vocabulary is intentionally small for this demo, not a general policy language.
- Execution only targets the three bundled synthetic fixtures; there is no arbitrary-URL testing.
- Bypass variants are a fixed, versioned list of common tricks, not a fuzzer. Holding against them is evidence, not a guarantee.
- The guided demo is public and synthetic. Workbench adds configured custom APIs, workspace authentication, and team approvals; see [its contract and limits](docs/specs/authorization-workbench.md).
- `Access-Control-Allow-Origin` defaults to `*` for local development. Set `RULEPROOF_ALLOWED_ORIGIN` to a specific origin before any real deployment. Request bodies are capped at 1MB and the HTTP server sets read/write/idle timeouts.

## Contributing

**Branches and commits.** Branch from `main` as `feat/…`, `fix/…`, `docs/…` or `chore/…`, and use [Conventional Commits](https://www.conventionalcommits.org/) (`feat: add bypass variants`).

**Before opening a PR,** run the same checks CI does:

```sh
go vet ./internal/... ./cmd/... && go test -race ./internal/... ./cmd/...
cd web && npm run format:check && npm run typecheck && npm run lint && npm test && npm run build
```

The [PR template](.github/pull_request_template.md) carries the product checklist: approved plans must never change silently. The guided demo targets bundled fixtures; Workbench can also target operator-configured test APIs.

**Labels.** Every PR and issue gets one `type:` label, one or more `area:` labels for the packages it touches, and a `priority:` when it matters for the deadline.

| Group    | Labels                                                                                                                                                               |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type     | `type: feature` `type: bug` `type: enhancement` `type: security` `type: docs` `type: refactor` `type: test` `type: chore`                                            |
| Area     | `area: parser` `area: runner` `area: bypass` `area: coverage` `area: diff` `area: store` `area: api` `area: fixtures` `area: ci-gate` `area: studio` `area: landing` |
| Priority | `priority: critical` `priority: high` `priority: low`                                                                                                                |
| Status   | `status: needs triage` `status: in progress` `status: blocked`                                                                                                       |
| Project  | `hackathon` `demo` `wispr` `post-mvp` `good first issue` `help wanted`                                                                                               |

## Two-minute demo outline

1. Explain the recurring problem: checking who can actually access what, beyond what the UI shows.
2. Dictate the rule. Review shows 8 checks, and coverage flags `GET /assets/{id}/export`: the rule never mentions it.
3. Add the sentence (or dictate your own), approve the 12-check revision, and run it against the seeded defect. Cross-tenant reads **and** the forgotten export leak, with the CSV as evidence.
4. Switch to the partial fix: all 12 checks pass — it looks fixed. Turn on bypass variants: 9 attempts leak, including an editor updating another tenant's asset with a spoofed header.
5. Switch to the corrected fixture with the same approved plan: all 12 checks pass and all 27 bypass attempts are refused. Click **Share report** and open the link: the same evidence, read-only, for whoever signs off on the fix.
6. Show genuine Wispr build usage and the Insights usage card.

## How this was built with Wispr Flow

<!-- Fill with real examples only. "Was Wispr used meaningfully?" is one of four weighted judging questions. -->

- **Specs:** _e.g. the product contract above was dictated, then edited._
- **Prompts:** _e.g. coding-agent prompts dictated for the parser, runner, and evidence drawer._
- **Docs:** _e.g. this README and the submission write-up._
- **In the product:** the rule itself is dictated into the Explain textarea — the bounded parser was designed around how people actually phrase access rules out loud.
- **Usage card:** _add the Wispr Insights screenshot here._

---

<div align="center">

Built for **No Hands: The Wispr Challenge** (WeMakeDevs × Wispr Flow) · [Official challenge](https://www.wemakedevs.org/wispr)

</div>
