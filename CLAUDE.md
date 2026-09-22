# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Landing page + attendee/exhibitor portal for the "Expo Empresarios de la Baja" event. UI copy, routes, Firestore collections and function names are in Spanish — keep new code consistent with that.

## Commands

```bash
npm run dev      # Express + Vite dev middleware (tsx server/index.ts), PORT defaults to 5001
npm run build    # vite build -> dist/public, plus esbuild bundle of server -> dist/index.js
npm run start    # run the production Express bundle
npm run check    # tsc type check (the only static check; there is no linter or test suite)
```

Deploy targets both serve only the static SPA from `dist/public` with a catch-all rewrite to `index.html`:
- Vercel: `vercel.json` (runs `npm run build`)
- Firebase Hosting: `firebase deploy --only hosting` (target `expo-empresarios` → site `expo-empresarios-de-la-baja` in project `scaleflow-aee7f`)

## Architecture

**The app is effectively a client-only SPA backed by Firebase.** The Express server (`server/`), Drizzle config and `shared/schema.ts` are leftover Replit "rest-express" scaffolding: `server/routes.ts` registers no routes and the Postgres `users` table is unused. The server exists only to host Vite in dev. Don't add backend logic there expecting it to be deployed — production is static hosting.

- **Vite root is `client/`** (`vite.config.ts`), so env vars are read from `client/.env` (template: `client/.env.example`). Aliases: `@` → `client/src`, `@shared` → `shared`, `@assets` → `attached_assets`.
- **Data layer: `client/src/lib/firebase.ts`** — a single large module that holds all Firestore/Auth/Storage access and all transactional email sending. Pages call its exported functions directly (no React Query usage for Firebase data despite `queryClient` being set up).
- **Multi-tenant Firestore layout:** everything is scoped under `empresas/{EMPRESA_ID}/...`:
  - `contactos` (invitados/guests), `expositores` (exhibitors), `solicitudes` (registration requests)
  - `{contactos|expositores}/{id}/citas` — meetings; accepting/rejecting/rescheduling (`aceptarCita`, `rechazarCita`, `reagendarCita`) writes to both participants' `citas` subcollections
  - `pagina_web/landing` — carousel and gallery images for the landing page
  - top-level `usuarios` is also consulted during login
- **Firebase project is Scaleflow Suite (`scaleflow-aee7f`) and Firestore uses the named database `suite`**, not `(default)` — `getFirestore(app, FIRESTORE_DATABASE_ID)`. The old `advance-medical-68626` project must not be referenced anywhere. All Firebase config, `FIRESTORE_DATABASE_ID`, `EMAIL_API_URL` and `EMAIL_LOGO_URL` live in `@/config/constants` (env var overrides: `VITE_FIREBASE_*`, `VITE_FIREBASE_DATABASE_ID`, `VITE_EMAIL_API_URL`); `lib/firebase.ts` consumes them from there. `VITE_FIREBASE_API_KEY` has no fallback and must be set in `client/.env`.
- **`EMPRESA_ID`** always comes from `@/config/constants` (reads `VITE_EMPRESA_ID`, falls back to a hardcoded default). Import it from there instead of reading `import.meta.env` directly.
- **Emails** are sent by POSTing inline HTML templates to the Suite `emailAPI` Cloud Function (`EMAIL_API_URL`); the templates live inside the `enviarCorreo*` functions in `lib/firebase.ts` and use `EMAIL_LOGO_URL` (`client/public/logo-expo.png` on the production domain). Links in emails are built from `window.location.origin` (e.g. `/registro?invitado={id}`, `/registro-expositor?expositor={id}`).
- **Auth:** Firebase Auth email/password. A logged-in user is either an expositor or a contacto; `getUserProfile(EMPRESA_ID)` resolves which by looking them up in both collections. Protected pages use `useAuthCheck()` (`client/src/hooks/useAuthCheck.ts`), which redirects to `/login` with a SweetAlert2 dialog if no profile is found.
- **Routing:** `wouter`, all routes declared in `client/src/App.tsx`.
- **UI:** shadcn/ui components in `client/src/components/ui` (config in `components.json`), Tailwind, framer-motion. Alerts/confirmations use SweetAlert2 styled dark with gold `#D4AF37`. The app forces dark mode in `main.tsx`. Visual direction (black/gold/sand palette, Playfair Display + Poppins) is in `design_guidelines.md`. `components/examples/` are Replit preview stubs, not used by the app.
- **Cache busting:** `main.tsx` clears localStorage/sessionStorage (except `authToken`, `user`) when `APP_VERSION` changes. Bump it after deploys that change stored-state shape (see `SOLUCION_CACHE.md`).

## Reference docs in repo

Feature-level docs (Spanish) describe the business flows in detail: `MANUAL_USO.md` (end-to-end CRM → invitation → registration → event day flow), `client/SISTEMA_AUTENTICACION.md`, `client/SISTEMA_DETALLE_INVITADO.md` (contact registration + 30-minute meeting slots), `client/SISTEMA_PERFIL_USUARIO.md`, `client/CONFIG.md`.
