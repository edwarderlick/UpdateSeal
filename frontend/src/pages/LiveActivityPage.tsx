import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Filter } from 'lucide-react';
import { DataModeBadge } from '../components/ui/DataModeBadge';
import {
  ExternalRepoLink,
  IntegrityRecordCard,
  LoadMoreButton,
  NetworkErrorPanel,
  PackageKindBadge,
  PublicValue,
  RegistryChangedNotice,
} from '../components/registry/RegistryChrome';
import { useLiveCandidatePages, useLivePackagePages } from '../features/registry/registryQueries';
import {
  matchesLoadedSearch,
  mergeIndexedById,
  scannedRange,
  type ActivityFilter,
  type IndexedCandidate,
  type IndexedPackage,
} from '../lib/registryEnumeration';
import {
  liveCandidateDecisionPath,
  liveCandidateRecordPath,
  livePackagePath,
} from '../lib/registrationValidation';
import { isCompletedVerdictStatus } from '../lib/decisionReport';
import { parsePackageUid } from '../lib/candidateId';
import { STUDIO_DEV_RPC_UNAVAILABLE_MESSAGE } from '../lib/updateSealErrors';

const FILTERS: { id: ActivityFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'packages', label: 'Packages' },
  { id: 'candidates', label: 'Candidates' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REVIEW_REQUIRED', label: 'Review required' },
  { id: 'VIOLATION', label: 'Violation' },
  { id: 'EVIDENCE_UNAVAILABLE', label: 'Evidence unavailable' },
];

function packageDetailPath(packageUid: string): string | null {
  const parsed = parsePackageUid(packageUid);
  if (!parsed.ok) {
    return null;
  }
  return livePackagePath(parsed.publisher, parsed.packageSlug);
}

export const LiveActivityPage: React.FC = () => {
  const [epoch, setEpoch] = useState(0);
  const [changedNotice, setChangedNotice] = useState(false);
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [search, setSearch] = useState('');
  const retryInFlightRef = useRef(false);

  const packagesQuery = useLivePackagePages(true, epoch);
  const candidatesQuery = useLiveCandidatePages(true, epoch);

  useEffect(() => {
    const changed =
      packagesQuery.data?.pages.some((page) => page.countChanged) ||
      candidatesQuery.data?.pages.some((page) => page.countChanged);
    if (changed) {
      setChangedNotice(true);
      setEpoch((value) => value + 1);
    }
  }, [packagesQuery.data, candidatesQuery.data]);

  const packages = useMemo(
    () => mergeIndexedById(packagesQuery.data?.pages.flatMap((page) => [...page.items]) ?? [], []),
    [packagesQuery.data],
  );
  const candidates = useMemo(
    () => mergeIndexedById(candidatesQuery.data?.pages.flatMap((page) => [...page.items]) ?? [], []),
    [candidatesQuery.data],
  );
  const packageIds = useMemo(
    () => new Set(packages.filter((item): item is Extract<IndexedPackage, { kind: 'ok' }> => item.kind === 'ok').map((item) => item.id)),
    [packages],
  );

  const packageScan = scannedRange(packagesQuery.data?.pages ?? []);
  const candidateScan = scannedRange(candidatesQuery.data?.pages ?? []);
  const packageTotal = packagesQuery.data?.pages[0]?.totalCount;
  const candidateTotal = candidatesQuery.data?.pages[0]?.totalCount;
  const hasConfirmedSnapshot = packagesQuery.data !== undefined && candidatesQuery.data !== undefined;
  const snapshotSettled = !packagesQuery.isPending && !candidatesQuery.isPending;
  const snapshotReadFailed = snapshotSettled && (packagesQuery.isError || candidatesQuery.isError);
  const hideUnconfirmedSnapshot = snapshotReadFailed && !hasConfirmedSnapshot;
  const packagesReadSucceeded = packagesQuery.isSuccess || (hasConfirmedSnapshot && !packagesQuery.isError);
  const packagesComplete = packagesReadSucceeded && Boolean(packagesQuery.data) && !packagesQuery.hasNextPage;
  const candidatesComplete = Boolean(candidatesQuery.data) && !candidatesQuery.hasNextPage && !candidatesQuery.isError;
  const incomplete = !hideUnconfirmedSnapshot && (!packagesComplete || !candidatesComplete);

  const visiblePackages = useMemo(() => {
    if (filter !== 'all' && filter !== 'packages') {
      return [];
    }
    return packages.filter((item) => matchesLoadedSearch(item, search));
  }, [packages, filter, search]);

  const visibleCandidates = useMemo(() => {
    if (filter === 'packages') {
      return [];
    }
    return candidates.filter((item) => {
      if (!matchesLoadedSearch(item, search)) {
        return false;
      }
      if (filter === 'all' || filter === 'candidates') {
        return true;
      }
      return item.kind === 'ok' && item.record.status === filter;
    });
  }, [candidates, filter, search]);

  const loadingInitial = !hasConfirmedSnapshot && (packagesQuery.isPending || candidatesQuery.isPending);
  const showPackages = !hideUnconfirmedSnapshot && (filter === 'all' || filter === 'packages');
  const showCandidates = !hideUnconfirmedSnapshot && filter !== 'packages';

  const retryReads = async () => {
    if (retryInFlightRef.current) {
      return;
    }
    retryInFlightRef.current = true;
    try {
      await packagesQuery.refetch();
      await candidatesQuery.refetch();
    } finally {
      retryInFlightRef.current = false;
    }
  };

  return (
    <div className="flex flex-col w-full pb-16" data-testid="live-activity-page">
      <section className="w-full bg-brand-forest border-b-2 border-brand-charcoal text-white px-4 lg:px-12 py-8">
        <div className="max-w-[1440px] mx-auto space-y-4">
          <DataModeBadge />
          <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tight">
            Current registry activity snapshot
          </h1>
          <p className="text-sm text-stone-200 max-w-3xl" data-testid="activity-snapshot-explainer">
            This is a current contract registry snapshot. Entries are ordered by their individual package or candidate
            registry indexes; the contract does not expose timestamps or a unified event stream.
          </p>
          {hasConfirmedSnapshot && packageTotal !== undefined && candidateTotal !== undefined ? (
            <p className="font-mono text-xs text-stone-300" data-testid="activity-snapshot-counts">
              package_count {packageTotal} • candidate_count {candidateTotal} • Studio-dev preview may reset
            </p>
          ) : null}
        </div>
      </section>

      <main className="w-full max-w-[1440px] mx-auto px-4 lg:px-12 py-10 space-y-8">
        <RegistryChangedNotice visible={changedNotice} />

        {snapshotReadFailed ? (
          <NetworkErrorPanel
            error={packagesQuery.error ?? candidatesQuery.error}
            onRetry={() => {
              void retryReads();
            }}
            testId="activity-network-error"
            message={STUDIO_DEV_RPC_UNAVAILABLE_MESSAGE}
          />
        ) : null}

        <div className="space-y-3 border-b-2 border-brand-charcoal pb-4">
          <div className="flex items-center gap-2 font-mono text-xs">
            <Filter className="w-4 h-4 text-brand-orange" />
            <span className="font-bold uppercase">Filters apply to loaded records</span>
          </div>
          {incomplete ? (
            <p className="text-xs font-mono" data-testid="filters-loaded-only">
              Filters and search apply to loaded records. Pagination is incomplete.
            </p>
          ) : null}
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">Activity filters</legend>
            {FILTERS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                aria-pressed={filter === tab.id}
                className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border-2 border-brand-charcoal shadow-[2px_2px_0px_#0B130E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-charcoal ${
                  filter === tab.id ? 'bg-brand-orange text-white' : 'bg-white text-brand-charcoal'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </fieldset>
          <label className="block font-mono text-xs font-bold uppercase" htmlFor="activity-search">
            Search loaded public fields
          </label>
          <input
            id="activity-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Package UID, candidate ID, slug, version, publisher, repository"
            className="w-full max-w-xl bg-white px-4 py-2.5 font-mono text-sm border-2 border-brand-charcoal shadow-[3px_3px_0px_#0B130E] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-charcoal"
          />
        </div>

        {loadingInitial ? (
          <div
            className="bg-white border-2 border-brand-charcoal p-10 animate-pulse min-h-[160px]"
            data-testid="activity-loading"
            aria-busy="true"
            role="status"
          >
            Loading registry snapshot…
          </div>
        ) : null}

        {!loadingInitial && !hideUnconfirmedSnapshot && visiblePackages.length === 0 && visibleCandidates.length === 0 && !snapshotReadFailed ? (
          <div className="bg-white border-2 border-brand-charcoal p-10" data-testid="activity-empty">
            <p className="font-mono text-xs font-bold uppercase">No loaded records match this filter.</p>
          </div>
        ) : null}

        {showPackages ? (
          <section className="space-y-4" data-testid="package-activity-section" aria-labelledby="package-registrations-heading">
            <h2 id="package-registrations-heading" className="text-2xl font-black uppercase">
              Package registrations
            </h2>
            <p className="text-xs font-mono">
              Ordered by package registry index, newest index first within loaded data. Scanned {packageScan.scanned} of{' '}
              {packageTotal}.
            </p>
            {visiblePackages.map((item) =>
              item.kind === 'integrity' ? (
                <IntegrityRecordCard
                  key={`pkg-int-${item.index}`}
                  index={item.index}
                  id={item.id}
                  message={item.message}
                  raw={item.rawMalformedValue}
                />
              ) : (
                <PackageActivityCard key={item.id} item={item} />
              ),
            )}
          </section>
        ) : null}

        {showCandidates ? (
          <section className="space-y-4" data-testid="candidate-activity-section" aria-labelledby="candidate-records-heading">
            <h2 id="candidate-records-heading" className="text-2xl font-black uppercase">
              Candidate records
            </h2>
            <p className="text-xs font-mono">
              Ordered by candidate registry index, newest index first within loaded data. Scanned {candidateScan.scanned} of{' '}
              {candidateTotal}. Package and candidate lists are separate indexes.
            </p>
            {visibleCandidates.map((item) =>
              item.kind === 'integrity' ? (
                <IntegrityRecordCard
                  key={`can-int-${item.index}`}
                  index={item.index}
                  id={item.id}
                  message={item.message}
                  raw={item.rawMalformedValue}
                />
              ) : (
                <CandidateActivityCard
                  key={item.id}
                  item={item}
                  packageKnown={packageIds.has(item.associatedPackageUid)}
                  packagesComplete={packagesComplete}
                  packagesReadSucceeded={packagesReadSucceeded}
                />
              ),
            )}
          </section>
        ) : null}

        <div className="space-y-2">
          {packagesQuery.isFetchingNextPage || candidatesQuery.isFetchingNextPage ? (
            <p role="status" className="font-mono text-xs">
              Loading additional registry indexes…
            </p>
          ) : null}
          <LoadMoreButton
            onClick={() => {
              void packagesQuery.fetchNextPage();
              void candidatesQuery.fetchNextPage();
            }}
            disabled={
              hideUnconfirmedSnapshot ||
              snapshotReadFailed ||
              packagesQuery.isFetchingNextPage ||
              candidatesQuery.isFetchingNextPage
            }
            complete={packagesComplete && candidatesComplete}
          />
        </div>
      </main>
    </div>
  );
};

function PackageActivityCard({ item }: { item: Extract<IndexedPackage, { kind: 'ok' }> }) {
  const detail = packageDetailPath(item.record.package_uid);
  return (
    <article
      className="bg-white border-2 border-brand-charcoal p-6 space-y-3 shadow-[4px_4px_0px_#0B130E]"
      data-testid="package-activity-card"
      data-registry-index={item.index}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="bg-brand-forest text-white px-2 py-0.5 font-mono text-[10px] font-bold uppercase border border-brand-charcoal">
          PACKAGE REGISTERED
        </span>
        <span className="font-mono text-[10px] font-bold uppercase">Index {item.index}</span>
        <PackageKindBadge packageUid={item.record.package_uid} />
      </div>
      <h3 className="font-black uppercase">{item.record.package_slug}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <PublicValue label="Package UID" value={item.record.package_uid} />
        <PublicValue label="Publisher" value={item.record.publisher} />
        <PublicValue label="Baseline commit SHA" value={item.record.baseline_commit_sha} />
        <PublicValue label="Charter hash" value={item.record.charter_hash} />
      </div>
      <ExternalRepoLink url={item.record.repository_url} />
      {detail ? (
        <Link
          to={detail}
          className="inline-block mt-2 px-3 py-2 bg-brand-forest text-white font-mono text-xs font-bold uppercase border border-brand-charcoal"
        >
          Package detail
        </Link>
      ) : null}
    </article>
  );
}

function CandidateActivityCard({
  item,
  packageKnown,
  packagesComplete,
  packagesReadSucceeded,
}: {
  item: Extract<IndexedCandidate, { kind: 'ok' }>;
  packageKnown: boolean;
  packagesComplete: boolean;
  packagesReadSucceeded: boolean;
}) {
  const decided = isCompletedVerdictStatus(item.record.status);
  const activityType = decided ? 'CANDIDATE DECIDED' : 'CANDIDATE SUBMITTED';
  const parsed = parsePackageUid(item.record.package_uid);
  return (
    <article
      className="bg-white border-2 border-brand-charcoal p-6 space-y-3 shadow-[4px_4px_0px_#0B130E]"
      data-testid="candidate-activity-card"
      data-registry-index={item.index}
      data-activity-type={activityType}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="bg-brand-orange text-white px-2 py-0.5 font-mono text-[10px] font-bold uppercase border border-brand-charcoal">
          {activityType}
        </span>
        <span className="font-mono text-[10px] font-bold uppercase">Index {item.index}</span>
        <span className="font-mono text-[10px] font-bold uppercase border border-brand-charcoal px-2 py-0.5">
          Status: {item.record.status}
        </span>
      </div>
      {!packageKnown && packagesReadSucceeded ? (
        <p className="text-xs font-bold" data-testid="unknown-package-warning" role="status">
          {packagesComplete
            ? 'Integrity warning: this candidate package UID was not found among scanned packages.'
            : 'Integrity warning: associated package is not in the scanned package records yet.'}
        </p>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <PublicValue label="Candidate ID" value={item.record.candidate_id} />
        <PublicValue label="Package UID" value={item.record.package_uid} />
        <PublicValue label="Version" value={item.record.version} />
        <PublicValue label="Submitter" value={item.record.submitter} />
        <PublicValue label="Candidate commit SHA" value={item.record.candidate_commit_sha} />
        {decided ? <PublicValue label="Decision code" value={String(item.record.decision_code)} /> : null}
      </div>
      {decided ? (
        <p className="font-mono text-xs" data-testid="activity-finding-codes">
          Finding codes: {item.findingCodes.join(', ') || '(none)'}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {parsed.ok ? (
          <>
            <Link
              to={liveCandidateRecordPath(parsed.publisher, parsed.packageSlug, item.record.version)}
              className="px-3 py-2 bg-white text-brand-charcoal font-mono text-xs font-bold uppercase border border-brand-charcoal"
            >
              Candidate detail
            </Link>
            {decided ? (
              <Link
                to={liveCandidateDecisionPath(parsed.publisher, parsed.packageSlug, item.record.version)}
                className="px-3 py-2 bg-brand-pastelYellow text-brand-charcoal font-mono text-xs font-bold uppercase border border-brand-charcoal"
                data-testid="activity-decision-link"
              >
                Decision report
              </Link>
            ) : null}
          </>
        ) : null}
      </div>
    </article>
  );
}
