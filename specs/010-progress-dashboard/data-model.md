# Data Model: Study Progress Dashboard

## Entity: Progress Summary

A read-only calculated view over the authenticated student's tasks and study sessions.

| Field | Type | Rules |
|---|---|---|
| `totalTasks` | Integer | Count of the owner's tasks |
| `completedTasks` | Integer | Count of owner tasks with status exactly `completed` |
| `pendingTasks` | Integer | Count of owner tasks with status exactly `pending` |
| `completionPercentage` | Integer | `0` when no tasks; otherwise rounded `completedTasks / totalTasks * 100` |
| `totalStudySessions` | Integer | Count of the owner's valid persisted study sessions |
| `totalStudyMinutes` | Integer | Sum of owner's `duration_minutes` values |
| `hasActivity` | Boolean | True when the owner has at least one task or session |

## Source Relationships

- `ProgressSummary` reads `study_tasks` through `user_id` ownership.
- `ProgressSummary` reads `study_sessions` through `user_id` ownership.
- No new persistence entity is introduced.

## Invariants

- `completedTasks + pendingTasks` equals `totalTasks` for the current valid task domain.
- `completionPercentage` is between 0 and 100 inclusive.
- `totalStudyMinutes` is non-negative.
- No source record belonging to another user contributes to any field.
- Empty source datasets produce a successful zero-valued summary.
