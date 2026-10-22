import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Plus, X, Shield, Lock, Code2, AlertTriangle, Check } from 'lucide-react';
import { useRegistration } from '../features/registration/RegistrationContext';
import { RegisterStepper } from '../components/forms/RegisterStepper';
import { CopyButton } from '../components/ui/CopyButton';
import { CapabilityPolicy } from '../types';

export const RegisterStep3Page: React.FC = () => {
  const navigate = useNavigate();
  const {
    formData,
    updateCapabilityPolicy,
    addNetworkDomain,
    removeNetworkDomain,
    addJailedPath,
    removeJailedPath,
    setSpendingLimit,
  } = useRegistration();

  const [newDomain, setNewDomain] = useState('');
  const [showDomainInput, setShowDomainInput] = useState(false);

  const [newPath, setNewPath] = useState('');
  const [showPathInput, setShowPathInput] = useState(false);

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDomain.trim()) {
      addNetworkDomain(newDomain.trim());
      setNewDomain('');
      setShowDomainInput(false);
    }
  };

  const handleAddPath = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPath.trim()) {
      addJailedPath(newPath.trim());
      setNewPath('');
      setShowPathInput(false);
    }
  };

  const charter = formData.capabilityCharter;

  const liveCharterJson = {
    charter_version: '1.4.0',
    contract_id: 'Contract integration pending',
    package_id: formData.packageId || 'updateseal',
    baseline_commit: formData.baselineCommitSha || '4f89a29e81bfa0021c',
    rules: {
      network_egress: {
        policy: charter.network_egress.policy,
        allowed_domains: charter.network_egress.allowedDomains || [],
        allow_raw_ips: charter.network_egress.allowRawIps || false,
      },
      file_system: {
        policy: charter.file_system.policy,
        jailed_paths: charter.file_system.jailedPaths || [],
        prohibited_targets: charter.file_system.prohibitedTargets || [],
      },
      process_execution: {
        policy: charter.process_execution.policy,
        allow_child_processes: charter.process_execution.allowChildProcesses || false,
      },
      cryptographic_signing: {
        policy: charter.cryptographic_signing.policy,
        airgapped: charter.cryptographic_signing.airgapped || true,
      },
      spending_limits: {
        policy: charter.spending_limits.policy,
        max_gen_per_24h: charter.spending_limits.maxGenPer24h || 10,
      },
      external_data_export: {
        policy: charter.external_data_export.policy,
        encryption_required: charter.external_data_export.encryptionRequired || true,
        restricted_orchestrator_only: charter.external_data_export.restrictedOrchestratorOnly || true,
      },
    },
  };

  const jsonString = JSON.stringify(liveCharterJson, null, 2);

  return (
    <div className="w-full flex flex-col animate-in fade-in duration-150">
      <RegisterStepper currentStep={3} />

      {/* Editorial Title Banner */}
      <section className="w-full bg-brand-cream border-b-2 border-brand-charcoal py-8 px-6 lg:px-16">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
          <div className="max-w-3xl flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-brand-forest text-brand-pastelYellow font-mono text-[10px] font-bold px-2 py-1 uppercase border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                STAGE 03 / FORMAL VERIFICATION POLICY
              </span>
              <span className="bg-brand-pastelYellow text-brand-charcoal font-mono text-[10px] font-bold px-2 py-1 uppercase border border-brand-charcoal shadow-[2px_2px_0px_#0B130E] -rotate-1">
                ZERO DRIFT TOLERATED
              </span>
              <span className="bg-white text-brand-charcoal font-mono text-[10px] font-bold px-2 py-1 uppercase border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                SPEC v1.4 INT-CON
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tight leading-none text-brand-charcoal font-sans">
              DEFINE THE BOUNDARIES.<br />
              <span className="text-brand-orange">FREEZE WHAT IT CAN DO.</span>
            </h1>
            <p className="text-sm text-stone-700 max-w-2xl leading-relaxed font-medium">
              GenLayer validators compare all future releases against these exact rules. Nothing may be silently escalated across network, shell, disk, or cryptographic signing boundaries without deterministic protocol-level rejection.
            </p>
          </div>

          <div className="bg-brand-forest text-white border-2 border-brand-charcoal p-4 flex flex-col gap-2 w-full lg:w-80 shadow-[4px_4px_0px_#0B130E] font-mono">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-brand-pastelYellow uppercase">TARGET SUITE</span>
              <span className="text-stone-300">6 BOUNDARIES</span>
            </div>
            <span className="font-black text-xl text-white tracking-tight">CHARTER-ACTIVE-V1</span>
            <div className="bg-brand-charcoal text-brand-pastelYellow p-2 text-xs border border-stone-700 truncate">
              CANONICAL ID: 0x98bb...c1204
            </div>
            <span className="text-[11px] text-stone-300">Immutable baseline enforcement live.</span>
          </div>
        </div>
      </section>

      {/* Main Charter Matrix Workspace */}
      <section className="w-full bg-[#EBE7DE] py-10 px-6 lg:px-16 flex-grow">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Interactive 6-Category Matrix Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Category 01: Network Access */}
            <div className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] flex flex-col gap-4">
              <div className="flex items-start justify-between border-b-2 border-brand-charcoal pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-xs text-white bg-brand-charcoal px-2 py-1">01</span>
                  <h2 className="text-lg font-black uppercase tracking-tight text-brand-charcoal font-sans">
                    Network Access
                  </h2>
                </div>
                <span className="bg-brand-pastelYellow text-brand-charcoal font-mono text-[10px] font-black px-2 py-1 uppercase border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                  Egress Monitored
                </span>
              </div>

              {/* Policy Radios */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-xs font-bold">
                {(['PROHIBITED', 'ALLOWED_WITH_LIMITS', 'UNRESTRICTED'] as CapabilityPolicy[]).map((policy) => (
                  <label
                    key={policy}
                    className={`border-2 border-brand-charcoal p-2.5 flex items-center gap-2 cursor-pointer transition-colors shadow-[2px_2px_0px_#0B130E] ${
                      charter.network_egress.policy === policy
                        ? 'bg-brand-forest text-brand-pastelYellow'
                        : 'bg-brand-cream text-brand-charcoal hover:bg-stone-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cat-network"
                      checked={charter.network_egress.policy === policy}
                      onChange={() => updateCapabilityPolicy('network_egress', policy)}
                      className="text-brand-orange focus:ring-0"
                    />
                    <span>
                      {policy === 'ALLOWED_WITH_LIMITS'
                        ? 'Allowed With Limits'
                        : policy === 'PROHIBITED'
                        ? 'Prohibited'
                        : 'Unrestricted (Flagged)'}
                    </span>
                  </label>
                ))}
              </div>

              {/* Whitelist Domain Tags */}
              <div className="flex flex-col gap-2 pt-2">
                <span className="font-mono text-xs font-bold text-stone-600 uppercase tracking-wider">
                  Egress Whitelist (Fully Qualified Hosts)
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {(charter.network_egress.allowedDomains || []).map((dom) => (
                    <span
                      key={dom}
                      className="bg-brand-cream border border-brand-charcoal font-mono text-xs font-bold px-2.5 py-1 text-brand-charcoal flex items-center gap-2 shadow-[2px_2px_0px_#0B130E]"
                    >
                      {dom}
                      <button
                        type="button"
                        onClick={() => removeNetworkDomain(dom)}
                        className="text-stone-500 hover:text-brand-orange font-bold text-sm cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  {showDomainInput ? (
                    <form onSubmit={handleAddDomain} className="flex items-center gap-1">
                      <input
                        type="text"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        placeholder="api.example.com"
                        className="p-1 border border-brand-charcoal font-mono text-xs bg-white text-brand-charcoal"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="bg-brand-orange text-white px-2 py-1 font-mono text-xs font-bold border border-brand-charcoal"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDomainInput(false)}
                        className="px-2 py-1 font-mono text-xs"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowDomainInput(true)}
                      className="bg-brand-pastelYellow border border-brand-charcoal hover:bg-yellow-300 font-mono text-xs font-black px-2.5 py-1 flex items-center gap-1.5 shadow-[2px_2px_0px_#0B130E] transition-colors text-brand-charcoal cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Domain
                    </button>
                  )}
                </div>
              </div>

              {/* Boundary Rule Callout */}
              <div className="bg-brand-cream border-2 border-brand-charcoal p-3 flex items-start gap-3 shadow-[2px_2px_0px_#0B130E]">
                <Shield className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
                <div className="flex flex-col text-xs">
                  <span className="font-mono font-bold uppercase text-brand-charcoal">Active Boundary Rule</span>
                  <span className="text-stone-700 font-medium leading-relaxed font-sans">
                    HTTP/HTTPS only. No direct socket connections to raw IPs. All non-listed outbound packets trigger an automatic CAPABILITY_VIOLATION event on Chain 61997.
                  </span>
                </div>
              </div>
            </div>

            {/* Category 02: File & Data Access */}
            <div className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] flex flex-col gap-4">
              <div className="flex items-start justify-between border-b-2 border-brand-charcoal pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-xs text-white bg-brand-charcoal px-2 py-1">02</span>
                  <h2 className="text-lg font-black uppercase tracking-tight text-brand-charcoal font-sans">
                    File &amp; Data Access
                  </h2>
                </div>
                <span className="bg-brand-vibrantCyan text-brand-charcoal font-mono text-[10px] font-black px-2 py-1 uppercase border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                  Jail Path Enforced
                </span>
              </div>

              {/* Policy Radios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-xs font-bold">
                {(['PROHIBITED', 'ALLOWED_WITH_LIMITS'] as CapabilityPolicy[]).map((policy) => (
                  <label
                    key={policy}
                    className={`border-2 border-brand-charcoal p-2.5 flex items-center gap-2 cursor-pointer transition-colors shadow-[2px_2px_0px_#0B130E] ${
                      charter.file_system.policy === policy
                        ? 'bg-brand-forest text-brand-pastelYellow'
                        : 'bg-brand-cream text-brand-charcoal hover:bg-stone-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cat-files"
                      checked={charter.file_system.policy === policy}
                      onChange={() => updateCapabilityPolicy('file_system', policy)}
                      className="text-brand-orange focus:ring-0"
                    />
                    <span>{policy === 'ALLOWED_WITH_LIMITS' ? 'Allowed With Limits' : 'Prohibited'}</span>
                  </label>
                ))}
              </div>

              {/* Paths Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-brand-cream border-2 border-brand-charcoal p-3 flex flex-col gap-2 shadow-[2px_2px_0px_#0B130E]">
                  <span className="font-mono text-xs uppercase font-bold text-brand-charcoal">
                    Jailed Directory Paths (Read/Write)
                  </span>
                  <div className="flex flex-col gap-1.5 font-mono text-xs">
                    {(charter.file_system.jailedPaths || []).map((path) => (
                      <span
                        key={path}
                        className="bg-white border border-brand-charcoal px-2 py-1 text-brand-charcoal flex items-center justify-between"
                      >
                        <span>{path}</span>
                        <button
                          type="button"
                          onClick={() => removeJailedPath(path)}
                          className="text-stone-400 hover:text-brand-orange cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  {showPathInput ? (
                    <form onSubmit={handleAddPath} className="flex items-center gap-1 mt-1">
                      <input
                        type="text"
                        value={newPath}
                        onChange={(e) => setNewPath(e.target.value)}
                        placeholder="./data/*"
                        className="p-1 border border-brand-charcoal font-mono text-xs bg-white text-brand-charcoal w-full"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="bg-brand-orange text-white px-2 py-1 font-mono text-xs font-bold border border-brand-charcoal shrink-0"
                      >
                        Add
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowPathInput(true)}
                      className="text-[11px] font-mono text-brand-orange hover:underline font-bold text-left pt-1 cursor-pointer"
                    >
                      + Add Jailed Path
                    </button>
                  )}
                </div>

                <div className="bg-[#FFAAA5] border-2 border-brand-charcoal p-3 flex flex-col gap-2 text-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                  <span className="font-mono text-xs uppercase font-black text-brand-charcoal">
                    Prohibited System Targets
                  </span>
                  <div className="flex flex-col gap-1.5 font-mono text-xs font-bold">
                    {(charter.file_system.prohibitedTargets || []).map((target) => (
                      <span key={target} className="bg-white border border-brand-charcoal px-2 py-1 text-brand-charcoal">
                        {target}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Category 03: Shell & Process Execution */}
            <div className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] flex flex-col gap-4">
              <div className="flex items-start justify-between border-b-2 border-brand-charcoal pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-xs text-white bg-brand-charcoal px-2 py-1">03</span>
                  <h2 className="text-lg font-black uppercase tracking-tight text-brand-charcoal font-sans">
                    Shell &amp; Process Execution
                  </h2>
                </div>
                <span className="bg-error text-white font-mono text-[10px] font-black px-2 py-1 uppercase border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                  Zero Tolerance
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-xs font-bold">
                {(['PROHIBITED', 'ALLOWED_WITH_LIMITS'] as CapabilityPolicy[]).map((policy) => (
                  <label
                    key={policy}
                    className={`border-2 border-brand-charcoal p-2.5 flex items-center gap-2 cursor-pointer transition-colors shadow-[2px_2px_0px_#0B130E] ${
                      charter.process_execution.policy === policy
                        ? 'bg-brand-forest text-brand-pastelYellow'
                        : 'bg-brand-cream text-brand-charcoal hover:bg-stone-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cat-shell"
                      checked={charter.process_execution.policy === policy}
                      onChange={() => updateCapabilityPolicy('process_execution', policy)}
                      className="text-brand-orange focus:ring-0"
                    />
                    <span>{policy === 'PROHIBITED' ? 'Prohibited (Enforced)' : 'Allowed With Limits'}</span>
                  </label>
                ))}
              </div>

              <div className="bg-brand-cream border-2 border-brand-charcoal p-3 flex items-center gap-3 shadow-[2px_2px_0px_#0B130E]">
                <AlertTriangle className="w-5 h-5 text-error shrink-0" />
                <span className="text-xs text-brand-charcoal font-medium">
                  Strict prohibition. Any <code className="font-mono text-xs bg-white border border-brand-charcoal px-1 font-bold">child_process</code>, <code className="font-mono text-xs bg-white border border-brand-charcoal px-1 font-bold">exec()</code>, or <code className="font-mono text-xs bg-white border border-brand-charcoal px-1 font-bold">system()</code> call triggers instant REJECTION.
                </span>
              </div>
            </div>

            {/* Category 04: Wallet & Signing */}
            <div className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] flex flex-col gap-4">
              <div className="flex items-start justify-between border-b-2 border-brand-charcoal pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-xs text-white bg-brand-charcoal px-2 py-1">04</span>
                  <h2 className="text-lg font-black uppercase tracking-tight text-brand-charcoal font-sans">
                    Wallet &amp; Signing
                  </h2>
                </div>
                <span className="bg-brand-charcoal text-white font-mono text-[10px] font-black px-2 py-1 uppercase border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                  No Signer Injected
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-xs font-bold">
                {(['PROHIBITED', 'ALLOWED_WITH_LIMITS'] as CapabilityPolicy[]).map((policy) => (
                  <label
                    key={policy}
                    className={`border-2 border-brand-charcoal p-2.5 flex items-center gap-2 cursor-pointer transition-colors shadow-[2px_2px_0px_#0B130E] ${
                      charter.cryptographic_signing.policy === policy
                        ? 'bg-brand-forest text-brand-pastelYellow'
                        : 'bg-brand-cream text-brand-charcoal hover:bg-stone-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cat-signing"
                      checked={charter.cryptographic_signing.policy === policy}
                      onChange={() => updateCapabilityPolicy('cryptographic_signing', policy)}
                      className="text-brand-orange focus:ring-0"
                    />
                    <span>{policy === 'PROHIBITED' ? 'Prohibited (Airgapped)' : 'Allowed With Limits'}</span>
                  </label>
                ))}
              </div>

              <div className="bg-brand-cream border-2 border-brand-charcoal p-3 flex items-center gap-3 shadow-[2px_2px_0px_#0B130E]">
                <Lock className="w-5 h-5 text-brand-orange shrink-0" />
                <span className="text-xs text-stone-700 font-medium leading-relaxed font-sans">
                  Agent contains no private keys and cannot sign transactions autonomously. Signatures must pass through human-in-the-loop multi-sig hooks.
                </span>
              </div>
            </div>

            {/* Category 05: Payment & Spending */}
            <div className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] flex flex-col gap-4">
              <div className="flex items-start justify-between border-b-2 border-brand-charcoal pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-xs text-white bg-brand-charcoal px-2 py-1">05</span>
                  <h2 className="text-lg font-black uppercase tracking-tight text-brand-charcoal font-sans">
                    Payment &amp; Spending
                  </h2>
                </div>
                <span className="bg-brand-pastelYellow text-brand-charcoal font-mono text-[10px] font-black px-2 py-1 uppercase border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                  {charter.spending_limits.maxGenPer24h || 10} GEN / 24H CAP
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-xs font-bold">
                {(['PROHIBITED', 'ALLOWED_WITH_LIMITS'] as CapabilityPolicy[]).map((policy) => (
                  <label
                    key={policy}
                    className={`border-2 border-brand-charcoal p-2.5 flex items-center gap-2 cursor-pointer transition-colors shadow-[2px_2px_0px_#0B130E] ${
                      charter.spending_limits.policy === policy
                        ? 'bg-brand-forest text-brand-pastelYellow'
                        : 'bg-brand-cream text-brand-charcoal hover:bg-stone-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cat-spending"
                      checked={charter.spending_limits.policy === policy}
                      onChange={() => updateCapabilityPolicy('spending_limits', policy)}
                      className="text-brand-orange focus:ring-0"
                    />
                    <span>{policy === 'ALLOWED_WITH_LIMITS' ? 'Allowed With Limits' : 'Prohibited'}</span>
                  </label>
                ))}
              </div>

              <div className="bg-brand-cream border-2 border-brand-charcoal p-3 flex flex-col gap-2 shadow-[2px_2px_0px_#0B130E]">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-brand-charcoal uppercase font-bold">Max Gas / Epoch Allowance:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={1000}
                      value={charter.spending_limits.maxGenPer24h || 10}
                      onChange={(e) => setSpendingLimit(Number(e.target.value) || 0)}
                      className="w-16 p-1 border border-brand-charcoal font-mono text-xs font-bold text-brand-orange bg-white text-right"
                    />
                    <span className="text-brand-orange font-black">GEN / 24h</span>
                  </div>
                </div>
                <span className="text-[11px] text-stone-600 font-mono">
                  Epoch resets automatically at 00:00 UTC under GenLayer intelligent contract rules.
                </span>
              </div>
            </div>

            {/* Category 06: External Data Export */}
            <div className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] flex flex-col gap-4">
              <div className="flex items-start justify-between border-b-2 border-brand-charcoal pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-xs text-white bg-brand-charcoal px-2 py-1">06</span>
                  <h2 className="text-lg font-black uppercase tracking-tight text-brand-charcoal font-sans">
                    External Data Export
                  </h2>
                </div>
                <span className="bg-brand-vibrantCyan text-brand-charcoal font-mono text-[10px] font-black px-2 py-1 uppercase border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                  Encrypted Egress
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-xs font-bold">
                {(['PROHIBITED', 'ALLOWED_WITH_LIMITS'] as CapabilityPolicy[]).map((policy) => (
                  <label
                    key={policy}
                    className={`border-2 border-brand-charcoal p-2.5 flex items-center gap-2 cursor-pointer transition-colors shadow-[2px_2px_0px_#0B130E] ${
                      charter.external_data_export.policy === policy
                        ? 'bg-brand-forest text-brand-pastelYellow'
                        : 'bg-brand-cream text-brand-charcoal hover:bg-stone-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cat-export"
                      checked={charter.external_data_export.policy === policy}
                      onChange={() => updateCapabilityPolicy('external_data_export', policy)}
                      className="text-brand-orange focus:ring-0"
                    />
                    <span>{policy === 'ALLOWED_WITH_LIMITS' ? 'Allowed With Limits' : 'Prohibited'}</span>
                  </label>
                ))}
              </div>

              <div className="bg-brand-cream border-2 border-brand-charcoal p-3 flex flex-col gap-1.5 shadow-[2px_2px_0px_#0B130E]">
                <span className="font-mono text-xs text-brand-charcoal uppercase font-bold">Destination Policy:</span>
                <p className="text-xs text-stone-700 font-medium leading-relaxed font-sans">
                  Encrypted webhook payload to verified orchestrator endpoint only. Any plaintext transmission of context tokens or environmental keys triggers an immediate execution block.
                </p>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t-2 border-brand-charcoal font-mono">
              <button
                type="button"
                onClick={() => navigate('/register/baseline')}
                className="px-5 py-3 border border-brand-charcoal font-bold text-xs uppercase hover:bg-stone-100 cursor-pointer flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Baseline
              </button>

              <button
                type="button"
                onClick={() => navigate('/register/review')}
                className="px-7 py-3.5 bg-brand-orange text-white hover:bg-brand-charcoal font-bold text-xs uppercase tracking-wider transition-colors border border-brand-charcoal shadow-[4px_4px_0px_#0B130E] flex items-center gap-2 cursor-pointer"
              >
                <span>Continue to Step 4 (Review)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Live Charter Summary & JSON Preview Sidebar (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Live Audit Card */}
            <div className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] flex flex-col gap-4 font-mono">
              <div className="flex items-center justify-between border-b-2 border-brand-charcoal pb-3">
                <span className="text-xs font-black text-brand-charcoal uppercase tracking-wider">
                  CHARTER AUDIT STATE
                </span>
                <span className="bg-brand-pastelYellow text-brand-charcoal text-[10px] font-black px-2 py-0.5 uppercase border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                  VALIDATED FOR GENLAYER
                </span>
              </div>

              {/* Graphic Representation Metric */}
              <div className="bg-brand-cream border-2 border-brand-charcoal p-4 grid grid-cols-2 gap-4 shadow-[2px_2px_0px_#0B130E]">
                <div className="flex flex-col border-r border-brand-charcoal pr-3">
                  <span className="text-[10px] font-bold text-stone-500 uppercase">SURFACE RATIO</span>
                  <span className="text-3xl font-black text-brand-charcoal tracking-tight font-sans">14.2%</span>
                  <span className="text-[11px] text-stone-600">Attack Vector Exposure</span>
                </div>
                <div className="flex flex-col pl-1">
                  <span className="text-[10px] font-bold text-stone-500 uppercase">VERDICT PREDICTION</span>
                  <span className="text-3xl font-black text-brand-orange tracking-tight font-sans">0x01</span>
                  <span className="text-[11px] text-stone-600">Auto-Approve Eligible</span>
                </div>
              </div>

              {/* Prominent Badge Gauge */}
              <div className="bg-brand-forest border-2 border-brand-charcoal p-4 flex items-center justify-between gap-4 text-white shadow-[2px_2px_0px_#0B130E]">
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase text-brand-pastelYellow">
                    RESTRICTION CONSTRAINTS
                  </span>
                  <span className="text-xs text-stone-300 mt-0.5">4 of 6 categories strictly sealed or sandboxed</span>
                </div>
                <div className="w-16 h-16 border-2 border-brand-charcoal bg-brand-pastelYellow text-brand-charcoal font-black text-lg flex items-center justify-center font-sans shadow-[2px_2px_0px_#0B130E] shrink-0">
                  82%
                </div>
              </div>
            </div>

            {/* Live Formatted JSON Preview */}
            <div className="bg-brand-forest border-2 border-brand-charcoal text-white p-5 shadow-[4px_4px_0px_#0B130E] flex flex-col gap-3 sticky top-24 font-mono">
              <div className="flex items-center justify-between border-b border-stone-700 pb-3">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-brand-pastelYellow" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    CHARTER SCHEMA (v1.4)
                  </span>
                </div>
                <CopyButton text={jsonString} label="Copy JSON" className="bg-brand-pastelYellow text-brand-charcoal hover:bg-yellow-300" />
              </div>

              <div className="bg-brand-charcoal text-brand-pastelYellow p-3 text-xs border border-stone-800 overflow-x-auto max-h-[380px] leading-relaxed select-all">
                <pre>{jsonString}</pre>
              </div>

              <div className="flex items-center justify-between text-stone-300 text-[11px] pt-1">
                <span>HASH: sha256:7f14b09e...</span>
                <span className="text-emerald-400 font-bold">GENLAYER READY</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
