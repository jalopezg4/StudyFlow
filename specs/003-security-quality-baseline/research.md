# Research: Security and Quality Baseline

## Decision 1: Standardize server-side principal resolution and protected-route guards
- Decision: Define a shared server helper pattern that resolves authenticated principal context inside Nitro handlers and rejects missing/invalid authentication at the server boundary.
- Rationale: Prevents client-side trust assumptions and ensures future routes use a single, reviewable pattern for auth checks.
- Alternatives considered: Per-route ad hoc authentication logic was rejected because it increases inconsistency and review risk.

## Decision 2: Establish explicit ownership authorization conventions
- Decision: Require protected operations to perform explicit ownership checks in server-side logic for user-owned resources, even when RLS exists.
- Rationale: Defense in depth avoids accidental privilege drift and provides predictable application-layer behavior.
- Alternatives considered: Relying on only client checks or implicit ownership assumptions was rejected as insecure.

## Decision 3: Define Supabase RLS baseline as mandatory policy for user-owned tables
- Decision: Document required ownership column conventions (`user_id` or `owner_id` linked to `auth.users.id`) and baseline access principles for SELECT, INSERT, UPDATE, DELETE.
- Rationale: Provides a stable model for future HU schema design and authorization testing.
- Alternatives considered: Deferring all RLS guidance until feature-level work was rejected because it causes inconsistency across contributors.

## Decision 4: Use Zod as the mandatory API boundary validation mechanism
- Decision: Establish reusable schema-driven parsing helpers for request body, params, and query validation.
- Rationale: Keeps validation consistent, typed, and testable across handlers.
- Alternatives considered: Manual checks per route were rejected due to duplication and error-proneness.

## Decision 5: Normalize safe error responses
- Decision: Define a constrained error-response format that avoids stack traces, DB internals, and credential leakage.
- Rationale: Reduces accidental disclosure and provides predictable client-facing semantics.
- Alternatives considered: Returning raw framework/runtime errors was rejected for security reasons.

## Decision 6: Preserve existing CI security gate and add non-duplicative dependency visibility
- Decision: Keep the existing Snyk high-severity gate in CI and add Dependabot configuration for ongoing dependency awareness.
- Rationale: Snyk remains the blocking gate; Dependabot adds proactive update visibility without replacing established CI controls.
- Alternatives considered: Replacing Snyk or adding duplicate failing gates was rejected to avoid workflow instability.

## Decision 7: Codify contribution-time security review expectations
- Decision: Add SECURITY.md and a PR security checklist template aligned to TECH-03 acceptance criteria.
- Rationale: Embeds security checks into daily collaboration and improves traceability from requirement to review evidence.
- Alternatives considered: Keeping security expectations only in informal discussions was rejected due to low repeatability.

## Decision 8: Add baseline security tests without implementing functional HUs
- Decision: Create minimal representative server endpoints and tests focused on auth rejection, authorization rejection, invalid input rejection, and safe error behavior.
- Rationale: Provides immediate automated evidence for AC06 while avoiding premature domain feature implementation.
- Alternatives considered: Waiting for HU implementation to add security tests was rejected because baseline enforcement would be delayed.
