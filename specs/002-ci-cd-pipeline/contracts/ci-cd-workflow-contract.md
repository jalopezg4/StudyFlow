# CI/CD Workflow Contract

## Purpose
Define the expected delivery behavior for StudyFlow pull requests, main-branch pushes, preview deployments, production releases, and security gates.

## Required Events

- Pull requests targeting `main`
- Pushes to `main`
- Pull request updates after new commits
- Merge completion into `main`
- Selected pull requests labeled `run-e2e` or `e2e` when end-to-end execution is enabled

## Required Validation Stages

- Repository checkout
- Node setup compatible with the project baseline of Node.js 22+
- Dependency installation using `npm ci`
- Lint validation
- Type checking
- Automated tests
- Production build
- Security scanning

## Required Outcomes

- Pull request failures appear as visible status checks.
- Pull requests receive a preview deployment when Vercel Git integration completes successfully.
- Successful merges to `main` deploy to production automatically through Vercel Git integration.
- Snyk findings at High or Critical severity block readiness once configured.
- Security scans must not reveal secrets in workflow configuration or logs.

## Operational Expectations

- Workflow configuration must not contain secrets.
- The workflow must remain readable by contributors in repository documentation.
- E2E execution may be restricted to `main` or selected pull requests if runtime cost is too high for every pull request.