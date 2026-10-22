import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ShieldAlert, AlertCircle, Terminal } from 'lucide-react';
import { CopyButton } from '../components/ui/CopyButton';
import { DataModeBadge } from '../components/ui/DataModeBadge';
import { getUpdateSealConfigResult, isLiveReadsEnabled } from '../lib/updateSealConfig';
import { LiveVerificationPage } from './LiveVerificationPage';

export const VerificationPage: React.FC = () => {
  const configResult = getUpdateSealConfigResult();
  if (!configResult.ok) {
    return (
      <div className="bg-brand-cream px-6 py-16" data-testid="verify-config-error">
        <div className="max-w-xl mx-auto bg-white border-2 border-brand-charcoal p-8 space-y-3">
          <DataModeBadge />
          <h1 className="text-2xl font-black uppercase">Configuration Error</h1>
          <p className="text-xs font-mono">{configResult.error.userMessage}</p>
        </div>
      </div>
    );
  }
  if (isLiveReadsEnabled(configResult)) {
    return <LiveVerificationPage />;
  }
  return <DemoVerificationPage />;
};

type VerdictState = 'approved' | 'blocked' | 'unknown';

const DemoVerificationPage: React.FC = () => {
  const [packageId, setPackageId] = useState('atlas-protocol/research-agent');
  const [commitSha, setCommitSha] = useState('sha256:d9b2e04f9812cc994017bca882e558a120092bf');
  const [targetNetwork, setTargetNetwork] = useState('61997');
  const [activeState, setActiveState] = useState<VerdictState>('approved');
  const [isQuerying, setIsQuerying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setPreset = (preset: 'approved' | 'violation' | 'unknown') => {
    setErrorMessage(null);
    if (preset === 'approved') {
      setPackageId('atlas-protocol/research-agent');
      setCommitSha('sha256:d9b2e04f9812cc994017bca882e558a120092bf');
      setActiveState('approved');
    } else if (preset === 'violation') {
      setPackageId('sentinel-guard/sentinel-1');
      setCommitSha('sha256:61997402be49f812cc994017bca882e558a12009');
      setActiveState('blocked');
    } else {
      setPackageId('local/unregistered-agent');
      setCommitSha('sha256:0000000000000000000000000000000000000000');
      setActiveState('unknown');
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageId.trim() || !commitSha.trim()) {
      setErrorMessage('Please provide both a package identifier and a commit SHA.');
      return;
    }
    setErrorMessage(null);
    setIsQuerying(true);

    setTimeout(() => {
      setIsQuerying(false);
      if (commitSha.toLowerCase().includes('d9b2e') || packageId.includes('atlas')) {
        setActiveState('approved');
      } else if (commitSha.toLowerCase().includes('61997') || packageId.includes('sentinel')) {
        setActiveState('blocked');
      } else {
        setActiveState('unknown');
      }
    }, 400);
  };

  const getJsonPayload = () => {
    if (activeState === 'approved') {
      return JSON.stringify(
        {
          contract: 'Contract integration pending',
          package_id: packageId,
          commit: commitSha.replace('sha256:', ''),
          approved: true,
          verdict_code: '0x01',
          status: 'APPROVED',
          baseline_version: 'v1.4.2',
          chain_id: Number(targetNetwork),
          finalized_block: 61997402,
          consensus_nodes: 5,
          capabilities_permitted: [
            'network:arxiv.org',
            'network:api.openai.com',
            'fs:read_local_workspace'
          ],
          execution_permitted: true
        },
        null,
        2
      );
    } else if (activeState === 'blocked') {
      return JSON.stringify(
        {
          contract: 'Contract integration pending',
          package_id: packageId,
          commit: commitSha.replace('sha256:', ''),
          approved: false,
          verdict_code: '0x03',
          status: 'CAPABILITY_VIOLATION',
          baseline_version: 'v1.4.2',
          chain_id: Number(targetNetwork),
          finalized_block: 61997428,
          consensus_nodes: 5,
          breaches_detected: [
            'shell:child_process.spawn',
            'network:telemetry-collect-xyz.net'
          ],
          execution_permitted: false
        },
        null,
        2
      );
    } else {
      return JSON.stringify(
        {
          contract: 'Contract integration pending',
          package_id: packageId,
          commit: commitSha.replace('sha256:', ''),
          approved: false,
          verdict_code: '0x00',
          status: 'UNKNOWN_OR_UNSEALED',
          chain_id: Number(targetNetwork),
          error: 'Package commit not registered in UpdateSeal smart contract.',
          execution_permitted: false
        },
        null,
        2
      );
    }
  };

  return (
    <div className="flex flex-col w-full pb-16" data-testid="demo-verification-page">
      {/* Editorial Header & Ticker */}
      <section className="relative w-full bg-brand-cream border-b-2 border-brand-charcoal py-12 px-6 lg:px-12 overflow-hidden">
        <div className="max-w-[1360px] mx-auto relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-8 text-brand-charcoal border-b border-brand-charcoal/20 mb-8 font-mono text-xs">
            <div className="flex items-center gap-3">
              <span className="uppercase tracking-widest bg-brand-forest text-brand-pastelYellow px-2.5 py-1 border border-brand-charcoal font-bold shadow-[2px_2px_0px_#0B130E]">
                GENLAYER::RPC::61997
              </span>
              <span className="text-stone-400">/</span>
              <span className="uppercase tracking-widest text-stone-600 font-semibold">
                GATEWAY: VERIFY_RELEASE_STATE
              </span>
            </div>
            <div className="flex items-center gap-6 uppercase">
              <DataModeBadge />
              <span className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-brand-orange animate-pulse"></span>
                CONSENSUS LATENCY: <strong className="text-brand-charcoal font-bold">184MS</strong>
              </span>
              <span className="hidden md:inline text-stone-300">|</span>
              <span className="hidden md:inline text-stone-600">
                ORACLE CONTRACT: <code className="font-mono text-brand-orange font-bold">Contract integration pending</code>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-3 mb-2 font-mono text-xs">
                <span className="inline-block -rotate-2 bg-brand-orange text-white px-3 py-1 border border-brand-charcoal shadow-[2px_2px_0px_#0B130E] uppercase tracking-wider font-bold">
                  ✦ Interface Query (Demo Data)
                </span>
                <span className="inline-block rotate-1 bg-brand-pastelYellow text-brand-charcoal px-3 py-1 border border-brand-charcoal shadow-[2px_2px_0px_#0B130E] uppercase tracking-wider font-bold">
                  [01] Zero Trust Verification
                </span>
                <span className="inline-block -rotate-1 bg-white text-brand-charcoal px-2.5 py-1 uppercase font-bold border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                  STUDIO NEXT PROTOCOL
                </span>
              </div>
              <h1 className="font-sans font-black text-4xl lg:text-6xl text-brand-charcoal tracking-tighter uppercase leading-[0.95]">
                CHECK BEFORE<br />
                <span className="text-brand-orange underline decoration-brand-charcoal decoration-4 underline-offset-8">
                  YOU ACTIVATE.
                </span>
              </h1>
              <p className="font-sans text-base text-stone-700 max-w-2xl pt-2 leading-relaxed font-medium">
                Query the GenLayer Intelligent Contract in real time to verify whether a package commit is cryptographically sealed and approved by decentralized LLM validator consensus before executing dynamic weights or autonomous agent subroutines.
              </p>
            </div>

            <div className="lg:col-span-4 bg-brand-forest text-white p-6 border-2 border-brand-charcoal shadow-[6px_6px_0px_#0B130E] relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 text-brand-pastelYellow/10 font-black text-7xl select-none pointer-events-none uppercase tracking-tighter">
                SEAL
              </div>
              <div className="relative z-10 space-y-3 font-sans">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-widest text-brand-pastelYellow font-bold">STATE ENGINE</span>
                  <Terminal className="w-5 h-5 text-brand-orange" />
                </div>
                <div className="font-black text-2xl tracking-tight text-white uppercase">
                  4 CANONICAL VERDICTS
                </div>
                <p className="text-xs text-stone-300 leading-relaxed font-sans">
                  Any execution engine consuming unsealed agent commits risks prompt injection, unauthorized egress, or total autonomy revocation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Query Form */}
      <section className="w-full bg-brand-cream border-b-2 border-brand-charcoal py-12 px-6 lg:px-12">
        <div className="max-w-[1360px] mx-auto">
          <div className="bg-white border-2 border-brand-charcoal shadow-[8px_8px_0px_#0B130E] p-6 lg:p-10 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b-2 border-brand-charcoal bg-stone-100 p-4 border">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-brand-forest text-brand-pastelYellow flex items-center justify-center font-mono text-sm font-bold border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                  02
                </span>
                <div>
                  <h2 className="font-sans font-black text-base text-brand-charcoal uppercase tracking-tight">
                    On-Chain Registry Evaluation Query
                  </h2>
                  <p className="font-mono text-xs text-stone-600">
                    Realtime JSON-RPC eth_call to GenLayer Smart Contract Instance
                  </p>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                <span className="font-mono text-[11px] font-bold text-stone-600 uppercase tracking-wider">PRESET QUICK LOADS:</span>
                <button
                  type="button"
                  onClick={() => setPreset('approved')}
                  className="px-3 py-1 font-mono text-xs font-bold bg-brand-forest text-white border border-brand-charcoal hover:bg-brand-orange transition-colors uppercase shadow-[2px_2px_0px_#0B130E] cursor-pointer"
                >
                  APPROVED (ATLAS)
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('violation')}
                  className="px-3 py-1 font-mono text-xs font-bold bg-white text-brand-charcoal border border-brand-charcoal hover:bg-brand-orange hover:text-white transition-colors uppercase shadow-[2px_2px_0px_#0B130E] cursor-pointer"
                >
                  VIOLATION (SENTINEL)
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('unknown')}
                  className="px-3 py-1 font-mono text-xs font-bold bg-white text-brand-charcoal border border-brand-charcoal hover:bg-stone-200 transition-colors uppercase shadow-[2px_2px_0px_#0B130E] cursor-pointer"
                >
                  UNKNOWN (LOCAL)
                </button>
              </div>
            </div>

            <form onSubmit={handleVerify} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
              <div className="lg:col-span-4 space-y-2">
                <label className="block font-mono text-xs uppercase tracking-wider font-bold text-brand-charcoal" htmlFor="input-package-id">
                  Package Identifier or Repo Slug
                </label>
                <input
                  id="input-package-id"
                  type="text"
                  value={packageId}
                  onChange={(e) => setPackageId(e.target.value)}
                  placeholder="org/package-name or slug"
                  className="w-full px-4 py-3 bg-stone-50 text-brand-charcoal font-mono text-sm border-2 border-brand-charcoal focus:outline-none focus:bg-white shadow-[2px_2px_0px_#0B130E] font-medium"
                />
                <span className="font-mono text-[11px] text-stone-500 block">
                  Example: <code className="text-brand-orange font-bold">atlas-protocol/research-agent</code>
                </span>
              </div>

              <div className="lg:col-span-5 space-y-2">
                <label className="block font-mono text-xs uppercase tracking-wider font-bold text-brand-charcoal" htmlFor="input-commit-sha">
                  Candidate Commit SHA-256 / Git Commit
                </label>
                <input
                  id="input-commit-sha"
                  type="text"
                  value={commitSha}
                  onChange={(e) => setCommitSha(e.target.value)}
                  placeholder="sha256:4a88..."
                  className="w-full px-4 py-3 bg-stone-50 text-brand-charcoal font-mono text-sm border-2 border-brand-charcoal focus:outline-none focus:bg-white shadow-[2px_2px_0px_#0B130E] truncate font-medium"
                />
                <span className="font-mono text-[11px] text-stone-500 block">
                  Evaluated by decentralized AST scanner on commit snapshot
                </span>
              </div>

              <div className="lg:col-span-3 space-y-2">
                <label className="block font-mono text-xs uppercase tracking-wider font-bold text-brand-charcoal" htmlFor="input-network">
                  Target Consensus Network
                </label>
                <select
                  id="input-network"
                  value={targetNetwork}
                  onChange={(e) => setTargetNetwork(e.target.value)}
                  className="w-full px-3 py-3 bg-stone-50 text-brand-charcoal font-mono text-xs uppercase border-2 border-brand-charcoal focus:outline-none shadow-[2px_2px_0px_#0B130E] cursor-pointer font-bold"
                >
                  <option value="61997">GenLayer Studio Next (Chain 61997)</option>
                  <option value="61998">GenLayer Testnet Alpha (Chain 61998)</option>
                  <option value="4000">Local Studio Simulator (127.0.0.1:4000)</option>
                </select>

                <button
                  type="submit"
                  disabled={isQuerying}
                  className="w-full mt-2 py-3 px-6 bg-brand-orange hover:bg-brand-charcoal text-white font-mono text-xs uppercase font-bold tracking-wider border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>{isQuerying ? 'QUERYING VAL NODES...' : 'VERIFY RELEASE ON-CHAIN'}</span>
                  <span>→</span>
                </button>
              </div>
            </form>

            {errorMessage && (
              <div className="mt-4 p-3 bg-red-100 border border-red-500 text-red-800 font-mono text-xs font-bold">
                {errorMessage}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Result Cards & Tabs */}
      <section className="w-full bg-brand-cream border-b-2 border-brand-charcoal py-12 px-6 lg:px-12">
        <div className="max-w-[1360px] mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b-2 border-brand-charcoal">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-brand-orange font-bold">
                [03] CONSENSUS VERDICT INSPECTION
              </span>
              <h2 className="font-sans font-black text-3xl text-brand-charcoal tracking-tight uppercase mt-1">
                Cryptographic Oracle Verdicts
              </h2>
            </div>
            <p className="font-sans text-xs text-stone-600 max-w-md font-medium leading-relaxed">
              Explore canonical resolution states below. The query form updates the active visual verdict in real time.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 font-mono text-xs">
            <button
              onClick={() => setActiveState('approved')}
              className={`px-4 py-2 uppercase tracking-wider font-bold border-2 border-brand-charcoal shadow-[3px_3px_0px_#0B130E] flex items-center gap-2 cursor-pointer ${
                activeState === 'approved'
                  ? 'bg-brand-forest text-white'
                  : 'bg-white text-brand-charcoal hover:bg-stone-100'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-brand-pastelYellow border border-brand-charcoal"></span>
              State A: Approved (0x01)
            </button>
            <button
              onClick={() => setActiveState('blocked')}
              className={`px-4 py-2 uppercase tracking-wider font-bold border-2 border-brand-charcoal shadow-[3px_3px_0px_#0B130E] flex items-center gap-2 cursor-pointer ${
                activeState === 'blocked'
                  ? 'bg-brand-orange text-white'
                  : 'bg-white text-brand-charcoal hover:bg-stone-100'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-brand-charcoal"></span>
              State B: Blocked (0x03)
            </button>
            <button
              onClick={() => setActiveState('unknown')}
              className={`px-4 py-2 uppercase tracking-wider font-bold border-2 border-brand-charcoal shadow-[3px_3px_0px_#0B130E] flex items-center gap-2 cursor-pointer ${
                activeState === 'unknown'
                  ? 'bg-stone-800 text-white'
                  : 'bg-white text-brand-charcoal hover:bg-stone-100'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-stone-400 border border-brand-charcoal"></span>
              State C: Unknown (0x00)
            </button>
          </div>

          {/* Result Card Container */}
          <div className="bg-white border-2 border-brand-charcoal p-6 lg:p-8 shadow-[8px_8px_0px_#0B130E] relative overflow-hidden">
            <div className={`absolute top-0 bottom-0 left-0 w-3 ${
              activeState === 'approved' ? 'bg-brand-forest' : activeState === 'blocked' ? 'bg-brand-orange' : 'bg-stone-400'
            }`}></div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pl-2">
              <div className="lg:col-span-7 space-y-6">
                <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
                  <span className={`px-3 py-1 uppercase tracking-widest font-bold border border-brand-charcoal shadow-[2px_2px_0px_#0B130E] ${
                    activeState === 'approved'
                      ? 'bg-brand-forest text-white'
                      : activeState === 'blocked'
                      ? 'bg-brand-orange text-white'
                      : 'bg-stone-800 text-white'
                  }`}>
                    {activeState === 'approved' && 'APPROVED RELEASE — 0x01'}
                    {activeState === 'blocked' && 'BLOCKED RELEASE — 0x03'}
                    {activeState === 'unknown' && 'UNSEALED / UNKNOWN — 0x00'}
                  </span>
                  <span className="bg-brand-pastelYellow text-brand-charcoal px-2.5 py-1 uppercase font-bold border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                    {activeState === 'approved' ? 'CRYPTOGRAPHIC SEAL VERIFIED' : activeState === 'blocked' ? 'CONSENSUS REJECTION' : 'NO RECORD FOUND'}
                  </span>
                  <span className="text-stone-500 font-bold">BLOCK #61997-402</span>
                </div>

                <div>
                  <h3 className="font-sans font-black text-2xl text-brand-charcoal uppercase tracking-tight">
                    {activeState === 'approved' && 'Candidate SHA matches active frozen baseline v1.4.2.'}
                    {activeState === 'blocked' && 'Candidate SHA rejected due to undeclared process spawning and network egress.'}
                    {activeState === 'unknown' && 'Candidate commit SHA is not registered or sealed in UpdateSeal contract.'}
                  </h3>
                  <p className={`font-sans text-sm font-bold mt-1 tracking-wide ${
                    activeState === 'approved' ? 'text-brand-forest' : activeState === 'blocked' ? 'text-brand-orange' : 'text-stone-600'
                  }`}>
                    {activeState === 'approved' && 'SAFE TO TREAT AS THE REGISTRY\'S APPROVED RELEASE.'}
                    {activeState === 'blocked' && 'DO NOT RUN: CONTAINS CRITICAL CAPABILITY VIOLATIONS.'}
                    {activeState === 'unknown' && 'EXECUTION UNVERIFIED. RUN AT YOUR OWN RISK.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-stone-50 border-2 border-brand-charcoal p-4 shadow-[3px_3px_0px_#0B130E]">
                  <div>
                    <span className="block font-mono text-[11px] uppercase text-stone-500 font-bold">Validator Consensus</span>
                    <span className="font-sans font-bold text-sm text-brand-charcoal flex items-center gap-1 mt-1">
                      {activeState === 'approved' && <CheckCircle2 className="w-4 h-4 text-brand-forest" />}
                      {activeState === 'blocked' && <ShieldAlert className="w-4 h-4 text-brand-orange" />}
                      {activeState === 'unknown' && <AlertCircle className="w-4 h-4 text-stone-500" />}
                      {activeState === 'approved' ? '5/5 Concurred' : activeState === 'blocked' ? '5/5 Rejected' : '0/5 No Vote'}
                    </span>
                  </div>
                  <div>
                    <span className="block font-mono text-[11px] uppercase text-stone-500 font-bold">Charter Match</span>
                    <span className="font-sans font-bold text-sm text-brand-charcoal flex items-center gap-1 mt-1">
                      {activeState === 'approved' ? '100% In-Bounds' : activeState === 'blocked' ? '2 Breaches' : 'No Charter'}
                    </span>
                  </div>
                  <div>
                    <span className="block font-mono text-[11px] uppercase text-stone-500 font-bold">Execution Permitted</span>
                    <span className={`font-sans font-bold text-sm flex items-center gap-1 mt-1 ${
                      activeState === 'approved' ? 'text-emerald-700' : 'text-red-700'
                    }`}>
                      {activeState === 'approved' ? 'PERMITTED' : 'DENIED'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2 font-mono text-xs">
                  {activeState === 'approved' && (
                    <Link
                      to="/decisions/approved"
                      className="px-5 py-2.5 bg-brand-forest hover:bg-brand-charcoal text-white uppercase font-bold tracking-wider flex items-center gap-2 border border-brand-charcoal shadow-[3px_3px_0px_#0B130E]"
                    >
                      <span>View Full 0x01 Audit Report →</span>
                    </Link>
                  )}
                  {activeState === 'blocked' && (
                    <Link
                      to="/decisions/capability-violation"
                      className="px-5 py-2.5 bg-brand-orange hover:bg-brand-charcoal text-white uppercase font-bold tracking-wider flex items-center gap-2 border border-brand-charcoal shadow-[3px_3px_0px_#0B130E]"
                    >
                      <span>Inspect 0x03 Violation Dossier →</span>
                    </Link>
                  )}
                  {activeState === 'unknown' && (
                    <Link
                      to="/register/identity"
                      className="px-5 py-2.5 bg-brand-forest text-white uppercase font-bold tracking-wider flex items-center gap-2 border border-brand-charcoal shadow-[3px_3px_0px_#0B130E]"
                    >
                      <span>Register This Package Now →</span>
                    </Link>
                  )}
                  <Link
                    to="/packages/atlas-research-agent"
                    className="font-bold tracking-wider text-brand-orange underline hover:text-brand-charcoal"
                  >
                    View Package Registry Listing →
                  </Link>
                </div>
              </div>

              {/* Right column: Raw Machine-Readable JSON Output */}
              <div className="lg:col-span-5 bg-brand-forest text-stone-200 p-5 border-2 border-brand-charcoal shadow-[6px_6px_0px_#0B130E] relative">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-700 bg-stone-900/60 -mx-5 -mt-5 p-3 px-5">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-brand-pastelYellow font-bold uppercase tracking-wider">
                    <Terminal className="w-3.5 h-3.5 text-brand-orange" />
                    <span>MACHINE_READABLE_ORACLE_PAYLOAD</span>
                  </div>
                  <CopyButton text={getJsonPayload()} label="Copy JSON" />
                </div>

                <pre className="font-mono text-xs overflow-x-auto p-3 bg-stone-950/70 text-emerald-400 leading-relaxed border border-stone-800">
                  <code>{getJsonPayload()}</code>
                </pre>

                <div className="mt-3 pt-2 flex items-center justify-between font-mono text-[11px] text-stone-400">
                  <span>ECDSA ATTESTATION: 0x9bf4...e81c</span>
                  <span className="text-brand-pastelYellow font-bold">VERIFIED REALTIME</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
