'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { downloadJson } from '@/lib/download';
import { errorMessage } from '@/lib/errorMessage';
import type { Run } from '@/lib/types';
import type { Section } from '@/constants/navigation';
import { SAMPLE_RULE } from '@/constants/rules';
import useRuleFlip from './useRuleFlip';
import type { PlanHistory } from './usePlanHistory';
import type { StudioRuns } from './useStudioRuns';

// Rule text, plan lifecycle (generate → edit → approve) and which step is shown.
const useStudioPlan = ({
  planHistory: { plan, setPlan, setHistory, refreshHistory },
  runs,
  setErrorMsg,
  setSection,
}: {
  planHistory: PlanHistory;
  runs: StudioRuns;
  setErrorMsg: (msg: string | null) => void;
  setSection: (section: Section) => void;
}) => {
  const [text, setText] = useState(SAMPLE_RULE);
  const [generating, setGenerating] = useState(false);
  const [editingPending, setEditingPending] = useState(false);
  const [approving, setApproving] = useState(false);

  const [viewOverride, setViewOverride] = useState<0 | 1 | 2 | null>(null);
  const captureFlip = useRuleFlip(plan?.id);

  const derivedStage: 0 | 1 | 2 = (() => {
    if (!plan) {
      return 0;
    }
    if (!plan.approved) {
      return 1;
    }
    return 2;
  })();
  const stage = viewOverride ?? derivedStage;

  const handleGenerate = async () => {
    setErrorMsg(null);
    setGenerating(true);
    captureFlip();
    try {
      const p = plan ? await api.revisePlan(plan.id, text) : await api.createPlan(text);
      setPlan(p);
      runs.resetRuns();
      setViewOverride(null);
      await refreshHistory(p.rootPlanId);
    } catch (e) {
      setErrorMsg(errorMessage(e));
    } finally {
      setGenerating(false);
    }
  };

  const handleStartOver = () => {
    setPlan(null);
    setHistory(null);
    runs.clearRuns();
    setText(SAMPLE_RULE);
    setViewOverride(null);
  };

  // Back to Explain with the gap's sentence appended and the cursor at the
  // end, so the user can generate as-is or dictate their own wording.
  const handleAddSentence = (sentence: string) => {
    if (!plan) return;
    const next = `${plan.ruleText.trim()} ${sentence}`;
    setText(next);
    setViewOverride(0);
    requestAnimationFrame(() => {
      const input = document.getElementById('rule-input') as HTMLTextAreaElement | null;
      input?.focus();
      input?.setSelectionRange(next.length, next.length);
    });
  };

  const handleEditCase = async (caseId: string, want: number) => {
    if (!plan) return;
    setErrorMsg(null);
    setEditingPending(true);
    try {
      const p = await api.editCases(plan.id, { [caseId]: want });
      setPlan(p);
      runs.resetRuns();
      await refreshHistory(p.rootPlanId);
    } catch (e) {
      setErrorMsg(errorMessage(e));
    } finally {
      setEditingPending(false);
    }
  };

  const handleApprove = async () => {
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
      setErrorMsg(errorMessage(e));
    } finally {
      setApproving(false);
    }
  };

  const handleExportPlan = async () => {
    if (!plan) return;
    const bundle = await api.exportBundle(plan.id);
    downloadJson(`ruleproof-plan-${plan.id}.json`, bundle);
  };

  const handleOpenRun = async (historicalRun: Run) => {
    setErrorMsg(null);
    try {
      let targetPlan = plan;
      if (!targetPlan || targetPlan.id !== historicalRun.planId) {
        targetPlan = await api.getPlan(historicalRun.planId);
        setPlan(targetPlan);
      }
      runs.showRun(historicalRun);
      setSection('checks');
      setViewOverride(2);
    } catch (e) {
      setErrorMsg(errorMessage(e));
    }
  };

  return {
    text,
    setText,
    generating,
    editingPending,
    approving,
    derivedStage,
    stage,
    setViewOverride,
    handleGenerate,
    handleStartOver,
    handleAddSentence,
    handleEditCase,
    handleApprove,
    handleExportPlan,
    handleOpenRun,
  };
};

export default useStudioPlan;
