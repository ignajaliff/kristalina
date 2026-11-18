# CLAUDE.md — Hoja de ruta del proyecto

> Este archivo es leído automáticamente por Claude al iniciar cualquier conversación en este proyecto.
> Contiene el contexto del sistema, las decisiones tomadas y el estado actual del desarrollo.
> **Mantenerlo actualizado es obligatorio** — es la memoria del proyecto entre sesiones.

---

## Proyecto

**Nombre**: Kristalina
**Tipo**: Sistema de gestión a medida
**Cliente**: Kristalina
**Desarrollado por**: Nuvvora
**Inicio**: 2025-06 (arrancó en Lovable; desde 2026-06 se desarrolla directo en el repo)

### Descripción del sistema

Sistema de gestión interno para Kristalina. Cubre el circuito comercial (prospectos, presupuestos con PDF, aceptación y contratos) y la gestión posterior de cada edificio/cliente: pagos mensuales, gestiones, reportes con fotos en PDF y envío de emails a los contactos. Lo usan administradores y vendedores.

---

## Reglas del proyecto

Este proyecto respeta estrictamente los siguientes documentos. Leerlos antes de hacer cualquier cambio:

* [ai-pmp/rules.txt](ai-pmp/rules.txt) — Stack, arquitectura general y reglas de código
* [ai-pmp/frontend-rules.txt](ai-pmp/frontend-rules.txt) — Componentes, formularios, estado y UI
* [ai-pmp/supabase-rules.txt](ai-pmp/supabase-rules.txt) — Base de datos, RLS, seguridad y queries
* [ai-pmp/security-rules.txt](ai-pmp/security-rules.txt) — Signup, trampas de RLS, storage, hardening y auditoría
* [ai-pmp/error-handling.txt](ai-pmp/error-handling.txt) — Manejo de errores y estados de carga
* [ai-pmp/naming-rules.txt](ai-pmp/naming-rules.txt) — Convenciones de nombres
* [ai-pmp/git-rules.txt](ai-pmp/git-rules.txt) — Commits y ramas
* [ai-pmp/cloudflare-rules.txt](ai-pmp/cloudflare-rules.txt) — Deploy en Cloudflare Workers: versiones, wrangler.jsonc, headers, límites, variables

> Proyecto heredado (nació en Lovable): el código existente no sigue todavía todas las reglas de estructura del kit. El código **nuevo** sí las sigue. Ver "Decisiones técnicas" para las diferencias aceptadas.

---

## Stack del proyecto

* React 18.3 + Vite 7 + TypeScript (`strict: false`, heredado)
* Node.js 22 LTS (fijado en `.nvmrc`)
* Tailwind CSS v3.4 + postcss (`tailwind.config.ts`) + shadcn/ui
* Supabase (auth + base de datos + storage + Edge Function `send-email`)
* TanStack React Query
* React Hook Form + Zod
* React Router v6
* jsPDF (+ html2canvas) para PDFs de presupuestos, contratos y reportes
* Deploy: Cloudflare Workers con static assets (wrangler 4.x)

> Las diferencias con `ai-pmp/rules.txt` (React 19, Tailwind v4, TS strict, estructura por features) están registradas en "Decisiones técnicas".

---

## Comandos

```
nvm use              → usar el Node de .nvmrc (22). Correrlo antes de build o deploy
npm run dev          → servidor de desarrollo en http://localhost:8080
npm run build        → tsc -b + vite build (debe pasar sin errores antes de entregar). Es el mismo build que corre Cloudflare
npx tsc --noEmit -p tsconfig.app.json → verificación de tipos (correr antes de entregar cualquier cambio)
npm run lint         → linter (tiene ~145 problemas heredados; no sumar nuevos)
npm run deploy       → build + wrangler deploy manual. SOLO si el usuario lo pide: producción se deploya por push a main
```

El build **falla a propósito** si faltan `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY` (ver `vite.config.ts`). En local van en `.env` (copiar `.env.example`).

---

## Módulos del sistema

| Módulo | Estado | Tablas Supabase | Notas |
|--------|--------|-----------------|-------|
| Auth y roles | Completo | `user_roles` | Login email + contraseña. Rutas `/admin/*` (administrador) y `/seller/*` (vendedor) con `ProtectedRoute` |
| Dashboard | Completo | `presupuestos`, `prospectos`, `contratos`, `gestion` | Admin y vendedor tienen el suyo |
| Prospectos | Completo | `prospectos` | Alta desde admin y vendedor |
| Clientes | Completo | `prospectos` | Vista admin y vendedor |
| Presupuestos | Completo | `presupuestos` | PDF con jsPDF, se sube al bucket `presupuestos-pdf` y se envía por email / webhook n8n |
| Presupuestos aceptados y contratos | Completo | `presupuestos`, `contratos` | Aceptación genera contrato (PDF) |
| Gestión de pagos | Completo | `pagos`, `gestion` | Estado de pago al día 28, envío de email |
| Edificios | Completo | `gestion`, `pagos`, `reportes` | Detalle por edificio, reportes con fotos ilimitadas en PDF, envío por email |
| Emails | Completo | `emails` | Vía Edge Function `send-email` (no está en este repo) |
| Aviso de versión nueva | Completo | — | `useVersionCheck` + `/version.json` (ver Decisiones técnicas) |

Estados posibles: `Pendiente` / `En desarrollo` / `UI lista` / `Completo`

---

## Base de datos — Tablas creadas

```
- user_roles    → rol de cada usuario (enum app_role: administrador | vendedor)
- prospectos    → prospectos / clientes y sus contactos
- presupuestos  → presupuestos enviados (PDF en storage)
- contratos     → contratos generados al aceptar un presupuesto
- gestion       → gestión de cada edificio/cliente activo
- pagos         → pagos mensuales por edificio
- reportes      → reportes de servicio con fotos (PDF)
- emails        → registro de emails enviados
```

Funciones: `has_role()`, `get_user_role()` (equivalentes a `tiene_rol()` del kit).
Storage: bucket `presupuestos-pdf` (público, se usa `getPublicUrl`).

---

## Deploy (Cloudflare)

Detalle en `ai-pmp/cloudflare-rules.txt`. Antes se deployaba con Docker + nginx en CapRover (eliminado el 2026-11-18).

| Dato | Valor |
|------|-------|
| Nombre del Worker (`name` en `wrangler.jsonc`) | `kristalina` |
| URL de producción | https://kristalina.nuvvora.com |
| Dominio custom | `kristalina.nuvvora.com` (zona `nuvvora.com` en Cloudflare; declarado en `routes` de `wrangler.jsonc`) |
| Dominio anterior | `kristalina.provves.com` (CapRover). Los emails viejos tienen el logo apuntando ahí |
| URL workers.dev | https://kristalina.ignaciojaliff29.workers.dev |
| Rama de producción | `main` |
| Patrón de previews | https://*-kristalina.ignaciojaliff29.workers.dev |
| Fecha del primer deploy | 2026-11-18 (manual con `npm run deploy`) |

- [x] `.nvmrc`, `wrangler.jsonc` (sin `main`) y `public/_headers` creados
- [x] Dominio `kristalina.nuvvora.com` conectado al Worker
- [ ] Repo conectado a Workers Builds (build: `npm run build`, deploy: `npx wrangler deploy`)
- [ ] Build Variables cargadas: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (y nada más)
- [ ] Supabase → URL Configuration: Site URL `https://kristalina.nuvvora.com` + Redirect URLs de producción, previews y `http://localhost:8080/**`
- [ ] Probado en la URL real: login, recarga en `/admin/edificios`, link directo a `/admin/edificios/[id]`, PDFs con logo y firma, envío de email, consola limpia
- [ ] Rollback probado una vez desde Deployments
- [ ] Servidor de CapRover apagado (recién después de validar todo lo anterior)

## Roles del sistema

| Rol | Permisos |
|-----|----------|
| administrador | Acceso total: prospectos, clientes, presupuestos, contratos, pagos, edificios, reportes |
| vendedor | Sus prospectos, clientes, presupuestos y presupuestos aceptados (`/seller/*`) |

**Alta de usuarios**: no hay página de registro en la app; los usuarios se crean desde el dashboard de Supabase. [Confirmar que el signup público está deshabilitado — security-rules.txt §1]

---

## Checklist de seguridad

- [ ] Signup público deshabilitado en el dashboard (verificar `disable_signup` — ver security-rules.txt §1)
- [ ] Ninguna política `FOR ALL` para lecturas, ninguna con `(true)`, ninguna que dependa solo de `auth.uid() IS NOT NULL`
- [ ] Buckets de storage privados + signed URLs para datos de clientes (hoy `presupuestos-pdf` es público — ver deuda técnica)
- [ ] Tabla `user_roles` con RLS propio: nadie puede modificar su rol desde el cliente
- [ ] Funciones `has_role()` / `get_user_role()` con `SECURITY DEFINER`, `search_path` fijo y `REVOKE FROM anon`
- [ ] Toda tabla: RLS habilitado + `WITH CHECK` en políticas de escritura
- [ ] Campos de dinero en `numeric(12,2)` — nunca float
- [ ] Después de cada cambio de schema: correr `get_advisors` del MCP y corregir alertas
- [x] `public/_headers` con los headers de seguridad base (ver cloudflare-rules.txt §3)
- [x] `.env` fuera del repo (se destrackeó el 2026-11-18) y `.env.example` commiteado
- [ ] Build Variables de Cloudflare sin service key; Site URL de Supabase apuntando a producción

---

## Decisiones técnicas tomadas

* **Versiones heredadas que se mantienen** (registradas según rules.txt): React 18.3 (subir a 19 exige actualizar `react-day-picker`, `vaul`, `next-themes` y probar todo), Tailwind v3.4 + postcss (el kit lo permite para proyectos viejos), TypeScript `strict: false`. Vite quedó en 7 (el kit pide 7 o superior); Vite 8 cambia el bundler a Rolldown y se evalúa aparte.
* **Estructura por tipo** (`pages/`, `components/`, `utils/`) en vez de `features/`: herencia de Lovable. No se reestructura de golpe; lo nuevo puede ir en `features/[dominio]/`.
* **`build.target` fijo** en `vite.config.ts` a los navegadores que soportaba Vite 5 (`chrome87`, `safari14`, etc.) para no dejar afuera equipos viejos al subir a Vite 7.
* **Aviso de versión nueva**: Vite emite `dist/version.json` y embebe la misma versión en el bundle (`__APP_VERSION__`). `public/_headers` sirve `/version.json` con `no-store`; el HTML ya sale de Cloudflare con `max-age=0, must-revalidate`. Si se toca `_headers`, no cachear `/version.json`.
* **Supabase por variables de entorno**: `src/integrations/supabase/client.ts` lee `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. `vite.config.ts` frena el build si faltan, así un deploy sin variables nunca reemplaza a producción.
* **Excepción a "public/ solo favicon y logo"**: `public/firmaARM.jpg` se queda porque jsPDF la carga por URL para firmar presupuestos, contratos y reportes.
* **Logo de los emails hardcodeado** a `https://kristalina.nuvvora.com/kristalina-logo.png?v=2` (en `EnviarPresupuestoDialog.tsx`, `GestionPagos.tsx`, `EdificioDetail.tsx`). Si cambia el dominio, cambiar las tres. Los emails enviados antes del 2026-11-18 apuntan a `kristalina.provves.com` y pierden el logo cuando se apague CapRover.
* **Webhooks n8n** llamados desde el navegador con `mode: "no-cors"` (presupuestos, clientes y pagos): no dependen del dominio. La Edge Function `send-email` tiene CORS `*`: tampoco.
* **Restos de Lovable**: `lovable-tagger` (solo en `npm run dev`) y el script `cdn.gpteng.co/gptengineer.js` en `index.html`. No afectan el deploy; se pueden quitar si ya no se usa Lovable.

---

## Estado actual del desarrollo

**Última sesión**: 2026-11-18
**Próximo paso**: conectar el repo a Cloudflare Workers Builds (con sus Build Variables), cargar las URLs en Supabase y completar el checklist de "Deploy (Cloudflare)".

**Lo que está funcionando**:
* Todos los módulos de la tabla
* Build con Node 22 + Vite 7 verificado; servido probado con `wrangler dev` (rutas SPA, `_headers`, `version.json`, logo y firma)

**Lo que está pendiente**:
* Deploy automático por push a `main` (Workers Builds) y apagado de CapRover

**Problemas conocidos o deuda técnica**:
* Bucket `presupuestos-pdf` público con `getPublicUrl` (security-rules.txt §3). Pasarlo a privado rompe los links ya enviados por email: requiere plan aparte.
* Archivos de más de 300 líneas: `EdificioDetail.tsx` (~2200), `GestionPagos.tsx` (~980), `contractPdfGenerator.ts`, `reportPdfGenerator.ts`, `pdfGenerator.ts`, `ProspectForm.tsx`.
* Bundle principal de ~1,8 MB sin code-splitting (`React.lazy` por página pendiente).
* `EnviarPresupuestoDialog.tsx` usa una URL `webhook-test` de n8n (solo responde con el workflow en modo test).
* Colores hardcodeados y `console.error` sin `import.meta.env.DEV` en código heredado.
* ~145 problemas de lint heredados.

---

## Instrucciones para la IA

1. **Antes de escribir cualquier código**, leer los documentos de `ai-pmp/` referenciados arriba.
2. **No empezar nuevos módulos** sin que el usuario lo indique explícitamente.
3. **Antes de entregar cualquier cambio**: correr `npx tsc --noEmit -p tsconfig.app.json` y verificar que no hay imports rotos ni errores. Si el cambio es grande, verificar también que `npm run build` pasa.
4. **Si hay ambigüedad** en un requerimiento, preguntar antes de implementar.
5. **No agregar dependencias nuevas** sin consultarlo primero.
6. **Actualizar la tabla de módulos** de este archivo cuando se complete uno.
7. **El límite es 300 líneas por archivo** — si se supera, dividir en subarchivos o componentes. No agrandar los archivos heredados que ya lo superan.
8. **Nunca leer, imprimir ni commitear el contenido de `.env`** ni de ningún archivo con credenciales.
9. **Después de cualquier cambio de schema en Supabase**, correr `get_advisors` del MCP y corregir las alertas de seguridad antes de dar por terminada la tarea.
10. **Al terminar una sesión de trabajo**, actualizar la sección "Estado actual del desarrollo" de este archivo.
11. **Nunca correr `wrangler deploy` ni `npm run deploy`** sin que el usuario lo pida explícitamente en esa misma sesión. Producción se deploya por push a `main`.
12. **Si un cambio toca `wrangler.jsonc`, `public/_headers`, `.nvmrc` o variables `VITE_*`**, repasar el checklist de `cloudflare-rules.txt` §8 antes de darlo por terminado.

---

## Cómo actualizar este archivo

* **Al terminar un módulo** → cambiar su estado en la tabla de módulos
* **Al crear una tabla nueva** → agregarla en "Base de datos"
* **Al tomar una decisión técnica importante** → registrarla en "Decisiones técnicas"
* **Al terminar una sesión** → actualizar "Estado actual del desarrollo"
* **Al hacer el primer deploy** → completar la sección "Deploy (Cloudflare)"
