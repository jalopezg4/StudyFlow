# Contract: Authentication Boundary

## 1. Client-side identity operations (delegated to Supabase Auth)

These are not StudyFlow-owned HTTP endpoints; they are calls made through the Supabase browser client, wrapped by a `useAuth` composable so pages never call the SDK directly.

| Operation | Composable call | Input (validated with Zod first) | Success | Failure surfaced to UI |
|---|---|---|---|---|
| Register | `useAuth().register(email, password)` → `supabase.auth.signUp`, returns `{ hasSession }` | `RegisterRequestSchema` | `hasSession: true` (new account) → page redirects straight to `/dashboard` (FR-018). `hasSession: false` (duplicate email, no error thrown by Supabase) → page stays on `/register` and shows the same generic success text, never revealing the account already existed (FR-004, FR-019) | Single generic message on thrown errors; does not distinguish "email already registered" from other server-side rejection (FR-004) |
| Login | `useAuth().login(email, password)` → `supabase.auth.signInWithPassword` | `LoginRequestSchema` | Session established; redirect to `/dashboard` | Single generic "invalid credentials" message (FR-006) |
| Logout | `useAuth().logout()` → `supabase.auth.signOut` | none | Session cleared; redirect to `/login` | N/A (best-effort; treat any failure as "already logged out" and redirect anyway) |

## 2. Server-side authenticated principal (existing contract, reused)

Already defined by TECH-03 and unchanged by this feature:

```ts
// server/utils/security/types.ts
interface AuthenticatedPrincipal { userId: string }

// server/utils/security/auth.ts
function getAuthenticatedPrincipal(event: H3Event): AuthenticatedPrincipal | null
function requireAuthenticatedPrincipal(event: H3Event): AuthenticatedPrincipal // throws UNAUTHENTICATED
```

This feature is responsible for making `event.context.auth.userId` actually populated (previously nothing set it). It does so via `server/middleware/auth.ts`, for **every** request — page and API alike.

## 3. Server-side route protection (new)

`server/middleware/auth.ts` (or a small companion `server/middleware/route-protection.ts`) enforces, before any page/API handler runs:

- Path matches a private prefix (`/dashboard`, and any future prefix added by later HUs) AND `event.context.auth` is absent → respond with a redirect to `/login` (FR-012, FR-014).
- Path matches a private prefix AND `event.context.auth.userId` is present → allow the request through (FR-013).
- Path is `/login` or `/register` AND `event.context.auth.userId` is present → redirect to `/dashboard` (FR-015).
- Any other path → pass through unchanged.

This is the single source of truth for access control. The client-side `app/middleware/auth.ts` route middleware only improves perceived responsiveness during SPA navigation and must never be the only check (Constitution Principle III).

## 4. Error handling

All rejections from the operations above use the existing safe-error helpers (`server/utils/security/errors.ts`) where the rejection happens server-side (route protection, `requireAuthenticatedPrincipal`). Client-side Supabase SDK errors are mapped to the single generic messages specified in the table above before being shown to the user — never the raw Supabase error string, to avoid leaking which specific check failed (FR-004, FR-006, SC-006).
