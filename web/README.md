# RuleProof frontend

The Next.js application exports static pages served by the Go server. Run `npm ci`,
then `npm run dev` for development or `npm run build` for production.
See the root README for server setup and the Workbench configuration.

## Code conventions

- Use arrow functions, including React components and callbacks.
- Keep each TypeScript source file within 200 lines, including blank lines and comments.
  Extract components, domain hooks, and pure helpers by responsibility.
- Put reusable values, labels, limits, and styles in `constants/`.
- `.editorconfig` defines UTF-8, LF, final newlines and two-space frontend indentation.
  Prettier controls formatting; use the editor's format-on-save integration.
- ESLint loads the actual `eslint-config-airbnb` rules through `FlatCompat`, then
  the Next.js and TypeScript rules. Next supplies the current plugin implementations.
  TypeScript types and the automatic JSX runtime replace redundant JavaScript checks.
  Labels may use either `htmlFor` or a nested control; native UI wrappers can forward props.
  Error and warning diagnostics remain allowed.
- `.npmrc` enables legacy peer resolution because Airbnb's published configuration
  declares ESLint 8 peers while this Next.js application uses ESLint 9. The adapted
  configuration is exercised by lint in CI; do not bypass lint to update dependencies.

## Checks

```sh
npm run format:check
npm run typecheck
npm run lint
npm test
npm run build
```

CI runs each command. `npm run format` and `npm run lint:fix` apply mechanical fixes.
`npm run typecheck` generates Next.js route types before running TypeScript, so it
works on a fresh checkout without a prior dev session or production build. Use this
command instead of invoking `tsc` directly; generated types remain Git-ignored.
The Node tests exercise revision transitions and the API request boundary. Backend
tests cover approvals, workspace isolation, execution, redaction, and persistence.

## Workbench structure

`components/workbench/` contains the workspace views and small editors.
`hooks/workbench/` separates session loading, revision lifecycle, debounced analysis,
and asynchronous actions. `lib/workbenchState.ts` owns immutable draft transitions;
`lib/workbench.ts` owns the API types and request boundary. Editing never changes a
saved revision, and discarded edits reset local editor state as well as the draft.

The feature contract and operational limits are documented in
[`docs/specs/authorization-workbench.md`](../docs/specs/authorization-workbench.md).
