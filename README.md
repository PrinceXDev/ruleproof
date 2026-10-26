<div align="center">

<img src="docs/media/logo.svg" width="64" alt="RuleProof logo" />

# RuleProof

**Your UI says no. Does your API?**

Speak an access rule in plain language, approve the exact checks it produces, then see — with request and response evidence — where your API breaks the rule.

![Go](https://img.shields.io/badge/Go-1.26-00ADD8?logo=go&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?logo=tailwindcss&logoColor=white)
![SQLite | Postgres](https://img.shields.io/badge/SQLite%20%7C%20Postgres-ready-4169E1?logo=postgresql&logoColor=white)
![Wispr Flow](https://img.shields.io/badge/Dictated%20with-Wispr%20Flow-D5F879)

<img src="docs/media/hero-console.gif" width="640" alt="Animated sample: a rule becomes eight checks and two cross-tenant reads fail" />

[Quickstart](#get-started) · [How it works](#how-it-works) · [Screenshots](#explore-the-product) · [Revision diff](#revision-diff) · [CI gate](#ci-gate) · [API](#api) · [Architecture](#architecture) · [Scope](#scope-and-limits)

</div>

---

## Why RuleProof

Broken access control is the #1 risk in the OWASP Top 10, and it hides in plain sight: the button is gone, so everyone assumes the data is safe. RuleProof makes the question explicit — **an identity, an action, a tenant, an expected status** — and keeps the request and response as proof when the answer is wrong.

> Example rule: *"Viewers can read assets in their own tenant. Editors can also update them. Neither role can access another tenant's assets."*

| | Feature | What it does |
|---|---|---|
| 🗣️ | **Plain-language rules** | Type or dictate a rule with Wispr Flow. No policy language to learn. |
| 🧩 | **Bounded parser with provenance** | Extracts roles, actions and tenant scope sentence by sentence. Every concept links to the sentence it came from. |
| ⚠️ | **Assumptions, never guesses** | Wording outside the vocabulary becomes a visible assumption that must be acknowledged before approval. |
| 🧮 | **Full coverage matrix** | 2 roles × 2 actions × 2 scopes = 8 explicit expectations, including the cases nobody wrote down. |
| ✅ | **Approve the exact revision** | Plans are immutable. Any edit creates a new revision, and the old approval does not carry over. |
| 🎯 | **Exact status matching** | Want 403, got 500? That's a failure. Crashes and redirects never pass as a "deny". |
| 🔍 | **Evidence inspector** | Rule excerpt → expectation → request (redacted headers) → response body, plus a plain-language explanation. |
| 🔀 | **Revision diff** | Before re-approving, see word-level rule edits, every flipped expectation, new or resolved assumptions, and whether an old approval was reset. |
| 🚦 | **CI gate** | `ruleproof-ci` re-runs an approved plan on every push and fails the build on any mismatch. Refuses unapproved or edited plans. |
| 🕓 | **Run history and replay** | Every run is stored against the revision it tested. Compare seeded-defect vs corrected side by side. |
| 📦 | **Exportable evidence bundle** | One JSON file with the rule, every revision, approvals and runs. |
| 🗄️ | **SQLite or Postgres** | Embedded SQLite by default. Set `DATABASE_URL` and the same SQL runs on Postgres. |

## How it works

<div align="center">
<img src="docs/media/how-it-works.gif" width="900" alt="Studio walkthrough: type the rule, generate checks, approve, run against the seeded defect, inspect evidence, switch to the corrected API" />
</div>

1. **Explain** — describe who can do what. The parser extracts concepts and flags anything it can't resolve.
2. **Review and approve** — inspect the 8 proposed checks, edit any expected outcome, acknowledge assumptions, approve.
3. **Run** — send the approved requests to the *seeded-defect* or *corrected* fixture API.
4. **Inspect** — open any result to trace it from the rule sentence to the raw response.

With the sample rule, the seeded-defect API returns **6 passed, 2 failed** (both cross-tenant reads leak data). The same approved plan against the corrected API returns **8 passed**.

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

## CI gate

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

| | |
|---|---|
| **Plan source** | `-bundle plan.json` (exported from the studio) or `-server http://host:8080 -plan <id>` |
| **Target** | `-fixture broken\|fixed` (bundled), or `-base-url https://staging.example.com` for your own API |
| **Credentials** | Demo tokens by default; override per role with `-token viewer=$VIEWER_TOKEN` |
| **Integrity** | Refuses plans that are unapproved, or whose cases no longer match the approved hash |
| **Exit codes** | `0` all passed · `1` mismatch or error · `2` invalid input or plan |
| **Reports** | GitHub Actions error annotations and job summary (automatic), JUnit XML with `-junit report.xml`, raw results with `-json` |

This repository dogfoods it: [`.github/workflows/ruleproof.yml`](.github/workflows/ruleproof.yml) requires the example plan to pass on the corrected API **and** to fail on the seeded defect, so the gate is proven to catch the leak.

<div align="center">
<a href="docs/media/studio-ci-hint.png"><img src="docs/media/studio-ci-hint.png" width="900" alt="Verify screen with copy-ready CI commands" /></a>
<p><sub>The Verify screen hands you the exact command for the plan you just approved.</sub></p>
</div>

## Explore the product

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
    <td><a href="docs/media/landing-architecture.png"><img src="docs/media/landing-architecture.png" alt="Architecture section" /></a><p align="center"><sub><b>Architecture</b> — one Go binary, two fixtures, one static UI</sub></p></td>
  </tr>
</table>

## Get started

### Local development

```sh
# Terminal 1 — API + both fixtures (SQLite by default)
go run ./cmd/server

# Terminal 2 — web UI with hot reload
cd web
npm install
npm run dev
```

Open http://localhost:3000 for the landing page and interactive sample, and http://localhost:3000/studio/ for the Evidence Studio. Approve the sample rule, then switch between **Seeded defect** and **Corrected** to see the leak and its fix.

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

Any container host works (Render, Fly.io, Railway). The server listens on `$PORT` when set. SQLite lives in `/tmp` inside the container, so demo data resets on restart — intended for a public demo.

### Postgres

```sh
DATABASE_URL=postgres://user:password@localhost:5432/ruleproof go run ./cmd/server
```

### Tests

```sh
go test ./...               # backend: store, api, rules, assets, check, diff, ci
cd web && npx tsc --noEmit  # frontend typecheck
cd web && npx eslint .      # frontend lint
```

## Architecture

```
Browser (Next.js 16 static export · React 19 · Tailwind v4 · GSAP · Radix UI)
   │  same origin
   ▼
cmd/server (Go)
   ├── internal/api     REST surface, structured JSON errors
   ├── internal/rules   bounded, sentence-scoped rule parser
   ├── internal/store   immutable plans + runs (SQLite or Postgres via sqlx)
   ├── internal/diff    revision diff: wording, expectations, assumptions
   └── internal/check   HTTP runner: per-request timeouts, exact status match
          │
          ▼
internal/assets — synthetic asset API, started twice:
   ├── seeded defect  skips the cross-tenant ownership check on reads
   └── corrected      checks tenant ownership on every request
```

| Package | Responsibility |
|---|---|
| `internal/rules` | Turns reviewed text into an 8-case plan using a fixed vocabulary. Out-of-vocabulary wording becomes an assumption; every concept keeps its source sentence. |
| `internal/assets` | Project/tenant-scoped asset API with `fixed` and `broken` modes, so a UI-hidden action can still be bypassed at the API. |
| `internal/check` | Issues approved requests with timeouts and exact status matching, and captures the synthetic response body. Credentials are never captured. |
| `internal/store` | Immutable plans linked into a lineage; runs replayable across the revision history. |
| `internal/api` | explain → revise → edit → acknowledge → approve → run → history → export. |
| `internal/diff` | Compares two revisions: phrase-level wording diff, changed/added/removed cases, assumptions and concepts, approval reset. |
| `cmd/ruleproof-ci` | CI gate: verifies an approved, untampered plan, runs it, fails the build on any mismatch. |
| `cmd/ruleproof` | The original standalone CLI demo (invoice-tenant fixture), Go only. |

**Frontend:** Next.js 16 + TypeScript, styled entirely with Tailwind CSS v4 utilities and theme tokens. Radix UI primitives (select, tabs, accordion), `class-variance-authority` + `tailwind-merge` for variants, GSAP (ScrollTrigger, SplitText, Flip) and Lenis for motion, `@number-flow/react` for animated counts, Lucide icons. All motion respects `prefers-reduced-motion`, and the layout works from 1440px down to 375px.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Health and storage driver |
| `POST` | `/api/plans` | Parse a rule into a new plan |
| `GET` | `/api/plans/{id}` | Fetch a plan revision |
| `POST` | `/api/plans/{id}/revise` | New revision from changed wording |
| `PATCH` | `/api/plans/{id}/cases` | Override expectations → new revision |
| `POST` | `/api/plans/{id}/acknowledge` | Acknowledge parser assumptions |
| `POST` | `/api/plans/{id}/approve` | Approve this exact revision |
| `POST` | `/api/runs` | Run an approved plan against `broken` or `fixed` |
| `GET` | `/api/runs/{id}` | Fetch a run with evidence |
| `GET` | `/api/plans/{id}/history` | Full lineage and every run |
| `GET` | `/api/plans/{id}/diff` | What changed vs. the parent, or `?base=<id>` |
| `GET` | `/api/plans/{id}/export` | Download the evidence bundle |

```sh
curl -X POST localhost:8080/api/plans \
  -d '{"text":"Viewers can read assets in their own tenant."}'
```

## Product contract

1. The user explains the rule in plain language (no simulated microphone UI — dictate into the normal textarea with Wispr Flow, or type).
2. The bounded parser proposes a matrix and lists any assumptions; assumptions must be acknowledged before approval.
3. The user reviews, can edit any expected outcome, and approves the exact revision — any later edit invalidates that approval.
4. The approved plan runs against a chosen fixture; every result links back to its expectation, the raw request, and the captured response.

## Scope and limits

A passing matrix means **the approved scenarios passed**. It does not prove the whole application is secure.

- Two fixed identities (editor/viewer in tenant A) and two fixed assets (tenant A/B). The vocabulary is intentionally small for this demo, not a general policy language.
- Execution only targets the two bundled synthetic fixtures; there is no arbitrary-URL testing.
- No authentication or team approvals yet.
- `Access-Control-Allow-Origin` defaults to `*` for local development. Set `RULEPROOF_ALLOWED_ORIGIN` to a specific origin before any real deployment. Request bodies are capped at 1MB and the HTTP server sets read/write/idle timeouts.

## Two-minute demo outline

1. Explain the recurring problem: checking who can actually access what, beyond what the UI shows.
2. Dictate the rule, review the generated matrix, approve it.
3. Run against the seeded-defect fixture — reveal the cross-tenant read leak with evidence.
4. Switch to the corrected fixture with the same approved plan — all eight cases pass.
5. Show genuine Wispr build usage and the Insights usage card.

## How this was built with Wispr Flow

<!-- Fill with real examples only. Judges score Wispr usage at 30%. -->

- **Specs:** _e.g. the product contract above was dictated, then edited._
- **Prompts:** _e.g. coding-agent prompts dictated for the parser, runner, and evidence drawer._
- **Docs:** _e.g. this README and the submission write-up._
- **In the product:** the rule itself is dictated into the Explain textarea — the bounded parser was designed around how people actually phrase access rules out loud.
- **Usage card:** _add the Wispr Insights screenshot here._

---

<div align="center">

Built for **No Hands: The Wispr Challenge** (WeMakeDevs × Wispr Flow) · [Official challenge](https://www.wemakedevs.org/wispr)

</div>
