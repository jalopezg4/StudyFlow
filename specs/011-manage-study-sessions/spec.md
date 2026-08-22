# Feature Specification: Manage Study Sessions

**Feature Branch**: `feat/HU11-manage-study-sessions`

**Created**: 2026-08-21

**Status**: Implementing

## User Story

As a student, I want to view, edit, and delete my recorded study sessions, so that my study-time history remains accurate.

## Acceptance Criteria

- **AC01**: An authenticated student can view only their own recorded sessions.
- **AC02**: An authenticated student can edit a session's duration and valid subject/task association.
- **AC03**: Duration edits accept only whole minutes from 1 through 1,440.
- **AC04**: A task association must belong to the authenticated student and selected subject.
- **AC05**: An authenticated student can delete their own session.
- **AC06**: Unauthenticated or cross-owner access is rejected without exposing or changing data.

## Functional Requirements

- Sessions remain independent records; time is not stored as a mutable field on tasks.
- Ownership is derived from the authenticated server session.
- The API validates all body and route input before persistence.
- Empty session history is a valid response.
- Dashboard aggregates reflect edits and deletions on reload.

## Scope

This feature adds session listing, editing, and deletion. Timers, bulk operations, reporting filters, and session notes remain out of scope.
