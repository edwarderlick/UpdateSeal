import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../../features/wallet/useWallet';

export const AppFooter: React.FC = () => {
  const { openNetworkModal } = useWallet();

  return (
    <footer
      className="bg-brand-charcoal text-stone-300 border-t-2 border-brand-charcoal pt-16 pb-12 px-6 lg:px-16 mt-auto"
      data-purpose="editorial-footer"
    >
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-16 border-b border-stone-800">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-brand-orange text-white flex items-center justify-center font-bold text-lg border border-brand-charcoal shadow-[2px_2px_0px_#EF5313]">
                ✦
              </div>
              <span className="font-black text-2xl uppercase tracking-tighter text-white font-sans">
                Update<span className="text-brand-orange">Seal</span>
              </span>
            </div>
            <p className="text-xs text-stone-400 max-w-sm leading-relaxed mb-6 font-normal">
              The on-chain release approval registry for autonomous AI agents, plugins, and self-updating software. GenLayer Studio Next intelligent contracts record consensus-backed verdicts that downstream systems may consume.
            </p>
            <div className="text-[11px] font-mono text-stone-500">
              Chain ID 61997 • Consensus Engine: LLM Evaluator Multi-Validator
            </div>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-brand-pastelYellow mb-4 font-mono">
              Registry
            </h5>
            <ul className="text-xs space-y-2.5 font-medium">
              <li>
                <Link to="/registry" className="hover:text-white transition-colors">
                  Directory Listing
                </Link>
              </li>
              <li>
                <Link to="/register/identity" className="hover:text-white transition-colors">
                  Register Agent Charter
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-white transition-colors">
                  Decision Reports
                </Link>
              </li>
              <li>
                <Link to="/verify" className="hover:text-white transition-colors">
                  Verify Release RPC
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-brand-pastelYellow mb-4 font-mono">
              Specifications
            </h5>
            <ul className="text-xs space-y-2.5 font-medium">
              <li>
                <Link to="/how-it-works" className="hover:text-white transition-colors">
                  Charter v1.4 Standard
                </Link>
              </li>
              <li>
                <Link to="/how-it-works#verdicts" className="hover:text-white transition-colors">
                  4 Canonical Verdicts
                </Link>
              </li>
              <li>
                <Link
                  to="/packages/0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal"
                  className="hover:text-white transition-colors"
                >
                  Official Package Record
                </Link>
              </li>
              <li>
                <Link to="/packages/atlas-research-agent" className="hover:text-white transition-colors">
                  Design preview screens (not live)
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-brand-pastelYellow mb-4 font-mono">
              Network Node
            </h5>
            <div className="bg-stone-900 p-3 border border-stone-800 text-[11px] font-mono space-y-1">
              <div className="text-emerald-400 font-bold">GENLAYER STUDIO NEXT</div>
              <div className="text-stone-400">Chain: 61997</div>
              <div className="text-stone-400 truncate">Contract: 0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3</div>
              <button
                type="button"
                className="text-brand-orange hover:underline pt-1 block cursor-pointer font-bold"
                onClick={openNetworkModal}
              >
                Switch RPC Network →
              </button>
            </div>
          </div>
        </div>

        {/* Massive Editorial Display Watermark */}
        <div className="pt-10 flex flex-col md:flex-row items-center justify-between text-xs font-mono text-stone-500">
          <div>© 2025 UpdateSeal Protocol. Open-source governance for autonomous systems.</div>
          <div className="mt-4 md:mt-0 flex gap-6">
            <Link to="/how-it-works" className="hover:text-stone-300">
              Terms of Governance
            </Link>
            <Link to="/how-it-works" className="hover:text-stone-300">
              Protocol Specs
            </Link>
            <button
              type="button"
              onClick={openNetworkModal}
              className="hover:text-stone-300 cursor-pointer text-left"
            >
              GenLayer Studio Next RPC Docs
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
