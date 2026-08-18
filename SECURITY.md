# Security Policy

## Supported Security Baseline

StudyFlow uses a security-by-default baseline for server-side operations and user-owned data.

Current baseline expectations:
- server-side authentication decisions for protected operations,
- server-side authorization and ownership checks,
- Supabase RLS strategy for user-owned tables,
- Zod validation at API boundaries,
- safe/sanitized error responses,
- dependency security monitoring in CI.

## Reporting a Vulnerability

If you discover a potential security issue:

1. Do not disclose it publicly in issues, pull requests, commits, or discussions.
2. Report it privately to project maintainers through the team’s agreed private channel.
3. Include reproducible steps, affected paths, impact assessment, and suggested mitigation if available.

Contributors must treat vulnerability reports as confidential until maintainers coordinate remediation and disclosure.

## Secret Handling

- Never commit real secrets, tokens, credentials, private keys, or service-role values to Git.
- Keep local secrets in local environment files only.
- Keep CI secrets in GitHub Actions Secrets.
- Keep deployment secrets in Vercel environment variables.
- Keep Supabase sensitive credentials in provider-managed secure settings.
- Commit only placeholder variable names in `.env.example`.

## Authentication and Authorization Expectations

- Protected operations must enforce authentication server-side.
- Client-provided user identifiers are not trusted for authorization decisions.
- Authorization must be explicit for user-owned resources.
- One authenticated user must not gain access to another user’s owned records.

## Supabase RLS Expectations

For user-owned tables:
- include ownership column (`user_id` or `owner_id`) tied to `auth.users.id`,
- enforce RLS policies for SELECT, INSERT, UPDATE, DELETE,
- treat server-side authorization and RLS as complementary controls.

## Validation Expectations

- Validate all untrusted API inputs (body, params, query) with Zod.
- Reject invalid inputs before business logic and persistence.
- Prefer reusable validation schemas and shared helpers.

## Error Handling Expectations

- Error responses must be safe and predictable.
- Do not expose stack traces, SQL details, credential values, tokens, or internal implementation details to clients.

## Dependency Security

- CI security scanning must remain enabled.
- High-severity dependency findings in the configured gate must block readiness.
- Complementary monitoring such as Dependabot should improve visibility without replacing existing CI security gates.

## Pull Request Security Review Expectations

Contributors should verify:
- input validation is present and tested,
- authentication is enforced where required,
- authorization and ownership are enforced server-side,
- user-to-user data isolation is preserved,
- RLS implications are documented for user-owned tables,
- secrets are not introduced,
- error responses remain sanitized,
- security tests are updated when behavior changes.
