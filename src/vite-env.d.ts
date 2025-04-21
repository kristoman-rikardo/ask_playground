/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VOICEFLOW_API_KEY: string;
  readonly VITE_VOICEFLOW_PROJECT_ID: string;
  readonly VITE_VOICEFLOW_VERSION_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
