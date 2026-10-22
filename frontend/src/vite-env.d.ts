/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REOWN_PROJECT_ID: string;
  readonly VITE_GENLAYER_RPC_URL: string;
  readonly VITE_GENLAYER_CHAIN_ID: string;
  readonly VITE_GENLAYER_CHAIN_NAME: string;
  readonly VITE_GENLAYER_SYMBOL: string;
  readonly VITE_GENLAYER_EXPLORER_URL: string;
  readonly VITE_UPDATESEAL_CONTRACT_ADDRESS: string;
  readonly VITE_UPDATESEAL_DATA_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
