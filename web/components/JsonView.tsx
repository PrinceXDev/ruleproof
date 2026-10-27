import type { ReactNode } from 'react';

import { TOKEN_SOURCE } from '@/constants/json';

// classify is only ever called for non-key tokens (the caller routes key
// tokens to "text-brand" itself), so a quoted token here is always a string
// value, never a key.
const classify = (token: string): string => {
  if (/^".*"$/.test(token)) return 'text-pass';
  if (token === 'true' || token === 'false') return 'text-attn';
  if (token === 'null') return 'text-ink-faint';
  if (/^-?\d/.test(token)) return 'text-fail';
  return 'text-pass';
};

/** Minimal, dependency-free JSON syntax highlighting for evidence bodies. */
const JsonView = ({ value }: { value: string }) => {
  let pretty = value;
  try {
    pretty = JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    // not JSON (or empty) — render as-is
  }

  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  const tokenRe = new RegExp(TOKEN_SOURCE, 'g'); // fresh instance per render: exec() is stateful via lastIndex
  Array.from(pretty.matchAll(tokenRe)).forEach((match) => {
    if (match.index > lastIndex) nodes.push(pretty.slice(lastIndex, match.index));
    const isKey = /":?$/.test(match[0]) && match[0].trimEnd().endsWith(':');
    nodes.push(
      <span key={match.index} className={isKey ? 'text-brand' : classify(match[0])}>
        {match[0]}
      </span>,
    );
    lastIndex = match.index + match[0].length;
  });
  nodes.push(pretty.slice(lastIndex));

  return (
    <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono-tnum text-[12.5px] leading-relaxed text-ink-muted">
      {nodes}
    </pre>
  );
};

export default JsonView;
