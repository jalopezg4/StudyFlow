# Phase 0 Research: Authentication (Registration, Login, Logout & Route Protection)

## 1. Session mechanism for a Nuxt + Supabase SSR app

**Decision**: Use `@supabase/ssr` to manage the Supabase session as SSR-readable cookies. A Nuxt plugin creates a browser Supabase client for the register/login/logout calls; a Nitro server middleware (`server/middleware/auth.ts`) creates a per-request server client from the incoming cookies, calls `supabase.auth.getUser()` to validate the JWT with Supabase (not just decode it), and — when valid — sets `event.context.auth = { userId }`, matching the contract already consumed by `server/utils/security/auth.ts`'s `getAuthenticatedPrincipal`/`requireAuthenticatedPrincipal`.

**Rationale**: `@supabase/ssr` is Supabase's own officially maintained package for SSR frameworks (Next.js, Nuxt, SvelteKit) and is the direct successor to the deprecated auth-helpers packages. It keeps the session as httpOnly-capable cookies instead of `localStorage`, which is required for SSR (the server must be able to read the session on the first request) and is safer than exposing tokens to arbitrary client-side JS. It is a small, focused addition to the `@supabase/supabase-js` family already chosen by the project constitution and already installed on the `origin/004-subject-management` branch — it does not introduce a new backend framework or service, keeping Constitution Principle II (Nuxt-Native) intact.

**Alternatives considered**:
- *`@nuxtjs/supabase` module*: bundles composables (`useSupabaseUser`, `useSupabaseClient`) and route middleware out of the box. Rejected for this feature to avoid a second abstraction layer on top of the already-adopted `@supabase/supabase-js`/service-role pattern used by `origin/004-subject-management`, and to keep the session-resolution logic visible and testable inside `server/middleware/`, consistent with the existing `server/utils/security/*` conventions. Can be revisited later if the team wants less boilerplate.
- *`localStorage`-only client session (default `@supabase/supabase-js` browser behavior)*: rejected because it is invisible to the server on first render, which would force every private page to flash-then-redirect client-side only — violating Constitution Principle III ("client-side authorization alone is insufficient").
- *Custom hand-rolled JWT cookie signing*: rejected — reimplements what Supabase Auth already provides and increases security risk for no benefit.

## 2. Where register/login/logout calls happen

**Decision**: Registration, login, and logout call the Supabase Auth API directly from the client via the Supabase browser client (`supabase.auth.signUp`, `supabase.auth.signInWithPassword`, `supabase.auth.signOut`), wrapped in a small `useAuth` composable. No custom `server/api/auth/*` endpoints are introduced for these three actions.

**Rationale**: Supabase Auth is the credential store and verifier (Constitution Principle III, FR-010); StudyFlow's server has nothing meaningful to add in the middle of that specific exchange, and Supabase's client SDK already handles CSRF-safe cookie sync with `@supabase/ssr`. Adding a pass-through server endpoint would duplicate Supabase's own validation and increase the attack surface without a security benefit. Server-side enforcement is instead applied where it matters for this project: validating the *resulting* session on every subsequent request to a protected page or API (FR-012–FR-014).

**Alternatives considered**:
- *Server-side proxy endpoints for signUp/signIn/signOut*: rejected as unnecessary indirection; would need to duplicate Supabase's own error handling for no added guarantee.

## 3. Enforcing route protection server-side for pages (not just APIs)

**Decision**: `server/middleware/auth.ts` resolves `event.context.auth` for every request (page or API). A second, narrowly-scoped check — either in the same middleware or a small `server/middleware/route-protection.ts` — compares `event.path` against an explicit list of private path prefixes (starting with `/dashboard`) and, when `event.context.auth` is absent, returns an HTTP redirect to `/login` before the page is rendered. A companion Nuxt route middleware (`app/middleware/auth.ts`, applied via `definePageMeta`) provides the same redirect for pure client-side navigations (SPA transitions after hydration), as a UX-only defense-in-depth layer — never the sole guard.

**Rationale**: Satisfies Constitution Principle III explicitly ("client-side authorization alone is insufficient") for pages, not only data APIs, by making the Nitro server the authority for both. Reuses the same `event.context.auth` contract already defined in the TECH-03 baseline instead of inventing a parallel mechanism.

**Alternatives considered**:
- *Client-only route middleware*: rejected — fails FR-012/FR-014 and the constitution's explicit prohibition on client-only authorization.
- *Nuxt `routeRules` with `ssr: false` for private pages*: rejected — turns private pages into SPA-only islands that still need a server-side data check anyway, adding complexity without closing the gap.

## 4. Dependencies to add

**Decision**: Add `@supabase/supabase-js` (same major/minor already used on `origin/004-subject-management`, currently `^2.112.3`) and `@supabase/ssr` (latest stable release compatible with that version at install time) to `package.json`.

**Rationale**: Reuses the exact dependency already vetted for this codebase on the sibling feature branch instead of introducing a divergent version.

## 5. Password policy enforcement point

**Decision**: Enforce the 8-character minimum (per Clarifications) in two places: (a) client-side Zod schema validation before the Supabase call, for immediate feedback (FR-002, FR-003), and (b) the Supabase Auth project's own "Minimum password length" setting, so the rule holds even if a request bypasses the UI.

**Rationale**: Matches the existing project convention of Zod-validating input at the boundary (Constitution Principle IV) while relying on the identity provider as the ultimate source of truth for credential rules (Principle III), avoiding a StudyFlow-side password store.

## 6. Prerequisite infrastructure fixes uncovered during analysis

Two pre-existing defects on `main`/`loginForm` block any new page from working and must be fixed as part of this feature's implementation (not as separate HUs, per the backlog's guidance that infrastructure work is not a user story):

- `app/app.vue` does not render `<NuxtPage />`, so no page under `app/pages/` would ever display. Already fixed independently on `origin/004-subject-management`.
- `tailwind.config.cjs` / `postcss.config.cjs` use the Tailwind v3 setup, incompatible with the installed Tailwind v4 (`^4.3.3`). `origin/004-subject-management` fixed this via the `@tailwindcss/vite` plugin. This feature adopts the same fix so the registration/login/dashboard pages render with usable styling.

**Alternatives considered**: Ship the auth pages unstyled and defer the Tailwind fix — rejected, since SC-001/SC-002 (fast, usable registration/login) are hard to demonstrate credibly on an unstyled form during the course demo.
