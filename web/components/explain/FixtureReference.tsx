import { Pencil } from "lucide-react";
import { FIXTURE_REFERENCE } from "@/constants/fixtureReference";
import PanelHeading from "./PanelHeading";

const FixtureReference = () => (
  <aside data-explain-reveal className="h-fit rounded-xl border border-border bg-panel p-5 lg:mt-[104px]">
    <PanelHeading icon={<Pencil size={12} />} className="mb-3 text-ink-faint">
      Fixture reference
    </PanelHeading>
    <dl className="space-y-3 text-sm">
      {FIXTURE_REFERENCE.map(({ term, value }) => (
        <div key={term}>
          <dt className="text-ink-faint">{term}</dt>
          <dd className="text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  </aside>
);

export default FixtureReference;
