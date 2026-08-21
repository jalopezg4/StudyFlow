# Study Session Creation Contract

## Endpoint

`POST /api/study-sessions`

## Authentication

A valid authenticated session is required. Missing or invalid authentication returns `401 UNAUTHENTICATED` before persistence.

## Request Body

```json
{
  "subjectId": "uuid",
  "taskId": "uuid (optional)",
  "durationMinutes": 45
}
```

- `subjectId` is required and must be a valid UUID.
- `taskId` is optional and must be a valid UUID when supplied.
- `durationMinutes` is required and must be an integer from 1 through 1,440.
- Unknown ownership fields such as `userId` or `ownerId` are not accepted as authority.

## Success Response

Status: `201 Created`

```json
{
  "status": "ok",
  "studySession": {
    "id": "uuid",
    "subjectId": "uuid",
    "taskId": "uuid or null",
    "durationMinutes": 45,
    "createdAt": "timestamp"
  }
}
```

## Error Responses

| Status | Code | Meaning |
|---:|---|---|
| 401 | `UNAUTHENTICATED` | No valid authenticated principal |
| 404 | `NOT_FOUND` | Subject or optional task is not available to the authenticated owner |
| 422 | `VALIDATION_ERROR` | Invalid body, duration, UUID, or unsupported input |
| 500 | Safe internal error | Persistence failure without database details |

Cross-owner and nonexistent references use the same safe `404 NOT_FOUND` shape so the endpoint does not disclose another student's resource.

## Processing Rules

1. Resolve the authenticated principal.
2. Validate the complete request body.
3. Verify the subject belongs to the principal.
4. If `taskId` is present, verify the task belongs to the principal and its `subjectId` equals `subjectId`.
5. Insert the session with server-derived `userId` and database-generated `id`/`createdAt`.
6. Return the created session without exposing internal persistence errors.
