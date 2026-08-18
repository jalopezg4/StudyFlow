# Data Model: Security and Quality Baseline

## Overview
TECH-03 defines security control entities and ownership relationships used by future StudyFlow features. It does not introduce product domain tables for subjects, tasks, or sessions.

## Entities

### Authenticated Principal
Represents the authenticated user identity resolved by the server for protected operations.

**Fields**
- Subject identifier: canonical user id from authentication provider.
- Authentication state: authenticated or unauthenticated.
- Claims/context: minimal metadata required for authorization decisions.

**Rules**
- Must be resolved server-side for protected operations.
- Must never be accepted from untrusted client-provided identity fields.

### Owned Resource Reference
Represents ownership metadata for user-bound records.

**Fields**
- Resource identifier.
- Owner identifier (`user_id` or `owner_id`).
- Resource type.

**Rules**
- Owner identifier maps to authentication identity.
- Authorization checks must compare authenticated principal id to owner id.

### Validation Contract
Represents schema-validated request input accepted by API boundaries.

**Fields**
- Request body schema.
- Route parameter schema.
- Query parameter schema.
- Validation outcome (pass/fail with safe error details).

**Rules**
- Validation executes before business logic and persistence actions.
- Invalid input responses remain safe and predictable.

### Safe Error Envelope
Represents client-facing error payload for failed protected operations.

**Fields**
- Error code.
- Human-safe message.
- Optional request correlation hint.

**Rules**
- Must not include stack traces, secrets, tokens, SQL details, or internal service credentials.
- Must map known security failures to predictable statuses.

### Dependency Security Signal
Represents security tooling output tied to dependency risk.

**Fields**
- Tool source.
- Severity summary.
- Gate result.

**Rules**
- Existing CI gate remains authoritative for blocking behavior.
- Complementary monitoring may increase visibility without replacing the current gate.

## Ownership and Access Principles

- **SELECT**: Authenticated users can read only rows where `owner_id == principal.id`.
- **INSERT**: Authenticated users can create rows only for their own ownership id.
- **UPDATE**: Authenticated users can update only rows they own.
- **DELETE**: Authenticated users can delete only rows they own.
- **UNAUTHENTICATED**: No access to user-owned rows.

## State Transitions

- Principal state: unauthenticated -> authenticated -> unauthenticated
- Validation contract: unvalidated input -> validated payload or rejected request
- Authorization state: unresolved ownership -> authorized or forbidden
- Error handling path: internal error -> sanitized response
