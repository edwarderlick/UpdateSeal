import React from 'react';
import { Link } from 'react-router-dom';
import { CopyButton } from '../ui/CopyButton';
import { knownPackageLabelText, LEGACY_SMOKE_EXPLANATION, knownPackageLabel } from '../../lib/registryLabels';
import { logUpdateSealError, toUpdateSealError } from '../../lib/updateSealErrors';
import { safeExternalHref } from '../../lib/decisionReport';

export function ConfigErrorPanel({ testId, message }: { testId: string; message: string }) {
  return (
    <div className="bg-brand-cream px-6 py-16" data-testid={testId}>
      <div className="max-w-xl mx-auto bg-white border-2 border-brand-charcoal p-8 space-y-3">
        <h1 className="text-2xl font-black uppercase">Configuration Error</h1>
        <p className="text-xs font-mono">{message}</p>
      </div>
    </div>
  );
}

export function NetworkErrorPanel({
  error,
  onRetry,
  testId,
}: {
  error: unknown;
  onRetry: () => void;
  testId: string;
}) {
  const parsed = toUpdateSealError(error);
  logUpdateSealError(parsed);
  return (
    <div className="bg-white border-2 border-brand-charcoal p-8 space-y-3" data-testid={testId} role="alert">
      <h2 className="text-2xl font-black uppercase">NETWORK/CONFIGURATION ERROR</h2>
      <p className="text-xs font-mono">{parsed.userMessage}</p>
      <button
        type="button"
        onClick={onRetry}
        className="bg-brand-orange text-white px-4 py-2 text-xs font-bold uppercase border border-brand-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-charcoal"
      >
        Retry
      </button>
    </div>
  );
}

export function IntegrityRecordCard({
  index,
  id,
  message,
  raw,
}: {
  index: number;
  id: string | null;
  message: string;
  raw?: string;
}) {
  return (
    <article
      className="bg-white border-2 border-brand-charcoal p-6 space-y-2 shadow-[4px_4px_0px_#0B130E]"
      data-testid="integrity-record-card"
      role="alert"
    >
      <h3 className="font-black uppercase">ON-CHAIN DATA INTEGRITY ERROR</h3>
      <p className="font-mono text-xs">Registry index: {index}</p>
      {id ? <p className="font-mono text-xs break-all">Identifier: {id}</p> : null}
      <p className="text-sm">{message}</p>
      {raw !== undefined ? (
        <pre className="bg-stone-100 border border-brand-charcoal p-3 text-[11px] font-mono whitespace-pre-wrap break-all">
          {raw}
        </pre>
      ) : null}
    </article>
  );
}

export function PackageKindBadge({ packageUid }: { packageUid: string }) {
  const kind = knownPackageLabel(packageUid);
  const text = knownPackageLabelText(packageUid);
  if (!kind || !text) {
    return null;
  }
  return (
    <div className="space-y-1">
      <span
        data-testid={kind === 'official' ? 'official-package-label' : 'legacy-smoke-label'}
        className="inline-block bg-brand-pastelYellow text-brand-charcoal px-2 py-0.5 font-mono text-[10px] font-bold uppercase border border-brand-charcoal"
      >
        {text}
      </span>
      {kind === 'legacy_smoke' ? (
        <p className="text-xs text-stone-700 max-w-xl" data-testid="legacy-smoke-explanation">
          {LEGACY_SMOKE_EXPLANATION}
        </p>
      ) : null}
    </div>
  );
}

export function PublicValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-mono text-[10px] uppercase font-bold text-stone-500">{label}</span>
      <div className="mt-1 flex items-start justify-between gap-2">
        <span className="break-all font-mono text-xs font-bold">{value || '(empty)'}</span>
        {value ? <CopyButton text={value} label={`Copy ${label}`} /> : null}
      </div>
    </div>
  );
}

export function ExternalRepoLink({ url }: { url: string }) {
  const href = safeExternalHref(url);
  if (!href) {
    return <span className="break-all font-mono text-xs">{url}</span>;
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all font-mono text-xs text-brand-orange underline font-bold"
    >
      {url}
    </a>
  );
}

export function LoadMoreButton({
  onClick,
  disabled,
  complete,
}: {
  onClick: () => void;
  disabled: boolean;
  complete: boolean;
}) {
  if (complete) {
    return (
      <p className="font-mono text-xs font-bold uppercase" data-testid="end-of-registry">
        End of scanned registry indexes
      </p>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="bg-brand-forest text-white px-4 py-2 text-xs font-bold uppercase border-2 border-brand-charcoal shadow-[2px_2px_0px_#0B130E] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-charcoal"
    >
      {disabled ? 'Loading more…' : 'Load more'}
    </button>
  );
}

export function RegistryChangedNotice({ visible }: { visible: boolean }) {
  if (!visible) {
    return null;
  }
  return (
    <p className="bg-brand-pastelYellow border-2 border-brand-charcoal p-3 font-mono text-xs font-bold" role="status">
      Registry changed; refreshed data
    </p>
  );
}

export { Link };
