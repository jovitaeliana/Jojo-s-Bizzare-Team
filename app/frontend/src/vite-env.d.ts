/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HEDERA_ACCOUNT_ID: string;
  readonly VITE_HEDERA_PRIVATE_KEY: string;
  readonly VITE_HEDERA_NETWORK: string;
  readonly VITE_MIRROR_NODE_URL: string;
  readonly VITE_JSON_RPC_URL: string;
  readonly VITE_ERC8004_REGISTRY: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_SERP_API_KEY?: string;
  readonly VITE_GOOGLE_API_KEY?: string;
  readonly VITE_GOOGLE_CSE_ID?: string;
  readonly VITE_OPENAI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  electron?: {
    sendMessage: (channel: string, data: any) => void;
    onMessage: (channel: string, callback: Function) => void;
    windowControls: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
    };
  };
}
