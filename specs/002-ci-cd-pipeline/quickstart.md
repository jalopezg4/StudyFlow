# Quickstart: CI/CD Pipeline Validation

## Purpose
Verify that the delivery pipeline validates pull requests, provides previews, and deploys merged work consistently.

## Prerequisites
- Access to the StudyFlow GitHub repository.
- GitHub Actions enabled on the repository.
- Vercel Git integration connected to the repository.
- Snyk configured for the repository when security scanning is enabled.
- A branch protection rule for main that requires status checks.
- The repository secrets store contains `SNYK_TOKEN` once Snyk is enabled.

## Validation Scenarios

### 1. Pull Request Validation
1. Open a pull request targeting main.
2. Confirm the workflow starts automatically.
3. Confirm the pull request shows status checks for dependency installation, linting, type checking, tests, build, and security scanning.
4. If E2E is enabled for that pull request, confirm the end-to-end stage runs and reports its result.
5. For selected pull requests, add the `run-e2e` or `e2e` label to request end-to-end execution.

**Expected outcome**: The pull request shows a visible pass or fail state before merge.

### 2. Main Branch Validation
1. Push a change directly to main through the normal merge path.
2. Confirm the main-branch workflow starts automatically.
3. Confirm the same validation stages run with the lockfile-based install step.

**Expected outcome**: Main is validated automatically on every push and remains protected by required checks.

### 3. Preview Deployment
1. Open or update a pull request.
2. Wait for the deployment integration to complete.
3. Confirm a preview environment is available for review.

**Expected outcome**: Reviewers can inspect the change in a live preview without manual deployment steps.

### 4. Production Deployment
1. Merge an approved pull request into main.
2. Confirm the production deployment starts automatically through the Git integration.
3. Verify the live environment reflects the merged change.

**Expected outcome**: Production updates automatically from main without a separate manual release process.

### 5. Security Scanning
1. Trigger a pull request workflow with a known High or Critical security finding.
2. Confirm the security scan reports the finding.
3. Confirm the finding blocks readiness once Snyk is configured.
4. Confirm the workflow reports a skipped scan when `SNYK_TOKEN` is not configured rather than exposing a secret in the repository.

**Expected outcome**: Serious security issues are visible and block the change when the scanner is active.

## Notes
- E2E checks may run only on main or selected pull requests if the suite is too slow for every PR.
- Deployment behavior comes from Vercel Git integration rather than a custom deployment service.
- See [data-model.md](data-model.md) for the delivery artifacts referenced in these scenarios.
