import React from 'react';
import { useParams } from 'react-router-dom';
import { LiveDecisionGate, LiveDecisionReportView } from '../components/decision/LiveDecisionReportView';
import { useOnChainCandidate, useOnChainPackageByPublisherSlug } from '../features/registry/registryQueries';
import { deriveCandidateId } from '../lib/candidateValidation';
import { inspectLiveDecision } from '../lib/decisionReport';
import { getUpdateSealConfigResult, isLiveReadsEnabled } from '../lib/updateSealConfig';
import { logUpdateSealError, toUpdateSealError } from '../lib/updateSealErrors';

export const LiveCandidateDecisionPage: React.FC = () => {
  const { publisher = '', packageSlug = '', version = '' } = useParams();
  const decodedPublisher = decodeURIComponent(publisher);
  const decodedSlug = decodeURIComponent(packageSlug);
  const decodedVersion = decodeURIComponent(version);
  const configResult = getUpdateSealConfigResult();
  const liveEnabled = isLiveReadsEnabled(configResult);
  const packageQuery = useOnChainPackageByPublisherSlug(decodedPublisher, decodedSlug);
  const packageUid = packageQuery.data?.packageUid;
  const candidateId = packageUid ? deriveCandidateId(packageUid, decodedVersion) : undefined;
  const candidateQuery = useOnChainCandidate(candidateId);

  if (!configResult.ok) {
    return (
      <LiveDecisionGate title="Configuration Error" testId="live-decision-config-error">
        <p className="text-xs font-mono">{configResult.error.userMessage}</p>
      </LiveDecisionGate>
    );
  }

  if (!liveEnabled) {
    return (
      <LiveDecisionGate title="Live Route Unavailable" testId="live-decision-demo-unavailable">
        <p className="text-xs font-mono">Live decision reports are unavailable in demo mode.</p>
      </LiveDecisionGate>
    );
  }

  if (packageQuery.isLoading || candidateQuery.isLoading) {
    return (
      <div className="bg-brand-cream px-6 py-16" data-testid="live-decision-loading">
        <div className="max-w-[1400px] mx-auto bg-white border-2 border-brand-charcoal p-10 animate-pulse min-h-[240px]" />
      </div>
    );
  }

  const error =
    packageQuery.error || candidateQuery.error
      ? toUpdateSealError(packageQuery.error ?? candidateQuery.error)
      : null;
  if (error) {
    logUpdateSealError(error);
    return (
      <LiveDecisionGate
        title="Decision Report Unavailable"
        testId="live-decision-error"
        retry={() => {
          void packageQuery.refetch();
          void candidateQuery.refetch();
        }}
      >
        <p className="text-xs font-mono">{error.userMessage}</p>
      </LiveDecisionGate>
    );
  }

  const record = candidateQuery.data;
  const pkg = packageQuery.data?.record;
  if (!record || !pkg) {
    return null;
  }

  return <LiveDecisionReportView inspection={inspectLiveDecision(record, pkg)} />;
};
