# Implementation Plan: Study Session Recording

**Branch**: `feat/HU09-study-session-recording` | **Date**: 2026-08-20 | **Spec**: [spec.md](spec.md)

## Summary

Implement HU09 as a new protected creation flow for `study_sessions`. A session requires an owned subject, optionally references an owned task under that subject, and stores a positive whole duration in minutes. The API will reuse the established authentication, request-scoped Supabase client, validation, safe errors, repository, and RLS conventions.

## Technical Context

- **Runtime**: Nuxt 4, Vue 3, TypeScript, Nitro server routes
- **Persistence**: Supabase PostgreSQL with a new migration and RLS policies
- **Validation**: Zod at the API body boundary
- **Authentication**: Existing `requireAuthenticatedPrincipal` and request-scoped Supabase client
- **Testing**: Vitest route/repository/security tests; focused Playwright coverage if the creation UI is included
- **Deployment**: Existing GitHub Actions and Vercel workflow

## Constitution Check

- Specification-first: pass; this plan is rooted in `spec.md` and its acceptance criteria.
- Security by default: pass; owner comes from the authenticated request, resource ownership is checked server-side, and RLS protects the table.
- Type-safe Nuxt architecture: pass; no new framework or service is introduced.
- Automated quality: pass; validation, persistence, ownership, and safe-error tests are part of the tasks.
- Simplicity and deployability: pass; one entity, one creation endpoint, and existing helpers are reused.

## Design

The migration creates `study_sessions` with `user_id`, required `subject_id`, nullable `task_id`, bounded `duration_minutes`, and `created_at`. Subject and task references use the existing resource lifecycle policy selected during implementation, with session rows cascading when a referenced resource is deleted. The route validates the complete body before resource lookups, then verifies the subject and optional task under the authenticated owner before insertion.

The first UI touchpoint will be the existing authenticated task/subject workflow only if it can be added without widening the feature's persistence contract; the API and automated tests remain the minimum independently valuable slice.

## Risks and Mitigations

- **Cross-resource mismatch**: Verify task ownership and subject identity together before insert; cover with route tests.
- **RLS not actually exercised by mocks**: Apply the migration to a real Supabase project and run a two-user smoke test before PR merge.
- **Existing subject/task deletion behavior**: Verify cascade behavior with migration tests and document it in the PR.
- **E2E environment instability**: Keep Vitest route/repository/security coverage mandatory and run Playwright against the configured environment when credentials are available.
