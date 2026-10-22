import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ExternalLink } from 'lucide-react';
import { DataModeBadge } from '../ui/DataModeBadge';
import type { CompletedVerdictStatus, LiveDecisionInspection } from '../../lib/decisionReport';
import { ON_CHAIN_INTEGRITY_ERROR, safeExternalHref } from '../../lib/decisionReport';
import { liveCandidateRecordPath, livePackagePath } from '../../lib/registrationValidation';
import { HashField } from './HashField';

const PRESENTATION: Record<
  CompletedVerdictStatus,
  { watermark: string; heroClass: string; title: string; badgeClass: string }
> = {
  APPROVED: {
    watermark: '0x01',
    heroClass: 'bg-brand-vibrantCyan text-brand-charcoal',
    title: 'Candidate Release Approved',
    badgeClass: 'bg-brand-forest text-brand-pastelYellow',
  },
  REVIEW_REQUIRED: {
    watermark: '0x02',
    heroClass: 'bg-brand-pastelYellow text-brand-charcoal',
    title: 'Human Review Required',
    badgeClass: 'bg-brand-orange text-white',
  },
  VIOLATION: {
    watermark: '0x03',
    heroClass: 'bg-brand-orange text-white',
    title: 'Capability Violation',
    badgeClass: 'bg-brand-charcoal text-brand-pastelYellow',
  },
  EVIDENCE_UNAVAILABLE: {
    watermark: '0x04',
    heroClass: 'bg-brand-forest text-white',
    title: 'Evidence Unavailable',
    badgeClass: 'bg-brand-orange text-white',
  },
};

function Breadcrumb({
  publisher,
  slug,
  version,
  trail,
}: {
  publisher: string;
  slug: string;
  version: string;
  trail: string;
}) {
  return (
    <div className="w-full bg-brand-cream border-b-2 border-brand-charcoal py-3 px-4 lg:px-12">
      <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3 font-mono text-xs text-brand-charcoal">
        <div className="flex flex-wrap items-center gap-2 uppercase">
          <Link to="/registry" className="text-stone-500 hover:text-brand-orange font-bold">
            Registry
          </Link>
          <span className="text-stone-400">/</span>
          <Link to={livePackagePath(publisher, slug)} className="text-brand-orange font-bold hover:underline">
            {slug}
          </Link>
          <span className="text-stone-400">/</span>
          <Link
            to={liveCandidateRecordPath(publisher, slug, version)}
            className="text-brand-charcoal font-bold hover:underline"
          >
            {version}
          </Link>
          <span className="text-stone-400">/</span>
          <span className="bg-brand-charcoal text-brand-pastelYellow border border-brand-charcoal px-2 py-0.5 tracking-wider font-bold">
            {trail}
          </span>
        </div>
        <DataModeBadge />
      </div>
    </div>
  );
}

function IdentityPanel({ inspection }: { inspection: LiveDecisionInspection }) {
  const { candidate, packageRecord } = inspection;
  const evidenceHref = safeExternalHref(candidate.evidence_uri);
  const repoHref = safeExternalHref(packageRecord.repository_url);

  return (
    <div className="bg-brand-forest text-white border-2 border-brand-charcoal p-6 shadow-[6px_6px_0px_#0B130E] space-y-4">
      <h2 className="font-mono text-xs text-brand-pastelYellow uppercase font-bold tracking-wider">
        Cryptographic state proof
      </h2>
      <div className="space-y-3 font-mono text-xs">
        <HashField label="Candidate ID" value={candidate.candidate_id} testId="report-candidate-id" />
        <HashField label="Package UID" value={candidate.package_uid} testId="report-package-uid" />
        <HashField label="Version" value={candidate.version} testId="report-version" />
        <HashField label="Candidate commit SHA" value={candidate.candidate_commit_sha} testId="report-commit-sha" />
        <HashField label="Decision hash" value={candidate.decision_hash} testId="report-decision-hash" />
        <HashField label="Evidence hash" value={candidate.evidence_hash} testId="report-evidence-hash" />
        <HashField label="Package charter hash" value={packageRecord.charter_hash} testId="report-charter-hash" />
        <HashField label="Publisher" value={packageRecord.publisher} testId="report-publisher" />
        <HashField label="Candidate submitter" value={candidate.submitter} testId="report-submitter" />
        <div>
          <span className="text-stone-500 text-[10px] uppercase font-bold block mb-1">Evidence URI</span>
          {evidenceHref ? (
            <a
              href={evidenceHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-orange underline break-all font-bold flex items-start gap-1"
              data-testid="report-evidence-uri"
            >
              <span className="break-all">{candidate.evidence_uri}</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            </a>
          ) : (
            <span className="break-all" data-testid="report-evidence-uri">
              {candidate.evidence_uri || '(empty)'}
            </span>
          )}
        </div>
        {repoHref ? (
          <div>
            <span className="text-stone-500 text-[10px] uppercase font-bold block mb-1">Repository</span>
            <a
              href={repoHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-orange underline break-all font-bold flex items-start gap-1"
            >
              <span className="break-all">{packageRecord.repository_url}</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FindingCodes({ codes }: { codes: readonly string[] }) {
  if (codes.length === 0) {
    return <p className="text-xs font-mono text-stone-600">No finding codes recorded.</p>;
  }
  return (
    <ul className="flex flex-wrap gap-2" data-testid="finding-codes">
      {codes.map((code) => (
        <li
          key={code}
          data-testid="finding-code"
          className="bg-brand-pastelYellow border-2 border-brand-charcoal px-3 py-1.5 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#0B130E]"
        >
          {code}
        </li>
      ))}
    </ul>
  );
}

function IntegrityNotice({
  message,
  rawMalformedValue,
}: {
  message: string;
  rawMalformedValue?: string;
}) {
  return (
    <div
      className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] space-y-3"
      data-testid="live-decision-integrity"
      role="alert"
    >
      <h1 className="text-xl font-black uppercase text-brand-charcoal">{ON_CHAIN_INTEGRITY_ERROR}</h1>
      <p className="text-sm text-brand-charcoal">{message}</p>
      {rawMalformedValue !== undefined ? (
        <pre className="bg-stone-100 border border-brand-charcoal p-3 text-[11px] font-mono whitespace-pre-wrap break-all">
          {rawMalformedValue}
        </pre>
      ) : null}
    </div>
  );
}

export const LiveDecisionReportView: React.FC<{ inspection: LiveDecisionInspection }> = ({ inspection }) => {
  const { candidate, packageRecord } = inspection;
  const packagePath = livePackagePath(packageRecord.publisher, packageRecord.package_slug);
  const candidatePath = liveCandidateRecordPath(
    packageRecord.publisher,
    packageRecord.package_slug,
    candidate.version,
  );

  if (inspection.kind === 'integrity' || inspection.kind === 'unsupported') {
    return (
      <div className="flex flex-col w-full pb-16" data-testid="live-decision-report">
        <Breadcrumb
          publisher={packageRecord.publisher}
          slug={packageRecord.package_slug}
          version={candidate.version}
          trail="Decision"
        />
        <div className="max-w-[1440px] mx-auto px-4 lg:px-12 py-8 w-full space-y-6">
          {inspection.kind === 'integrity' ? (
            <IntegrityNotice message={inspection.message} rawMalformedValue={inspection.rawMalformedValue} />
          ) : (
            <div
              className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] space-y-3"
              data-testid="live-decision-unsupported"
              role="alert"
            >
              <h1 className="text-2xl font-black uppercase">Unsupported candidate status</h1>
              <p className="text-sm">
                On-chain status <strong>{inspection.status}</strong> is not a supported verdict. Status is not inferred
                from decision code {candidate.decision_code}.
              </p>
              <p className="text-xs font-mono">{inspection.message}</p>
            </div>
          )}
          <IdentityPanel inspection={inspection} />
        </div>
      </div>
    );
  }

  if (inspection.kind === 'pending') {
    return (
      <div className="flex flex-col w-full pb-16" data-testid="live-decision-report">
        <Breadcrumb
          publisher={packageRecord.publisher}
          slug={packageRecord.package_slug}
          version={candidate.version}
          trail="Decision"
        />
        <div className="max-w-[1440px] mx-auto px-4 lg:px-12 py-8 w-full flex flex-col gap-8">
          <section
            className="relative bg-brand-charcoal text-white border-2 border-brand-charcoal p-6 lg:p-10 shadow-[8px_8px_0px_#0B130E]"
            data-testid="live-decision-pending"
          >
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-2 bg-brand-pastelYellow text-brand-charcoal font-mono text-xs px-3 py-1.5 font-bold uppercase tracking-wider border border-brand-charcoal">
                <Clock className="w-4 h-4" />
                Status: PENDING
              </span>
            </div>
            <h1 className="text-3xl lg:text-5xl font-black uppercase tracking-tight leading-none">
              Evaluation Pending
            </h1>
            <p className="text-base mt-4 max-w-3xl leading-relaxed">
              This candidate has no completed verdict. Evaluation is a separate on-chain write and is not started from
              this public report.
            </p>
          </section>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Status" value="PENDING" />
            <StatCard label="Decision code" value={String(candidate.decision_code)} testId="report-decision-code" />
            <StatCard
              label="Evaluation attempts"
              value={String(candidate.evaluation_attempts)}
              testId="report-attempts"
            />
          </div>
          <IdentityPanel inspection={inspection} />
          <Link
            to={candidatePath}
            className="w-fit bg-brand-cream hover:bg-stone-200 text-brand-charcoal font-bold p-3 text-center border-2 border-brand-charcoal shadow-[2px_2px_0px_#0B130E] uppercase font-mono text-xs"
          >
            Back to candidate record
          </Link>
        </div>
      </div>
    );
  }

  const presentation = PRESENTATION[inspection.status];
  return (
    <div className="flex flex-col w-full pb-16" data-testid="live-decision-report">
      <Breadcrumb
        publisher={packageRecord.publisher}
        slug={packageRecord.package_slug}
        version={candidate.version}
        trail={`Report-${presentation.watermark}`}
      />
      <div className="max-w-[1440px] mx-auto px-4 lg:px-12 py-8 w-full flex flex-col gap-8">
        <section
          className={`relative border-2 border-brand-charcoal p-6 lg:p-10 overflow-hidden shadow-[8px_8px_0px_#0B130E] ${presentation.heroClass}`}
          data-testid={`live-decision-${inspection.status.toLowerCase()}`}
        >
          <div className="absolute -right-8 -top-12 text-[15rem] font-black text-brand-charcoal/10 select-none pointer-events-none leading-none tracking-tighter">
            {presentation.watermark}
          </div>
          <div className="relative z-10 flex flex-col gap-4 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-2 font-mono text-xs px-3 py-1.5 font-bold uppercase tracking-wider border border-brand-charcoal shadow-[2px_2px_0px_#0B130E] ${presentation.badgeClass}`}
              >
                Status: {inspection.status}
              </span>
              <span className="bg-white text-brand-charcoal font-mono text-xs px-3 py-1.5 border border-brand-charcoal font-bold uppercase tracking-wider shadow-[2px_2px_0px_#0B130E]">
                Decision code {candidate.decision_code}
              </span>
            </div>
            <h1 className="text-3xl lg:text-5xl font-black uppercase tracking-tight leading-none font-sans">
              {presentation.title}
            </h1>
            <p className="text-base lg:text-lg font-medium max-w-3xl leading-relaxed" data-testid="report-summary">
              {candidate.decision_summary || '(empty)'}
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Status / verdict" value={inspection.status} testId="report-status" />
          <StatCard label="Decision code" value={String(candidate.decision_code)} testId="report-decision-code" />
          <StatCard
            label="Evaluation attempts"
            value={String(candidate.evaluation_attempts)}
            testId="report-attempts"
          />
          <StatCard label="Finding codes" value={String(inspection.findingCodes.length)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="bg-brand-charcoal text-white border-2 border-brand-charcoal p-4 shadow-[4px_4px_0px_#EF5313]">
              <h2 className="text-lg font-black uppercase tracking-tight font-sans text-brand-pastelYellow">
                Finding codes
              </h2>
            </div>
            <FindingCodes codes={inspection.findingCodes} />
          </div>
          <div className="lg:col-span-5 flex flex-col gap-6">
            <IdentityPanel inspection={inspection} />
            <div className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] flex flex-col gap-3 font-mono text-xs">
              <span className="uppercase text-stone-600 font-bold tracking-wider">Follow-up</span>
              <Link
                to={candidatePath}
                className="w-full bg-brand-cream hover:bg-stone-200 text-brand-charcoal font-bold p-3 text-center border border-brand-charcoal shadow-[2px_2px_0px_#0B130E] uppercase"
              >
                Candidate record
              </Link>
              <Link
                to={packagePath}
                className="w-full bg-brand-cream hover:bg-stone-200 text-brand-charcoal font-bold p-3 text-center border border-brand-charcoal shadow-[2px_2px_0px_#0B130E] uppercase"
              >
                Package detail
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function StatCard({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className="bg-white border-2 border-brand-charcoal p-5 shadow-[4px_4px_0px_#0B130E]">
      <span className="font-mono text-xs uppercase tracking-wider font-bold text-brand-charcoal">{label}</span>
      <div className="text-2xl font-black text-brand-charcoal font-sans break-all mt-2" data-testid={testId}>
        {value}
      </div>
    </div>
  );
}

export const LiveDecisionGate: React.FC<{
  title: string;
  testId: string;
  children: React.ReactNode;
  retry?: () => void;
}> = ({ title, testId, children, retry }) => {
  return (
    <div className="bg-brand-cream px-6 py-16" data-testid={testId}>
      <div className="max-w-xl mx-auto bg-white border-2 border-brand-charcoal p-8 space-y-3">
        <DataModeBadge />
        <h1 className="text-2xl font-black uppercase">{title}</h1>
        {children}
        {retry ? (
          <button
            type="button"
            onClick={retry}
            className="bg-brand-orange text-white px-4 py-2 text-xs font-bold uppercase border border-brand-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-charcoal"
          >
            Retry
          </button>
        ) : null}
        <Link to="/registry" className="block text-xs font-bold uppercase text-brand-orange">
          ← Back to registry
        </Link>
      </div>
    </div>
  );
};

