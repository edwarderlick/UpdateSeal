# Stitch Source Map — UpdateSeal

This document records the mapping of all original Stitch design exports into the unified Vite + React + TypeScript application.

> **Visual Reference Notice:**
> All `screen.png` files located within the original Stitch export directories were utilized solely as visual reference evidence for editorial layout fidelity, typography hierarchy, palette application, and component styling. No screenshot PNG images are embedded into the production bundle, and no HTML files are iframed.

---

## Source Directory Mapping Table

| Original Stitch Directory | Final React Route / Component | Type | Description |
| :--- | :--- | :--- | :--- |
| `updateseal_on_chain_release_approval_registry` | `/` (`LandingPage`) | Page | Full long-form editorial landing page featuring hero, mission, protocol stats, capability highlights, workflow, verdict cards, runtime enforcement example, trust principles, and footer wordmark. |
| `updateseal_public_package_registry` | `/registry` (`RegistryPage`) | Page | Public package registry directory with live text search, status filters, capability filters, sorting, responsive grid, pagination, and empty states. |
| `updateseal_package_detail_atlas_research_agent` | `/packages/atlas-research-agent` (`PackageDetailPage`) | Page | Comprehensive package detail dossier for Atlas Research Agent, including commit SHAs, capability charter matrix, release history, external links, and verification shortcuts. |
| `updateseal_register_package_step_1` | `/register/identity` (`RegisterStep1Page`) | Page | Multi-step registration wizard Step 1: Package Identity & GitHub repository validation with persistent session state. |
| `updateseal_register_package_step_2_approved_baseline` | `/register/baseline` (`RegisterStep2Page`) | Page | Registration wizard Step 2: Approved baseline declaration with 40-character hexadecimal commit SHA and manifest validation. |
| `updateseal_register_package_step_3_capability_charter` | `/register/capabilities` (`RegisterStep3Page`) | Page | Registration wizard Step 3: Formal capability charter matrix covering all 6 security boundaries with interactive policy toggles and live JSON preview. |
| `updateseal_register_package_step_4_review_register` | `/register/review` (`RegisterStep4Page`) | Page | Registration wizard Step 4: Comprehensive charter review and transaction submission trigger. |
| `updateseal_registration_success_baseline_sealed` | `/register/success` (`RegisterSuccessPage`) | Page | Registration completion screen showing on-chain sealed baseline status, canonical contract hash, and direct navigation links. |
| `updateseal_submit_candidate_step_1_release_identity` | `/packages/atlas-research-agent/releases/new/identity` (`CandidateStep1Page`) | Page | Candidate submission Step 1: Release versioning, candidate commit SHA, and release notes declaration. |
| `updateseal_submit_candidate_release_evidence_boundary_diff` | `/packages/atlas-research-agent/releases/new/evidence` (`CandidateStep2Page`) | Page | Candidate submission Step 2: Automated capability boundary diff engine, AST inspection, and deterministic evidence checks. |
| `updateseal_submit_candidate_step_3_review_confirm` | `/packages/atlas-research-agent/releases/new/confirm` (`CandidateStep3Page`) | Page | Candidate submission Step 3: Candidate verification summary, escrow bond confirmation, and dispatch signing. |
| `updateseal_review_progress_consensus_tracker` | `/reviews/review-atlas-150` (`ReviewTrackerPage`) | Page | Live on-chain consensus tracker with multi-validator node progress, stage timeline, and interactive demo preview controls for simulating all 4 verdicts. |
| `updateseal_decision_report_approved_0x01` | `/decisions/approved` (`DecisionApprovedPage`) | Page | Canonical Decision Report `0x01`: Approved verdict dossier, consensus node votes, signed AST receipt, and registry status. |
| `updateseal_decision_report_review_required_0x02` | `/decisions/review-required` (`DecisionReviewRequiredPage`) | Page | Decision Report `0x02`: Review Required verdict with multi-sig governance escalation triggers and quorum criteria. |
| `updateseal_decision_report_capability_violation` | `/decisions/capability-violation` (`DecisionViolationPage`) | Page | Decision Report `0x03`: Hard Capability Violation rejection with side-by-side diff extract, unauthorized shell execution callout, and unwhitelisted domain notice. |
| `updateseal_decision_report_evidence_unavailable_0x04` | `/decisions/evidence-unavailable` (`DecisionUnavailablePage`) | Page | Decision Report `0x04`: Evidence Unavailable verdict when upstream git commit or build artifacts cannot be cryptographically fetched. |
| `updateseal_public_release_verification_tool` | `/verify` (`VerificationPage`) | Page | Public cryptographic release verification tool accepting Package ID and commit SHA, returning machine-readable JSON with one-click copy. |
| `updateseal_my_packages_dashboard` | `/dashboard` (`DashboardPage`) | Page | Developer package management dashboard with active packages, pending candidate evaluations, recent verdicts, and first-use empty state toggle. |
| `updateseal_public_activity_feed` | `/activity` (`ActivityFeedPage`) | Page | Real-time on-chain governance activity log with event category filters, decision code tags, pagination, and transaction explorers. |
| `updateseal_how_it_works_protocol_guide` | `/how-it-works` (`HowItWorksPage`) | Page | Protocol architecture guide explaining the 4 canonical verdicts, immutable charter boundaries, GenLayer intelligent contracts, and developer workflows. |
| `updateseal_connect_wallet_modal` | `ConnectWalletModal` (`src/components/ui/ConnectWalletModal.tsx`) | Shared Modal | Reusable wallet selection dialog supporting simulated Web3 providers (MetaMask, Coinbase Wallet, WalletConnect) with typed adapter state. |
| `updateseal_network_switch_modal_chain_61997` | `WrongNetworkModal` (`src/components/ui/WrongNetworkModal.tsx`) | Shared Modal | Reusable network switch modal displaying GenLayer Studio Next Chain ID 61997 RPC configuration and one-click add button. |
| `updateseal_transaction_confirmation_signing_modal` | `TransactionConfirmationModal` & `TransactionStatusModal` (`src/components/transactions/`) | Shared Modals | Reusable 4-stage transaction signing modal displaying EIP-712 structured data payload, escrow bond lockup, validator quorum parameters, and live broadcasting states. |

---

## Architectural Notes

1. **Shared Layout:** All pages share `AppHeader`, `AppFooter`, `NetworkBanner`, and `MobileMenu`.
2. **State Management:**
   - Registration flow state is centralized in `RegistrationContext` and backed by `sessionStorage`.
   - Candidate release flow state is centralized in `CandidateContext` and backed by `sessionStorage`.
   - Wallet connection state is managed via `useWallet` hook backed by a typed adapter interface.
3. **Design System:** All tokens (cream, forest, orange, pastel yellow, coral pink, vibrant cyan, ink charcoal, 0px border radius, sharp hairlines, rotated stickers) are implemented through local Tailwind CSS configuration in `frontend/tailwind.config.js` and `frontend/src/styles/globals.css`.
