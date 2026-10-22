import { buildCharterFromRegistration } from '../../lib/charterFromWizard';
import { createWriteGenLayerClient, getReadOnlyGenLayerClient, type EthereumProviderLike, type GenLayerReadClient } from '../../lib/genlayerClient';
import { createPendingRegistrationSnapshot } from '../../lib/registrationReceipt';
import {
  derivePackageUid,
  livePackagePath,
  validateCommitSha,
  validateGithubRepositoryUrl,
  validatePackageSlug,
} from '../../lib/registrationValidation';
import { getUpdateSealConfigResult, type UpdateSealConfigResult } from '../../lib/updateSealConfig';
import { UpdateSealError } from '../../lib/updateSealErrors';
import { getPackage, getPackageUid, packageExists } from '../../services/updateSealContract';
import {
  confirmRegistrationFromReceipt,
  registerPackage,
  waitForExistingRegistration,
} from '../../services/updateSealWrites';
import type { PendingRegistrationSnapshot, RegisterPackageSuccess, RegisterProgress } from '../../types/updateSeal';
import type { RegistrationFormData } from './RegistrationContext';

export type RegistrationSubmitPhase =
  | 'review'
  | 'config_invalid'
  | 'wallet_required'
  | 'wrong_network'
  | 'duplicate'
  | 'validation_error'
  | 'estimating_fees'
  | 'fee_estimation_failed'
  | 'fee_estimate_invalid'
  | 'awaiting_wallet'
  | 'submitted'
  | 'waiting_consensus'
  | 'finalized'
  | 'wallet_rejected'
  | 'contract_rejected'
  | 'rpc_interrupted'
  | 'status_unknown'
  | 'demo';

export interface DuplicatePackageInfo {
  packageUid: string;
  path: string;
}

export type SubmitRegistrationResult =
  | { ok: true; phase: 'demo' }
  | { ok: true; phase: 'finalized'; success: RegisterPackageSuccess }
  | {
      ok: false;
      phase: Exclude<
        RegistrationSubmitPhase,
        'demo' | 'finalized' | 'review' | 'estimating_fees' | 'awaiting_wallet' | 'submitted' | 'waiting_consensus'
      >;
      message: string;
      fieldErrors?: Record<string, string>;
      duplicate?: DuplicatePackageInfo;
      transactionHash?: string;
      snapshot?: PendingRegistrationSnapshot;
    };

export interface SubmitRegistrationInput {
  form: RegistrationFormData;
  connectedAddress: string | null;
  isConnected: boolean;
  chainId: number;
  provider: EthereumProviderLike | null;
  configResult?: UpdateSealConfigResult;
  onProgress?: (event: RegisterProgress) => void;
}

export interface SubmitRegistrationDeps {
  getConfigResult?: () => UpdateSealConfigResult;
  getPackageUidFn?: typeof getPackageUid;
  packageExistsFn?: typeof packageExists;
  getPackageFn?: typeof getPackage;
  registerPackageFn?: typeof registerPackage;
  createWriteClientFn?: typeof createWriteGenLayerClient;
  waitForExistingRegistrationFn?: typeof waitForExistingRegistration;
  getReadClientFn?: () => Pick<GenLayerReadClient, 'waitForTransactionReceipt'>;
}

export function validateRegistrationForm(form: RegistrationFormData): Record<string, string> {
  const errors: Record<string, string> = {};
  const slug = form.packageId.trim();
  const slugError = validatePackageSlug(slug);
  if (slugError) {
    errors.packageId = slugError;
  }
  if (!form.displayName.trim()) {
    errors.displayName = 'Display Name is required.';
  }
  const repo = form.repositoryUrl.trim();
  const repoError = validateGithubRepositoryUrl(repo);
  if (!repo) {
    errors.repositoryUrl = 'Repository URL is required.';
  } else if (repoError) {
    errors.repositoryUrl = 'Must be a valid GitHub repository URL (e.g. https://github.com/org/repo).';
  }
  const sha = form.baselineCommitSha.trim();
  const shaError = validateCommitSha(sha);
  if (!sha) {
    errors.baselineCommitSha = 'Commit SHA is required.';
  } else if (shaError) {
    errors.baselineCommitSha = shaError;
  }
  const charter = buildCharterFromRegistration(form);
  if (!charter.ok) {
    Object.assign(errors, charter.errors);
  }
  return errors;
}

function phaseFromError(error: UpdateSealError, snapshot?: PendingRegistrationSnapshot): SubmitRegistrationResult {
  const map: Record<string, SubmitRegistrationResult['phase']> = {
    CONFIG_INVALID: 'config_invalid',
    WALLET_REQUIRED: 'wallet_required',
    WRONG_NETWORK: 'wrong_network',
    WALLET_REJECTED: 'wallet_rejected',
    CONTRACT_REJECTED: 'contract_rejected',
    RPC_UNAVAILABLE: 'rpc_interrupted',
    STATUS_UNKNOWN: 'status_unknown',
    DUPLICATE_PACKAGE: 'duplicate',
    WRITE_DISABLED: 'config_invalid',
    SENDER_MISMATCH: 'wallet_required',
    FEE_ESTIMATION_FAILED: 'fee_estimation_failed',
    FEE_ESTIMATE_INVALID: 'fee_estimate_invalid',
  };
  return {
    ok: false,
    phase: (map[error.code] ?? 'contract_rejected') as Exclude<
      SubmitRegistrationResult extends { ok: false } ? SubmitRegistrationResult['phase'] : never,
      never
    >,
    message: error.userMessage,
    transactionHash: error.transactionHash ?? snapshot?.transactionHash,
    snapshot,
  };
}

export async function checkRegistrationStatus(
  input: {
    snapshot: PendingRegistrationSnapshot;
    configResult?: UpdateSealConfigResult;
  },
  deps: SubmitRegistrationDeps = {},
): Promise<SubmitRegistrationResult> {
  const snapshot = input.snapshot;
  const transactionHash = snapshot.transactionHash;
  const configResult = input.configResult ?? (deps.getConfigResult ?? getUpdateSealConfigResult)();
  if (!configResult.ok || configResult.config.dataMode !== 'live') {
    return {
      ok: false,
      phase: 'config_invalid',
      message: configResult.ok ? 'Status checks run only in live mode.' : configResult.error.userMessage,
      transactionHash,
      snapshot,
    };
  }

  const getPackageFn = deps.getPackageFn ?? getPackage;

  try {
    const waitFn = deps.waitForExistingRegistrationFn ?? waitForExistingRegistration;
    const readClient = deps.getReadClientFn
      ? deps.getReadClientFn()
      : deps.waitForExistingRegistrationFn
        ? { waitForTransactionReceipt: async () => undefined }
        : getReadOnlyGenLayerClient();
    const receipt = await waitFn(transactionHash, {
      client: readClient,
    });
    const success = await confirmRegistrationFromReceipt(snapshot, receipt, getPackageFn);
    return { ok: true, phase: 'finalized', success };
  } catch (error) {
    if (error instanceof UpdateSealError) {
      return phaseFromError(error, snapshot);
    }
    return {
      ok: false,
      phase: 'status_unknown',
      message: 'Transaction status is unknown. The registration may still be processing. Keep this hash and check status.',
      transactionHash,
      snapshot,
    };
  }
}

let activeSubmission: Promise<SubmitRegistrationResult> | null = null;

export function resetActiveSubmissionForTests(): void {
  activeSubmission = null;
}

export async function submitRegistration(
  input: SubmitRegistrationInput,
  deps: SubmitRegistrationDeps = {},
): Promise<SubmitRegistrationResult> {
  if (activeSubmission) {
    return activeSubmission;
  }
  const run = runSubmitRegistration(input, deps);
  activeSubmission = run;
  try {
    return await run;
  } finally {
    activeSubmission = null;
  }
}

async function runSubmitRegistration(
  input: SubmitRegistrationInput,
  deps: SubmitRegistrationDeps = {},
): Promise<SubmitRegistrationResult> {
  const configResult = input.configResult ?? (deps.getConfigResult ?? getUpdateSealConfigResult)();

  if (!configResult.ok) {
    return {
      ok: false,
      phase: 'config_invalid',
      message: configResult.error.userMessage,
    };
  }

  if (configResult.config.dataMode === 'demo') {
    return { ok: true, phase: 'demo' };
  }

  if (configResult.config.dataMode !== 'live') {
    return {
      ok: false,
      phase: 'config_invalid',
      message: 'VITE_UPDATESEAL_DATA_MODE must be exactly "live" or "demo".',
    };
  }

  if (!input.isConnected || !input.connectedAddress) {
    return {
      ok: false,
      phase: 'wallet_required',
      message: 'Connect a wallet to register a package on Studio-dev.',
    };
  }

  if (input.chainId !== 61997) {
    return {
      ok: false,
      phase: 'wrong_network',
      message: 'Switch to GenLayer Studio-dev (chain ID 61997) before registering.',
    };
  }

  const fieldErrors = validateRegistrationForm(input.form);
  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      phase: 'validation_error',
      message: 'Fix the highlighted registration fields before submitting.',
      fieldErrors,
    };
  }

  const sender = input.connectedAddress.toLowerCase() as `0x${string}`;
  const slug = input.form.packageId.trim();
  const repositoryUrl = input.form.repositoryUrl.trim();
  const baselineCommitSha = input.form.baselineCommitSha.trim();
  const getPackageUidFn = deps.getPackageUidFn ?? getPackageUid;
  const packageExistsFn = deps.packageExistsFn ?? packageExists;

  try {
    const packageUid = await getPackageUidFn(sender, slug);
    const exists = await packageExistsFn(packageUid);
    if (exists) {
      return {
        ok: false,
        phase: 'duplicate',
        message: `Package '${packageUid}' is already registered.`,
        duplicate: {
          packageUid,
          path: livePackagePath(sender, slug),
        },
      };
    }
  } catch (error) {
    if (error instanceof UpdateSealError) {
      return phaseFromError(error);
    }
    return {
      ok: false,
      phase: 'rpc_interrupted',
      message: 'Studio-dev RPC was interrupted while checking for an existing package.',
    };
  }

  if (!input.provider) {
    return {
      ok: false,
      phase: 'wallet_required',
      message: 'Connect a wallet to register a package on Studio-dev.',
    };
  }

  const charter = buildCharterFromRegistration(input.form);
  if (!charter.ok) {
    return {
      ok: false,
      phase: 'validation_error',
      message: 'Fix the highlighted registration fields before submitting.',
      fieldErrors: charter.errors,
    };
  }

  const identity = {
    senderAddress: sender,
    packageSlug: slug,
    repositoryUrl,
    baselineCommitSha,
    canonicalCharterJson: charter.json,
  };

  const createWriteClientFn = deps.createWriteClientFn ?? createWriteGenLayerClient;
  const registerPackageFn = deps.registerPackageFn ?? registerPackage;
  const client = createWriteClientFn(sender, input.provider);

  const emitProgress = (event: RegisterProgress) => {
    if (!event.transactionHash) {
      input.onProgress?.(event);
      return;
    }
    const snapshot = event.snapshot ?? createPendingRegistrationSnapshot({
      transactionHash: event.transactionHash,
      ...identity,
    });
    input.onProgress?.({ ...event, snapshot });
  };

  try {
    const success = await registerPackageFn(
      {
        packageSlug: slug,
        repositoryUrl,
        baselineCommitSha,
        charterJson: charter.json,
        senderAddress: sender,
      },
      {
        client,
        packageExistsFn,
        getPackageFn: deps.getPackageFn ?? getPackage,
        onProgress: emitProgress,
        config: configResult.config,
      },
    );

    return { ok: true, phase: 'finalized', success };
  } catch (error) {
    if (error instanceof UpdateSealError) {
      const snapshot = error.transactionHash
        ? createPendingRegistrationSnapshot({
            transactionHash: error.transactionHash as `0x${string}`,
            ...identity,
          })
        : undefined;
      if (error.code === 'DUPLICATE_PACKAGE' || error.userMessage.toLowerCase().includes('already registered')) {
        const packageUid = derivePackageUid(sender, slug);
        return {
          ok: false,
          phase: 'duplicate',
          message: error.userMessage,
          duplicate: { packageUid, path: livePackagePath(sender, slug) },
          transactionHash: error.transactionHash ?? undefined,
          snapshot,
        };
      }
      return phaseFromError(error, snapshot);
    }
    return {
      ok: false,
      phase: 'rpc_interrupted',
      message: 'Studio-dev RPC was interrupted. The transaction may still be processing.',
    };
  }
}
