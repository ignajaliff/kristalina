# Kristalina — Sistema de gestión

SPA en React + Vite + Supabase, deployada en Cloudflare Workers (static assets). Contexto completo del proyecto en [CLAUDE.md](CLAUDE.md) y reglas en [ai-pmp/](ai-pmp/).

## Desarrollo local

Requiere Node 22 (fijado en `.nvmrc`).

```sh
nvm use
npm ci
cp .env.example .env   # completar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev            # http://localhost:8080
```

## Build

```sh
npm run build          # tsc -b + vite build → dist/
```

El build falla si faltan las variables `VITE_SUPABASE_*`.

## Deploy

Cada push a `main` deploya a producción en Cloudflare (Workers Builds). Cualquier otra rama genera una URL de preview.

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Build Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

Configuración: [wrangler.jsonc](wrangler.jsonc) y [public/_headers](public/_headers). Detalle en [ai-pmp/cloudflare-rules.txt](ai-pmp/cloudflare-rules.txt).
