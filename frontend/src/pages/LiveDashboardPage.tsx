import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { DataModeBadge } from '../components/ui/DataModeBadge';
import { CopyButton } from '../components/ui/CopyButton';
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
import { useWallet } from '../features/wallet/useWallet';
import {
  candidateCountLabel,
  candidatesForPackageUid,
  highestIndexCandidate,
  mergeIndexedById,
  publishersMatch,
  scannedRange,
  type IndexedPackage,
} from '../lib/registryEnumeration';
import {
  liveCandidateDecisionPath,
  liveCandidateRecordPath,
  liveCandidateWizardPath,
  livePackagePath,
} from '../lib/registrationValidation';
import { isCompletedVerdictStatus } from '../lib/decisionReport';

export const LiveDashboardPage: React.FC = () => {
  const { wallet, isWrongNetwork, openConnectModal, openNetworkModal } = useWallet();
  const connected = Boolean(wallet.isConnected && wallet.address);
  const canScan = connected && !isWrongNetwork;
  const [epoch, setEpoch] = useState(0);
  const [changedNotice, setChangedNotice] = useState(false);

  const packagesQuery = useLivePackagePages(canScan, epoch);
  const candidatesQuery = useLiveCandidatePages(canScan, epoch);

  useEffect(() => {
    const changed =
      packagesQuery.data?.pages.some((page) => page.countChanged) ||
      candidatesQuery.data?.pages.some((page) => page.countChanged);
    if (changed) {
      setChangedNotice(true);
      setEpoch((value) => value + 1);
    }
  }, [packagesQuery.data, candidatesQuery.data]);

  const packageItems = useMemo(
    () => mergeIndexedById(packagesQuery.data?.pages.flatMap((page) => [...page.items]) ?? [], []),
    [packagesQuery.data],
  );
  const candidateItems = useMemo(
    () => mergeIndexedById(candidatesQuery.data?.pages.flatMap((page) => [...page.items]) ?? [], []),
    [candidatesQuery.data],
  );

  const packageScan = scannedRange(packagesQuery.data?.pages ?? []);
  const candidateScan = scannedRange(candidatesQuery.data?.pages ?? []);
  const packageTotal = packagesQuery.data?.pages[0]?.totalCount ?? 0;
  const candidateTotal = candidatesQuery.data?.pages[0]?.totalCount ?? 0;
  const packagesComplete = Boolean(packagesQuery.data) && !packagesQuery.hasNextPage && !packagesQuery.isFetchingNextPage;
  const candidatesComplete =
    Boolean(candidatesQuery.data) && !candidatesQuery.hasNextPage && !candidatesQuery.isFetchingNextPage;

  const address = wallet.address ?? '';
  const owned = useMemo(
    () =>
      packageItems.filter(
        (item): item is Extract<IndexedPackage, { kind: 'ok' }> =>
          item.kind === 'ok' && publishersMatch(item.record.publisher, address),
      ),
    [packageItems, address],
  );
  const ownedIntegrity = packageItems.filter((item) => item.kind === 'integrity');

  const loadingInitial = canScan && (packagesQuery.isLoading || candidatesQuery.isLoading);

  return (
    <div className="flex flex-col w-full pb-16" data-testid="live-dashboard-page">
      <section className="w-full bg-brand-cream border-b-2 border-brand-charcoal px-4 lg:px-12 py-10">
        <div className="max-w-[1440px] mx-auto space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <DataModeBadge />
            <span className="font-mono text-xs uppercase tracking-wider text-stone-600">Operator console • read only</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tight text-brand-charcoal">
            Developer Registry Dashboard
          </h1>
          <p className="text-sm text-stone-700 max-w-3xl">
            Connecting a wallet identifies the public publisher address used to filter scanned registry records. Dashboard
            reads do not request a signature. Studio-dev is a preview network and may reset. The contract has no
            publisher index, so this page scans registry pages to find matching packages.
          </p>
        </div>
      </section>

      <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-12 py-10 space-y-8">
        {isWrongNetwork ? (
          <div className="bg-white border-2 border-brand-charcoal p-8 space-y-3" data-testid="dashboard-wrong-network" role="alert">
            <h2 className="text-2xl font-black uppercase">Wrong network</h2>
            <p className="text-sm">
              Switch to Studio-dev (chain 61997) to scan packages for this address. No network-switch transaction is sent
              automatically.
            </p>
            <p className="font-mono text-xs break-all">{address}</p>
            <button
              type="button"
              onClick={openNetworkModal}
              className="bg-brand-orange text-white px-4 py-2 text-xs font-bold uppercase border-2 border-brand-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-charcoal"
            >
              Switch to Studio-dev
            </button>
          </div>
        ) : null}

        {!connected && !isWrongNetwork ? (
          <div className="bg-white border-2 border-brand-charcoal p-8 space-y-4 shadow-[6px_6px_0px_#0B130E]" data-testid="dashboard-disconnected">
            <h2 className="text-2xl font-black uppercase">Connect your wallet to view packages registered by this address.</h2>
            <p className="text-sm text-stone-700 max-w-2xl">
              Connecting identifies the public address only. It does not submit a contract write or request a signature.
            </p>
            <button
              type="button"
              onClick={openConnectModal}
              className="px-4 py-2 bg-brand-charcoal text-brand-pastelYellow font-bold uppercase border-2 border-brand-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
            >
              Connect Wallet
            </button>
          </div>
        ) : null}

        {canScan ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="font-mono text-xs">
                <span className="font-bold uppercase">Connected publisher:</span>{' '}
                <span className="break-all" data-testid="dashboard-publisher">
                  {address}
                </span>
                <CopyButton text={address} label="Copy address" />
              </div>
              <Link
                to="/register/identity"
                className="px-6 py-3 bg-brand-orange text-white font-black text-sm uppercase tracking-wider flex items-center gap-2 border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E]"
              >
                <Plus className="w-4 h-4" />
                Register New Package
              </Link>
            </div>

            <RegistryChangedNotice visible={changedNotice} />

            {packagesQuery.error ? (
              <NetworkErrorPanel
                error={packagesQuery.error}
                onRetry={() => {
                  void packagesQuery.refetch();
                  void candidatesQuery.refetch();
                }}
                testId="dashboard-network-error"
              />
            ) : null}
            {candidatesQuery.error && !packagesQuery.error ? (
              <NetworkErrorPanel
                error={candidatesQuery.error}
                onRetry={() => {
                  void candidatesQuery.refetch();
                }}
                testId="dashboard-network-error"
              />
            ) : null}

            {loadingInitial ? (
              <div
                className="bg-white border-2 border-brand-charcoal p-10 animate-pulse min-h-[160px]"
                data-testid="dashboard-loading"
                aria-busy="true"
                role="status"
              >
                Loading registry pages…
              </div>
            ) : null}

            {!loadingInitial && owned.length === 0 && ownedIntegrity.length === 0 && !packagesQuery.error ? (
              <div className="bg-white border-2 border-brand-charcoal p-10 space-y-4" data-testid="dashboard-empty">
                <h2 className="text-2xl font-black uppercase">
                  No packages registered by this wallet were found in the scanned registry records.
                </h2>
                {!packagesComplete ? (
                  <p className="text-sm" data-testid="partial-scan-notice">
                    Not all registry records have been scanned ({packageScan.scanned} of {packageTotal} package indexes).
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  <LoadMoreButton
                    onClick={() => {
                      void packagesQuery.fetchNextPage();
                      void candidatesQuery.fetchNextPage();
                    }}
                    disabled={packagesQuery.isFetchingNextPage || candidatesQuery.isFetchingNextPage}
                    complete={packagesComplete && candidatesComplete}
                  />
                  <Link
                    to="/register/identity"
                    className="px-4 py-2 bg-brand-orange text-white font-mono text-xs uppercase font-black border-2 border-brand-charcoal"
                  >
                    Register Package
                  </Link>
                </div>
              </div>
            ) : null}

            <div className="space-y-6">
              {ownedIntegrity.map((item) => (
                <IntegrityRecordCard
                  key={`integrity-${item.index}`}
                  index={item.index}
                  id={item.id}
                  message={item.message}
                  raw={item.rawMalformedValue}
                />
              ))}
              {owned.map((item) => {
                const associated = candidatesForPackageUid(item.record.package_uid, candidateItems);
                const latest = highestIndexCandidate(associated);
                return (
                  <article
                    key={item.id}
                    className="bg-white border-2 border-brand-charcoal p-6 lg:p-8 space-y-4 shadow-[8px_8px_0px_#0B130E]"
                    data-testid="dashboard-package-card"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <PackageKindBadge packageUid={item.record.package_uid} />
                        <h2 className="text-2xl font-black uppercase tracking-tight">{item.record.package_slug}</h2>
                      </div>
                      <span className="font-mono text-[10px] font-bold uppercase bg-brand-cream border border-brand-charcoal px-2 py-1">
                        Registry index {item.index}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <PublicValue label="Package UID" value={item.record.package_uid} />
                      <PublicValue label="Publisher" value={item.record.publisher} />
                      <PublicValue label="Baseline commit SHA" value={item.record.baseline_commit_sha} />
                      <PublicValue label="Charter hash" value={item.record.charter_hash} />
                    </div>
                    <div>
                      <span className="font-mono text-[10px] uppercase font-bold text-stone-500">Repository URL</span>
                      <div className="mt-1">
                        <ExternalRepoLink url={item.record.repository_url} />
                      </div>
                    </div>
                    <p className="font-mono text-xs" data-testid="candidate-count-label">
                      {candidateCountLabel(associated.length, candidateScan.scanned, candidateTotal, candidatesComplete)}
                    </p>
                    {latest ? (
                      <p className="font-mono text-xs" data-testid="highest-index-status">
                        Highest scanned candidate registry index {latest.index}: {latest.record.status}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-3 font-mono text-xs">
                      <Link
                        to={livePackagePath(item.record.publisher, item.record.package_slug)}
                        className="px-3 py-2 bg-brand-forest text-white font-bold uppercase border border-brand-charcoal"
                      >
                        Package detail
                      </Link>
                      <Link
                        to={liveCandidateWizardPath(item.record.publisher, item.record.package_slug)}
                        className="px-3 py-2 bg-brand-orange text-white font-bold uppercase border border-brand-charcoal"
                      >
                        Submit a candidate
                      </Link>
                      {associated.map((candidate) => (
                        <span key={candidate.id} className="flex flex-wrap gap-2">
                          <Link
                            to={liveCandidateRecordPath(
                              item.record.publisher,
                              item.record.package_slug,
                              candidate.record.version,
                            )}
                            className="px-3 py-2 bg-white text-brand-charcoal font-bold uppercase border border-brand-charcoal"
                          >
                            {candidate.record.version}
                          </Link>
                          {isCompletedVerdictStatus(candidate.record.status) ? (
                            <Link
                              to={liveCandidateDecisionPath(
                                item.record.publisher,
                                item.record.package_slug,
                                candidate.record.version,
                              )}
                              className="px-3 py-2 bg-brand-pastelYellow text-brand-charcoal font-bold uppercase border border-brand-charcoal"
                            >
                              Decision report
                            </Link>
                          ) : null}
                        </span>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>

            {owned.length > 0 || ownedIntegrity.length > 0 ? (
              <div className="space-y-2">
                {!packagesComplete ? (
                  <p className="text-xs font-mono" data-testid="partial-scan-notice">
                    Scanned {packageScan.scanned} of {packageTotal} package indexes and {candidateScan.scanned} of{' '}
                    {candidateTotal} candidate indexes.
                  </p>
                ) : null}
                <LoadMoreButton
                  onClick={() => {
                    void packagesQuery.fetchNextPage();
                    void candidatesQuery.fetchNextPage();
                  }}
                  disabled={packagesQuery.isFetchingNextPage || candidatesQuery.isFetchingNextPage}
                  complete={packagesComplete && candidatesComplete}
                />
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
};
