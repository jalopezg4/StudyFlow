# Implementation Plan: Manage Study Sessions

**Branch**: `feat/HU11-manage-study-sessions` | **Date**: 2026-08-21 | **Spec**: [spec.md](spec.md)

Reuse the existing study-session entity and security boundary. Add owner-scoped list/update/delete repository operations, protected Nitro routes, a session history UI with inline editing and deletion, and focused tests. The existing dashboard will consume the updated aggregates without API changes.

## Design Decisions

- Session owner always comes from `requireAuthenticatedPrincipal`.
- Subject is required; task is optional and must belong to the selected subject.
- Duration is an integer from 1 to 1,440 minutes.
- Cross-owner and missing records use safe `404 NOT_FOUND` responses.
- Update/delete RLS policies are added in a new migration.
