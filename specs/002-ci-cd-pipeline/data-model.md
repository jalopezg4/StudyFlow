# Data Model: CI/CD Pipeline

## Overview
This feature primarily manages workflow state rather than product data. The important entities are delivery artifacts and their status transitions.

## Entities

### Pull Request Validation Run
Represents one CI execution associated with a pull request.

**Fields**
- Pull request reference: the change under validation.
- Trigger event: pull request opened, synchronized, or re-run.
- Validation status: pending, passing, or failing.
- Check results: lint, type check, tests, build, security scan, and optional E2E status.
- Completion timestamp: when the validation finished.

**Rules**
- Must be created for each eligible pull request event targeting main.
- Must expose a visible status to reviewers before merge.
- Must fail if any required validation stage fails.

### Main Branch Validation Run
Represents one CI execution associated with a push to main.

**Fields**
- Commit reference: the main-branch change being validated.
- Trigger event: push to main.
- Validation status: pending, passing, or failing.
- Check results: lint, type check, tests, build, security scan, and optional E2E status.
- Completion timestamp: when the validation finished.

**Rules**
- Must run for every push to main.
- Must use the lockfile for dependency installation.
- Must block release readiness when a required stage fails.

### Preview Deployment
Represents the temporary deployment created for a pull request.

**Fields**
- Pull request reference: the source change.
- Preview URL: the accessible review environment.
- Deployment status: pending, available, failed, or removed.
- Last updated: when the preview was refreshed.

**Rules**
- Must be associated with a single pull request.
- Should refresh when the pull request receives new commits.
- Must not persist indefinitely after the pull request closes.

### Production Deployment
Represents the deployment produced from the main branch.

**Fields**
- Main branch reference: the release source.
- Deployment status: pending, live, or failed.
- Deployment timestamp: when the release became available.
- Live environment reference: the public production target.

**Rules**
- Must originate from main.
- Must be triggered automatically after a successful merge.
- Must remain the only production release path for this feature.

### Security Scan Result
Represents the output of the configured security check.

**Fields**
- Scan target: the pull request or main-branch change.
- Severity summary: counts of findings by severity.
- Gate decision: pass or block.
- Report visibility: available to reviewers.

**Rules**
- High and Critical findings must block once the scanner is configured.
- Security results must be surfaced in the same review flow as other checks.

## State Transitions

- Pull request validation run: pending → passing or failing
- Main branch validation run: pending → passing or failing
- Preview deployment: pending → available or failed → removed
- Production deployment: pending → live or failed
- Security scan result: pass or block
