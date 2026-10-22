import React, { createContext, useContext, useState, useEffect } from 'react';
import { CapabilityBoundary, CapabilityPolicy } from '../../types';
import { DEFAULT_ATLAS_CHARTER, MOCK_OWNER_WALLET } from '../../mocks';
import { validateCommitSha, validateGithubRepositoryUrl, validatePackageSlug } from '../../lib/registrationValidation';

export interface RegistrationFormData {
  // Step 1: Identity
  packageId: string;
  displayName: string;
  name?: string;
  description: string;
  repositoryUrl: string;
  ownerWallet: string;

  // Step 2: Baseline
  baselineVersion: string;
  baselineCommitSha: string;
  manifestPath: string;
  license: string;

  // Step 3: Charter
  capabilityCharter: CapabilityBoundary;
}

export interface LiveRegistrationReceipt {
  packageUid: string;
  transactionHash: string;
  publisher: string;
  repositoryUrl: string;
  baselineCommitSha: string;
  charterHash: string;
  packageSlug: string;
}

const RECEIPT_STORAGE_KEY = 'updateseal_registration_receipt';

const defaultFormData: RegistrationFormData = {
  packageId: 'sentinel-code-auditor',
  displayName: 'Sentinel Code Auditor',
  name: 'Sentinel Code Auditor',
  description: 'Autonomous static analysis daemon evaluating smart contracts against security invariants.',
  repositoryUrl: 'https://github.com/sentinel-sec/code-auditor',
  ownerWallet: MOCK_OWNER_WALLET,
  baselineVersion: 'v1.0.0',
  baselineCommitSha: '4f89a29e81bfa0021c38e9184b2910cbe8822910',
  manifestPath: 'package.json',
  license: 'Apache-2.0',
  capabilityCharter: DEFAULT_ATLAS_CHARTER,
};

interface RegistrationContextType {
  formData: RegistrationFormData;
  form: RegistrationFormData;
  updateFormData: (updates: Partial<RegistrationFormData>) => void;
  updateField: (key: string, val: any) => void;
  updateCapabilityPolicy: (category: keyof CapabilityBoundary, policy: CapabilityPolicy) => void;
  addNetworkDomain: (domain: string) => void;
  removeNetworkDomain: (domain: string) => void;
  addJailedPath: (path: string) => void;
  removeJailedPath: (path: string) => void;
  setSpendingLimit: (limit: number) => void;
  validateStep1: () => { isValid: boolean; errors: Record<string, string> };
  validateStep2: () => { isValid: boolean; errors: Record<string, string> };
  resetForm: () => void;
  liveReceipt: LiveRegistrationReceipt | null;
  setLiveReceipt: (receipt: LiveRegistrationReceipt | null) => void;
}

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export const RegistrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [formData, setFormData] = useState<RegistrationFormData>(() => {
    const saved = sessionStorage.getItem('updateseal_registration_form');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return defaultFormData;
  });
  const [liveReceipt, setLiveReceiptState] = useState<LiveRegistrationReceipt | null>(() => {
    const saved = sessionStorage.getItem(RECEIPT_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as LiveRegistrationReceipt;
      } catch {
        return null;
      }
    }
    return null;
  });

  const setLiveReceipt = (receipt: LiveRegistrationReceipt | null) => {
    setLiveReceiptState(receipt);
    if (receipt) {
      sessionStorage.setItem(RECEIPT_STORAGE_KEY, JSON.stringify(receipt));
    } else {
      sessionStorage.removeItem(RECEIPT_STORAGE_KEY);
    }
  };

  useEffect(() => {
    sessionStorage.setItem('updateseal_registration_form', JSON.stringify(formData));
  }, [formData]);

  const updateFormData = (updates: Partial<RegistrationFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const updateCapabilityPolicy = (category: keyof CapabilityBoundary, policy: CapabilityPolicy) => {
    setFormData((prev) => ({
      ...prev,
      capabilityCharter: {
        ...prev.capabilityCharter,
        [category]: {
          ...prev.capabilityCharter[category],
          policy,
        },
      },
    }));
  };

  const addNetworkDomain = (domain: string) => {
    if (!domain.trim()) return;
    setFormData((prev) => {
      const current = prev.capabilityCharter.network_egress.allowedDomains || [];
      if (current.includes(domain.trim())) return prev;
      return {
        ...prev,
        capabilityCharter: {
          ...prev.capabilityCharter,
          network_egress: {
            ...prev.capabilityCharter.network_egress,
            allowedDomains: [...current, domain.trim()],
          },
        },
      };
    });
  };

  const removeNetworkDomain = (domain: string) => {
    setFormData((prev) => ({
      ...prev,
      capabilityCharter: {
        ...prev.capabilityCharter,
        network_egress: {
          ...prev.capabilityCharter.network_egress,
          allowedDomains: (prev.capabilityCharter.network_egress.allowedDomains || []).filter(
            (d) => d !== domain
          ),
        },
      },
    }));
  };

  const addJailedPath = (path: string) => {
    if (!path.trim()) return;
    setFormData((prev) => {
      const current = prev.capabilityCharter.file_system.jailedPaths || [];
      if (current.includes(path.trim())) return prev;
      return {
        ...prev,
        capabilityCharter: {
          ...prev.capabilityCharter,
          file_system: {
            ...prev.capabilityCharter.file_system,
            jailedPaths: [...current, path.trim()],
          },
        },
      };
    });
  };

  const removeJailedPath = (path: string) => {
    setFormData((prev) => ({
      ...prev,
      capabilityCharter: {
        ...prev.capabilityCharter,
        file_system: {
          ...prev.capabilityCharter.file_system,
          jailedPaths: (prev.capabilityCharter.file_system.jailedPaths || []).filter(
            (p) => p !== path
          ),
        },
      },
    }));
  };

  const setSpendingLimit = (limit: number) => {
    setFormData((prev) => ({
      ...prev,
      capabilityCharter: {
        ...prev.capabilityCharter,
        spending_limits: {
          ...prev.capabilityCharter.spending_limits,
          maxGenPer24h: limit,
        },
      },
    }));
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    const slug = formData.packageId.trim();
    if (!slug) {
      errors.packageId = 'Package slug is required (e.g. sentinel-code-auditor).';
    } else {
      const slugError = validatePackageSlug(slug);
      if (slugError) {
        errors.packageId = slugError;
      }
    }
    if (!formData.displayName.trim()) {
      errors.displayName = 'Display Name is required.';
    }
    const repo = formData.repositoryUrl.trim();
    if (!repo) {
      errors.repositoryUrl = 'Repository URL is required.';
    } else {
      const repoError = validateGithubRepositoryUrl(repo);
      if (repoError) {
        errors.repositoryUrl = 'Must be a valid GitHub repository URL (e.g. https://github.com/org/repo).';
      }
    }
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const validateStep2 = () => {
    const errors: Record<string, string> = {};
    if (!formData.baselineVersion.trim()) {
      errors.baselineVersion = 'Baseline version is required (e.g. v1.0.0).';
    }
    const shaTrimmed = formData.baselineCommitSha.trim();
    if (!shaTrimmed) {
      errors.baselineCommitSha = 'Commit SHA is required.';
    } else {
      const shaError = validateCommitSha(shaTrimmed);
      if (shaError) {
        errors.baselineCommitSha = shaError;
      }
    }
    if (!formData.manifestPath.trim()) {
      errors.manifestPath = 'Manifest path is required (e.g. package.json).';
    }
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    sessionStorage.removeItem('updateseal_registration_form');
    setLiveReceipt(null);
  };

  return (
    <RegistrationContext.Provider
      value={{
        formData,
        form: formData,
        updateFormData,
        updateField: (key: string, val: any) => updateFormData({ [key]: val }),
        updateCapabilityPolicy,
        addNetworkDomain,
        removeNetworkDomain,
        addJailedPath,
        removeJailedPath,
        setSpendingLimit,
        validateStep1,
        validateStep2,
        resetForm,
        liveReceipt,
        setLiveReceipt,
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistration = (): RegistrationContextType => {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
};
