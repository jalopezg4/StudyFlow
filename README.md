# StudyFlow

Shared Nuxt 4 + Vue 3 + TypeScript foundation for the StudyFlow app.
See [`specs/001-project-bootstrap/quickstart.md`](specs/001-project-bootstrap/quickstart.md) for setup and validation.

## CI/CD

The repository uses GitHub Actions for validation and Vercel Git integration for deployment.

- Pull requests targeting `main` and pushes to `main` trigger automated validation.
- CI uses `npm ci` followed by linting, type checking, unit tests, the production build, and a Snyk scan when `SNYK_TOKEN` is configured.
- End-to-end tests run on `main` or on selected pull requests labeled `run-e2e` or `e2e` when the suite is too slow for every PR.
- Vercel Git integration provides pull request preview deployments and production deployments from `main`.
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
