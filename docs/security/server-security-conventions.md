# Server Security Conventions

This guide defines reusable conventions for future StudyFlow user stories.

## Protected Route Baseline

1. Resolve authenticated principal server-side.
2. Validate request params, query, and body with Zod.
3. Enforce ownership authorization server-side.
4. Execute business logic only after validation and authorization pass.
5. Return only safe, sanitized error responses.

## Authentication Convention

- Treat server-resolved principal as the source of truth.
- Never trust client-submitted user ids for authorization.

## Authorization Convention

- Use ownership checks for user-owned resources.
- Pair application-level checks with Supabase RLS policies.

## Validation Convention

- Define reusable schemas in shared server security utilities.
- Reject invalid input before persistence or side effects.

## Error Convention

- Map known failures to safe messages and codes.
- Keep implementation details and secret values out of client responses.
