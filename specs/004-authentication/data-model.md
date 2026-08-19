# Phase 1 Data Model: Authentication

No new StudyFlow-owned database tables are introduced by this feature. Identity and session data are owned entirely by Supabase Auth.

## Account (Supabase-managed)

Represented by Supabase's built-in `auth.users` table — not created, modified, or queried directly by StudyFlow application code.

| Field | Source | Notes |
|---|---|---|
| `id` (UUID) | Supabase Auth | This is the `userId` referenced throughout `server/utils/security/*` (`AuthenticatedPrincipal.userId`, `OwnedResourceReference.ownerId`). Every future user-owned table (subjects, tasks, study sessions) stores this value as its ownership column. |
| `email` | Supabase Auth | Used as the login identifier. Uniqueness enforced by Supabase Auth (FR-004). |
| `encrypted_password` | Supabase Auth | Never read, written, or logged by StudyFlow code (FR-010, FR-011). |
| `email_confirmed_at` | Supabase Auth | Not required to be set for a session to be considered valid in this feature (email confirmation disabled per Clarifications). |

**Validation rules enforced by StudyFlow before calling Supabase**:
- Email: RFC-compliant format (Zod `.email()`).
- Password: minimum 8 characters (FR-003).

**Lifecycle**: created by `auth.signUp`; no update/delete operations are in scope for this feature (profile editing, password reset, and account deletion are out of scope per the spec's exclusions).

## Session (Supabase-managed, cookie-backed)

Not a StudyFlow database entity. Represented as a Supabase Auth session (access token + refresh token) synchronized into SSR-readable cookies by `@supabase/ssr`.

| Attribute | Description |
|---|---|
| `userId` | The authenticated principal's id, extracted server-side after validating the session with `supabase.auth.getUser()`. This is the only piece of session data StudyFlow's own code touches — surfaced as `event.context.auth.userId` (existing contract from `server/utils/security/types.ts`). |
| Lifetime | Starts at successful login (FR-007), ends at explicit logout (FR-008/FR-009) or natural token expiry (Edge Cases: expired session redirects to login on next server-checked action). |
| Concurrency | Multiple concurrent sessions per account across devices are allowed (Assumptions); no additional state is introduced to track or limit them. |

## No new Zod schemas beyond request-shape validation

- `RegisterRequestSchema`: `{ email: string (email), password: string (min 8) }`
- `LoginRequestSchema`: `{ email: string (email), password: string (min 1) }`

These validate the *shape* of the form submission before it is handed to the Supabase client call; they do not represent a persisted entity.
