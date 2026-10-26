import JsonView from "../JsonView";

const ResponseBody = ({ body }: { body?: string }) =>
  body ? (
    <div className="rounded-md border border-border bg-panel-elevated px-3 py-2">
      <JsonView value={body} />
    </div>
  ) : (
    <p className="text-xs text-ink-faint">No response body captured.</p>
  );

export default ResponseBody;
