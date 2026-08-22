# Implementation Plan: Study Progress Dashboard

**Branch**: `feat/HU10-progress-dashboard` | **Date**: 2026-08-21 | **Spec**: [spec.md](spec.md)

## Summary

Upgrade the protected dashboard from a placeholder to a read-only progress view. Add `GET /api/dashboard/progress`, calculate task and study-session metrics from owner-scoped queries, and render a stable populated or empty state in the existing dashboard page.

## Technical Context

- **Runtime**: Nuxt 4, Vue 3, TypeScript, Nitro server routes
- **Persistence**: Existing Supabase PostgreSQL tables `study_tasks` and `study_sessions`
- **Validation**: No request body/query; authentication remains mandatory
- **Authentication**: Existing server middleware and request-scoped Supabase client
- **Testing**: Vitest repository/route tests and Playwright dashboard scenarios
- **Deployment**: Existing GitHub Actions and Vercel workflow

## Constitution Check

- Specification-first: pass; implementation is rooted in HU10's spec, contract, and tasks.
- Security by default: pass; both source queries are owner-scoped and protected by RLS.
- Type-safe Nuxt architecture: pass; reuses existing Nuxt/Nitro patterns without new services.
- Automated quality: pass; metrics, empty state, isolation, and protected route behavior are testable.
- Simplicity and deployability: pass; no new table, dependency, or background process.

## Design

The dashboard progress repository will query owned task statuses and owned session durations through the request-scoped Supabase client. It will calculate a typed `ProgressSummary`, with zero values for empty data. The protected route will compose authentication, client resolution, repository aggregation, and safe error handling. The dashboard page will fetch the summary on mount and render loading, error, populated, and empty states.

The dashboard will retain the existing logout and navigation actions while replacing the placeholder welcome content with the progress metrics and links to subjects, tasks, and study sessions.

## Risks and Mitigations

- **Data leakage**: Apply `.eq('user_id', principal.userId)` to every source query and cover two-user tests.
- **Partial aggregates**: Fail the complete request if either source query fails; do not display a misleading partial summary.
- **Empty division**: Explicitly return 0% when `totalTasks` is zero.
- **Live RLS gap**: Include a two-user quickstart scenario and execute it against Supabase before merge when credentials are available.
