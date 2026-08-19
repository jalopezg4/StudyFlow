# Implementation Plan: Authentication (Registration, Login, Logout & Route Protection)

**Branch**: `loginForm` | **Date**: 2026-08-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-authentication/spec.md`

## Summary

Implement HU01 (registration and login) and HU02 (logout and private-route protection) on top of the TECH-03 security baseline. Registration, login, and logout are delegated to Supabase Auth via the client-side Supabase SDK; a new Nitro server middleware resolves the resulting session into the already-defined `event.context.auth` contract and enforces access control server-side for both pages and data operations. Two pre-existing infrastructure defects (`app/app.vue` missing `<NuxtPage />`, and a Tailwind v3/v4 config mismatch) are fixed as part of delivering the first real pages.

## Technical Context

**Language/Version**: TypeScript 5.9.x with Nuxt 4 runtime on Node.js 22+ (current CI/runtime target Node.js 24)

**Primary Dependencies**: Nuxt 4, Nitro server routes, Vue 3, `@supabase/supabase-js` (`^2.112.3`, matching `origin/004-subject-management`), `@supabase/ssr` (new), Zod, Vitest, `@nuxt/test-utils`, Playwright, `@tailwindcss/vite` (fixes existing Tailwind v4 misconfiguration)

**Storage**: Supabase Auth (`auth.users`) as the sole identity/credential store; no new StudyFlow-owned tables

**Testing**: Vitest for schema validation and middleware/session-resolution logic; Playwright for the end-to-end register → login → dashboard → logout → blocked-access flow

**Target Platform**: Nuxt full-stack web app deployed via Vercel Git integration with GitHub Actions CI

**Project Type**: Web application feature (first product-facing user stories, HU01/HU02)

**Performance Goals**: Registration and login perceived as near-instant (SC-001 ≤ 2 min including user typing time, SC-002 ≤ 30 s); no specific throughput target for a course-scale demo

**Constraints**: No custom credential storage (FR-010); no client-only authorization (Constitution Principle III); no new backend framework; must reuse `server/utils/security/*` from TECH-03 rather than reimplementing auth/error/validation helpers

**Scale/Scope**: Single Supabase project, course-scale user volume; establishes the session/route-protection mechanism every later HU (HU03–HU10) will build private pages on top of

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Pass: Specification-First Development — this plan follows an approved, clarified `spec.md` (004-authentication).
- Pass: Nuxt-Native and Type-Safe Architecture — implementation stays within Nuxt/Nitro + TypeScript; `@supabase/supabase-js`/`@supabase/ssr` are the already-endorsed identity dependency family, not a new backend framework.
- Pass: Security by Default — session resolution and route protection are enforced server-side (`server/middleware/auth.ts`), for both pages and data operations; no credential is ever stored in a StudyFlow table.
- Pass: Validation and Automated Quality — Zod validates registration/login input at the boundary; Vitest covers middleware/schema behavior and Playwright covers the critical end-to-end flow, per the spec's Success Criteria.
- Pass: Simplicity, Traceability and Deployability — no new services introduced; work is traceable to HU01/HU02 and `specs/004-authentication`; the two infrastructure fixes bundled in are prerequisites for any page to render at all, not scope creep.

No constitution violations require exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/004-authentication/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── auth-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
app/
├── app.vue                       # fixed: add <NuxtPage />
├── pages/
│   ├── register.vue              # new
│   ├── login.vue                 # new
│   └── dashboard.vue             # new (placeholder for HU10)
├── middleware/
│   └── auth.ts                   # new: client-side UX redirect (defense-in-depth only)
├── composables/
│   └── useAuth.ts                # new: wraps Supabase browser client (signUp/signIn/signOut)
└── plugins/
    └── supabase.client.ts        # new: Supabase browser client via @supabase/ssr

server/
├── middleware/
│   └── auth.ts                   # new: resolves event.context.auth + enforces route protection
└── utils/
    └── security/                 # existing, reused as-is (auth.ts, errors.ts, validation.ts, schemas.ts, types.ts)

tests/
├── unit/
│   └── auth/                     # new: schema + middleware tests
└── e2e/
    └── auth.spec.ts              # new: Playwright register→login→dashboard→logout flow

tailwind.config.cjs / postcss.config.cjs → nuxt.config.ts   # fixed: Tailwind v4 via @tailwindcss/vite
.env.example                                                # unchanged (Supabase vars already present)
```

**Structure Decision**: Single-project Nuxt layout (no separate backend/frontend split), consistent with the existing repository structure and `origin/004-subject-management`. Auth pages and composables live under `app/`; session resolution and route enforcement live under `server/middleware/`, reusing the existing `server/utils/security/` boundary utilities rather than introducing new ones.

## Complexity Tracking

No constitution violations or exception justifications identified. The two bundled infrastructure fixes (`app.vue`, Tailwind) are prerequisites already required to render any page and are documented in `research.md` §6 rather than treated as scope creep.
