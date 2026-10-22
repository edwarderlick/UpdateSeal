import { useContext } from 'react';
import { WalletContext } from './walletContextDef';
import type { WalletContextType } from './walletContextDef';

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export type { WalletContextType };
