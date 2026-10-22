# UpdateSeal Frontend

Vite + React + TypeScript web application for the UpdateSeal release approval registry.

## GenLayerJS public reads and live registration

The frontend uses **genlayer-js@2.0.0-rc.1** (exact version, no `^`/`~`) for Studio-dev intelligent-contract reads and the `register_package` write:

- `createClient({ chain: studioDevnet })` from `genlayer-js` / `genlayer-js/chains`
- `client.readContract({ address, functionName, args })`
- `client.writeContract({ address, functionName, args, account })` with the connected Reown/Wagmi wallet
- `client.waitForTransactionReceipt({ hash, waitUntil: 'finalized' })`

Do not call UpdateSealRegistry with Wagmi or Viem EVM ABI helpers. The read-only client is a lazy singleton and does not require a connected wallet. Writes use a separate client bound to the connected account and wallet provider.

### Required public environment variables

See `.env.example`:

```bash
VITE_GENLAYER_RPC_URL=https://studio-dev.genlayer.com/api
VITE_GENLAYER_CHAIN_ID=61997
VITE_UPDATESEAL_CONTRACT_ADDRESS=0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3
VITE_UPDATESEAL_DATA_MODE=live
```

Wallet connection also needs `VITE_REOWN_PROJECT_ID` for Reown AppKit. Never put private keys, mnemonics, or wallet secrets in source or env files.

`VITE_UPDATESEAL_DATA_MODE` must be exactly `live` or `demo`. Unknown values show a configuration error. Live mode reads and registers against the deployed contract; demo mode uses mock records labeled `DEMO DATA` and never sends an RPC write. Live RPC failures show an error and Retry and never fall back to mocks. Invalid configuration disables Register Package submission.

Active contract: `0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3` on Studio-dev (chain 61997), Evidence Schema v2. Legacy v1 address `0x6A882db328782051dFf05C40F4C34b3F223cd80A` remains in migration history. v1 and v2 evidence documents are incompatible. Studio-dev is a preview network and may reset.

Official project repository: `https://github.com/edwarderlick/UpdateSeal`. The intended live application package is `updateseal` (`0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal`), baseline `b5d498fa08949e1e0f5113fb2f9d154368dfa97c`. A controlled Evidence Schema v2 candidate `0.1.0-v2-smoke` is on-chain **APPROVED**. The public live decision report is at `/packages/:publisher/:packageSlug/candidates/:version/decision`. Presentation is selected from the on-chain `status` string only (`APPROVED`, `REVIEW_REQUIRED`, `VIOLATION`, `EVIDENCE_UNAVAILABLE`, or a dedicated `PENDING` state). `finding_codes_json` must parse as a JSON array of non-empty strings; completed verdicts require a 64-character lowercase hex `decision_hash`. Malformed values show an on-chain data integrity error. `evaluate_candidate` remains unwired in this frontend. The public registry enumerates every on-chain package, including the immutable erroneous smoke package `updateseal-v2-e2e` that incorrectly points at Provider-Court. Do not treat that smoke package as the UpdateSeal application package.

### How live registration works

1. Complete the Register Package wizard. The frontend builds a canonical v1 charter (`schema_version`, `summary`, `allowed_capabilities`, `forbidden_capabilities`, `allowed_domains`, `required_evidence`, `policy_text`) matching the contract. The contract hashes the charter; the frontend does not send `charter_hash`.
2. Connect a wallet on chain ID 61997. The wizard does not request a signature until you click the final register button.
3. A read-only preflight calls `get_package_uid` and `package_exists`. If the package already exists, submission is blocked and the live package page is linked.
4. `register_package(package_slug, repository_url, baseline_commit_sha, charter_json)` is submitted with the connected wallet as sender.
5. The UI waits for consensus (`waitUntil: 'finalized'`). A transaction hash is not treated as success. Timeout means status is unknown.
6. After finalized/accepted execution, the app reads the package back, invalidates registry queries, and links to `/packages/{publisher}/{packageSlug}`.

Registration proves which wallet registered the package. It does not prove ownership of the GitHub repository.

### How live candidate submission works

Live candidate wizard routes:

- `/packages/:publisher/:packageSlug/releases/new/identity`
- `/packages/:publisher/:packageSlug/releases/new/evidence`
- `/packages/:publisher/:packageSlug/releases/new/confirm`
- Candidate record: `/packages/:publisher/:packageSlug/candidates/:version`
- Live decision report: `/packages/:publisher/:packageSlug/candidates/:version/decision`
- Live review (pending, or redirect to the decision report): `/packages/:publisher/:packageSlug/candidates/:version/review`

The live package UID is `lowercase(publisher) + "/" + packageSlug`. Direct refresh on every live wizard step reloads the on-chain package. Demo Atlas flow remains at `/packages/:packageId/releases/new/*` and is labeled `DEMO DATA`.

1. Only the registered package publisher wallet may submit. GitHub ownership is not proven.
2. Generate an **Evidence Schema v2** document first. It must contain exactly:
   `schema_version` (integer `2`), `package_uid`, `version`, `baseline_commit_sha`, `diff_summary`, `changed_files`, `declared_capabilities`, `requested_domains`, `evidence_items`, `tests`.
   Do not include `candidate_commit_sha` in the JSON. A Git commit hash depends on file bytes, so putting the SHA inside the evidence file would change the SHA.
3. Add `evidence-v2.json` to the candidate tree, commit, then use the resulting commit SHA in the candidate form and in the raw GitHub URL:
   `https://raw.githubusercontent.com/{owner}/{repository}/{candidate_commit_sha}/{path}`
   UpdateSeal does not upload, commit, or push the repository. The URL commit segment is the candidate binding.
4. The frontend fetches those raw bytes (HTTP 200, max 100,000 bytes), computes SHA-256 over the exact fetched bytes, and compares that digest to the entered hash. It does not hash a reserialized JSON object. Evidence Schema v1 is rejected with a migration message.
5. `submit_candidate(package_uid, version, candidate_commit_sha, evidence_uri, evidence_hash)` is submitted with fee estimation first. The candidate ID is `package_uid + "@" + version`. The candidate record still stores `candidate_commit_sha`.
6. After a successful receipt the candidate is **PENDING**. Evaluation is a separate `evaluate_candidate` transaction and is not a frontend write. The public decision report reads the stored verdict. The controlled smoke candidate `0.1.0-v2-smoke` is already on-chain **APPROVED**.
7. Studio-dev is a preview network and may reset. The active contract at `0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3` evaluates Evidence Schema v2. The previous address `0x6A882db328782051dFf05C40F4C34b3F223cd80A` is legacy Evidence Schema v1. v1 and v2 evidence documents are incompatible. Candidate submission and evaluation remain separate transactions. `evaluate_candidate` is still not wired in this frontend.

Candidate draft sessionStorage is namespaced by live package UID (`updateseal_candidate_form:live:{packageUid}`). Atlas demo drafts are stored separately and are never restored into a live package. In-flight transaction hashes are kept in memory for this tab session; a full browser refresh does not restore a pending hash.

Public live verification is at `/verify`. Lookup a candidate ID (`publisher/slug@version`) or a package UID plus version. “Verified” means the on-chain record and its decision fields were read and validated; it does not mean every status is approved. Completed verdicts recompute the canonical decision hash in the browser. Evidence bytes are hashed only when you click Verify Evidence Bytes. Public verification does not open a wallet. Studio-dev is a preview network and may reset.

Read methods: `package_count`, `package_uid_at`, `package_exists`, `get_package`, `get_package_uid`, `candidate_count`, `candidate_id_at`, `candidate_exists`, `get_candidate`, `get_candidate_id`.

Write methods used by the frontend: `register_package`, `submit_candidate`. `evaluate_candidate` is not called.

Live packages are identified by publisher and slug: `/packages/:publisher/:packageSlug`.

## Vercel Deployment & Reown AppKit Configuration

When deploying this frontend to Vercel, ensure the following configuration steps are performed:

### 1. Environment Variables in Vercel

Add the following environment variables in your Vercel Project Settings (`Settings` -> `Environment Variables`):

```bash
VITE_REOWN_PROJECT_ID=your_reown_project_id
VITE_GENLAYER_RPC_URL=https://studio-dev.genlayer.com/api
VITE_GENLAYER_CHAIN_ID=61997
VITE_GENLAYER_CHAIN_NAME=GenLayer Studio-dev
VITE_UPDATESEAL_CONTRACT_ADDRESS=0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3
VITE_UPDATESEAL_DATA_MODE=live
VITE_GENLAYER_SYMBOL=GEN
VITE_GENLAYER_EXPLORER_URL=https://explorer-studio-dev.genlayer.com/
```

- **Important:** `VITE_REOWN_PROJECT_ID` must be configured in Vercel to enable live wallet connections across all supported Web3 providers (MetaMask, Rabby, Coinbase Wallet, and WalletConnect).
- Only `VITE_` prefixed environment variables are bundled into the client build.

### 2. Reown Cloud Allowed Domains

- The deployed production domain (e.g. `your-app.vercel.app` or custom domain) must be added to your Reown project's allowed domains/origins list in the [Reown Cloud Dashboard](https://cloud.reown.com/).
- Reown AppKit uses `window.location.origin` at runtime to authenticate connection requests with the Reown relayer.

### 3. SPA Fallback Routing

- Single Page Application (SPA) routing is preserved via `vercel.json`:
  ```json
  {
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }
  ```

---

## Local Development

```bash
npm install
npm run dev
```

Server runs by default at `http://127.0.0.1:5173`.

## Automated Testing

```bash
npm run test -- --run
```

## Production Build

```bash
npm run build
```
