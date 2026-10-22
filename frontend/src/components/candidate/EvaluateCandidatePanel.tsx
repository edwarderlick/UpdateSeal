import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CopyButton } from '../ui/CopyButton';
import { useEvaluateCandidate } from '../../features/candidate-release/useEvaluateCandidate';
import { liveCandidateDecisionPath } from '../../lib/registrationValidation';
import { isCompletedVerdictStatus } from '../../lib/decisionReport';
import { getUpdateSealConfigResult, isLiveReadsEnabled } from '../../lib/updateSealConfig';
import type { OnChainCandidateRecord, OnChainPackageRecord } from '../../types/updateSeal';

export const EvaluateCandidatePanel: React.FC<{
  candidate: OnChainCandidateRecord;
  packageRecord: OnChainPackageRecord;
}> = ({ candidate, packageRecord }) => {
  const configResult = getUpdateSealConfigResult();
  const liveEnabled = isLiveReadsEnabled(configResult);
  const evaluation = useEvaluateCandidate({ candidate, packageRecord });
  const [feeDetailsOpen, setFeeDetailsOpen] = useState(false);
  const decisionPath = liveCandidateDecisionPath(
    packageRecord.publisher,
    packageRecord.package_slug,
    candidate.version,
  );

  if (!configResult.ok) {
    return (
      <div className="bg-white border-2 border-brand-charcoal p-6 space-y-2" role="alert" data-testid="evaluate-config-error">
        <h2 className="text-xl font-black uppercase">Configuration Error</h2>
        <p className="text-xs font-mono">{configResult.error.userMessage}</p>
      </div>
    );
  }

  if (!liveEnabled) {
    return null;
  }

  if (isCompletedVerdictStatus(candidate.status) || evaluation.completed || evaluation.view.phase === 'finalized') {
    const status = evaluation.view.resultStatus ?? candidate.status;
    return (
      <section className="bg-white border-2 border-brand-charcoal p-6 space-y-3 shadow-[4px_4px_0px_#0B130E]" data-testid="evaluation-complete">
        <h2 className="text-xl font-black uppercase">Evaluation complete</h2>
        <p className="text-sm">Status: {status}</p>
        <Link
          to={decisionPath}
          data-testid="view-decision-report"
          className="inline-flex w-fit bg-brand-orange text-white px-5 py-3 text-xs font-bold uppercase border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-charcoal"
        >
          View Decision Report
        </Link>
      </section>
    );
  }

  if (candidate.status !== 'PENDING') {
    return (
      <div className="bg-white border-2 border-brand-charcoal p-6" role="alert" data-testid="evaluate-unsupported">
        <h2 className="text-xl font-black uppercase">On-chain data integrity error</h2>
        <p className="text-sm">This candidate cannot be evaluated from the frontend.</p>
      </div>
    );
  }

  const { view, wallet, isWrongNetwork } = evaluation;
  const unresolved = Boolean(view.pendingSnapshot);
  const requestDisabled =
    unresolved ||
    !wallet.isConnected ||
    isWrongNetwork ||
    view.phase === 'estimating_fees' ||
    view.phase === 'awaiting_wallet' ||
    view.phase === 'submitted' ||
    view.phase === 'waiting_consensus' ||
    !view.confirmation ||
    !view.estimate ||
    view.estimate.feeValue <= 0n;

  return (
    <section className="bg-white border-2 border-brand-charcoal p-6 lg:p-8 space-y-4 shadow-[6px_6px_0px_#0B130E]" data-testid="evaluate-candidate-panel">
      <h2 className="text-2xl font-black uppercase">Request evaluation</h2>
      <p className="text-sm max-w-3xl">
        Any connected wallet may request evaluation. The transaction pays the GenLayer evaluation fee but does not
        transfer package ownership.
      </p>
      <p className="text-sm max-w-3xl">
        The connected wallet is paying to request evaluation and is not becoming the package owner.
      </p>
      <p className="text-xs font-mono max-w-3xl">
        GenLayer evaluation may use validators, web evidence retrieval, and model execution. Final processing can take
        longer than a normal transaction. Studio-dev is a preview network and may reset.
      </p>
      <p className="text-xs text-stone-600 max-w-3xl">
        Frontend checks reduce accidental duplicate requests, but cannot eliminate races from another wallet or browser.
        Only contract-level guards can fully prevent concurrent duplicate evaluation.
      </p>

      <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
        <div>
          <dt className="font-bold uppercase">Connected caller</dt>
          <dd className="break-all">{wallet.address ?? '(disconnected)'}</dd>
        </div>
        <div>
          <dt className="font-bold uppercase">Candidate ID</dt>
          <dd className="break-all">{candidate.candidate_id}</dd>
        </div>
        <div>
          <dt className="font-bold uppercase">Package UID</dt>
          <dd className="break-all">{candidate.package_uid}</dd>
        </div>
        <div>
          <dt className="font-bold uppercase">Version</dt>
          <dd className="break-all">{candidate.version}</dd>
        </div>
        <div>
          <dt className="font-bold uppercase">Candidate commit SHA</dt>
          <dd className="break-all">{candidate.candidate_commit_sha}</dd>
        </div>
        <div>
          <dt className="font-bold uppercase">Evidence URI</dt>
          <dd className="break-all">{candidate.evidence_uri}</dd>
        </div>
        <div>
          <dt className="font-bold uppercase">Evidence hash</dt>
          <dd className="break-all">{candidate.evidence_hash}</dd>
        </div>
        <div>
          <dt className="font-bold uppercase">Current status</dt>
          <dd>{candidate.status}</dd>
        </div>
        <div>
          <dt className="font-bold uppercase">Evaluation attempts</dt>
          <dd>{candidate.evaluation_attempts}</dd>
        </div>
      </dl>

      {isWrongNetwork ? (
        <div className="bg-brand-pastelYellow border-2 border-brand-charcoal p-4 space-y-2" data-testid="evaluate-wrong-network" role="alert">
          <h3 className="font-black uppercase">Wrong network</h3>
          <p className="text-sm">Switch to Studio-dev (chain 61997). No network-switch transaction is sent automatically.</p>
          <button
            type="button"
            onClick={evaluation.openNetworkModal}
            className="px-4 py-2 bg-brand-orange text-white text-xs font-bold uppercase border-2 border-brand-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-charcoal"
          >
            Switch to Studio-dev
          </button>
        </div>
      ) : null}

      {!wallet.isConnected && !isWrongNetwork ? (
        <button
          type="button"
          onClick={evaluation.connectToEvaluate}
          data-testid="connect-to-evaluate"
          className="px-5 py-3 bg-brand-charcoal text-brand-pastelYellow text-xs font-bold uppercase border-2 border-brand-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
        >
          Connect Wallet to Request Evaluation
        </button>
      ) : null}

      {wallet.isConnected && !isWrongNetwork && !unresolved ? (
        <div className="space-y-3">
          {view.estimate ? (
            <div className="space-y-2" data-testid="evaluation-fee">
              <p className="font-mono text-sm font-bold">Estimated fee: {view.estimate.feeLabel}</p>
              <button
                type="button"
                className="font-mono text-xs underline"
                onClick={() => setFeeDetailsOpen((open) => !open)}
                aria-expanded={feeDetailsOpen}
              >
                {feeDetailsOpen ? 'Hide' : 'Show'} technical fee details
              </button>
              {feeDetailsOpen ? (
                <pre className="whitespace-pre-wrap break-all font-mono text-[10px] bg-brand-cream border border-brand-charcoal p-3">
                  {`wei: ${view.estimate.feeValue.toString()}\n${JSON.stringify(
                    {
                      distribution: view.estimate.distribution,
                      messageAllocations: view.estimate.messageAllocations,
                    },
                    (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
                    2,
                  )}`}
                </pre>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                void evaluation.estimate();
              }}
              disabled={view.phase === 'estimating_fees'}
              data-testid="estimate-evaluation-fee"
              className="px-5 py-3 bg-white text-brand-charcoal text-xs font-bold uppercase border-2 border-brand-charcoal disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
            >
              {view.phase === 'estimating_fees' ? 'Estimating fee' : 'Estimate evaluation fee'}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              void evaluation.submit();
            }}
            disabled={requestDisabled}
            data-testid="request-evaluation"
            className="px-5 py-3 bg-brand-orange text-white text-xs font-bold uppercase border-2 border-brand-charcoal disabled:opacity-50 shadow-[4px_4px_0px_#0B130E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-charcoal"
          >
            Request Evaluation
          </button>
        </div>
      ) : null}

      {view.message ? (
        <p className="text-sm" role="status" data-testid="evaluate-message">
          {view.message}
        </p>
      ) : null}

      {view.transactionHash ? (
        <p className="font-mono text-xs break-all" data-testid="evaluation-tx-hash">
          Transaction hash: {view.transactionHash}{' '}
          <CopyButton text={view.transactionHash} label="Copy transaction hash" />
          <span className="block text-stone-600 mt-1">
            Keep this hash. Status unknown does not mean the transaction failed.
          </span>
        </p>
      ) : null}

      {view.pendingSnapshot ? (
        <div className="space-y-2" data-testid="evaluation-pending-snapshot">
          <p className="text-xs">
            Local client time (not on-chain): {view.pendingSnapshot.submittedAtLocal}
          </p>
          <button
            type="button"
            onClick={() => {
              void evaluation.checkStatus();
            }}
            data-testid="check-existing-transaction"
            className="px-5 py-3 bg-brand-forest text-white text-xs font-bold uppercase border-2 border-brand-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-charcoal"
          >
            Check Existing Transaction
          </button>
          {view.phase === 'transaction_rejected' || view.phase === 'finalized' ? (
            <button
              type="button"
              onClick={evaluation.clearTerminalSnapshot}
              className="block text-xs font-mono underline"
            >
              Clear local transaction record
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};
