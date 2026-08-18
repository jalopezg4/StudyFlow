# Research: CI/CD Pipeline

## Decision 1: Use GitHub Actions for CI validation
- Decision: Run pull request and main-branch validation in GitHub Actions.
- Rationale: It is the repository-native automation platform, it surfaces status checks directly on pull requests, and it avoids introducing another delivery system.
- Alternatives considered: External CI services and custom scripting outside GitHub Actions were rejected because they add operational overhead without improving the StudyFlow delivery model.

## Decision 2: Use npm ci for dependency installation
- Decision: CI jobs will install dependencies with npm ci.
- Rationale: npm ci enforces lockfile fidelity, is deterministic, and fails when the lockfile is out of sync with package definitions, which matches the fresh-clone requirement.
- Alternatives considered: npm install was rejected for CI because it can rewrite the lockfile and does not guarantee reproducible installs.

## Decision 3: Target Node.js 24 in CI while supporting the project baseline of Node.js 22+
- Decision: Configure the workflow to run on Node.js 24-compatible runners while preserving compatibility with the project requirement of Node.js 22 or newer.
- Rationale: This satisfies the current environment constraint without narrowing the supported runtime below the constitution baseline.
- Alternatives considered: Pinning to only Node.js 22 would be acceptable for baseline support but would not reflect the requested Node 24-compatible workflow.

## Decision 4: Treat Snyk as the security gate for configured scanning
- Decision: Integrate Snyk into the CI pipeline and block High and Critical findings once configured.
- Rationale: The feature requirement explicitly calls for security scanning and blocking/reporting of serious findings, and Snyk provides the requested severity-oriented policy gate.
- Alternatives considered: Other scanners were not selected because they would require additional policy translation and do not match the requested tooling.

## Decision 5: Use Vercel Git integration for preview and production deployments
- Decision: Rely on Vercel Git integration for pull request previews and production deployments from main.
- Rationale: This keeps deployment behavior consistent, avoids unnecessary custom deployment code, and aligns with the explicit product requirement to use Git integration.
- Alternatives considered: A custom deployment service or bespoke scripts were rejected because they increase complexity and duplicate Vercel-managed deployment behavior.

## Decision 6: Run E2E tests selectively when execution time is high
- Decision: Configure end-to-end tests to run on main and on selected pull requests when execution time would otherwise be too slow for every PR.
- Rationale: This preserves meaningful coverage while preventing preview and validation latency from becoming a bottleneck for contributors.
- Alternatives considered: Running E2E on every PR was considered but deferred because the feature explicitly allows main-only or selected-PR execution when the suite is slow.
