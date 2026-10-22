import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { DataModeBadge } from '../components/ui/DataModeBadge';
import { LiveDecisionGate } from '../components/decision/LiveDecisionReportView';
import { useOnChainCandidate, useOnChainPackageByPublisherSlug } from '../features/registry/registryQueries';
import { deriveCandidateId } from '../lib/candidateValidation';
import { inspectLiveDecision, isCompletedVerdictStatus } from '../lib/decisionReport';
import { liveCandidateDecisionPath, liveCandidateRecordPath, livePackagePath } from '../lib/registrationValidation';
import { getUpdateSealConfigResult, isLiveReadsEnabled } from '../lib/updateSealConfig';
import { logUpdateSealError, toUpdateSealError } from '../lib/updateSealErrors';
import { EvaluateCandidatePanel } from '../components/candidate/EvaluateCandidatePanel';

export const LiveCandidateReviewPage: React.FC = () => {
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
      <LiveDecisionGate title="Configuration Error" testId="live-review-config-error">
        <p className="text-xs font-mono">{configResult.error.userMessage}</p>
      </LiveDecisionGate>
    );
  }

  if (!liveEnabled) {
    return (
      <LiveDecisionGate title="Live Route Unavailable" testId="live-review-demo-unavailable">
        <p className="text-xs font-mono">Live candidate review is unavailable in demo mode.</p>
      </LiveDecisionGate>
    );
  }

  if (packageQuery.isLoading || candidateQuery.isLoading) {
    return (
      <div className="bg-brand-cream px-6 py-16" data-testid="live-review-loading">
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
        title="Live Review Unavailable"
        testId="live-review-error"
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

  const decisionPath = liveCandidateDecisionPath(pkg.publisher, pkg.package_slug, record.version);
  if (isCompletedVerdictStatus(record.status)) {
    return <Navigate to={decisionPath} replace />;
  }

  const inspection = inspectLiveDecision(record, pkg);
  const candidatePath = liveCandidateRecordPath(pkg.publisher, pkg.package_slug, record.version);

  return (
    <div className="flex flex-col w-full pb-16" data-testid="live-candidate-review">
      <div className="w-full bg-brand-cream border-b-2 border-brand-charcoal py-3 px-4 lg:px-12">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <div className="flex flex-wrap items-center gap-2 uppercase">
            <Link to="/registry" className="text-stone-500 hover:text-brand-orange font-bold">
              Registry
            </Link>
            <span className="text-stone-400">/</span>
            <Link to={livePackagePath(pkg.publisher, pkg.package_slug)} className="text-brand-orange font-bold">
              {pkg.package_slug}
            </Link>
            <span className="text-stone-400">/</span>
            <Link to={candidatePath} className="text-brand-charcoal font-bold">
              {record.version}
            </Link>
            <span className="text-stone-400">/</span>
            <span className="bg-brand-charcoal text-brand-pastelYellow px-2 py-0.5 font-bold">Review</span>
          </div>
          <DataModeBadge />
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 lg:px-12 py-8 w-full space-y-6">
        {inspection.kind === 'pending' ? (
          <section className="bg-brand-forest text-white border-2 border-brand-charcoal p-8 shadow-[8px_8px_0px_#0B130E] space-y-4">
            <span className="inline-flex items-center gap-2 bg-brand-pastelYellow text-brand-charcoal font-mono text-xs px-3 py-1.5 font-bold uppercase border border-brand-charcoal">
              <Clock className="w-4 h-4" />
              Status: PENDING
            </span>
            <h1 className="text-3xl lg:text-5xl font-black uppercase tracking-tight">Evaluation Pending</h1>
            <p className="text-base max-w-3xl leading-relaxed">
              This live candidate has no completed verdict. The demo consensus tracker is not used for on-chain records.
            </p>
            <p className="font-mono text-xs break-all">Candidate ID: {record.candidate_id}</p>
            <p className="font-mono text-xs">Evaluation attempts: {record.evaluation_attempts}</p>
            <EvaluateCandidatePanel candidate={record} packageRecord={pkg} />
          </section>
        ) : (
          <div
            className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] space-y-3"
            role="alert"
            data-testid="live-review-integrity"
          >
            <h1 className="text-2xl font-black uppercase">On-chain data integrity error</h1>
            <p className="text-sm">
              {inspection.kind === 'unsupported'
                ? inspection.message
                : inspection.kind === 'integrity'
                  ? inspection.message
                  : 'This candidate cannot be shown as a pending review.'}
            </p>
            <Link to={decisionPath} className="text-xs font-bold uppercase text-brand-orange">
              Open decision report
            </Link>
          </div>
        )}
        <Link to={candidatePath} className="text-xs font-bold uppercase text-brand-orange">
          ← Back to candidate record
        </Link>
      </div>
    </div>
  );
};
