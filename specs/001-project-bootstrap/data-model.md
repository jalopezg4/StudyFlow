# Data Model: Project Bootstrap

## Overview

This data model describes the foundational project configuration and operational entities needed to support the StudyFlow technical baseline. It does not define product domain entities such as users, subjects, tasks, or sessions; those remain out of scope for this bootstrap phase.

## Entity: Contributor Environment

**Purpose**: Represents the local setup state required for a contributor to work on the project.

**Fields**:
- `id`: unique contributor environment identifier
- `developerName`: contributor identity used for local context and ownership
- `nodeVersion`: required runtime baseline for the project
- `packageManager`: package manager used to install and run the project
- `setupStatus`: current readiness state of the local environment
- `lastValidatedAt`: timestamp of the most recent local verification run

**Relationships**:
- A contributor environment supports one or more validation workflows.
- A contributor environment depends on one project configuration.

## Entity: Project Configuration

**Purpose**: Captures the required runtime and environment settings for local execution and deployment validation.

**Fields**:
- `id`: unique configuration identifier
- `environmentName`: local, staging, or production context
- `runtimeBaseline`: required runtime version policy
- `appUrl`: local or hosted application endpoint
- `supabaseUrl`: provider endpoint for database and auth integration
- `supabaseAnonKey`: public key for safe client-level access
- `supabaseServiceRoleKey`: protected server-only secret for trusted backend usage
- `secretStatus`: indicates whether secrets are stored securely and not committed

**Relationships**:
- Project configuration is consumed by the application runtime.
- Project configuration supports validation and production build workflows.

## Entity: Validation Workflow

**Purpose**: Represents the standard checks used to verify correctness and release readiness.

**Fields**:
- `id`: unique workflow identifier
- `workflowType`: lint, typecheck, unit test, integration test, end-to-end test, build
- `requiredStatus`: pass/fail gate required for merge or release
- `trigger`: local command, CI workflow, or release step
- `executionResult`: success or failure outcome

**Relationships**:
- A validation workflow validates the project configuration and application runtime state.
- Multiple validation workflows contribute to release readiness.

## Entity: Build Artifact

**Purpose**: Represents the compiled, production-ready output generated from the project baseline.

**Fields**:
- `id`: unique artifact identifier
- `artifactType`: production bundle or deployment artifact
- `generatedAt`: timestamp of build generation
- `status`: success, failure, or pending
- `targetPlatform`: deployment target such as Vercel or equivalent environment

**Relationships**:
- A build artifact is produced from the project configuration and source repository state.
- Build artifacts are validated against production readiness criteria.

## Validation Rules

- Contributor environments must be documented and reproducible from a fresh clone.
- Project configuration values must be kept in secure local storage and never committed to source control.
- Validation workflows must be run before merge and before production-release readiness is considered valid.
- Production build artifacts must be generated successfully in a standard environment before shipping.

## State Transitions

- `Contributor Environment`: Uninitialized → Configured → Ready → Validated
- `Project Configuration`: Missing → Template → Populated → Secure
- `Validation Workflow`: Pending → Running → Passed or Failed
- `Build Artifact`: Pending → Building → Built or Failed
