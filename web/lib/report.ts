// Trailing slash matches the static export's report/index.html, so the Go
// file server serves it without a redirect.
export const reportPath = (runId: string): string => `/report/?run=${encodeURIComponent(runId)}`;
