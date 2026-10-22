import React, { createContext, useContext, useState } from 'react';
import { TransactionLifecycle } from '../../types';

export interface TransactionIntent {
  intent: 'REGISTER_PACKAGE_BASELINE' | 'SEAL_CANDIDATE_RELEASE' | string;
  packageId: string;
  packageName: string;
  version: string;
  commitSha: string;
  charterMerkleRoot: string;
  title?: string;
  description?: string;
  onSuccess?: () => void;
}

interface TransactionContextType {
  lifecycle: TransactionLifecycle;
  txState: TransactionLifecycle;
  currentIntent: TransactionIntent | null;
  isOpen: boolean;
  startTransaction: (intentOrTitle: TransactionIntent | string, description?: string, onSuccess?: () => void) => void;
  confirmSign: () => void;
  simulateError: () => void;
  simulateReject: () => void;
  closeModal: () => void;
  reset: () => void;
}

const initialLifecycle: TransactionLifecycle = {
  status: 'IDLE',
  step: 1,
  stageLabel: '1. Inscription Built',
};

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lifecycle, setLifecycle] = useState<TransactionLifecycle>(initialLifecycle);
  const [currentIntent, setCurrentIntent] = useState<TransactionIntent | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const startTransaction = (intentOrTitle: TransactionIntent | string, description?: string, onSuccess?: () => void) => {
    if (typeof intentOrTitle === 'string') {
      setCurrentIntent({
        intent: 'CUSTOM',
        packageId: 'atlas-protocol/research-agent',
        packageName: intentOrTitle,
        version: 'v1.5.0',
        commitSha: 'd9b2e04f9812cc994017bca882e558a120092bf',
        charterMerkleRoot: '0x78ab4991c0e9f2b848558a120092bfda194c721',
        title: intentOrTitle,
        description,
        onSuccess,
      });
    } else {
      setCurrentIntent(intentOrTitle);
    }

    setLifecycle({
      status: 'AWAITING_SIGNATURE',
      step: 3,
      stageLabel: '3. Awaiting Signature (Demo Mode)',
    });
    setIsOpen(true);
  };

  const confirmSign = () => {
    setLifecycle({
      status: 'SUBMITTED',
      step: 4,
      stageLabel: '4. Contract integration pending (Broadcasting simulation)...',
      txHash: 'demo-tx-0x9c4f' + Math.random().toString(16).substring(2, 8),
    });

    setTimeout(() => {
      setLifecycle((prev) => ({
        ...prev,
        status: 'CONSENSUS_PENDING',
        stageLabel: '5. Multi-Validator Swarm Simulation (5/5 Concurred)...',
      }));

      setTimeout(() => {
        setLifecycle((prev) => ({
          ...prev,
          status: 'FINALIZED',
          stageLabel: '6. Simulation Completed • Contract integration pending',
          blockNumber: 61997482,
        }));
        if (currentIntent?.onSuccess) {
          currentIntent.onSuccess();
        }
      }, 300);
    }, 200);
  };

  const simulateError = () => {
    setLifecycle({
      status: 'CONTRACT_ERROR',
      step: 4,
      stageLabel: 'Execution Reverted: Gas limit exceeded or contract assertion failed.',
      errorMessage: 'EVM execution halted: Quorum disagreement or invalid Merkle proof.',
    });
  };

  const simulateReject = () => {
    setLifecycle({
      status: 'WALLET_REJECTED',
      step: 3,
      stageLabel: 'Transaction Signature Rejected by Signer.',
      errorMessage: 'User cancelled structured data signing prompt in wallet client.',
    });
  };

  const closeModal = () => {
    setIsOpen(false);
    setLifecycle(initialLifecycle);
  };

  const reset = () => {
    setLifecycle(initialLifecycle);
    setCurrentIntent(null);
    setIsOpen(false);
  };

  return (
    <TransactionContext.Provider
      value={{
        lifecycle,
        txState: lifecycle,
        currentIntent,
        isOpen,
        startTransaction,
        confirmSign,
        simulateError,
        simulateReject,
        closeModal,
        reset,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransaction = (): TransactionContextType => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransaction must be used within a TransactionProvider');
  }
  return context;
};

export const useTransactions = useTransaction;
