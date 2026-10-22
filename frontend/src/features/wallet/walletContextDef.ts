import { createContext } from 'react';
import type { WalletState, NetworkState } from '../../types';

export interface WalletContextType {
  wallet: WalletState;
  walletState: WalletState & { account: string | null };
  network: NetworkState;
  isConnecting: boolean;
  isWrongNetwork: boolean;
  isWalletModalOpen: boolean;
  isNetworkModalOpen: boolean;
  isProjectConfigured: boolean;
  errorMessage: string | null;
  copied: boolean;
  clearError: () => void;
  openWalletModal: () => void;
  openConnectModal: () => void;
  closeWalletModal: () => void;
  openNetworkModal: () => void;
  closeNetworkModal: () => void;
  connectWallet: (provider?: string) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchToStudioNext: () => Promise<void>;
  copyAddress: () => Promise<boolean>;
  viewOnExplorer: () => void;
  getEthereumProvider: () => Promise<unknown>;
}

export const WalletContext = createContext<WalletContextType | undefined>(undefined);
