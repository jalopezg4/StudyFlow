# Phase 1 Data Model: Study Session Feedback & Refresh Fixes

This feature does not add, remove, or change any persisted field, table, or API contract.
It only changes how already-available data is surfaced in the UI, and adds local
(client-only) UI state for confirmation and error display. Documented here for completeness
per the Phase 1 template.

## Existing Entity (unchanged): Study Session

Already defined server-side and already returned by `/api/study-sessions` (GET/POST/PATCH).
Reused as-is by this feature.

| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Session identifier |
| `subjectId` | string (UUID) | Owning subject |
| `taskId` | string \| null | Optional associated task |
| `durationMinutes` | number | Editable via PATCH |
| `createdAt` | string (ISO 8601) | Already returned by the API; **not currently rendered in the list — this feature adds the rendering only (FR-006)** |

No validation rule changes: duration validation (`min 1`, `max 1440`) already exists
server-side and client-side and is untouched.

## New Client-Only UI State: `StudySessionList.vue`

Not persisted, not sent to the server — local component state only, mirroring
`SubjectList.vue`.

| State | Type | Purpose |
|---|---|---|
| `confirmingDeleteId` | `string \| null` | Which session (if any) is showing the inline delete confirmation. Only one at a time (Edge Case). |
| `deleteErrors` | `Record<string, string>` | Per-session delete error message, keyed by session id, so an error on one session's delete doesn't clash with another's. |
| `errorMessage` | `string` | Single edit-error message, shown while `editingId` is set (only one session can be in edit mode at a time, so a single field is sufficient). |

### State Transitions (delete confirm flow)

```
idle --requestDelete(id)--> confirming(id)
confirming(id) --cancelDelete(id)--> idle
confirming(id) --confirmDelete(id) [success]--> idle, session removed from list
confirming(id) --confirmDelete(id) [failure]--> confirming(id), deleteErrors[id] set
```

## Component Contract (internal, not a network contract)

`StudySessionList.vue` exposes (via `defineExpose`) a `refresh()` method, matching
`SubjectList.vue`'s exposed contract:

```ts
defineExpose({ refresh: loadSessions })
```

`StudySessionForm.vue` emits a `created` event on successful submit, matching
`SubjectForm.vue`'s emitted contract:

```ts
const emit = defineEmits<{ created: [session: CreatedStudySession] }>()
```

`app/pages/study-sessions/index.vue` wires the two together, matching
`app/pages/subjects/index.vue`:

```ts
const sessionList = useTemplateRef('sessionList')
function handleCreated() {
  sessionList.value?.refresh()
}
```
