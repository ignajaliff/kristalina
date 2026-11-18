import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// ═══════════════════════════════════════════════════════════════════════════
// Versión del build
// ═══════════════════════════════════════════════════════════════════════════
// Se calcula una vez por build y se usa en dos lugares que tienen que coincidir:
//   1. __APP_VERSION__  → queda embebida dentro del bundle JS que corre en la
//      pestaña del usuario.
//   2. /version.json    → archivo suelto que Cloudflare sirve sin cachear
//      (ver public/_headers).
// El cliente compara ambas: si difieren, es que se desplegó algo nuevo y la
// pestaña abierta está corriendo código viejo.
//
// En Cloudflare se puede fijar VITE_APP_VERSION como Build Variable (por
// ejemplo con el hash del commit) para que un rebuild sin cambios no dispare
// el aviso. Si no está definida, se usa la fecha del build.
const APP_VERSION = process.env.VITE_APP_VERSION || String(Date.now());

// Emite /version.json dentro de dist/ con la versión de este build.
const versionFilePlugin = (version: string): Plugin => ({
  name: "kristalina-version-file",
  apply: "build",
  generateBundle() {
    this.emitFile({
      type: "asset",
      fileName: "version.json",
      source: JSON.stringify({ version }, null, 2),
    });
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// Variables de entorno obligatorias
// ═══════════════════════════════════════════════════════════════════════════
// Las VITE_* quedan dentro del bundle al buildear. Si falta alguna, el build
// pasaría igual y la app arrancaría rota contra Supabase. Por eso se frena el
// build: en Cloudflare un build fallido no reemplaza la versión en producción.
const REQUIRED_ENV = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"] as const;

const assertRequiredEnv = (mode: string) => {
  // loadEnv lee .env y también process.env (las Build Variables de Cloudflare).
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const missing = REQUIRED_ENV.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno: ${missing.join(", ")}. ` +
        "En local van en .env (ver .env.example); en Cloudflare, en " +
        "Worker → Settings → Build → Build Variables and Secrets.",
    );
  }
};

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  if (command === "build") assertRequiredEnv(mode);

  return {
    server: {
      host: "::",
      port: 8080,
    },
    define: {
      __APP_VERSION__: JSON.stringify(APP_VERSION),
    },
    build: {
      // Mismos navegadores que soportaba Vite 5. Vite 7 subió el mínimo por
      // defecto y dejaría afuera equipos viejos (ej. iPhone con Safari 14-15).
      target: ["es2020", "edge88", "firefox78", "chrome87", "safari14"],
    },
    plugins: [
      react(),
      versionFilePlugin(APP_VERSION),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
