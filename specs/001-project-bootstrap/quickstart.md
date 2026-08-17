# Quickstart: Local development and validation

## Prerequisites

- Node.js 22
- npm
- Git
- A local environment capable of running the project and installing dependencies

## Setup

1. Clone the repository.
2. Open the repository root in a terminal.
3. Install dependencies with `npm install`.
4. Copy the environment template to a local environment file and populate required values without committing secrets.
5. Start the application in development mode.

## Standard commands

- `npm install` — install dependencies
- `npm run dev` — start the application locally
- `npm run lint` — run lint checks
- `npm run typecheck` — verify TypeScript correctness
- `npm run test` — run automated tests
- `npm run build` — produce the production build

## Validation scenarios

1. Local app startup
   - Run `npm run dev`.
   - Confirm the application starts successfully without manual configuration workarounds.

2. Local validation gate
   - Run `npm run lint`, `npm run typecheck`, and `npm run test`.
   - Confirm all checks succeed in a clean local state.

3. Production readiness
   - Run `npm run build`.
   - Confirm the application produces a successful production build.

## Expected outcomes

- Contributors can start the app locally with the documented steps.
- The project passes consistent validation checks before merge.
- The foundation is ready for future product feature work and database/auth integration.
