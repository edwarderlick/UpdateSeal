import { QueryClient } from '@tanstack/react-query';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { createConfig, http, type Config } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { genlayerStudioNext } from './network';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const origin = typeof window !== 'undefined' && window.location?.origin
  ? window.location.origin
  : 'https://updateseal.dev';

export const metadata = {
  name: 'UpdateSeal',
  description: 'The on-chain approval registry for autonomous software',
  url: origin,
  icons: [`${origin}/favicon.ico`],
};

/**
 * Validates a candidate Reown project ID.
 * Returns false if missing, undefined, empty, placeholder, or whitespace.
 */
export function isValidReownProjectId(value?: string | null): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  return Boolean(
    trimmed.length > 0 &&
    trimmed !== 'your_reown_project_id' &&
    trimmed !== 'undefined'
  );
}

export interface WalletConfigResult {
  isProjectConfigured: boolean;
  projectId: string;
  wagmiAdapter: WagmiAdapter | null;
  config: Config;
  appKit: ReturnType<typeof createAppKit> | null;
}

/**
 * Creates wallet configuration based on whether a valid Reown project ID is provided.
 * When valid: creates WagmiAdapter and initializes Reown AppKit.
 * When invalid/missing: creates an injected-only Wagmi configuration and skips AppKit.
 */
export function createWalletConfig(rawProjectIdInput?: string | null): WalletConfigResult {
  const isConfigured = isValidReownProjectId(rawProjectIdInput);
  const validatedProjectId = isConfigured ? (rawProjectIdInput || '').trim() : '';

  const adapter = isConfigured
    ? new WagmiAdapter({
        projectId: validatedProjectId,
        networks: [genlayerStudioNext as any],
        ssr: false,
      })
    : null;

  const resolvedConfig: Config = adapter
    ? (adapter.wagmiConfig as Config)
    : createConfig({
        chains: [genlayerStudioNext],
        connectors: [injected()],
        transports: {
          [genlayerStudioNext.id]: http(),
        },
        ssr: false,
      });

  let appKitInstance: ReturnType<typeof createAppKit> | null = null;
  if (isConfigured && adapter && typeof window !== 'undefined') {
    try {
      appKitInstance = createAppKit({
        adapters: [adapter],
        networks: [genlayerStudioNext as any],
        projectId: validatedProjectId,
        metadata,
        features: {
          analytics: false,
          email: false,
          socials: false,
        },
        themeMode: 'light',
      });
    } catch (err) {
      console.warn('[UpdateSeal] AppKit initialization notice:', err);
    }
  }

  return {
    isProjectConfigured: isConfigured,
    projectId: validatedProjectId,
    wagmiAdapter: adapter,
    config: resolvedConfig,
    appKit: appKitInstance,
  };
}

export const rawProjectId = (import.meta.env.VITE_REOWN_PROJECT_ID || '').trim();
const defaultSetup = createWalletConfig(rawProjectId);

export const isProjectConfigured = defaultSetup.isProjectConfigured;
export const projectId = defaultSetup.projectId;
export const wagmiAdapter = defaultSetup.wagmiAdapter;
export const config = defaultSetup.config;
export const appKit = defaultSetup.appKit;
