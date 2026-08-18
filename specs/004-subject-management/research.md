# Research: Subject Management

## Decision 1: Enforce ownership server-side via principal + RLS, not a per-request JWT client
- Decision: `POST /api/subjects` uses a server-only Supabase client and always sets `user_id` from `requireAuthenticatedPrincipal(event).userId`. Row Level Security is still enabled on `subjects` as a defense-in-depth backstop, per `docs/security/rls-strategy.md`.
- Rationale: A per-request, user-JWT-scoped Supabase client would require extending the `AuthenticatedPrincipal`/`event.context.auth` contract (owned by HU01) to carry a raw access token. That is out of scope for HU03 and would couple this feature to HU01's still-undefined session design. Deriving `user_id` exclusively from the server-resolved principal already satisfies FR-006/FR-007 (no client-controlled ownership) without that coupling.
- Alternatives considered: (a) Trusting a client-supplied `user_id` — rejected, violates FR-007 and the constitution's security-by-default principle. (b) Building a per-request JWT-scoped client now — rejected as premature; revisit once HU01 defines how the access token is surfaced to server routes.

## Decision 2: Whitelist the request schema instead of "ignoring" an owner field
- Decision: `CreateSubjectSchema` only defines `name` and `description`. It has no `user_id`/`ownerId` field at all.
- Rationale: A field that is parsed and then discarded is one accidental refactor away from being used. Not accepting the field in the schema at all is strictly safer and simpler, and still satisfies the acceptance criteria ("the client cannot choose the owner").
- Alternatives considered: Accept and ignore a client-supplied owner field (as the `server/api/security` template routes do, for illustration purposes) — rejected for the real feature route; that pattern is fine for a security-baseline demo endpoint but not for production code.

## Decision 3: Business rules enforced in Zod, mirrored (not duplicated as logic) in the DB
- Decision: `CreateSubjectSchema` trims and validates `name` (1–100 chars) and optional `description` (≤500 chars) at the API boundary. The `subjects` table also carries `CHECK` constraints for the same bounds.
- Rationale: Zod gives fast, user-facing validation errors (FR-011) before any DB round-trip; the DB constraints are a second, independent safety net against any future write path that bypasses the API (defense in depth, consistent with the RLS strategy doc's philosophy).
- Alternatives considered: DB constraints only — rejected, produces poor error messages and relies on DB error parsing. Zod only — rejected, leaves the table without an independent integrity guarantee.

## Decision 4: Scope this HU to creation only; verify "appears in listing" without a listing UI
- Decision: No `GET /api/subjects` route or listing page is built in this HU. CA01's "aparece en su listado de materias" is verified by an automated test that creates a subject and then queries it back (via the repository function), asserting it is persisted, owned correctly, and retrievable.
- Rationale: The GitHub issue's subtasks for HU03 only list a creation form and create-related tests — no listing subtask. Building a listing endpoint/page now would be speculative scope beyond what was asked, contradicting the constitution's simplicity principle. Listing is a natural, separate future user story.
- Alternatives considered: Build a minimal listing endpoint now "since it's easy" — rejected as scope creep not requested by HU03; would also need its own acceptance criteria, RLS verification, and empty-state UX that HU03 does not define.

## Decision 5: Defer Playwright E2E coverage for this HU
- Decision: Automated coverage for CA01–CA03 is delivered via Vitest (unit + route-level tests with a fake authenticated event), matching the existing `tests/security/` pattern. No new Playwright spec is added for HU03.
- Rationale: There is no real login flow yet (HU01 not implemented), so a genuine end-to-end browser test cannot authenticate a session without faking it in a way that wouldn't exercise anything beyond what the Vitest tests already cover. Constitution language ("critical end-to-end flows *should* have Playwright coverage") is a should, not a must, and is better satisfied once HU01 exists.
- Alternatives considered: Stub authentication in Playwright via a test-only cookie/header — rejected for now; would hard-code assumptions about HU01's eventual session shape that may not hold, requiring rework.

## Decision 6: Add `@supabase/supabase-js` as the only new runtime dependency
- Decision: Use the official `@supabase/supabase-js` client from `server/utils/subjects/repository.ts`, configured with the server-only service-role key (never exposed to the browser), consistent with `.env.example` and `docs/security/rls-strategy.md`.
- Rationale: This is the constitution-mandated Supabase integration path; no alternative ORM/client is warranted for one table.
- Alternatives considered: Raw `pg`/SQL client — rejected, duplicates what Supabase's client already provides and loses built-in RLS/session ergonomics for future features.
