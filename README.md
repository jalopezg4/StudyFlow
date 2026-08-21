# StudyFlow

Shared Nuxt 4 + Vue 3 + TypeScript foundation for the StudyFlow app.
See [`specs/001-project-bootstrap/quickstart.md`](specs/001-project-bootstrap/quickstart.md) for setup and validation.

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
