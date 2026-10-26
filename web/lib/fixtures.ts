import type { Fixture } from "./types";

export const FIXTURES: Fixture[] = ["broken", "partial", "fixed"];

export const FIXTURE_LABEL: Record<Fixture, { long: string; short: string }> = {
  broken: { long: "Seeded defect", short: "Defect" },
  partial: { long: "Partial fix", short: "Partial" },
  fixed: { long: "Corrected", short: "Fixed" },
};

export const NO_RUNS: Record<Fixture, null> = { broken: null, partial: null, fixed: null };
