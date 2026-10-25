"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiRequestError } from "@/lib/api";
import type { CheckResult, Fixture, History, Plan, PlanCase, Run } from "@/lib/types";
import { gsap, useGSAP, Flip } from "@/lib/gsap";

import Sidebar, { type Section } from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import ExplainScreen from "@/components/ExplainScreen";
import ReviewScreen from "@/components/ReviewScreen";
import VerifyScreen from "@/components/VerifyScreen";
import EvidenceDrawer from "@/components/EvidenceDrawer";
import HistoryPanel from "@/components/HistoryPanel";
import FixturesPanel from "@/components/FixturesPanel";

const SAMPLE_RULE =
  "Viewers can read assets in their own tenant. Editors can also update them. Neither role can access another tenant's assets.";

export default function Home() {
  const [section, setSection] = useState<Section>("checks");
  const [driver, setDriver] = useState<string>();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [text, setText] = useState(SAMPLE_RULE);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [history, setHistory] = useState<History | null>(null);

  const [fixture, setFixture] = useState<Fixture>("broken");
  // Cached per fixture so switching between "seeded defect" and "corrected"
  // is instant and both results stay on screen for comparison, without
  // re-running or losing either one.
  const [runsByFixture, setRunsByFixture] = useState<Record<Fixture, Run | null>>({ broken: null, fixed: null });
  const run = runsByFixture[fixture];
  const [running, setRunning] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const runAbortRef = useRef<AbortController | null>(null);

  const [generating, setGenerating] = useState(false);
  const [editingPending, setEditingPending] = useState(false);
  const [approving, setApproving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [viewOverride, setViewOverride] = useState<0 | 1 | 2 | null>(null);
  const flipState = useRef<ReturnType<typeof Flip.getState> | null>(null);

  const derivedStage: 0 | 1 | 2 = !plan ? 0 : !plan.approved ? 1 : 2;
  const stage = viewOverride ?? derivedStage;

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setDriver(d.driver))
      .catch((e) => console.error("health check failed:", e));
  }, []);

  const refreshHistory = useCallback(async (rootId: string) => {
    try {
      const h = await api.history(rootId);
      setHistory(h);
      return h;
    } catch (e) {
      // Non-fatal: the current plan/run state is already correct without
      // history, so this only degrades the History panel and revision
      // label — but it should still be visible for debugging.
      console.error("failed to refresh history:", e);
      return null;
    }
  }, []);

  function captureFlip() {
    const el = document.getElementById("rule-summary-flip");
    if (el) flipState.current = Flip.getState(el);
  }

  useGSAP(() => {
    if (!flipState.current) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      Flip.from(flipState.current!, { duration: 0.45, ease: "power2.inOut", absolute: true });
    });
    flipState.current = null;
  }, [plan?.id]);

  // Workspace entrance
  const shellRef = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-shell-reveal]", { opacity: 0, y: 10, duration: 0.5, ease: "power2.out", stagger: 0.05 });
      });
      return () => mm.revert();
    },
    { scope: shellRef }
  );

  async function handleGenerate() {
    setErrorMsg(null);
    setGenerating(true);
    captureFlip();
    try {
      const p = plan ? await api.revisePlan(plan.id, text) : await api.createPlan(text);
      setPlan(p);
      setRunsByFixture({ broken: null, fixed: null });
      setCancelled(false);
      setViewOverride(null);
      await refreshHistory(p.rootPlanId);
    } catch (e) {
      setErrorMsg(message(e));
    } finally {
      setGenerating(false);
    }
  }

  function handleStartOver() {
    setPlan(null);
    setHistory(null);
    setRunsByFixture({ broken: null, fixed: null });
    setText(SAMPLE_RULE);
    setViewOverride(null);
    setSelectedResultId(null);
    setDrawerOpen(false);
  }

  async function handleEditCase(caseId: string, want: number) {
    if (!plan) return;
    setErrorMsg(null);
    setEditingPending(true);
    try {
      const p = await api.editCases(plan.id, { [caseId]: want });
      setPlan(p);
      setRunsByFixture({ broken: null, fixed: null });
      setCancelled(false);
      await refreshHistory(p.rootPlanId);
    } catch (e) {
      setErrorMsg(message(e));
    } finally {
      setEditingPending(false);
    }
  }

  async function handleApprove() {
    if (!plan) return;
    setErrorMsg(null);
    setApproving(true);
    try {
      let p = plan;
      if (p.assumptions && p.assumptions.length > 0 && !p.assumptionsAcknowledged) {
        p = await api.acknowledge(p.id);
      }
      p = await api.approve(p.id);
      setPlan(p);
      setViewOverride(null);
      await refreshHistory(p.rootPlanId);
    } catch (e) {
      setErrorMsg(message(e));
    } finally {
      setApproving(false);
    }
  }

  async function handleRun() {
    if (!plan || running) return; // guards against rapid-click duplicate runs
    setErrorMsg(null);
    setCancelled(false);
    setRunning(true);
    const controller = new AbortController();
    runAbortRef.current = controller;
    try {
      const r = await api.createRun(plan.id, fixture, controller.signal);
      setRunsByFixture((prev) => ({ ...prev, [fixture]: r }));
      await refreshHistory(plan.rootPlanId);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setCancelled(true);
      } else {
        setErrorMsg(message(e));
      }
    } finally {
      setRunning(false);
      runAbortRef.current = null;
    }
  }

  function handleCancelRun() {
    runAbortRef.current?.abort();
  }

  function handleFixtureChange(f: Fixture) {
    if (f === fixture) return;
    setFixture(f);
    setCancelled(false);
    // The run cached for this fixture (if any) is shown immediately —
    // no need to re-run just to compare against what's already known.
  }

  function handleSelectResult(caseId: string) {
    setSelectedResultId(caseId);
    setDrawerOpen(true);
  }

  async function handleExportPlan() {
    if (!plan) return;
    const bundle = await api.exportBundle(plan.id);
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ruleproof-plan-${plan.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleOpenRun(historicalRun: Run) {
    setErrorMsg(null);
    try {
      let targetPlan = plan;
      if (!targetPlan || targetPlan.id !== historicalRun.planId) {
        targetPlan = await api.getPlan(historicalRun.planId);
        setPlan(targetPlan);
      }
      setFixture(historicalRun.fixture);
      setRunsByFixture({ broken: null, fixed: null, [historicalRun.fixture]: historicalRun });
      setCancelled(false);
      setSection("checks");
      setViewOverride(2);
    } catch (e) {
      setErrorMsg(message(e));
    }
  }

  const selectedCase: PlanCase | null = plan?.cases.find((c) => c.id === selectedResultId) ?? null;
  const selectedResult: CheckResult | null = run?.results.find((r) => r.id === selectedResultId) ?? null;

  const revisionLabel =
    history && plan
      ? `Revision ${history.lineage.findIndex((p) => p.id === plan.id) + 1} of ${history.lineage.length}`
      : plan
      ? "Revision 1"
      : "No revision yet";

  const primaryAction =
    section !== "checks"
      ? null
      : stage === 0
      ? { label: plan ? "Update checks" : "Generate checks", onClick: handleGenerate, loading: generating, disabled: !text.trim() }
      : stage === 1
      ? { label: "Approve plan", onClick: handleApprove, loading: approving, disabled: editingPending }
      : { label: run ? "Run again" : "Run checks", onClick: handleRun, loading: running };

  return (
    <div ref={shellRef} className="flex h-dvh overflow-hidden bg-canvas text-ink">
      <Sidebar
        section={section}
        onSelect={setSection}
        driver={driver}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div data-shell-reveal>
          <TopBar
            revisionLabel={revisionLabel}
            fixture={fixture}
            onFixtureChange={handleFixtureChange}
            fixtureDisabled={section !== "checks" || !plan?.approved}
            primaryAction={primaryAction}
            stepperCurrent={derivedStage}
            stepperViewing={section === "checks" ? stage : undefined}
            onStepNavigate={section === "checks" ? setViewOverride : undefined}
            onOpenMobileNav={() => setMobileNavOpen(true)}
          />
        </div>

        {errorMsg && (
          <div className="border-b border-fail/30 bg-fail/5 px-6 py-2 text-sm text-fail" role="alert">
            {errorMsg}
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          {section === "fixtures" && <FixturesPanel fixture={fixture} onSelect={setFixture} />}

          {section === "history" && (
            <HistoryPanel
              history={history}
              loading={false}
              onOpenRun={handleOpenRun}
            />
          )}

          {section === "checks" && stage === 0 && (
            <ExplainScreen
              text={text}
              onTextChange={setText}
              onGenerate={handleGenerate}
              loading={generating}
              concepts={plan?.concepts ?? null}
              assumptions={plan?.assumptions ?? null}
              hasPlan={Boolean(plan)}
              onStartOver={handleStartOver}
            />
          )}

          {section === "checks" && stage === 1 && plan && (
            <ReviewScreen
              plan={plan}
              revisionLabel={revisionLabel}
              onEdit={handleEditCase}
              onApprove={handleApprove}
              approving={approving}
              editingPending={editingPending}
            />
          )}

          {section === "checks" && stage === 2 && plan && (
            <VerifyScreen
              plan={plan}
              run={run}
              running={running}
              cancelled={cancelled}
              fixture={fixture}
              onRun={handleRun}
              onCancel={handleCancelRun}
              onSelectResult={handleSelectResult}
              selectedId={selectedResultId}
              onExport={handleExportPlan}
            />
          )}
        </main>
      </div>

      <EvidenceDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        result={selectedResult}
        planCase={selectedCase}
        plan={plan as Plan}
        run={run}
        revisionLabel={revisionLabel}
      />
    </div>
  );
}

function message(e: unknown): string {
  if (e instanceof ApiRequestError) return e.message;
  if (e instanceof Error) return e.message;
  return "Something went wrong.";
}
