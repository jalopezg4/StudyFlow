# Navigation UI Contract

## Purpose

Define the contract for the persistent navigation introduced by US11, since this feature has no server API surface — the "contract" here is the component/layout interface other pages depend on.

## `app/layouts/authenticated.vue`

- No props. Renders `<AppNav />` followed by `<slot />` (the page's own content).
- Any page wanting the persistent nav opts in with:

  ```ts
  definePageMeta({ layout: 'authenticated' })
  ```

- Pages that don't opt in (`/`, `/login`, `/register`) are unaffected — they continue to render with no layout, exactly as before this feature.

## `app/components/AppNav.vue`

- No props, no emits. Self-contained: reads the current route via `useRoute()` and calls `useAuth().logout()` directly for its own Log out action, the same composable every other authenticated page already uses.
- Renders exactly three navigation entries, in this fixed order:

  | Label | Target path |
  |---|---|
  | Dashboard | `/dashboard` |
  | My Subjects | `/subjects` |
  | My Tasks | `/tasks` |

- Plus a "Log out" action (not a navigation link) that calls `useAuth().logout()` and redirects to `/login`, matching the existing behavior `dashboard.vue`'s own Log out button had before this feature (FR-001, Decision 3).
- The entry whose `path` matches `useRoute().path` exactly MUST render with a distinct visual treatment (e.g., a filled/underlined state) from the other two (FR-004).
- MUST NOT fetch any data of its own (no subjects, no tasks) — it is pure navigation chrome; the pages it links to remain solely responsible for fetching and rendering their own data via the existing `SubjectList.vue`/`TaskList.vue` components (FR-005).

## Pages consuming the layout

| Page | Before | After |
|---|---|---|
| `app/pages/dashboard.vue` | Own inline "Log out" button; `/subjects`, `/tasks` links labeled "Create subject"/"Create task" | Opts into `authenticated` layout; inline Log out button removed (now in `AppNav`); "Create subject"/"Create task" quick-action links unchanged (they remain valid, focused shortcuts to the create flow specifically) |
| `app/pages/subjects/index.vue` | "← Back to dashboard" link | Opts into `authenticated` layout; "← Back to dashboard" link removed (superseded by the nav's "Dashboard" entry) |
| `app/pages/tasks/index.vue` | "← Back to dashboard" link | Opts into `authenticated` layout; "← Back to dashboard" link removed (superseded by the nav's "Dashboard" entry) |

No change to any component's own script logic, data fetching, or emitted events — only the surrounding page template (layout opt-in, removal of now-redundant links).
