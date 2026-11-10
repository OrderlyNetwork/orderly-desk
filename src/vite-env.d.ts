/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AGENTS_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
