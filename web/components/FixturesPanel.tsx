import type { Fixture } from "@/lib/types";
import { FIXTURES, FIXTURE_DETAILS, FIXTURE_LABEL } from "@/constants/fixtures";
import clsx from "clsx";

const FixturesPanel = ({
  fixture,
  onSelect,
}: {
  fixture: Fixture;
  onSelect: (f: Fixture) => void;
}) => (
  <div className="mx-auto max-w-4xl px-6 py-10">
    <h1 className="text-xl font-semibold tracking-tight text-ink">Fixtures</h1>
    <p className="mt-1 text-sm text-ink-muted">
      A synthetic asset API with three versions, so the same approved plan can run against any of them.
    </p>

    <div className="mt-6 grid gap-4 md:grid-cols-3">
      {FIXTURES.map((f) => {
        const d = FIXTURE_DETAILS[f];
        const Icon = d.icon;
        return (
          <button
            key={f}
            type="button"
            onClick={() => onSelect(f)}
            className={clsx(
              "rounded-lg border p-4 text-left transition-colors",
              fixture === f ? d.selected : "border-border bg-panel hover:border-ink-faint"
            )}
          >
            <div className={clsx("flex items-center gap-2", d.tone)}>
              <Icon size={16} />
              <span className="text-sm font-medium">{FIXTURE_LABEL[f].long}</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">{d.text}</p>
          </button>
        );
      })}
    </div>

    <p className="mt-6 text-xs leading-relaxed text-ink-faint">
      All fixtures are synthetic, started locally for this demo. RuleProof never executes checks against an
      arbitrary user-supplied target. A passing run means the approved scenarios passed against this fixture —
      it does not prove the whole application is secure.
    </p>
  </div>
);

export default FixturesPanel;
