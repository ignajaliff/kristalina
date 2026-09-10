import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// ═══════════════════════════════════════════════════════════════════════════
// Versión del build
// ═══════════════════════════════════════════════════════════════════════════
// Se calcula una vez por build y se usa en dos lugares que tienen que coincidir:
//   1. __APP_VERSION__  → queda embebida dentro del bundle JS que corre en la
//      pestaña del usuario.
//   2. /version.json    → archivo suelto que sirve nginx sin cachear.
// El cliente compara ambas: si difieren, es que se desplegó algo nuevo y la
// pestaña abierta está corriendo código viejo.
//
// En CapRover/CI se puede fijar VITE_APP_VERSION (por ejemplo el hash del
// commit) para que un rebuild sin cambios no dispare el aviso. Si no está
// definida, se usa la fecha del build.
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

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  plugins: [
    react(),
    versionFilePlugin(APP_VERSION),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
