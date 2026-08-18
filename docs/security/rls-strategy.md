# Supabase Ownership and RLS Strategy

This document defines the StudyFlow baseline for user-owned data isolation.

## Ownership Convention

- User-owned tables must include an ownership column named `user_id` or `owner_id`.
- Ownership columns map to the authenticated identity from `auth.users.id`.
- Application server authorization and database RLS must both enforce ownership.

## RLS Access Principles

- **SELECT**: allow reads only when row owner matches authenticated user id.
- **INSERT**: allow inserts only when inserted owner id matches authenticated user id.
- **UPDATE**: allow updates only when existing row owner matches authenticated user id.
- **DELETE**: allow deletes only when existing row owner matches authenticated user id.

## Contribution Rules

- Do not disable RLS to speed up feature implementation.
- Do not trust client-provided user id values as authorization evidence.
- Protected server routes must check authentication and authorization before mutations.
- Service-role keys are server-only and must never be exposed to browser code.

## Future Feature Expectation

Each user-owned table introduced in future HU stories must include:
- ownership column decision,
- matching RLS policy updates,
- server-side authorization test coverage,
- traceability in that feature spec/tasks/tests.
