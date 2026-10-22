import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, RotateCcw, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { MOCK_PACKAGES } from '../mocks';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DataModeBadge } from '../components/ui/DataModeBadge';
import { LiveRegistryPanel } from '../features/registry/LiveRegistryPanel';
import { getUpdateSealConfigResult } from '../lib/updateSealConfig';

export const RegistryPage: React.FC = () => {
  const configResult = getUpdateSealConfigResult();
  if (!configResult.ok) {
    return (
      <div className="bg-brand-cream px-6 py-16">
        <div className="max-w-xl mx-auto bg-white border-2 border-brand-charcoal p-8 shadow-[4px_4px_0px_#0B130E] space-y-4">
          <DataModeBadge />
          <h1 className="text-3xl font-black uppercase">Configuration Error</h1>
          <p className="text-xs font-mono text-stone-600">{configResult.error.userMessage}</p>
        </div>
      </div>
    );
  }
  if (configResult.config.dataMode === 'live') {
    return <LiveRegistryPanel />;
  }
  return <DemoRegistryPage />;
};

const DemoRegistryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCapability, setSelectedCapability] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'stars' | 'verified'>('stars');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const filteredPackages = useMemo(() => {
    return MOCK_PACKAGES.filter((pkg) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        pkg.displayName.toLowerCase().includes(q) ||
        pkg.id.toLowerCase().includes(q) ||
        pkg.description.toLowerCase().includes(q) ||
        pkg.tags.some((t) => t.toLowerCase().includes(q));

      // Status
      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'APPROVED' && pkg.activeDecisionCode === '0x01') ||
        (selectedStatus === 'REVIEW_REQUIRED' && pkg.activeDecisionCode === '0x02') ||
        (selectedStatus === 'VIOLATION' && pkg.activeDecisionCode === '0x03') ||
        (selectedStatus === 'UNAVAILABLE' && pkg.activeDecisionCode === '0x04');

      // Capability
      let matchesCap = true;
      if (selectedCapability !== 'ALL') {
        const cap = pkg.capabilityCharter[selectedCapability as keyof typeof pkg.capabilityCharter];
        matchesCap = cap ? cap.policy !== 'PROHIBITED' : true;
      }

      return matchesSearch && matchesStatus && matchesCap;
    }).sort((a, b) => {
      if (sortBy === 'name') return a.displayName.localeCompare(b.displayName);
      if (sortBy === 'stars') return (b.stars || 0) - (a.stars || 0);
      return new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime();
    });
  }, [searchQuery, selectedStatus, selectedCapability, sortBy]);

  const totalPages = Math.ceil(filteredPackages.length / itemsPerPage) || 1;
  const paginatedPackages = filteredPackages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('ALL');
    setSelectedCapability('ALL');
    setSortBy('stars');
    setCurrentPage(1);
  };

  return (
    <div className="w-full flex flex-col animate-in fade-in duration-150">
      {/* Top Registry Header Banner */}
      <section className="bg-brand-cream border-b-2 border-brand-charcoal py-8 px-6 lg:px-16">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="sticker-badge bg-brand-charcoal text-white">Registry Index (Demo data)</span>
                <DataModeBadge />
              </div>
              <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-brand-charcoal font-sans">
                Package Registry Directory
              </h1>
            </div>

            <Link
              to="/register/identity"
              className="bg-brand-orange text-white hover:bg-brand-charcoal transition-colors px-5 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-brand-charcoal shadow-[2px_2px_0px_#0B130E] self-start md:self-auto font-mono cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Agent</span>
            </Link>
          </div>

          {/* Counter Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="bg-white p-4 border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
              <span className="text-[10px] uppercase font-bold text-stone-500">Approved Active</span>
              <div className="text-2xl font-black text-emerald-700 mt-1 font-sans">36 Agents</div>
            </div>
            <div className="bg-white p-4 border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
              <span className="text-[10px] uppercase font-bold text-stone-500">Pending Consensus</span>
              <div className="text-2xl font-black text-amber-600 mt-1 font-sans">4 Releases</div>
            </div>
            <div className="bg-white p-4 border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
              <span className="text-[10px] uppercase font-bold text-stone-500">Violations Intercepted</span>
              <div className="text-2xl font-black text-red-600 mt-1 font-sans">19 Blocked</div>
            </div>
            <div className="bg-white p-4 border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
              <span className="text-[10px] uppercase font-bold text-stone-500">Total Evaluations</span>
              <div className="text-2xl font-black text-brand-charcoal mt-1 font-sans">889 Total</div>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filter Toolbar */}
      <section className="bg-stone-100 border-b-2 border-brand-charcoal py-4 px-6 lg:px-16">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search agent name, ID, or keywords..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-brand-charcoal focus:ring-0 focus:border-brand-orange font-mono"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 flex-wrap font-mono text-[11px]">
            <span className="font-bold uppercase text-stone-600 mr-1">Status:</span>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'APPROVED', label: 'Approved (0x01)' },
              { id: 'REVIEW_REQUIRED', label: 'Review Req. (0x02)' },
              { id: 'VIOLATION', label: 'Violations (0x03)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSelectedStatus(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 border border-brand-charcoal font-bold uppercase transition-colors cursor-pointer ${
                  selectedStatus === tab.id
                    ? 'bg-brand-charcoal text-white'
                    : 'bg-white text-brand-charcoal hover:bg-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort & Reset */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-stone-500 font-bold uppercase">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-brand-charcoal px-2.5 py-1.5 text-xs font-mono font-bold text-brand-charcoal focus:ring-0"
            >
              <option value="stars">Most Starred</option>
              <option value="name">Alphabetical</option>
              <option value="verified">Latest Verified</option>
            </select>

            <button
              type="button"
              onClick={resetFilters}
              title="Reset Filters"
              className="p-1.5 bg-white border border-brand-charcoal hover:bg-stone-200 transition-colors text-stone-700"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Main Packages Grid Area */}
      <section className="bg-brand-cream py-10 px-6 lg:px-16 flex-grow">
        <div className="max-w-[1440px] mx-auto">
          {/* Active Result Count */}
          <div className="flex items-center justify-between pb-6 font-mono text-xs text-stone-600">
            <span>
              Displaying <strong>{paginatedPackages.length}</strong> of{' '}
              <strong>{filteredPackages.length}</strong> Packages
            </span>
            <span>Chain ID: 61997 • Studio-dev • Demo data</span>
          </div>

          {/* Cards Grid */}
          {paginatedPackages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedPackages.map((pkg, idx) => (
                <div
                  key={pkg.id}
                  onClick={() => navigate(`/packages/${pkg.id}`)}
                  className="bg-white border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between p-6 group"
                >
                  <div>
                    {/* Card Top Metadata Bar */}
                    <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
                      <span className="font-mono text-xs font-black text-stone-500">
                        [{String(idx + 1).padStart(2, '0')}]
                      </span>
                      <StatusBadge decisionCode={pkg.activeDecisionCode} />
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-xl font-black uppercase tracking-tight text-brand-charcoal group-hover:text-brand-orange transition-colors mb-2 font-sans">
                      {pkg.displayName}
                    </h3>
                    <p className="text-xs text-stone-700 leading-relaxed line-clamp-3 mb-4">
                      {pkg.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {pkg.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-stone-100 border border-stone-300 px-2 py-0.5 text-[10px] font-mono font-bold text-stone-700 uppercase"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Bottom Ledger Metadata */}
                  <div className="pt-4 border-t border-brand-charcoal/20 space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between text-stone-600">
                      <span>Baseline:</span>
                      <span className="font-bold text-brand-charcoal">{pkg.baselineVersion}</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-600">
                      <span>Commit SHA:</span>
                      <span className="font-bold text-stone-800 truncate max-w-[140px]">
                        {pkg.baselineCommitSha.substring(0, 10)}...
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[11px] text-stone-500">
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <strong className="text-brand-charcoal">{pkg.stars}</strong>
                      </span>
                      <span className="text-brand-orange font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Inspect Dossier →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white border-2 border-brand-charcoal p-12 text-center shadow-[4px_4px_0px_#0B130E] space-y-4 max-w-lg mx-auto">
              <div className="w-12 h-12 bg-stone-100 border border-brand-charcoal mx-auto flex items-center justify-center font-black text-xl text-stone-400">
                ∅
              </div>
              <h3 className="text-lg font-black uppercase text-brand-charcoal font-sans">
                No Registered Packages Found
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed font-mono">
                No smart contracts matching your search query were found in this ledger query filter set.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="bg-brand-orange text-white hover:bg-brand-charcoal px-5 py-2.5 font-mono text-xs font-bold uppercase transition-colors shadow-[2px_2px_0px_#0B130E] border border-brand-charcoal cursor-pointer"
              >
                Reset Ledger Query
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-10 font-mono text-xs">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-2 border border-brand-charcoal bg-white disabled:opacity-40 hover:bg-stone-100 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3.5 py-2 border border-brand-charcoal font-bold cursor-pointer ${
                    currentPage === i + 1
                      ? 'bg-brand-charcoal text-white'
                      : 'bg-white text-brand-charcoal hover:bg-stone-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-2 border border-brand-charcoal bg-white disabled:opacity-40 hover:bg-stone-100 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
