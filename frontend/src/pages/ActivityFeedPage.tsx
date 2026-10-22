import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockActivityEvents } from '../mocks';
import { ArrowRight, ExternalLink, Filter } from 'lucide-react';
import { DataModeBadge } from '../components/ui/DataModeBadge';
import { ConfigErrorPanel } from '../components/registry/RegistryChrome';
import { getUpdateSealConfigResult, isLiveReadsEnabled } from '../lib/updateSealConfig';
import { LiveActivityPage } from './LiveActivityPage';

export const ActivityFeedPage: React.FC = () => {
  const configResult = getUpdateSealConfigResult();
  if (!configResult.ok) {
    return <ConfigErrorPanel testId="activity-config-error" message={configResult.error.userMessage} />;
  }
  if (isLiveReadsEnabled(configResult)) {
    return <LiveActivityPage />;
  }
  return <DemoActivityFeedPage />;
};

type FilterType = 'all' | 'approval' | 'violation' | 'escalation' | 'registration';

const DemoActivityFeedPage: React.FC = () => {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredEvents = mockActivityEvents.filter(event => {
    if (filterType === 'approval') return event.type === 'RELEASE_APPROVED';
    if (filterType === 'violation') return event.type === 'RELEASE_BLOCKED';
    if (filterType === 'escalation') return event.type === 'REVIEW_REQUESTED';
    if (filterType === 'registration') return event.type === 'PACKAGE_REGISTERED';
    return true;
  });

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage) || 1;
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex flex-col w-full pb-16" data-testid="demo-activity-page">
      {/* Telemetry Masthead */}
      <section className="w-full bg-brand-forest border-b-2 border-brand-charcoal text-white px-4 lg:px-12 py-8">
        <div className="max-w-[1440px] mx-auto flex flex-col gap-6">
          {/* Top Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-brand-charcoal border-2 border-brand-pastelYellow/40 px-4 py-2 shadow-[2px_2px_0px_#EF5313] font-mono text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-block w-2.5 h-2.5 bg-brand-pastelYellow rounded-full animate-ping"></span>
              <span className="font-bold text-brand-pastelYellow uppercase tracking-wider">
                [DEMO ACTIVITY STREAM] // CHAIN 61997
              </span>
              <span className="text-stone-500">|</span>
              <span className="text-stone-300 uppercase">VALIDATOR SWARM PROTOCOL: DEMO MODE</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-stone-300">LATEST BLOCK: <strong className="text-brand-pastelYellow font-bold">#61,997,514 (DEMO)</strong></span>
              <span className="text-stone-500 hidden sm:inline">|</span>
              <span className="text-stone-300 hidden sm:inline">CONSENSUS LATENCY: <strong className="text-brand-vibrantCyan font-bold">814ms</strong></span>
            </div>
          </div>

          {/* Hero Lockup */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-2">
            <div className="lg:col-span-8 flex flex-col gap-2">
              <div className="inline-flex self-start bg-brand-pastelYellow text-brand-charcoal border border-brand-charcoal px-3 py-1 font-mono text-xs font-bold uppercase -rotate-1 shadow-[2px_2px_0px_#0B130E]">
                ✦ HIGH-DENSITY EVENT STREAM &amp; DEMO PROOFS
              </div>
              <DataModeBadge />
              <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight uppercase leading-none font-sans">
                PUBLIC ACTIVITY FEED <span className="text-brand-pastelYellow">&amp; VERDICT LEDGER</span>
              </h1>
              <p className="text-sm text-stone-300 max-w-2xl font-mono leading-relaxed">
                Demonstration feed of autonomous agent release proposals, LLM multi-validator rounds, and canonical cryptographic seals. Contract integration pending.
              </p>
            </div>

            {/* Metric Tiles */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-3 font-mono">
              <div className="bg-brand-charcoal text-white p-4 border-2 border-brand-charcoal shadow-[4px_4px_0px_#F4E77E] flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-brand-pastelYellow tracking-wider">TOTAL SEALS ISSUED</span>
                <span className="text-3xl font-black text-white my-1">1,842</span>
                <span className="text-[10px] text-emerald-400 font-bold uppercase">DEMO DATA</span>
              </div>
              <div className="bg-brand-orange text-white p-4 border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-brand-pastelYellow tracking-wider">VIOLATIONS HALTED</span>
                <span className="text-3xl font-black text-brand-pastelYellow my-1">47</span>
                <span className="text-[10px] text-white font-bold uppercase">0x03 BLOCKED (DEMO)</span>
              </div>
            </div>
          </div>

          {/* Sparkline Bar */}
          <div className="bg-brand-charcoal border-2 border-brand-charcoal p-4 flex flex-col md:flex-row items-center justify-between gap-4 mt-2 shadow-[4px_4px_0px_#0B130E] font-mono text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-orange text-white flex items-center justify-center font-bold text-base border border-brand-charcoal">
                ✦
              </div>
              <div>
                <div className="font-bold text-white uppercase tracking-wider">24-HOUR SEAL FREQUENCY</div>
                <div className="text-[11px] text-stone-400">42 approvals • 3 rejections • 6 human escalations</div>
              </div>
            </div>

            <div className="flex items-end gap-1.5 h-8 bg-stone-900 p-1 border border-stone-800">
              {[3, 4, 6, 3.5, 7, 5, 4, 6, 7, 5, 8, 6, 9].map((height, i) => (
                <div
                  key={i}
                  className={`w-2.5 ${i % 3 === 0 ? 'bg-brand-orange' : i % 2 === 0 ? 'bg-brand-vibrantCyan' : 'bg-brand-pastelYellow'}`}
                  style={{ height: `${height * 3}px` }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Filter Ribbon & Event Stream */}
      <main className="w-full max-w-[1440px] mx-auto px-4 lg:px-12 py-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-brand-charcoal">
          <div className="flex items-center gap-2 font-mono text-xs">
            <Filter className="w-4 h-4 text-brand-orange" />
            <span className="font-bold uppercase tracking-wider text-brand-charcoal">Filter Activity By Type:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            {[
              { id: 'all', label: 'All Events' },
              { id: 'approval', label: 'Approvals (0x01)' },
              { id: 'violation', label: 'Violations (0x03)' },
              { id: 'escalation', label: 'Escalations (0x02)' },
              { id: 'registration', label: 'Registrations' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setFilterType(tab.id as FilterType);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 font-bold uppercase tracking-wider border-2 border-brand-charcoal shadow-[2px_2px_0px_#0B130E] transition-all cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-brand-orange text-white'
                    : 'bg-white text-brand-charcoal hover:bg-stone-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Event List */}
        {paginatedEvents.length === 0 ? (
          <div className="bg-white border-2 border-brand-charcoal p-12 text-center shadow-[4px_4px_0px_#0B130E] font-mono text-xs">
            <p className="text-stone-600 uppercase font-bold">No events matching this filter category.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedEvents.map(event => (
              <article
                key={event.id}
                className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:-translate-y-0.5"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                    <span className={`px-2 py-0.5 font-bold uppercase border border-brand-charcoal ${
                      event.type === 'RELEASE_APPROVED'
                        ? 'bg-emerald-100 text-emerald-900'
                        : event.type === 'RELEASE_BLOCKED'
                        ? 'bg-red-100 text-red-900'
                        : event.type === 'REVIEW_REQUESTED'
                        ? 'bg-brand-pastelYellow text-brand-charcoal'
                        : 'bg-brand-forest text-white'
                    }`}>
                      {event.type.replace('_', ' ')}
                    </span>
                    <span className="text-stone-400">|</span>
                    <span className="text-stone-600 font-bold">{event.timestamp}</span>
                    <span className="text-stone-400">|</span>
                    <span className="text-stone-500">Block #{event.blockNumber || event.blockHeight || 61997400}</span>
                  </div>

                  <h3 className="font-sans font-black text-lg uppercase text-brand-charcoal tracking-tight">
                    {event.packageId} — <span className="font-mono text-base font-bold text-brand-orange">{event.version}</span>
                  </h3>

                  <p className="font-sans text-xs text-stone-700 leading-relaxed max-w-3xl">
                    {event.summary}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-stone-600 pt-1">
                    {event.commitSha && (
                      <>
                        <span>COMMIT: <code className="font-bold text-brand-charcoal bg-stone-100 px-1">{event.commitSha}</code></span>
                        <span>•</span>
                      </>
                    )}
                    {event.quorum && (
                      <>
                        <span>QUORUM: <strong className="text-brand-charcoal">{event.quorum}</strong></span>
                        <span>•</span>
                      </>
                    )}
                    <span>TX: <code className="text-stone-500">{event.txHash}</code></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-center font-mono text-xs">
                  {event.decisionReportRoute && (
                    <Link
                      to={event.decisionReportRoute}
                      className="px-4 py-2.5 bg-brand-forest hover:bg-brand-charcoal text-brand-pastelYellow font-bold uppercase border border-brand-charcoal shadow-[2px_2px_0px_#0B130E] flex items-center gap-1.5"
                    >
                      <span>Inspect Report</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  <Link
                    to={`/packages/${event.packageId}`}
                    className="p-2.5 bg-brand-cream hover:bg-stone-200 text-brand-charcoal border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]"
                    title="Package Detail"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        <div className="flex items-center justify-between pt-6 border-t-2 border-brand-charcoal font-mono text-xs">
          <span className="text-stone-600 font-bold">
            Showing Page {currentPage} of {totalPages} ({filteredEvents.length} total events)
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className={`px-3 py-1.5 font-bold uppercase border border-brand-charcoal shadow-[2px_2px_0px_#0B130E] ${
                currentPage <= 1 ? 'opacity-50 cursor-not-allowed bg-stone-100' : 'bg-white hover:bg-stone-100 cursor-pointer'
              }`}
            >
              Previous
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className={`px-3 py-1.5 font-bold uppercase border border-brand-charcoal shadow-[2px_2px_0px_#0B130E] ${
                currentPage >= totalPages ? 'opacity-50 cursor-not-allowed bg-stone-100' : 'bg-brand-forest text-white hover:bg-brand-charcoal cursor-pointer'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
