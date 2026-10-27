'use client';

import { useRef, useState } from 'react';
import type { Plan } from '@/lib/types';
import useDriver from '@/hooks/useDriver';
import usePlanHistory from '@/hooks/usePlanHistory';
import useStaggerReveal from '@/hooks/useStaggerReveal';
import useStudioPlan from '@/hooks/useStudioPlan';
import useStudioRuns from '@/hooks/useStudioRuns';

import Sidebar from '@/components/Sidebar';
import type { Section } from '@/constants/navigation';
import TopBar from '@/components/TopBar';
import ExplainScreen from '@/components/ExplainScreen';
import ReviewScreen from '@/components/ReviewScreen';
import VerifyScreen from '@/components/VerifyScreen';
import EvidenceDrawer from '@/components/EvidenceDrawer';
import HistoryPanel from '@/components/HistoryPanel';
import FixturesPanel from '@/components/FixturesPanel';
import Workbench from '@/components/workbench/Workbench';
import WorkspaceBar from '@/components/workbench/WorkspaceBar';

const Home = () => {
  const [section, setSection] = useState<Section>('checks');
  const driver = useDriver();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const planHistory = usePlanHistory();
  const { plan, history, revisionLabel } = planHistory;
  const runs = useStudioRuns({
    plan,
    refreshHistory: planHistory.refreshHistory,
    setErrorMsg,
  });
  const { fixture, run } = runs;
  const studio = useStudioPlan({ planHistory, runs, setErrorMsg, setSection });
  const { stage } = studio;

  // Workspace entrance
  const shellRef = useRef<HTMLDivElement>(null);
  useStaggerReveal(shellRef, '[data-shell-reveal]', {
    y: 10,
    duration: 0.5,
    stagger: 0.05,
  });

  const primaryAction = (() => {
    if (section !== 'checks') {
      return null;
    }
    if (stage === 0) {
      return {
        label: plan ? 'Update checks' : 'Generate checks',
        onClick: studio.handleGenerate,
        loading: studio.generating,
        disabled: !studio.text.trim(),
      };
    }
    if (stage === 1) {
      return {
        label: 'Approve plan',
        onClick: studio.handleApprove,
        loading: studio.approving,
        disabled: studio.editingPending,
      };
    }
    return {
      label: run ? 'Run again' : 'Run checks',
      onClick: runs.handleRun,
      loading: runs.running,
    };
  })();

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
          {section === 'workbench' ? (
            <WorkspaceBar onOpenNavigation={() => setMobileNavOpen(true)} />
          ) : (
            <TopBar
              revisionLabel={revisionLabel}
              fixture={fixture}
              onFixtureChange={runs.handleFixtureChange}
              fixtureDisabled={section !== 'checks' || !plan?.approved}
              primaryAction={primaryAction}
              stepperCurrent={studio.derivedStage}
              stepperViewing={section === 'checks' ? stage : undefined}
              onStepNavigate={section === 'checks' ? studio.setViewOverride : undefined}
              onOpenMobileNav={() => setMobileNavOpen(true)}
            />
          )}
        </div>

        {errorMsg && (
          <div
            className="border-b border-fail/30 bg-fail/5 px-6 py-2 text-sm text-fail"
            role="alert"
          >
            {errorMsg}
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <div hidden={section !== 'workbench'}>
            <Workbench />
          </div>
          {section === 'fixtures' && <FixturesPanel fixture={fixture} onSelect={runs.setFixture} />}

          {section === 'history' && (
            <HistoryPanel history={history} loading={false} onOpenRun={studio.handleOpenRun} />
          )}

          {section === 'checks' && stage === 0 && (
            <ExplainScreen
              text={studio.text}
              onTextChange={studio.setText}
              onGenerate={studio.handleGenerate}
              loading={studio.generating}
              concepts={plan?.concepts ?? null}
              assumptions={plan?.assumptions ?? null}
              hasPlan={Boolean(plan)}
              onStartOver={studio.handleStartOver}
            />
          )}

          {section === 'checks' && stage === 1 && plan && (
            <ReviewScreen
              plan={plan}
              revisionLabel={revisionLabel}
              onEdit={studio.handleEditCase}
              onAddSentence={studio.handleAddSentence}
              onApprove={studio.handleApprove}
              approving={studio.approving}
              editingPending={studio.editingPending}
              lineage={history?.lineage}
            />
          )}

          {section === 'checks' && stage === 2 && plan && (
            <VerifyScreen
              plan={plan}
              run={run}
              running={runs.running}
              cancelled={runs.cancelled}
              fixture={fixture}
              bypass={runs.bypass}
              onBypassChange={runs.setBypass}
              onRun={runs.handleRun}
              onCancel={runs.handleCancelRun}
              onSelectResult={runs.handleSelectResult}
              selectedId={runs.selectedResultId}
              onExport={studio.handleExportPlan}
            />
          )}
        </main>
      </div>

      <EvidenceDrawer
        open={runs.drawerOpen}
        onClose={runs.closeDrawer}
        result={runs.selectedResult}
        planCase={runs.selectedCase}
        plan={plan as Plan}
        run={run}
        revisionLabel={revisionLabel}
      />
    </div>
  );
};

export default Home;
