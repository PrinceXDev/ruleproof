'use client';

import { useRef, useState } from 'react';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errorMessage';
import { NO_RUNS } from '@/constants/fixtures';
import type { CheckResult, Fixture, Plan, PlanCase, Run } from '@/lib/types';
import type { PlanHistory } from './usePlanHistory';

// Fixture choice, runs per fixture, and the evidence drawer selection.
const useStudioRuns = ({
  plan,
  refreshHistory,
  setErrorMsg,
}: {
  plan: Plan | null;
  refreshHistory: PlanHistory['refreshHistory'];
  setErrorMsg: (msg: string | null) => void;
}) => {
  const [fixture, setFixture] = useState<Fixture>('broken');
  // Cached per fixture so switching between fixtures is instant and every
  // result stays on screen for comparison, without re-running or losing any.
  const [runsByFixture, setRunsByFixture] = useState<Record<Fixture, Run | null>>(NO_RUNS);
  const run = runsByFixture[fixture];
  const [bypass, setBypass] = useState(true);
  const [running, setRunning] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const runAbortRef = useRef<AbortController | null>(null);

  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // The plan changed, so earlier results no longer apply.
  const resetRuns = () => {
    setRunsByFixture(NO_RUNS);
    setCancelled(false);
  };

  const clearRuns = () => {
    setRunsByFixture(NO_RUNS);
    setSelectedResultId(null);
    setDrawerOpen(false);
  };

  const showRun = (historicalRun: Run) => {
    setFixture(historicalRun.fixture);
    setRunsByFixture({ ...NO_RUNS, [historicalRun.fixture]: historicalRun });
    setCancelled(false);
  };

  const handleRun = async () => {
    if (!plan || running) return; // guards against rapid-click duplicate runs
    setErrorMsg(null);
    setCancelled(false);
    setRunning(true);
    const controller = new AbortController();
    runAbortRef.current = controller;
    try {
      const r = await api.createRun(plan.id, fixture, bypass, controller.signal);
      setRunsByFixture((prev) => ({ ...prev, [fixture]: r }));
      await refreshHistory(plan.rootPlanId);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        setCancelled(true);
      } else {
        setErrorMsg(errorMessage(e));
      }
    } finally {
      setRunning(false);
      runAbortRef.current = null;
    }
  };

  const handleCancelRun = () => {
    runAbortRef.current?.abort();
  };

  const handleFixtureChange = (f: Fixture) => {
    if (f === fixture) return;
    setFixture(f);
    setCancelled(false);
    // The run cached for this fixture (if any) is shown immediately —
    // no need to re-run just to compare against what's already known.
  };

  const handleSelectResult = (caseId: string) => {
    setSelectedResultId(caseId);
    setDrawerOpen(true);
  };

  // A bypass attempt opens the evidence of the approved case it came from.
  const selectedResult: CheckResult | null =
    [...(run?.results ?? []), ...(run?.variants ?? [])].find((r) => r.id === selectedResultId) ??
    null;
  const selectedCaseId = selectedResult?.variant?.of ?? selectedResultId;
  const selectedCase: PlanCase | null = plan?.cases.find((c) => c.id === selectedCaseId) ?? null;

  return {
    fixture,
    setFixture,
    run,
    bypass,
    setBypass,
    running,
    cancelled,
    resetRuns,
    clearRuns,
    showRun,
    handleRun,
    handleCancelRun,
    handleFixtureChange,
    selectedResultId,
    selectedResult,
    selectedCase,
    handleSelectResult,
    drawerOpen,
    closeDrawer: () => setDrawerOpen(false),
  };
};

export type StudioRuns = ReturnType<typeof useStudioRuns>;

export default useStudioRuns;
