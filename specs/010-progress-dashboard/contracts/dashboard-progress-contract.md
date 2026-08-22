# Dashboard Progress Contract

## Endpoint

`GET /api/dashboard/progress`

## Authentication

A valid authenticated session is required. Missing or invalid authentication returns `401 UNAUTHENTICATED` before returning dashboard data.

## Success Response

Status: `200 OK`

```json
{
  "status": "ok",
  "progress": {
    "totalTasks": 4,
    "completedTasks": 2,
    "pendingTasks": 2,
    "completionPercentage": 50,
    "totalStudySessions": 3,
    "totalStudyMinutes": 135,
    "hasActivity": true
  }
}
```

For a student with no tasks or sessions:

```json
{
  "status": "ok",
  "progress": {
    "totalTasks": 0,
    "completedTasks": 0,
    "pendingTasks": 0,
    "completionPercentage": 0,
    "totalStudySessions": 0,
    "totalStudyMinutes": 0,
    "hasActivity": false
  }
}
```

## Error Responses

| Status | Code | Meaning |
|---:|---|---|
| 401 | `UNAUTHENTICATED` | No valid authenticated principal |
| 500 | Safe internal error | Aggregation failed without exposing database details |

## Calculation Rules

- Task counts include only records owned by the authenticated principal.
- `completedTasks` counts status `completed` exactly.
- `pendingTasks` counts status `pending` exactly.
- `completionPercentage` is `0` with no tasks; otherwise it is rounded to the nearest whole percent.
- `totalStudySessions` counts only sessions owned by the authenticated principal.
- `totalStudyMinutes` is the sum of the owner's `duration_minutes` values.
- The endpoint never mutates source data.
