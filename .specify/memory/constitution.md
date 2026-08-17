<!--
Sync Impact Report
- Version change: template placeholders -> 1.0.0
- Modified principles: all five principles were defined and aligned to the StudyFlow project
- Added sections: Additional Constraints; Development Workflow and Quality Gates
- Removed sections: none
- Follow-up TODOs: none
-->

# StudyFlow Constitution

## Core Principles

### I. Specification-First Development
Every production feature must originate from an approved specification before implementation. Requirements, acceptance criteria, business rules, technical plans, and implementation tasks must be traceable from specification to delivery. Prompt-only coding without an approved specification is not allowed.

This rule ensures that product intent is explicit before code exists and that changes remain reviewable, testable, and aligned with the team’s agreed scope.

### II. Nuxt-Native and Type-Safe Architecture
Application code must use Nuxt 4, Vue 3, and TypeScript. The team must prefer Nuxt and Nitro native capabilities over introducing additional backend frameworks or unnecessary services. Shared contracts, models, and types must remain explicit, type-safe, and consistently used across the application.

This keeps the system easier to reason about, lowers integration risk, and avoids unnecessary architectural drift while preserving a clear product foundation.

### III. Security by Default
Authentication and authorization for protected resources must be enforced server-side. Client-side authorization alone is insufficient. Users may only access their own subjects, study tasks, and study sessions. Supabase Row Level Security must protect user-owned data, and secrets or private environment files must never be committed to Git.

Security is a product requirement, not a later-stage patch. Every protected workflow must enforce ownership, authorization, and data isolation at the boundary where data is served.

### IV. Validation and Automated Quality
All untrusted server-side input must be validated using Zod. Critical business rules, authorization behavior, and core API behavior must have automated tests. Critical end-to-end user flows should have Playwright coverage.

Validation and testing are mandatory quality gates because they prevent invalid state, unauthorized access, and regressions in core study workflows.

### V. Simplicity, Traceability and Deployability
Avoid unnecessary dependencies, services, and architectural complexity. Every implemented feature must be traceable from GitHub Issue to specification, plan, tasks, code, pull request, and tests. The main branch must remain deployable at all times.

This principle preserves operational clarity, keeps the team aligned on scope, and ensures the application remains releasable without hidden technical debt.

## Additional Constraints

- Framework: Nuxt 4
- UI: Vue 3 and Tailwind CSS
- Language: TypeScript
- Backend/API: Nuxt/Nitro server routes
- Database: Supabase PostgreSQL
- Authentication: Supabase Auth
- Database authorization: Supabase Row Level Security
- Validation: Zod
- Unit/integration testing: Vitest and Nuxt Test Utils
- E2E testing: Playwright
- CI: GitHub Actions
- Security scanning: Snyk
- Deployment: Vercel
- Runtime baseline: Node.js 22
- Package manager: npm
- No separate Express, NestJS or FastAPI backend unless the constitution is formally amended.

## Development Workflow and Quality Gates

- No direct commits to main.
- All changes must be delivered through Pull Requests.
- Every feature branch must reference its corresponding GitHub Issue or technical ticket.
- Before implementation, a feature must have an approved specification, clarified requirements when needed, a technical plan, and generated implementation tasks.
- Pull Requests must pass linting, type checking, automated tests, and production build before merge.
- Security-sensitive changes must verify authentication, authorization, ownership, validation, and RLS where applicable.
- No real secrets may appear in source code, commits, Issues, or Pull Requests.
- Feature branches must be deleted after merge.
- The preferred merge strategy is Squash and Merge.
- Main must always represent a deployable state.

## Governance

This constitution takes precedence over informal development practices. All team members must follow it, and Pull Request reviews must verify compliance with the constitution. Any exception to these principles must be explicitly documented and justified. Changes to architecture, security rules, or mandatory quality gates require a constitution amendment, and amendments must be reviewed by the team before implementation.

The constitution is the governing standard for all StudyFlow work. It supersedes ad hoc procedures when conflict exists, and it requires explicit technical and process accountability at each delivery stage.

**Version**: 1.0.0 | **Ratified**: 2026-08-17 | **Last Amended**: 2026-08-17
