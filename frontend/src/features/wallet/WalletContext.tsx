import React, { useState, useCallback } from 'react';
import {
  WagmiProvider,
  useAccount,
  useChainId,
  useBalance,
  useSwitchChain,
  useConnect,
  useDisconnect,
  type Config,
} from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { WalletState, NetworkState } from '../../types';
import {
  config,
  queryClient,
  isProjectConfigured,
  appKit,
} from '../../lib/walletConfig';
import {
  GENLAYER_CHAIN_ID,
  GENLAYER_CHAIN_NAME,
  GENLAYER_RPC_URL,
  GENLAYER_SYMBOL,
  GENLAYER_EXPLORER_URL,
} from '../../lib/network';
import { WalletContext } from './walletContextDef';

interface InnerWalletProviderProps {
  children: React.ReactNode;
  isProjectConfiguredOverride?: boolean;
}

const InnerWalletProvider: React.FC<InnerWalletProviderProps> = ({
  children,
  isProjectConfiguredOverride,
}) => {
  const effectiveProjectConfigured = isProjectConfiguredOverride !== undefined
    ? isProjectConfiguredOverride
    : isProjectConfigured;
  const { address, isConnected, isConnecting, isReconnecting, connector } = useAccount();
  const currentChainId = useChainId();
  const { data: balanceData } = useBalance({
    address: address as `0x${string}` | undefined,
    chainId: GENLAYER_CHAIN_ID,
    query: {
      enabled: Boolean(address),
    },
  });
  const { switchChainAsync } = useSwitchChain();
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Directly derive all wallet/chain states from Wagmi
  const isWrongNetwork = Boolean(isConnected && currentChainId && currentChainId !== GENLAYER_CHAIN_ID);
  const isConnectingState = Boolean(isConnecting || isReconnecting);

  const balanceFormatted = balanceData
    ? Number(balanceData.formatted).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      })
    : '0.00';

  const wallet: WalletState = {
    isConnected,
    address: address || null,
    providerName: connector?.name || 'Injected Provider',
    balanceGen: balanceFormatted,
    chainId: currentChainId || GENLAYER_CHAIN_ID,
  };

  const network: NetworkState = {
    chainId: currentChainId || GENLAYER_CHAIN_ID,
    networkName: (currentChainId || GENLAYER_CHAIN_ID) === GENLAYER_CHAIN_ID
      ? GENLAYER_CHAIN_NAME
      : `Chain ID ${currentChainId}`,
    rpcUrl: GENLAYER_RPC_URL,
    currencySymbol: GENLAYER_SYMBOL,
    isCorrectNetwork: !isWrongNetwork,
  };

  const openWalletModal = useCallback(() => {
    setErrorMessage(null);
    if (appKit) {
      try {
        appKit.open();
        return;
      } catch (err) {
        console.warn('[UpdateSeal] AppKit open fallback:', err);
      }
    }
    setIsWalletModalOpen(true);
  }, []);

  const closeWalletModal = useCallback(() => {
    setIsWalletModalOpen(false);
  }, []);

  const openNetworkModal = useCallback(() => {
    setErrorMessage(null);
    setIsNetworkModalOpen(true);
  }, []);

  const closeNetworkModal = useCallback(() => {
    setIsNetworkModalOpen(false);
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const connectWallet = useCallback(async (providerId?: string) => {
    setErrorMessage(null);
    if (effectiveProjectConfigured && appKit) {
      try {
        await appKit.open();
        setIsWalletModalOpen(false);
        return;
      } catch (err: any) {
        if (err?.code === 4001 || err?.message?.includes('User rejected')) {
          setErrorMessage('Connection request rejected by user.');
        } else {
          setErrorMessage(err?.message || 'Wallet connection error.');
        }
      }
    } else {
      // Injected-only mode when Reown project ID is unconfigured
      if (providerId === 'WalletConnect') {
        setErrorMessage('WalletConnect and QR login are unavailable because VITE_REOWN_PROJECT_ID is not configured. Please use an installed browser wallet or set VITE_REOWN_PROJECT_ID in .env.local.');
        return;
      }

      try {
        const injectedConnector =
          connectors.find((c) =>
            c.type === 'injected' ||
            c.id === 'injected' ||
            c.name.toLowerCase().includes('injected') ||
            c.name.toLowerCase().includes('metamask')
          ) || connectors[0];

        if (injectedConnector) {
          await connectAsync({ connector: injectedConnector });
          setIsWalletModalOpen(false);
        } else {
          setErrorMessage('No browser wallet detected. Please install MetaMask, Rabby, or configure VITE_REOWN_PROJECT_ID in .env.local.');
        }
      } catch (err: any) {
        if (err?.code === 4001 || err?.message?.includes('User rejected')) {
          setErrorMessage('Connection request rejected by user.');
        } else {
          setErrorMessage(err?.message || 'Wallet connection error.');
        }
      }
    }
  }, [connectAsync, connectors, effectiveProjectConfigured]);

  const disconnectWallet = useCallback(async () => {
    setErrorMessage(null);
    try {
      if (disconnectAsync) {
        await disconnectAsync();
      }
    } catch (err) {
      console.warn('[UpdateSeal] Disconnect notice:', err);
    }
    sessionStorage.removeItem('updateseal_wallet_state');
  }, [disconnectAsync]);

  const switchToStudioNext = useCallback(async () => {
    setErrorMessage(null);

    if (!switchChainAsync) {
      setErrorMessage('This wallet does not support programmatic network switching. Please switch to GenLayer Studio-dev manually in your wallet.');
      return;
    }

    try {
      const switchedChain = await switchChainAsync({ chainId: GENLAYER_CHAIN_ID });
      // Confirm the actual chain returned or reported
      if (switchedChain?.id === GENLAYER_CHAIN_ID || currentChainId === GENLAYER_CHAIN_ID) {
        setIsNetworkModalOpen(false);
      }
    } catch (err: any) {
      console.warn('[UpdateSeal] Switch network attempt error:', err);

      // Handle unknown-chain error 4902 by attempting to add GenLayer Studio-dev
      const isUnrecognized =
        err?.code === 4902 ||
        err?.message?.includes('4902') ||
        err?.message?.toLowerCase().includes('unrecognized chain');

      if (isUnrecognized) {
        let provider: any = null;
        try {
          if (connector?.getProvider) {
            provider = await connector.getProvider();
          }
        } catch {
          // ignore provider fetch error
        }
        if (!provider && typeof window !== 'undefined') {
          provider = (window as any).ethereum;
        }

        if (provider?.request) {
          try {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${GENLAYER_CHAIN_ID.toString(16)}`,
                  chainName: GENLAYER_CHAIN_NAME,
                  nativeCurrency: {
                    name: GENLAYER_SYMBOL,
                    symbol: GENLAYER_SYMBOL,
                    decimals: 18,
                  },
                  rpcUrls: [GENLAYER_RPC_URL],
                  blockExplorerUrls: [GENLAYER_EXPLORER_URL],
                },
              ],
            });

            // After adding, request the switch again
            const retrySwitch = await switchChainAsync({ chainId: GENLAYER_CHAIN_ID });
            if (retrySwitch?.id === GENLAYER_CHAIN_ID || currentChainId === GENLAYER_CHAIN_ID) {
              setIsNetworkModalOpen(false);
              return;
            }
          } catch (addErr: any) {
            if (addErr?.code === 4001 || addErr?.message?.includes('User rejected')) {
              setErrorMessage('User rejected adding GenLayer Studio-dev to wallet.');
            } else {
              setErrorMessage(addErr?.message || 'Could not add GenLayer Studio-dev network to browser wallet.');
            }
            // DO NOT close modal on error
            return;
          }
        } else {
          setErrorMessage('Could not access wallet provider to add GenLayer Studio-dev. Please add network manually.');
          return;
        }
      }

      if (err?.code === 4001 || err?.message?.includes('User rejected')) {
        setErrorMessage('Network switch request was rejected.');
      } else if (!isUnrecognized) {
        setErrorMessage(err?.message || 'Failed to switch network. Please switch to GenLayer Studio-dev in your wallet.');
      }
      // Never set simulated chain ID or close modal on error!
    }
  }, [switchChainAsync, currentChainId, connector]);

  const copyAddress = useCallback(async (): Promise<boolean> => {
    if (!address) return false;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      return false;
    }
  }, [address]);

  const viewOnExplorer = useCallback(() => {
    if (!address) return;
    const url = `${GENLAYER_EXPLORER_URL.replace(/\/$/, '')}/address/${address}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [address]);

  const getEthereumProvider = useCallback(async (): Promise<unknown> => {
    if (connector?.getProvider) {
      return connector.getProvider();
    }
    if (typeof window !== 'undefined') {
      return (window as { ethereum?: unknown }).ethereum ?? null;
    }
    return null;
  }, [connector]);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        walletState: { ...wallet, account: wallet.address },
        network,
        isConnecting: isConnectingState,
        isWrongNetwork,
        isWalletModalOpen,
        isNetworkModalOpen,
        isProjectConfigured: effectiveProjectConfigured,
        errorMessage,
        copied,
        clearError,
        openWalletModal,
        openConnectModal: () => {
          setErrorMessage(null);
          setIsWalletModalOpen(true);
        },
        closeWalletModal,
        openNetworkModal,
        closeNetworkModal,
        connectWallet,
        disconnectWallet,
        switchToStudioNext,
        copyAddress,
        viewOnExplorer,
        getEthereumProvider,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export interface WalletProviderProps {
  children: React.ReactNode;
  configOverride?: Config;
  isProjectConfiguredOverride?: boolean;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({
  children,
  configOverride,
  isProjectConfiguredOverride,
}) => {
  const activeConfig = configOverride || (config as unknown as Config);
  return (
    <WagmiProvider config={activeConfig}>
      <QueryClientProvider client={queryClient}>
        <InnerWalletProvider isProjectConfiguredOverride={isProjectConfiguredOverride}>
          {children}
        </InnerWalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
