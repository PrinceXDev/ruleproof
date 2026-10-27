# Authorization workbench

## Contract

A suite is a reviewed contract: environment, rule, OpenAPI document, identity
references, ordered requests, exact statuses, assertions, state observers, exclusions,
and build/data context. Saving creates an immutable revision. Approval binds its
complete SHA-256 fingerprint. Any edit requires a new revision and approval.

The original Explain / Review / Verify demo remains available. Workbench is the
configurable workflow in the Studio sidebar.

## Implemented behavior

| Feature | Behavior and edge cases |
| --- | --- |
| Response assertions | RFC 6901 pointers; equals, exists, absent, and allEqual. Missing and null are distinct. allEqual requires a nonempty array; explicitly assert equals `[]` for an expected empty list. Numbers compare without float precision loss. Assertions evaluate the full bounded response before redaction. |
| State verification | An independently selected observer reads a JSON resource before and after a request. Missing/unreadable baselines prevent the mutation. A changed value fails even when the mutation returns its expected 403. An unavailable after-read is an error. Choose a stable pointer to avoid unrelated timestamps. |
| Precise coverage | Match method and whole path segments, preferring literal paths to parameter routes. Include collections, search, export, and bulk endpoints. Display identity × scope gaps separately from operation coverage. A covered operation does not imply every combination passed. |
| Custom APIs | Import OpenAPI 3 JSON up to 512 KiB. Configure execution environments on the server. Provide concrete paths, query parameters, JSON bodies, and custom expected statuses. The importer never fetches remote references; local component references must resolve. YAML and generated resource-ID capture are not supported. |
| Identities | Up to 32 named identities with role, tenant, and optional credential reference. Empty reference means anonymous. Expired-token tests use a configured expired credential. Owners and same-tenant nonowners are separate identities/scopes. Secrets are resolved only from the environment's configured credential map. |
| Collections and bulk | Collection endpoints appear in coverage. Inspect every item with `/items/*/tenant` and allEqual. Mixed-tenant bulk bodies and exact outcomes are explicit checks. Pagination requires explicit cases for the pages/cursors being tested; there is no automatic crawl. |
| Scenarios | Checks sharing a scenario name execute in table order. A failed/error step blocks later steps in that scenario; unrelated checks continue. Skipped steps remain errors. No automatic write retries or automatic cleanup; model restoration as explicit reviewed checks in a separate cleanup scenario if required. |
| Conflicts | Block contradictory independent requests and explicit contradictory sentences in the demo's editor/viewer, read/update/export, own/other vocabulary. Ordered scenarios may intentionally change expectations. This is a bounded detector, not a general natural-language policy solver. Custom policy meaning is established by the reviewed matrix. |
| Drift | Compare saved and current specs in the UI or CI. Added, changed, and removed operations are listed. Operation definitions, path parameters, global security, and components participate in fingerprints. Component changes conservatively flag all operations. Property ordering and formatting alone do not create drift. |
| Team review | Configured bearer-token accounts are workspace-scoped author, reviewer, or viewer identities. Authors save/run; reviewers also approve; viewers read/export. Optional independent review prevents self-approval on every revision. Audit events record author, reviewer, execution actor, and time in SQL. |
| Evidence | Capture revision/spec hashes, environment label, commit, data version, timestamps, status, assertion verdicts, and redacted response previews. Credential-like JSON keys and configured token values are removed before persistence. Non-JSON/incomplete bodies are omitted. Preview is 4 KiB; full evaluation is limited to 1 MiB. Incomplete/oversized responses are errors. Request bodies are omitted from run evidence; use synthetic data in saved request definitions. |

## Limits and execution safeguards

- 1–256 checks per suite, 32 assertions per check, 64 KiB request bodies, and a
  1 MiB API request limit. Use multiple suites for larger contracts.
- Exact HTTP status matching; redirects are never followed. A crash, timeout,
  incomplete response, or skipped step cannot pass as a denial.
- A 60-second overall run limit and three-second individual request limit.
- Studio reservations serialize executions per workspace/environment across
  replicas sharing the same database. CLI executions remain operator-coordinated.
  Replicas must use identical environment configuration. PostgreSQL is recommended
  for multiple hosts; SQLite coordination applies to connections to one local file.
- External URLs and credential references are operator-configured; imported specs
  and browser requests cannot select arbitrary execution hosts or read arbitrary
  environment variables. Use dedicated staging/test environments for mutations.
- Approval requires all operations to have checks or a written exclusion of at
  least eight characters. Missing identity/scope combinations stay visible.
- Revision and event lists currently return the latest 100 records; all records
  remain in storage. No automatic retention deletion is performed.
- Exported bundles bind content with a hash, not a digital signature. Treat
  committed approved bundles as trusted CI inputs and protect changes with code
  review. A self-consistent bundle from an untrusted source is not proof of approval.
- Team access applies to `/api/workbench/*`. Legacy `/api/plans/*` is the separate
  public synthetic demo and does not expose workbench revisions or target secrets.

## Configure a team workspace

Set `RULEPROOF_WORKBENCH_CONFIG` to JSON of this form. Token values are supplied
through the named environment variables, never placed in this configuration:

```json
{
  "separateReviewer": true,
  "accounts": [
    {"name":"Alice","workspace":"payments","role":"author","tokenEnv":"RULEPROOF_ALICE_TOKEN"},
    {"name":"Bob","workspace":"payments","role":"reviewer","tokenEnv":"RULEPROOF_BOB_TOKEN"},
    {"name":"Audit","workspace":"payments","role":"viewer","tokenEnv":"RULEPROOF_AUDIT_TOKEN"}
  ],
  "environments": [
    {
      "id":"staging",
      "label":"Payments staging",
      "workspace":"payments",
      "baseUrl":"https://staging.example.com/api",
      "credentials":{"viewer-a":"STAGING_VIEWER_TOKEN","editor-a":"STAGING_EDITOR_TOKEN"}
    }
  ]
}
```

Workspace access tokens must be unique and at least 32 characters. Configuration
is validated at startup and fails closed. Serve team deployments over HTTPS and
set `RULEPROOF_ALLOWED_ORIGIN` to the Studio's origin. Provisioning and rotating
accounts is operator-managed; there is no password database or SSO provider.

With no configuration, the workbench uses synthetic fixtures and a clearly
labeled local reviewer. Independent approval is disabled in that demo mode.

## CI

Export a saved approved revision, commit the bundle, and run:

```sh
go run ./cmd/ruleproof-suite \
  -bundle approved-suite.json \
  -base-url https://staging.example.com/api \
  -credential-env viewer-a=STAGING_VIEWER_TOKEN \
  -credential-env editor-a=STAGING_EDITOR_TOKEN \
  -spec openapi-current.json \
  -junit ruleproof-suite.xml
```

Exit codes: 0 passed; 1 failed assertions, execution errors, or spec drift;
2 invalid input, missing credentials, unapproved revision, or changed contract.
JSON evidence is written to stdout. `-spec` is optional; without it the CLI cannot
detect changes to the target's current specification. The caller supplies the
authorized target URL, so confirm it corresponds to the bundle's environment.

## Verification

### Authorization impact analysis

In **Change impact**, upload a candidate OpenAPI 3 JSON document against a saved
revision. The advisory report identifies added, changed, removed, and unchanged
operations, then maps them to identities, scopes, response assertions, protected
state observers, and ordered scenarios. It does not execute requests, change the
saved suite, grant approval, or enable partial runs. Viewers may analyze contracts
within their workspace. Unsaved edits must be saved or discarded first.

`POST /api/workbench/revisions/{id}/impact` accepts `{ "spec": { ... } }` and returns
the baseline suite hash, both specification hashes, explanations, recommendations,
orphaned check IDs, and candidate coverage gaps. Export the report from the UI to
keep that provenance with a code review. Credentials and request/response bodies
are not included in the report.

The analyzer follows transitive local `#/components/` references with cycle
detection. It resolves effective root/operation security and root/path/operation
servers, and follows security scheme names even where OpenAPI uses no `$ref`.
Unused component edits do not implicate unrelated operations. Changes to shared
path settings affect sibling operations. Literal-route additions can remap an
existing concrete request. A changed observer GET also implicates the protected
mutation, and every step in its named scenario stays in the review plan.

Unclassified document settings, unexpanded path-item references, unresolved
security mappings, and changes involving callbacks, links, or dynamic schema
references broaden review to the complete suite. Removed request/observer routes
need repair. Changed exclusions require renewed review. Missing identity × scope
combinations are counted independently of exclusions; reports include up to 32
examples per operation and up to eight changed dependency references. UI operation
lists expand in pages of 20. Existing document/operation/case limits apply.

“Unchanged in spec” does not establish runtime safety: implementation-only changes
are outside this analyzer. Review and execute the full approved suite before
release. To adopt the candidate, import it and save an unapproved revision through
the normal workflow; no approval is carried forward.

For a local walkthrough, compare the synthetic tenant suite with
`examples/tenant-isolation-impact.openapi.json`. It introduces explicit bearer
authentication for asset reads and an uncovered asset-search operation. The
report includes the write check whose state observer depends on asset reads.

### Durable execution and operational dashboard

`POST /api/workbench/revisions/{id}/run` now returns **202** with an execution
receipt, rather than waiting for an audit event. Send `{ "requestKey": "<UUID>" }`.
Repeating a key as the same workspace actor returns the same receipt and never
starts another worker; reusing it for another revision/environment returns 409.
Only an approved, integrity-checked revision can execute. An environment already
reserved by another receipt returns 409; submissions are not queued.

The accepted worker continues independently of browser disconnects. Redacted
evidence and the current case are checkpointed before the next request. Poll
`GET /api/workbench/executions` for compact summaries or `/{id}` for full evidence.
The list includes the latest 50 receipts and every unresolved reservation; old
blocked environments cannot disappear behind completed history. Configurations
are bounded to 128 environments per server. All reads are workspace-scoped.

Authors/reviewers may `POST /executions/{id}/cancel`; viewers cannot. Cancellation
is persisted, polled every 200 ms, and checked at the next checkpoint.
Cancellation racing completion conservatively wins. Already accepted
downstream work may still finish, so cancellation does not imply rollback.

Runs have a 60-second execution budget and a 90-second reservation deadline.
Process loss, request errors, cancellation, or lost persistence keep the target
reserved. Expired active receipts appear interrupted; **no automatic retry,
takeover, or replay occurs**. After the deadline, a reviewer may inspect/reset
the target, stop the former worker, and `POST /executions/{id}/recover` with
10–1000 characters of recovery notes. This records an audit event and releases
the reservation. The old worker cannot checkpoint/finalize afterward. This is
not an exactly-once guarantee for external HTTP side effects. Operators must
verify worker shutdown and downstream state before recovery. Ordinary shutdown
drains accepted work before closing the database.

The Runs view shows completed, failing, active, and recovery counts for the listed
receipts, an accessible outcome history, and evidence inspection. Failed checks
are distinct from request errors and interrupted runs. Regression watch compares
only completed runs of the same suite hash, environment, and nonempty data version;
it lists previously passing case IDs that now fail. The operator-supplied data
version is provenance, not an independently verified database snapshot. Missing
comparable history displays an unavailable state. Charts do not claim a security
score or production traffic statistics.

This dashboard scope follows [Grafana's dashboard guidance](https://grafana.com/docs/grafana/latest/visualizations/dashboards/build-dashboards/best-practices/)
and [OWASP's endpoint-level authorization guidance](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/):
surface actionable evidence, preserve coverage context, and expose uncertainty.
Broader business analytics, alert delivery, SSO, and managed job queues require
separate product requirements and are outside this increment.

Backend tests cover assertions, mutation despite denial, unreadable baselines,
redaction, bounds, redirects, exact coverage, scenario failure propagation,
credential preflight, drift, approval integrity, workspace isolation, permissions,
auditing, migrations, and CLI exit codes. CI runs Go tests with the race detector,
Go vet, PostgreSQL persistence integration, TypeScript, zero-warning Airbnb/Next
ESLint, Prettier, frontend revision/request tests, and a production Next.js build.
Existing seeded-defect/partial-fix CI checks remain.

Legacy approvals used a short partial hash. This version hashes all case fields.
Existing databases remain readable, but those approvals must be reviewed again
and re-exported before execution. Repository synthetic example bundles have been
refreshed; `scripts/refresh-demo-bundles.go` only regenerates these demo artifacts.
