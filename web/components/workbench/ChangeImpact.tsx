'use client';

import useImpactAnalysis from '@/hooks/workbench/useImpactAnalysis';
import type { Revision } from '@/lib/workbench';
import ImpactUpload from './ImpactUpload';
import ImpactResults from './ImpactResults';

interface Props {
  token: string;
  revision: Revision | null;
  dirty: boolean;
}

const ChangeImpact = ({ token, revision, dirty }: Props) => {
  const analysis = useImpactAnalysis(token, revision);
  return (
    <div className="space-y-6">
      <ImpactUpload
        revision={revision}
        dirty={dirty}
        loading={analysis.loading}
        error={analysis.error}
        analyze={analysis.analyze}
      />
      {analysis.report && !dirty && (
        <ImpactResults report={analysis.report} filename={analysis.filename} />
      )}
    </div>
  );
};
export default ChangeImpact;
