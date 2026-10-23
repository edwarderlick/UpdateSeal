import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { CopyButton } from '../components/ui/CopyButton';
import { DataModeBadge } from '../components/ui/DataModeBadge';
import { useOnChainPackageByPublisherSlug } from '../features/registry/registryQueries';
import { getUpdateSealConfigResult, isLiveReadsEnabled } from '../lib/updateSealConfig';
import { liveCandidateWizardPath } from '../lib/registrationValidation';
import { logUpdateSealError, toUpdateSealError } from '../lib/updateSealErrors';
import { parseCharterJson } from '../services/updateSealMappers';
import { TrustBoundaryNotice } from '../components/ui/TrustBoundaryNotice';

function CharterList({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="border-2 border-brand-charcoal bg-white p-5 shadow-[4px_4px_0px_#0B130E]">
      <h3 className="font-mono text-[10px] uppercase tracking-widest font-black text-brand-orange mb-3">{label}</h3>
      {values.length === 0 ? (
        <p className="text-xs font-mono text-stone-500">None declared</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {values.map((value) => (
            <li
              key={value}
              className="bg-stone-100 border border-brand-charcoal px-2 py-1 text-[11px] font-mono font-bold uppercase"
            >
              {value}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const LivePackageDetailPage: React.FC = () => {
  const { publisher = '', packageSlug = '' } = useParams();
  const decodedPublisher = decodeURIComponent(publisher);
  const decodedSlug = decodeURIComponent(packageSlug);
  const configResult = getUpdateSealConfigResult();
  const liveEnabled = isLiveReadsEnabled(configResult);
  const query = useOnChainPackageByPublisherSlug(decodedPublisher, decodedSlug);

  if (!configResult.ok) {
    return (
      <div className="bg-brand-cream px-6 py-16">
        <div className="max-w-xl mx-auto bg-white border-2 border-brand-charcoal p-8 shadow-[4px_4px_0px_#0B130E] space-y-3">
          <DataModeBadge />
          <h1 className="text-2xl font-black uppercase">Configuration Error</h1>
          <p className="text-xs font-mono text-stone-600">{configResult.error.userMessage}</p>
        </div>
      </div>
    );
  }

  if (!liveEnabled) {
    return (
      <div className="bg-brand-cream px-6 py-16" data-testid="live-package-demo-unavailable">
        <div className="max-w-xl mx-auto bg-white border-2 border-brand-charcoal p-8 shadow-[4px_4px_0px_#0B130E] space-y-4">
          <DataModeBadge />
          <h1 className="text-2xl font-black uppercase">Live Route Unavailable</h1>
          <p className="text-xs font-mono text-stone-600">
            Live package routes are unavailable in demo mode.
          </p>
          <Link
            to="/registry"
            className="inline-block bg-brand-orange text-white px-4 py-2 text-xs font-bold uppercase border border-brand-charcoal"
          >
            ← Back to registry
          </Link>
        </div>
      </div>
    );
  }

  if (query.isLoading) {
    return (
      <div className="bg-brand-cream px-6 py-16" data-testid="live-package-loading">
        <div className="max-w-[1400px] mx-auto bg-white border-2 border-brand-charcoal p-10 animate-pulse min-h-[320px] shadow-[4px_4px_0px_#0B130E]" />
      </div>
    );
  }

  const error = query.error ? toUpdateSealError(query.error) : null;
  if (error) {
    logUpdateSealError(error);
    const notFound = error.code === 'CONTRACT_NOT_FOUND';
    return (
      <div className="bg-brand-cream px-6 py-16" data-testid={notFound ? 'live-package-not-found' : 'live-package-error'}>
        <div className="max-w-xl mx-auto bg-white border-2 border-brand-charcoal p-8 shadow-[4px_4px_0px_#0B130E] space-y-4">
          <DataModeBadge />
          <h1 className="text-2xl font-black uppercase">{notFound ? 'Package Not Found On-Chain' : 'Package Read Failed'}</h1>
          <p className="text-xs font-mono text-stone-600">
            {notFound
              ? `No UpdateSealRegistry record exists for publisher ${decodedPublisher} and slug ${decodedSlug}.`
              : error.userMessage}
          </p>
          {!notFound ? (
            <button
              type="button"
              onClick={() => {
                void query.refetch();
              }}
              className="bg-brand-orange text-white px-4 py-2 text-xs font-bold uppercase border border-brand-charcoal"
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
  }

  const record = query.data?.record;
  if (!record) {
    return null;
  }

  const charterResult = parseCharterJson(record.charter_json);

  return (
    <div className="w-full flex flex-col animate-in fade-in duration-150">
      <div className="bg-brand-charcoal text-white px-6 py-2.5 border-b-2 border-brand-charcoal flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/registry" className="text-stone-400 hover:text-white transition-colors">
            Registry
          </Link>
          <span className="text-stone-500">/</span>
          <span className="text-stone-400">{record.publisher}</span>
          <span className="text-stone-500">/</span>
          <span className="text-brand-pastelYellow font-bold">{record.package_slug}</span>
        </div>
        <DataModeBadge />
      </div>

      <section className="w-full bg-brand-cream px-6 lg:px-12 pt-8 pb-16 flex-grow">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-8">
          <TrustBoundaryNotice />
          <div className="bg-brand-forest text-brand-cream border-2 border-brand-charcoal p-8 lg:p-10 shadow-[8px_8px_0px_#0B130E]">
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs mb-5">
              <span className="bg-stone-100 text-brand-charcoal px-3 py-1 uppercase font-bold border border-brand-charcoal">
                REGISTERED • NO CANDIDATE
              </span>
              <span className="bg-brand-charcoal text-brand-cream border border-stone-600 px-3 py-1 font-bold uppercase">
                Sequence {record.sequence}
              </span>
            </div>
            <h1 className="font-sans text-3xl sm:text-5xl text-white font-black tracking-tighter uppercase leading-none mb-6">
              {record.package_slug}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 font-mono text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-stone-400 uppercase">Repo:</span>
                <a
                  href={record.repository_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-orange hover:text-brand-pastelYellow underline font-bold flex items-center gap-1"
                >
                  <span>{record.repository_url.replace('https://', '')}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-stone-400 uppercase">Publisher:</span>
                <span className="font-mono text-white font-bold break-all">{record.publisher}</span>
                <CopyButton text={record.publisher} />
              </div>
            </div>
          </div>

          <p className="text-xs font-mono text-stone-700 bg-white border-2 border-brand-charcoal p-4 shadow-[4px_4px_0px_#0B130E]">
            Wallet registration identifies the publisher address. GitHub repository ownership is not yet verified.
          </p>

          <Link
            to={liveCandidateWizardPath(record.publisher, record.package_slug, 'identity')}
            className="inline-flex w-fit bg-brand-orange text-white px-5 py-3 text-xs font-bold uppercase border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E]"
            data-testid="submit-candidate-action"
          >
            Submit candidate
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="bg-white border-2 border-brand-charcoal p-5 shadow-[4px_4px_0px_#0B130E]">
              <span className="text-[10px] uppercase text-stone-500 font-bold">Package UID</span>
              <div className="mt-2 break-all font-bold">{record.package_uid}</div>
            </div>
            <div className="bg-white border-2 border-brand-charcoal p-5 shadow-[4px_4px_0px_#0B130E]">
              <span className="text-[10px] uppercase text-stone-500 font-bold">Baseline Commit SHA</span>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="break-all font-bold">{record.baseline_commit_sha}</span>
                <CopyButton text={record.baseline_commit_sha} />
              </div>
            </div>
            <div className="bg-white border-2 border-brand-charcoal p-5 shadow-[4px_4px_0px_#0B130E]">
              <span className="text-[10px] uppercase text-stone-500 font-bold">Charter Hash</span>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="break-all font-bold">{record.charter_hash}</span>
                <CopyButton text={record.charter_hash} />
              </div>
            </div>
            <div className="bg-white border-2 border-brand-charcoal p-5 shadow-[4px_4px_0px_#0B130E]">
              <span className="text-[10px] uppercase text-stone-500 font-bold">Sequence</span>
              <div className="mt-2 font-black text-lg font-sans">{record.sequence}</div>
            </div>
          </div>

          {charterResult.ok ? (
            <div className="flex flex-col gap-4">
              <div className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E]">
                <div className="font-mono text-xs text-brand-orange uppercase tracking-widest font-black mb-2">
                  Frozen Charter v{charterResult.charter.schema_version}
                </div>
                <p className="text-sm text-brand-charcoal mb-4">{charterResult.charter.summary}</p>
                <p className="text-xs font-mono text-stone-700 whitespace-pre-wrap">{charterResult.charter.policy_text}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CharterList label="Allowed capabilities" values={charterResult.charter.allowed_capabilities} />
                <CharterList label="Forbidden capabilities" values={charterResult.charter.forbidden_capabilities} />
                <CharterList label="Allowed domains" values={charterResult.charter.allowed_domains} />
                <CharterList label="Required evidence" values={charterResult.charter.required_evidence} />
              </div>
            </div>
          ) : (
            <div
              className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] space-y-2"
              data-testid="charter-parse-error"
            >
              <h2 className="font-black uppercase text-brand-charcoal">Charter Could Not Be Parsed</h2>
              <p className="text-xs font-mono text-stone-600">{charterResult.message}</p>
              <p className="text-xs font-mono">
                Stored charter hash: <strong>{record.charter_hash}</strong>
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
