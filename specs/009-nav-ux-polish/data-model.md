# Data Model: My Subjects and My Tasks Navigation & UX Polish

No schema, table, column, or API contract changes. This feature introduces no new entity — it is a presentation-layer addition over the existing Subject (HU03/HU04) and Study Task (HU05/HU06/HU07/HU08) entities, which are unchanged.

## Nav Entry (client-side, not persisted)

The only new "shape" this feature introduces is a small, static, in-memory list driving `AppNav.vue` — not a database or API concept:

| Field | Type | Notes |
|---|---|---|
| `label` | `string` | Display text: "Dashboard", "My Subjects", "My Tasks". |
| `path` | `string` | Target route: `/dashboard`, `/subjects`, `/tasks`. |
| `isActive` | `boolean` (computed) | `true` when `useRoute().path === path`; drives the active-section visual state (FR-004). |

This list is hardcoded in `AppNav.vue` (three fixed entries) — it is not fetched, configured, or stored anywhere; there is no persistence concern.
