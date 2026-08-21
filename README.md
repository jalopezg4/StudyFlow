# StudyFlow

A Nuxt 4 + Vue 3 + TypeScript app that helps students organize and stay on top of their studying. Built with Supabase (Auth + Postgres with Row Level Security) for persistence, following Spec-Driven Development — every feature has a spec, plan, and tasks file under [`specs/`](specs/) before implementation.

Current functionality:

- **Authentication**: registration, login, logout, and private route protection ([`specs/004-authentication`](specs/004-authentication)).
- **Subjects**: create and manage the subjects a student is studying ([`specs/004-subject-management`](specs/004-subject-management), [`specs/005-manage-subjects`](specs/005-manage-subjects)).
- **Study Tasks**: create, edit, complete, and delete tasks under a subject ([`specs/005-create-study-task`](specs/005-create-study-task), [`specs/006-manage-study-tasks`](specs/006-manage-study-tasks)).
- **Filter and Sort**: filter tasks by status/subject and sort by due date, created date, or title ([`specs/007-filter-sort-study-tasks`](specs/007-filter-sort-study-tasks)).
- **Recommendation**: surfaces the most urgent task to study next ([`specs/008-study-task-recommendation`](specs/008-study-task-recommendation)).
- **Navigation & UX**: a persistent nav (Dashboard / My Subjects / My Tasks / Log out) reachable from every authenticated page ([`specs/009-nav-ux-polish`](specs/009-nav-ux-polish)).
- **Study Sessions**: record time spent studying a subject or task ([`specs/009-study-session-recording`](specs/009-study-session-recording)).

See [`specs/001-project-bootstrap/quickstart.md`](specs/001-project-bootstrap/quickstart.md) for the original project setup and validation baseline.

## Security Baseline

TECH-03 establishes reusable security and quality conventions for future user stories.

- Security policy: [`SECURITY.md`](SECURITY.md)
- Server-side security conventions: [`docs/security/server-security-conventions.md`](docs/security/server-security-conventions.md)
- Supabase ownership and RLS strategy: [`docs/security/rls-strategy.md`](docs/security/rls-strategy.md)
- Security testing baseline: [`docs/security/testing-baseline.md`](docs/security/testing-baseline.md)
- TECH-03 quickstart and evidence: [`specs/003-security-quality-baseline/quickstart.md`](specs/003-security-quality-baseline/quickstart.md)

Contributors should follow the pull request security checklist in [`.github/pull_request_template.md`](.github/pull_request_template.md).

## Authentication

HU01/HU02 (registration, login, logout, and private route protection) are implemented on Supabase Auth. See [`specs/004-authentication/spec.md`](specs/004-authentication/spec.md) and [`specs/004-authentication/quickstart.md`](specs/004-authentication/quickstart.md) for the full spec and validation scenarios.

To run auth locally, your Supabase project needs:

- Email/password auth enabled (default).
- **Confirm email** disabled under Authentication → Providers → Email (registration establishes a session immediately, per the feature's Clarifications).
- **Minimum password length** set to `8` under Authentication → Policies.
- `.env` populated with `NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from Project Settings → API. Use the project's base URL (e.g. `https://<ref>.supabase.co`), not the `/rest/v1/` REST endpoint.

## CI/CD

The repository uses GitHub Actions for validation and Vercel Git integration for deployment.

- Pull requests targeting `main` and pushes to `main` trigger automated validation.
- CI uses `npm ci` followed by linting, type checking, unit tests, the production build, and a Snyk scan when `SNYK_TOKEN` is configured.
- End-to-end tests run on `main` or on selected pull requests labeled `run-e2e` or `e2e` when the suite is too slow for every PR.
- Vercel Git integration provides pull request preview deployments and production deployments from `main`.
- **Production**: https://studyflow-pi-liard.vercel.app (stable domain, redeploys automatically on every merge to `main`).
- Do not commit secrets. Add CI secrets in GitHub and deployment secrets in Vercel instead.

## Setup

Make sure to install dependencies with npm:

    npm install

Copy the environment template and populate required values (do not commit secrets):

    cp .env.example .env

Then start the app:

    npm run dev

## Testing

    npm run lint        # ESLint
    npm run typecheck    # nuxt typecheck (Vue + TypeScript)
    npm run test         # Vitest unit/integration tests
    npm run test:e2e     # Playwright end-to-end tests (local dev server)
    npm run smoke:prod   # Playwright smoke + isolation tests against production

`npm run test:e2e` and `npm run smoke:prod` use separate Playwright configs (`playwright.config.ts` and `playwright.prod.config.ts`) — the former runs against a local dev server, the latter against the live production URL and is not part of CI.

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

For StudyFlow-specific deployment and validation expectations, see [`specs/002-ci-cd-pipeline/quickstart.md`](specs/002-ci-cd-pipeline/quickstart.md).
