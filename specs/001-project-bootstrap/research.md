# Phase 0 Research: Project Bootstrap

## Decision: Standardized Nuxt 4 web foundation

**Decision**: The project will use Nuxt 4, Vue 3, TypeScript, and Nitro server routes as the baseline architecture for the StudyFlow application.

**Rationale**: This matches the constitution’s mandatory framework and aligns with the need for a consistent architecture that supports both UI work and server-side API development. A single framework reduces setup drift, keeps contributor onboarding simpler, and supports future Supabase integration without introducing extra backend services.

**Alternatives considered**:
- Separate frontend and backend stacks: rejected because it would increase onboarding friction and create inconsistent validation and deployment workflows.
- Frameworkless SPA with custom server: rejected because it would complicate validation, architecture, and long-term maintainability.

---

## Decision: Supabase-first integration readiness

**Decision**: The foundation will be prepared for Supabase PostgreSQL, Supabase Auth, and Supabase Row Level Security without implementing product features.

**Rationale**: This is explicitly required by the constitution and matches the planned data ownership model for subjects, tasks, and sessions. The framework can be bootstrapped without implementing end-user auth flows, while leaving the project ready for secure integration later.

**Alternatives considered**:
- Custom auth and database layer: rejected because it would add needless operational complexity and conflict with the project’s governance requirements.
- Delaying backend and auth decisions: rejected because the bootstrap must prepare contributors for the eventual architecture.

---

## Decision: Validation and test stack

**Decision**: The project will standardize on Zod for validation, Vitest and Nuxt Test Utils for automated tests, and Playwright for end-to-end validation.

**Rationale**: The constitution mandates these standards and they create a consistent quality gate for both server and app flows. This supports reliable validation for local development and release readiness.

**Alternatives considered**:
- Ad hoc validation and random test tooling: rejected because it would create inconsistent patterns and weaker regression protection.
- One test framework only: rejected because validation coverage needs both unit/integration and user-flow coverage.

---

## Decision: Standard local operations and build pipeline

**Decision**: The bootstrap must define a standard workflow for installation, development, validation, and production builds using Node.js 22 and npm.

**Rationale**: A team of five contributors needs a single, documented command model for local setup and verification. This reduces setup drift and makes release readiness measurable.

**Alternatives considered**:
- Manual developer instructions only: rejected because it is not consistent or repeatable.
- Per-developer shell scripts without documentation: rejected because it would not support easy onboarding or predictable execution.

---

## Key research findings

- Nuxt 4 provides a consistent frontend + server foundation for a full-stack study application.
- Supabase is the recommended integration layer for persistent storage and auth boundaries.
- Zod-based validation and automated quality gates are required before merge and release readiness.
- The project must support both local developer workflows and production build verification with documented commands.
- The technical bootstrap is intentionally limited to foundational architecture and tooling, not product user stories.

## Unresolved decisions resolved during planning

- The system is a web application rather than a library or CLI tool.
- The project’s target platform is local development plus Vercel deployment.
- The architecture will support future product features without committing to a product user story implementation in this phase.
