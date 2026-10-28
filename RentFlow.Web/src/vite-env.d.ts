/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_PAYSTACK_PUBLIC_KEY?: string;
  readonly VITE_GOOGLE_ADSENSE_CLIENT_ID?: string;
  readonly VITE_GOOGLE_ADSENSE_SLOT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
