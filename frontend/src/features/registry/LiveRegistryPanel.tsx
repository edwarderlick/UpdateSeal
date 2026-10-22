import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, RotateCcw, Search } from 'lucide-react';
import { useRegistrySnapshot } from './registryQueries';
import { candidateCountForPackage, livePackagePath, shortenHex } from '../../services/updateSealMappers';
import { logUpdateSealError, toUpdateSealError } from '../../lib/updateSealErrors';
import type { OnChainPackageRecord } from '../../types/updateSeal';
import { DataModeBadge } from '../../components/ui/DataModeBadge';

const ITEMS_PER_PAGE = 6;

function matchesSearch(pkg: OnChainPackageRecord, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  return (
    pkg.package_slug.toLowerCase().includes(q) ||
    pkg.package_uid.toLowerCase().includes(q) ||
    pkg.publisher.toLowerCase().includes(q) ||
    pkg.repository_url.toLowerCase().includes(q) ||
    pkg.baseline_commit_sha.toLowerCase().includes(q)
  );
}

export const LiveRegistryPanel: React.FC = () => {
  const navigate = useNavigate();
  const snapshotQuery = useRegistrySnapshot();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const candidates = snapshotQuery.data?.candidates ?? [];

  const filteredPackages = useMemo(() => {
    const records = snapshotQuery.data?.packages ?? [];
    return records
      .filter((pkg) => matchesSearch(pkg, searchQuery))
      .slice()
      .sort((a, b) => a.sequence - b.sequence);
  }, [snapshotQuery.data, searchQuery]);

  const totalPages = Math.ceil(filteredPackages.length / ITEMS_PER_PAGE) || 1;
  const paginatedPackages = filteredPackages.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const resetFilters = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const error = snapshotQuery.error ? toUpdateSealError(snapshotQuery.error) : null;
  if (error) {
    logUpdateSealError(error);
  }

  return (
    <div className="w-full flex flex-col animate-in fade-in duration-150">
      <section className="bg-brand-cream border-b-2 border-brand-charcoal py-8 px-6 lg:px-16">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <DataModeBadge />
                <span className="text-xs font-mono text-stone-600">Chain ID 61997 • Studio-dev</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-brand-charcoal font-sans">
                Package Registry Directory
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 font-mono">
            <div className="bg-white p-4 border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
              <span className="text-[10px] uppercase font-bold text-stone-500">Packages On-Chain</span>
              <div className="text-2xl font-black text-brand-charcoal mt-1 font-sans" data-testid="live-package-count">
                {snapshotQuery.data ? snapshotQuery.data.packageCount : '—'}
              </div>
            </div>
            <div className="bg-white p-4 border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
              <span className="text-[10px] uppercase font-bold text-stone-500">Candidates On-Chain</span>
              <div className="text-2xl font-black text-brand-charcoal mt-1 font-sans" data-testid="live-candidate-count">
                {snapshotQuery.data ? snapshotQuery.data.candidateCount : '—'}
              </div>
            </div>
          </div>
          {snapshotQuery.data?.truncationWarning ? (
            <p className="mt-3 text-xs font-mono text-brand-orange">{snapshotQuery.data.truncationWarning}</p>
          ) : null}
        </div>
      </section>

      <section className="bg-stone-100 border-b-2 border-brand-charcoal py-4 px-6 lg:px-16">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search slug, UID, publisher, repository, or commit SHA..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-brand-charcoal focus:ring-0 focus:border-brand-orange font-mono"
            />
          </div>
          <button
            type="button"
            onClick={resetFilters}
            title="Reset Filters"
            className="p-1.5 bg-white border border-brand-charcoal hover:bg-stone-200 transition-colors text-stone-700 self-start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </section>

      <section className="bg-brand-cream py-10 px-6 lg:px-16 flex-grow">
        <div className="max-w-[1440px] mx-auto">
          {snapshotQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="live-registry-loading">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] p-6 animate-pulse min-h-[240px]"
                >
                  <div className="h-3 w-24 bg-stone-200 mb-4" />
                  <div className="h-6 w-48 bg-stone-200 mb-3" />
                  <div className="h-3 w-full bg-stone-100 mb-2" />
                  <div className="h-3 w-2/3 bg-stone-100" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div
              className="bg-white border-2 border-brand-charcoal p-12 text-center shadow-[4px_4px_0px_#0B130E] space-y-4 max-w-lg mx-auto"
              data-testid="live-registry-error"
            >
              <div className="w-12 h-12 bg-red-100 border border-brand-charcoal mx-auto flex items-center justify-center font-black text-xl text-red-700">
                !
              </div>
              <h3 className="text-lg font-black uppercase text-brand-charcoal font-sans">Registry Read Failed</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-mono">{error.userMessage}</p>
              <p className="text-[10px] font-mono text-stone-500 uppercase">Error code: {error.code}</p>
              <button
                type="button"
                onClick={() => {
                  void snapshotQuery.refetch();
                }}
                className="bg-brand-orange text-white hover:bg-brand-charcoal px-5 py-2.5 font-mono text-xs font-bold uppercase transition-colors shadow-[2px_2px_0px_#0B130E] border border-brand-charcoal cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : snapshotQuery.data && snapshotQuery.data.packageCount === 0 ? (
            <div
              className="bg-white border-2 border-brand-charcoal p-12 text-center shadow-[4px_4px_0px_#0B130E] space-y-4 max-w-lg mx-auto"
              data-testid="live-registry-empty"
            >
              <div className="w-12 h-12 bg-stone-100 border border-brand-charcoal mx-auto flex items-center justify-center font-black text-xl text-stone-400">
                ∅
              </div>
              <h3 className="text-lg font-black uppercase text-brand-charcoal font-sans">No Packages On-Chain</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-mono">
                package_count is 0 on Studio-dev. No mock records are shown in live mode.
              </p>
            </div>
          ) : paginatedPackages.length > 0 ? (
            <>
              <div className="flex items-center justify-between pb-6 font-mono text-xs text-stone-600">
                <span>
                  Displaying <strong>{paginatedPackages.length}</strong> of{' '}
                  <strong>{filteredPackages.length}</strong> Packages
                </span>
                <span>Chain ID: 61997 • Studio-dev</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedPackages.map((pkg, idx) => {
                  const candidateCount = candidateCountForPackage(pkg.package_uid, candidates);
                  return (
                    <div
                      key={pkg.package_uid}
                      onClick={() => navigate(livePackagePath(pkg.publisher, pkg.package_slug))}
                      className="bg-white border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between p-6 group"
                      data-testid={`live-package-card-${pkg.package_slug}`}
                    >
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
                          <span className="font-mono text-xs font-black text-stone-500">
                            [{String(idx + 1).padStart(2, '0')}]
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider border shadow-[2px_2px_0px_#0B130E] bg-stone-100 text-brand-charcoal border-brand-charcoal">
                            {candidateCount === 0 ? 'REGISTERED • NO CANDIDATE' : 'REGISTERED'}
                          </span>
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-brand-charcoal group-hover:text-brand-orange transition-colors mb-2 font-sans">
                          {pkg.package_slug}
                        </h3>
                        <p className="text-[11px] font-mono text-stone-600 break-all mb-4">{pkg.package_uid}</p>
                      </div>
                      <div className="pt-4 border-t border-brand-charcoal/20 space-y-2 font-mono text-xs">
                        <div className="flex items-center justify-between text-stone-600 gap-2">
                          <span>Publisher:</span>
                          <span className="font-bold text-brand-charcoal truncate">{shortenHex(pkg.publisher, 8)}</span>
                        </div>
                        <div className="flex items-center justify-between text-stone-600 gap-2">
                          <span>Repository:</span>
                          <span className="font-bold text-stone-800 truncate max-w-[180px]">{pkg.repository_url.replace('https://', '')}</span>
                        </div>
                        <div className="flex items-center justify-between text-stone-600 gap-2">
                          <span>Baseline SHA:</span>
                          <span className="font-bold text-stone-800">{shortenHex(pkg.baseline_commit_sha, 10)}</span>
                        </div>
                        <div className="flex items-center justify-between text-stone-600 gap-2">
                          <span>Charter hash:</span>
                          <span className="font-bold text-stone-800">{shortenHex(pkg.charter_hash, 10)}</span>
                        </div>
                        <div className="flex items-center justify-between text-stone-600">
                          <span>Sequence:</span>
                          <span className="font-bold text-brand-charcoal">{pkg.sequence}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[11px] text-stone-500">
                          <span>
                            Candidates: <strong className="text-brand-charcoal">{candidateCount}</strong>
                          </span>
                          <span className="text-brand-orange font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            Inspect Record →
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="bg-white border-2 border-brand-charcoal p-12 text-center shadow-[4px_4px_0px_#0B130E] space-y-4 max-w-lg mx-auto">
              <div className="w-12 h-12 bg-stone-100 border border-brand-charcoal mx-auto flex items-center justify-center font-black text-xl text-stone-400">
                ∅
              </div>
              <h3 className="text-lg font-black uppercase text-brand-charcoal font-sans">No Matching Packages</h3>
              <button
                type="button"
                onClick={resetFilters}
                className="bg-brand-orange text-white hover:bg-brand-charcoal px-5 py-2.5 font-mono text-xs font-bold uppercase transition-colors shadow-[2px_2px_0px_#0B130E] border border-brand-charcoal cursor-pointer"
              >
                Reset Ledger Query
              </button>
            </div>
          )}

          {totalPages > 1 && !snapshotQuery.isLoading && !error ? (
            <div className="flex items-center justify-center gap-2 pt-10 font-mono text-xs">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="px-3 py-2 border border-brand-charcoal bg-white disabled:opacity-40 hover:bg-stone-100 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentPage(index + 1)}
                  className={`px-3.5 py-2 border border-brand-charcoal font-bold cursor-pointer ${
                    currentPage === index + 1
                      ? 'bg-brand-charcoal text-white'
                      : 'bg-white text-brand-charcoal hover:bg-stone-100'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                className="px-3 py-2 border border-brand-charcoal bg-white disabled:opacity-40 hover:bg-stone-100 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
};
