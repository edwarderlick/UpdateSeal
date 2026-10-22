import { UpdateSealError } from './updateSealErrors';

export const STUDIO_DEV_CHAIN_ID = 61997;
export const STUDIO_DEV_RPC_HOST = 'studio-dev.genlayer.com';
export const CANONICAL_STUDIO_DEV_RPC_URL = 'https://studio-dev.genlayer.com/api';
export const UPDATESEAL_CONTRACT_ADDRESS = '0x6A882db328782051dFf05C40F4C34b3F223cd80A';

export type UpdateSealDataMode = 'live' | 'demo';

export interface UpdateSealConfig {
  readonly rpcUrl: string;
  readonly chainId: number;
  readonly contractAddress: `0x${string}`;
  readonly dataMode: UpdateSealDataMode;
  readonly networkAlias: 'studio-dev';
}

export type EnvRecord = Record<string, string | undefined>;

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

function readEnv(env: EnvRecord, key: string): string {
  const value = env[key];
  return typeof value === 'string' ? value.trim() : '';
}

function assertContractAddress(value: string): `0x${string}` {
  if (!ADDRESS_RE.test(value)) {
    throw new UpdateSealError(
      'CONFIG_INVALID',
      'VITE_UPDATESEAL_CONTRACT_ADDRESS must be a 20-byte 0x-prefixed hexadecimal address.',
    );
  }
  return value as `0x${string}`;
}

function assertChainId(value: string): number {
  if (value !== String(STUDIO_DEV_CHAIN_ID)) {
    throw new UpdateSealError(
      'CONFIG_INVALID',
      `VITE_GENLAYER_CHAIN_ID must be exactly ${STUDIO_DEV_CHAIN_ID}.`,
    );
  }
  return STUDIO_DEV_CHAIN_ID;
}

function assertRpcUrl(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new UpdateSealError('CONFIG_INVALID', 'VITE_GENLAYER_RPC_URL must be a valid HTTPS URL.');
  }

  const hasCredentials = Boolean(parsed.username || parsed.password);
  const hasCustomPort = Boolean(parsed.port);
  const hasQuery = Boolean(parsed.search);
  const hasFragment = Boolean(parsed.hash);
  const pathnameExact = parsed.pathname === '/api';
  const isHttps = parsed.protocol === 'https:';
  const hostExact = parsed.hostname === STUDIO_DEV_RPC_HOST;
  const isCanonical = value === CANONICAL_STUDIO_DEV_RPC_URL;

  if (
    !isCanonical ||
    !isHttps ||
    !hostExact ||
    !pathnameExact ||
    hasCredentials ||
    hasCustomPort ||
    hasQuery ||
    hasFragment
  ) {
    throw new UpdateSealError(
      'CONFIG_INVALID',
      `VITE_GENLAYER_RPC_URL must be exactly ${CANONICAL_STUDIO_DEV_RPC_URL}.`,
    );
  }

  return CANONICAL_STUDIO_DEV_RPC_URL;
}

function assertDataMode(value: string): UpdateSealDataMode {
  if (value === 'live' || value === 'demo') {
    return value;
  }
  throw new UpdateSealError(
    'CONFIG_INVALID',
    'VITE_UPDATESEAL_DATA_MODE must be exactly "live" or "demo".',
  );
}

export function parseUpdateSealConfig(env: EnvRecord): UpdateSealConfig {
  const contractAddress = assertContractAddress(readEnv(env, 'VITE_UPDATESEAL_CONTRACT_ADDRESS'));
  const chainId = assertChainId(readEnv(env, 'VITE_GENLAYER_CHAIN_ID'));
  const rpcUrl = assertRpcUrl(readEnv(env, 'VITE_GENLAYER_RPC_URL'));
  const dataMode = assertDataMode(readEnv(env, 'VITE_UPDATESEAL_DATA_MODE'));

  return Object.freeze({
    rpcUrl,
    chainId,
    contractAddress,
    dataMode,
    networkAlias: 'studio-dev',
  });
}

export type UpdateSealConfigResult =
  | { ok: true; config: UpdateSealConfig }
  | { ok: false; error: UpdateSealError };

let cachedResult: UpdateSealConfigResult | null = null;

export function getUpdateSealConfigResult(env: EnvRecord = import.meta.env as unknown as EnvRecord): UpdateSealConfigResult {
  if (cachedResult) {
    return cachedResult;
  }
  try {
    cachedResult = { ok: true, config: parseUpdateSealConfig(env) };
  } catch (error) {
    cachedResult = {
      ok: false,
      error: error instanceof UpdateSealError
        ? error
        : new UpdateSealError('CONFIG_INVALID', 'UpdateSeal public configuration is invalid.'),
    };
  }
  return cachedResult;
}

export function getUpdateSealConfig(env?: EnvRecord): UpdateSealConfig {
  const result = getUpdateSealConfigResult(env);
  if (!result.ok) {
    throw result.error;
  }
  return result.config;
}

export function resetUpdateSealConfigCache(): void {
  cachedResult = null;
}

export function isLiveDataMode(config: UpdateSealConfig = getUpdateSealConfig()): boolean {
  return config.dataMode === 'live';
}

export function isLiveReadsEnabled(
  configResult: UpdateSealConfigResult = getUpdateSealConfigResult(),
): boolean {
  const liveEnabled = configResult.ok && configResult.config.dataMode === 'live';
  return liveEnabled;
}
