# Security Baseline Contract

## Purpose
Define the minimum security behaviors that future StudyFlow server changes must satisfy.

## Contract Scope
- Server-side authentication checks for protected operations.
- Server-side authorization checks for owned resources.
- Input validation at request boundaries.
- Safe error responses.
- Ownership + RLS-aligned access principles.

## Required Request-Boundary Behaviors

### Authentication Contract
- Protected operations MUST resolve caller identity server-side.
- Missing or invalid authenticated identity MUST return an authentication failure.
- Client-provided owner/user identifiers MUST NOT be treated as proof of identity.

### Authorization Contract
- Protected operations on user-owned resources MUST verify ownership server-side.
- Ownership mismatch MUST return a forbidden response.

### Validation Contract
- Body, params, and query inputs MUST be validated at the route boundary.
- Invalid input MUST return a validation failure response before business logic or persistence.

### Safe Error Contract
- Internal failures MUST return sanitized errors.
- Sanitized errors MUST NOT include stack traces, SQL details, token values, secret values, or service-role credentials.

## Ownership and RLS Contract

For future user-owned Supabase tables:
- Ownership column MUST be present (`user_id` or `owner_id`) and mapped to auth identity.
- RLS MUST enforce row ownership for SELECT, INSERT, UPDATE, DELETE.
- Application-level authorization checks SHOULD complement RLS as defense in depth.

## Security Testing Contract

Baseline automated tests MUST cover:
- invalid input rejection,
- unauthenticated access rejection,
- unauthorized ownership rejection,
- safe/sanitized error responses.

## Contribution Review Contract

Every pull request touching server/data/security boundaries SHOULD answer:
- Is all untrusted input validated?
- Is authentication required where needed?
- Is authorization and ownership enforced server-side?
- Could one user access another user’s data?
- Does the table or data path require RLS updates?
- Are errors sanitized?
- Are security-focused tests present or updated?

## TECH-03 Traceability

- Spec source: `specs/003-security-quality-baseline/spec.md`
- Plan source: `specs/003-security-quality-baseline/plan.md`
- Task source: `specs/003-security-quality-baseline/tasks.md`
- Security policy: `SECURITY.md`
- Server security helpers: `server/utils/security/`
- Baseline protected endpoints: `server/api/security/`
- Baseline security tests: `tests/security/`
- RLS strategy documentation: `docs/security/rls-strategy.md`
