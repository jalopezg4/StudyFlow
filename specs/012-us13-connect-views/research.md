# Research: US13 AC04/AC05

## Decision 1

Use `GET /api/tasks?subjectId=...` for inline subject tasks.

Rationale:
- Existing endpoint already supports subject filter and ownership boundary.
- Avoids backend churn and duplicated data paths.

Alternatives considered:
- New endpoint under subjects: rejected as redundant.

## Decision 2

Use `PATCH /api/tasks/:id` to mark recommended task complete.

Rationale:
- Existing endpoint and payload are already used in TaskList behavior.
- Keeps recommendation action aligned with current task lifecycle.

Alternatives considered:
- Dedicated recommendation mutation endpoint: rejected as unnecessary.

## Decision 3

Derive recommendation reason from returned task fields.

Rationale:
- Current recommendation ordering logic is already known and stable.
- No API extension is required.

Alternatives considered:
- Return reason from backend: rejected for current scope.
