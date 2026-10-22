# UpdateSeal — On-chain Release Approval Registry for Autonomous AI Software

UpdateSeal is a decentralized release approval registry for autonomous AI agents, plugins, and self-updating software. Enforced by GenLayer Studio Next intelligent contracts, UpdateSeal validates candidate releases against immutable capability charters to prevent unauthorized network egress, unmonitored shell executions, filesystem escalations, and silent prompt injection vulnerabilities.

---

## Current Status: Live Public Reads; Writes Intentionally Unwired

`UpdateSealRegistry` is deployed on GenLayer Studio-dev. The frontend reads the public registry through GenLayerJS (`genlayer-js@2.0.0-rc.1`) when `VITE_UPDATESEAL_DATA_MODE=live`. Wallet connection (Reown/AppKit) remains available, but connecting a wallet does not submit transactions. This is not full frontend contract integration: `register_package`, `submit_candidate`, and `evaluate_candidate` are still unwired.

| Item | Value |
| :--- | :--- |
| Network | `studio-dev` (GenLayer Studio-dev / Studio Next preview) |
| Canonical RPC | `https://studio-dev.genlayer.com/api` |
| Chain ID | `61997` |
| Contract | `UpdateSealRegistry` at `0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3` (Evidence Schema v2) |
| Deployment transaction | `0x8d8179e0ca8875a6cced3564575f98167e5b75245ec5a9c245fe4516016e9897` |
| Legacy v1 contract | `0x6A882db328782051dFf05C40F4C34b3F223cd80A` (Evidence Schema v1; do not send v2 candidates) |
| Manifest | `deployments/studio-dev.json` |
| Official GitHub repository | `https://github.com/edwarderlick/UpdateSeal` |
| Active application package | `0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal` |
| Published baseline commit | `b5d498fa08949e1e0f5113fb2f9d154368dfa97c` (`main`) |
| Erroneous legacy smoke package | `0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal-v2-e2e` (immutable; points at Provider-Court; do not use for UpdateSeal candidates) |
| Controlled v2 candidate | `0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal@0.1.0-v2-smoke` — **APPROVED** |

The official project repository is `https://github.com/edwarderlick/UpdateSeal`. Provider-Court is a separate GenLayer project. An earlier Studio-dev smoke registration (`updateseal-v2-e2e`) incorrectly used Provider-Court as its repository URL. That on-chain package cannot be edited or deleted and may still appear in public registry enumeration. Evidence Schema v2 candidates must use the `updateseal` package and the published UpdateSeal baseline.

Studio-dev is a preview environment and may reset. Do not treat a Studio-dev address as durable mainnet state.

Write methods: `register_package`, `submit_candidate`, `evaluate_candidate`. Frontend pages do not submit these calls yet.

### Public read architecture

Public reads use `createClient({ chain: studioDevnet })` and `client.readContract(...)`. They do not use Wagmi or Viem ABI calls against this intelligent contract.

| Layer | Responsibility |
| :--- | :--- |
| `frontend/src/lib/updateSealConfig.ts` | Validate public env (`RPC`, chain `61997`, contract address, `live`/`demo`) |
| `frontend/src/lib/genlayerClient.ts` | Lazy singleton read-only GenLayerJS client |
| `frontend/src/services/updateSealContract.ts` | Typed view methods and bounded registry snapshot |
| `frontend/src/services/updateSealMappers.ts` | Contract records → view models |
| `frontend/src/features/registry/registryQueries.ts` | TanStack Query hooks (`staleTime` 30s, retry 2) |
| `frontend/src/pages/RegistryPage.tsx` | Live snapshot or demo mock list |
| `frontend/src/pages/LivePackageDetailPage.tsx` | Publisher-scoped on-chain package dossier |

Read methods: `package_count`, `package_uid_at`, `package_exists`, `get_package`, `get_package_uid`, `candidate_count`, `candidate_id_at`, `candidate_exists`, `get_candidate`, `get_candidate_id`.

### Live / demo mode

Set `VITE_UPDATESEAL_DATA_MODE` to `live` or `demo` (see `frontend/.env.example`). Unknown values produce a visible configuration error.

- **live:** registry data comes only from the deployed contract. RPC failures show an error and Retry. Mock records are never substituted.
- **demo:** the original mock registry and Atlas dossier remain, labeled `DEMO DATA`.

Live registry cards link to `/packages/:publisher/:packageSlug`. The demo Atlas route `/packages/:packageId` is unchanged.

### Public release verification

`/verify` is a wallet-free Studio-dev lookup. Supported methods are candidate ID (`publisher/slug@version`) and package UID plus version. “Verified” means the on-chain record and its decision fields were read and validated; it does not mean every status is approved. Completed verdicts recompute the canonical decision hash in the browser and compare it with the stored `decision_hash`. Evidence bytes are hashed only when you click Verify Evidence Bytes. Studio-dev is a preview network and may reset.

### Live dashboard and registry activity

`/dashboard` scans paginated registry indexes (20 records per page, at most 4 concurrent reads) for packages whose publisher matches the connected wallet. Connecting a wallet selects that public address only; dashboard reads do not request a signature. The contract has no publisher index and no timestamps.

`/activity` is a public current registry snapshot with separate package and candidate lists ordered by their own registry indexes. It is not an event log and does not invent transaction hashes or a unified chronology. Filters apply to loaded records.

`0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal` is the official UpdateSeal package. `…/updateseal-v2-e2e` is an immutable legacy smoke record and remains visible. Studio-dev is a preview network and may reset.

---

## Repository Structure

```text
D:\UpdateSeal
├── .gitignore
├── README.md
├── docs
│   └── design
│       ├── STITCH_SOURCE_MAP.md
│       └── DESIGN.md
└── frontend
    ├── public
    ├── src
    │   ├── app
    │   │   ├── App.tsx
    │   │   └── router.tsx
    │   ├── assets
    │   ├── components
    │   │   ├── layout
    │   │   ├── navigation
    │   │   ├── forms
    │   │   ├── capabilities
    │   │   ├── packages
    │   │   ├── releases
    │   │   ├── decisions
    │   │   ├── transactions
    │   │   ├── feedback
    │   │   └── ui
    │   ├── features
    │   │   ├── registration
    │   │   ├── candidate-release
    │   │   ├── verification
    │   │   ├── wallet
    │   │   └── transactions
    │   ├── hooks
    │   ├── lib
    │   ├── mocks
    │   ├── pages
    │   ├── services
    │   ├── styles
    │   ├── test
    │   ├── types
    │   └── main.tsx
    ├── .env.example
    ├── .gitignore
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── tsconfig.json
    ├── vite.config.ts
    └── vercel.json
```

---

## Application Routes

| Path | Screen Description |
| :--- | :--- |
| `/` | Editorial Overview & Protocol Landing Page |
| `/registry` | Public Package Registry (live Studio-dev snapshot or demo mocks) |
| `/packages/:publisher/:packageSlug` | Live on-chain package detail (publisher-scoped) |
| `/packages/:publisher/:packageSlug/candidates/:version` | Live on-chain candidate record |
| `/packages/:publisher/:packageSlug/candidates/:version/decision` | Live public decision report (status-selected verdict) |
| `/packages/:publisher/:packageSlug/candidates/:version/review` | Live pending evaluation, or redirect to the decision report |
| `/packages/atlas-research-agent` | Atlas Research Agent Dossier, Charter Matrix, and History |
| `/register/identity` | Register Package Wizard — Step 1: Package Identity & Repository |
| `/register/baseline` | Register Package Wizard — Step 2: Approved Baseline & Commit SHA |
| `/register/capabilities` | Register Package Wizard — Step 3: Formal 6-Category Capability Charter |
| `/register/review` | Register Package Wizard — Step 4: Summary Review & Registration Signing |
| `/register/success` | Registration Confirmation & Sealed Baseline On-Chain Receipt |
| `/packages/atlas-research-agent/releases/new/identity` | Candidate Release Submission — Step 1: Release Identity |
| `/packages/atlas-research-agent/releases/new/evidence` | Candidate Release Submission — Step 2: Boundary Diff & Evidence |
| `/packages/atlas-research-agent/releases/new/confirm` | Candidate Release Submission — Step 3: Review & Escrow Confirmation |
| `/reviews/review-atlas-150` | Consensus Progress Tracker with Interactive Demo Preview Controls |
| `/decisions/approved` | Decision Report `0x01`: Approved & Sealed On-Chain |
| `/decisions/review-required` | Decision Report `0x02`: Review Required (Multi-Sig Governance) |
| `/decisions/capability-violation` | Decision Report `0x03`: Hard Capability Violation (Blocked) |
| `/decisions/evidence-unavailable` | Decision Report `0x04`: Evidence Unavailable (Fetch Failure) |
| `/verify` | Public live release verification (candidate ID or package UID + version; no wallet) |
| `/dashboard` | Live developer dashboard (wallet-aware publisher scan; read-only) or demo packages |
| `/activity` | Live public registry activity snapshot (no wallet) or demo feed |
| `/how-it-works` | Technical Protocol Guide & Architectural Specification |

---

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

---

## Getting Started

### 1. Installation

Navigate to the `frontend` directory and install dependencies:

```bash
cd frontend
npm install
```

### 2. Local Development

Start the local Vite development server:

```bash
npm run dev
```

The application will be served locally at `http://127.0.0.1:5173`.

### 3. Running Tests

Run the full Vitest automated test suite:

```bash
npm run test -- --run
```

### 4. Production Build

Build the optimized production distribution:

```bash
npm run build
```

---

## Vercel Deployment & Reown AppKit Configuration

When deploying this frontend to Vercel:

1. **Vercel Environment Variables:**
   - Configure `VITE_REOWN_PROJECT_ID` in your Vercel Project Settings (`Settings` -> `Environment Variables`).
   - Configure public network variables (`VITE_GENLAYER_RPC_URL`, `VITE_GENLAYER_CHAIN_ID=61997`, `VITE_GENLAYER_CHAIN_NAME`, `VITE_GENLAYER_SYMBOL=GEN`, `VITE_GENLAYER_EXPLORER_URL`).
2. **Reown Allowed Domains:**
   - The deployed production domain must be added to your Reown project's allowed domains/origins list in the [Reown Cloud Dashboard](https://cloud.reown.com/).
3. **SPA Routing:**
   - Single Page Application (SPA) rewrites are automatically configured in `frontend/vercel.json`.

---

## Evidence Schema v2

Evidence documents use schema version `2` and omit `candidate_commit_sha`. Putting a commit SHA inside the evidence file would change the Git tree and therefore the SHA. Bind the candidate through the stored commit SHA, the raw GitHub URL commit segment, and the SHA-256 of the exact evidence bytes.

Create `evidence-v2.json`, add it to the candidate tree, commit, then use that commit SHA in `submit_candidate` and the raw GitHub URL. Evidence Schema v1 is incompatible.

The active Studio-dev contract at `0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3` evaluates Evidence Schema v2. The previous address `0x6A882db328782051dFf05C40F4C34b3F223cd80A` is legacy Evidence Schema v1. v1 and v2 evidence documents are incompatible. Do not send v2 candidates to the v1 address.

`submit_candidate` and `evaluate_candidate` remain separate transactions. `evaluate_candidate` is still not wired into the frontend.

## Next Planned Integration Phase

1. **Dashboard and activity feed** remain demo-backed.
2. **`evaluate_candidate` is still not a frontend write.** Public verification and decision reports are read-only.
3. Live multi-validator review progress is not simulated from on-chain events; completed live candidates open the decision report.

