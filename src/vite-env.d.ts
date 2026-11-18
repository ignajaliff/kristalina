/// <reference types="vite/client" />

// Versión del build, inyectada por Vite (ver `define` en vite.config.ts).
// Es la misma que queda escrita en /version.json al compilar.
declare const __APP_VERSION__: string;

// Variables de entorno disponibles en el frontend. Las mismas, con el mismo
// nombre, se cargan en Cloudflare como Build Variables (ver .env.example).
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
