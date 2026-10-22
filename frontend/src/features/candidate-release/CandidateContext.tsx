import React, { createContext, useContext, useState, useEffect } from 'react';
import { EvidenceCheck, DecisionCode } from '../../types';
import { MOCK_ATLAS_RELEASES } from '../../mocks';

export interface CandidateFormData {
  packageId: string;
  version: string;
  candidateVersion?: string;
  commitSha: string;
  releaseNotes: string;
  targetBranch: string;
  allowViolationsDemo: boolean;
}

const defaultCandidateData: CandidateFormData = {
  packageId: 'atlas-research-agent',
  version: 'v1.5.0-rc1',
  candidateVersion: 'v1.5.0-rc1',
  commitSha: '61997402be49f812cc994017bca882e558a12009',
  releaseNotes: 'Performance improvements and sub-agent orchestration enhancements.',
  targetBranch: 'main',
  allowViolationsDemo: true,
};

interface CandidateContextType {
  formData: CandidateFormData;
  form: CandidateFormData;
  updateFormData: (updates: Partial<CandidateFormData>) => void;
  evidenceChecks: EvidenceCheck[];
  simulatedVerdict: DecisionCode;
  simulatedOutcome: DecisionCode;
  setSimulatedVerdict: (code: DecisionCode) => void;
  validateStep1: () => { isValid: boolean; errors: Record<string, string> };
  resetCandidateForm: () => void;
}

const CandidateContext = createContext<CandidateContextType | undefined>(undefined);

const DEMO_STORAGE_KEY = 'updateseal_candidate_form:demo:atlas-research-agent';
const LEGACY_DEMO_STORAGE_KEY = 'updateseal_candidate_form';

function loadDemoCandidateForm(): CandidateFormData {
  const tryParse = (raw: string | null): CandidateFormData | null => {
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<CandidateFormData>;
      if (!parsed || typeof parsed !== 'object') {
        return null;
      }
      return {
        ...defaultCandidateData,
        ...parsed,
        packageId: typeof parsed.packageId === 'string' ? parsed.packageId : defaultCandidateData.packageId,
      };
    } catch {
      return null;
    }
  };
  return tryParse(sessionStorage.getItem(DEMO_STORAGE_KEY)) ?? tryParse(sessionStorage.getItem(LEGACY_DEMO_STORAGE_KEY)) ?? defaultCandidateData;
}

export const CandidateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [formData, setFormData] = useState<CandidateFormData>(() => loadDemoCandidateForm());

  const [simulatedVerdict, setSimulatedVerdict] = useState<DecisionCode>('0x03');

  useEffect(() => {
    sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const updateFormData = (updates: Partial<CandidateFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    const version = formData.version.trim();
    if (!version) {
      errors.version = 'Candidate release version is required (e.g. v1.5.0).';
    } else if (!/^v?[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$/.test(version)) {
      errors.version = 'Version must follow SemVer format (e.g. v1.5.0).';
    }
    const sha = formData.commitSha.trim();
    if (!sha) {
      errors.commitSha = 'Candidate Git commit SHA is required.';
    } else if (!/^[0-9a-fA-F]{40}$/.test(sha)) {
      errors.commitSha = 'Commit SHA must be a 40-character hexadecimal string.';
    }
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const resetCandidateForm = () => {
    setFormData(defaultCandidateData);
    sessionStorage.removeItem(DEMO_STORAGE_KEY);
    sessionStorage.removeItem(LEGACY_DEMO_STORAGE_KEY);
  };

  const evidenceChecks = MOCK_ATLAS_RELEASES[0].evidenceChecks;

  return (
    <CandidateContext.Provider
      value={{
        formData,
        form: formData,
        updateFormData,
        evidenceChecks,
        simulatedVerdict,
        simulatedOutcome: simulatedVerdict,
        setSimulatedVerdict,
        validateStep1,
        resetCandidateForm,
      }}
    >
      {children}
    </CandidateContext.Provider>
  );
};

export const useCandidate = (): CandidateContextType => {
  const context = useContext(CandidateContext);
  if (!context) {
    throw new Error('useCandidate must be used within a CandidateProvider');
  }
  return context;
};
