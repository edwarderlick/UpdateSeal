# Deploy UpdateSeal to Vercel

Manual GitHub import. Do not put private keys, mnemonics, burner env files, or server secrets in Vercel.

Studio-dev is a preview network and may reset. Do not treat a Studio-dev address as durable mainnet state.

## A. Import

1. Open Vercel.
2. Add New Project.
3. Import `https://github.com/edwarderlick/UpdateSeal`.
4. Set **Root Directory** to `frontend`.
5. Confirm the **Vite** framework preset.
6. Install command: `npm ci`
7. Build command: `npm run build`
8. Output directory: `dist`

`frontend/vercel.json` rewrites unknown paths to `index.html` so React Router deep links refresh correctly. Vercel serves matching files in `dist` first, so `/assets/*` hashed bundles remain static files.

## B. Environment variables

Set these public frontend values on **Production** and **Preview** unless you deliberately want preview deployments in demo mode. Redeploy after changing them.

| Name | Value |
| :--- | :--- |
| `VITE_REOWN_PROJECT_ID` | Your Reown Cloud project ID |
| `VITE_GENLAYER_RPC_URL` | `https://studio-dev.genlayer.com/api` |
| `VITE_GENLAYER_CHAIN_ID` | `61997` |
| `VITE_GENLAYER_CHAIN_NAME` | `GenLayer Studio-dev` |
| `VITE_GENLAYER_SYMBOL` | `GEN` |
| `VITE_GENLAYER_EXPLORER_URL` | `https://explorer-studio-dev.genlayer.com/` |
| `VITE_UPDATESEAL_CONTRACT_ADDRESS` | `0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3` |
| `VITE_UPDATESEAL_DATA_MODE` | `live` |

These `VITE_` values are compiled into the browser bundle. They are public configuration, not secrets.

Never place a private key, mnemonic, burner env, or server secret in Vercel.

## C. Reown domain allowlist

After Vercel assigns the production domain, add that exact hostname to the Reown project-domain allowlist **if** allowlist enforcement is enabled in the Reown dashboard. If the dashboard does not enforce an allowlist, no extra Reown step is required.

## D. Post-deployment checks

Open the assigned Vercel URL (desktop and 375px). Confirm `LIVE • STUDIO-DEV`, contract `0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3`, no automatic wallet modal, no signature or transaction, and no mock fallback.

| Route | Expect |
| :--- | :--- |
| `/` | Landing loads |
| `/registry` | Official package `updateseal` visible |
| `/activity` | Current registry snapshot |
| `/verify` | Wallet-free lookup |
| `/verify?candidate=0xb3f7518df619ef485f7a1568ed3705bb6f5b0407%2Fupdateseal%400.1.0-v2-smoke` | Candidate found, **APPROVED**, decision hash verifies |
| `/verify?candidate=0xb3f7518df619ef485f7a1568ed3705bb6f5b0407%2Fupdateseal%400.2.0-frontend-eval-smoke` | Candidate found, **REVIEW_REQUIRED**, decision hash verifies |
| `/packages/0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal` | Official package dossier |
| `/packages/0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal/candidates/0.1.0-v2-smoke` | **APPROVED** |
| `/packages/0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal/candidates/0.1.0-v2-smoke/decision` | Approved report; hash verifies |
| `/packages/0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal/candidates/0.2.0-frontend-eval-smoke` | **REVIEW_REQUIRED** |
| `/packages/0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal/candidates/0.2.0-frontend-eval-smoke/decision` | Review-required report; hash verifies |
| `/dashboard` | Disconnected dashboard is safe |
| `/register` | Live registration wizard (no automatic write) |

Then:

1. Refresh each deep route directly. It must not 404.
2. Browser Back/Forward must restore the previous route.
3. `/assets/*` files must remain hashed JS/CSS, not `index.html`.
4. No horizontal overflow at 375px.
5. No unhandled console errors.

The official package is `0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal`. The immutable `updateseal-v2-e2e` smoke package may still appear in enumeration; it is not the UpdateSeal application package.
