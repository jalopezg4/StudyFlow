# Research: UI State & Feedback Consistency

## Decision 1: Wire the study-sessions list refresh with the same ref+event+expose pattern already used for Subjects/Tasks

- Decision: `StudySessionList.vue` gains `defineExpose({ refresh: loadSessions })` (it currently exposes nothing); `study-sessions/index.vue` gains a `useTemplateRef` for the list and passes a `@created` handler to `StudySessionForm` that calls `.refresh()` — the identical shape already used by `app/pages/subjects/index.vue` (`SubjectList` + `SubjectForm`) and `app/pages/tasks/index.vue` (`TaskList` + `TaskForm`).
- Rationale: This is a verified, real gap — `study-sessions/index.vue` currently renders `StudySessionForm` and `StudySessionList` as unconnected siblings, so a newly recorded session doesn't appear until a manual reload. The fix is "do what the other two pages already do," not a new pattern.
- Alternatives considered: A shared Pinia/composable store for sessions — rejected, disproportionate for one missing wiring, and neither Subjects nor Tasks use one either (consistency with the existing per-page pattern matters more here than introducing state-management infrastructure).

## Decision 2: Reuse the per-row error-map + disabled-while-pending pattern for session edit/delete

- Decision: `StudySessionList.vue` adds `deletingId`/`savingId` refs and `reactive<Record<string, string>>` error maps for edit and delete, mirroring `SubjectList.vue`'s `deletingId`/`deleteErrors` and `TaskList.vue`'s `deletingId`/`togglingId`/`deleteErrors`/`toggleErrors`. The Save/Delete buttons are disabled only while their own request is pending (per the Clarifications session's resolution of this exact scope question).
- Rationale: `saveEdit`/`removeSession` already set `errorMessage.value` in their catch blocks today, but the template only renders `errorMessage` when the page-level `status` (set once, at initial load) equals `'error'` — which it never does again after a successful load. The message is computed and then never shown. Reusing the established per-row pattern (rather than inventing a page-level toast) fixes this the same way it's already fixed for Subjects and Tasks.
- Alternatives considered: A single shared `errorMessage` shown at the top of the list — rejected, doesn't identify *which* session failed when multiple exist, and diverges from the per-row pattern the rest of the app already uses.

## Decision 3: Replace `window.confirm` with the existing inline confirm-then-button markup

- Decision: `removeSession`'s `if (!window.confirm(...)) return` is replaced with the same two-step "Delete → Confirm delete / Cancel" markup already implemented in `SubjectList.vue` and `TaskList.vue` (a `confirmingDeleteId` ref gating an inline confirmation block).
- Rationale: Native `confirm()` is the one place in the app where deletion doesn't match the established interaction pattern, and it's also why this exact interaction was never covered by this codebase's own Playwright suite — the established inline pattern is both more consistent and more directly testable with `page.getByRole('button', ...)`.
- Alternatives considered: A shared `<ConfirmDialog>` component extracted from the duplicated markup — rejected as out of scope; the ticket asks for consistency with the existing pattern, not a refactor of it, and introducing a new shared component is exactly the kind of scope growth the constitution's Simplicity principle cautions against for a fix-parity feature.

## Decision 4: Format the recorded date and time with a local, dependency-free helper

- Decision: `StudySessionList.vue` renders `session.createdAt` through a small local formatting function (e.g., `new Date(session.createdAt).toLocaleString(...)` with explicit date+time options), matching the Clarifications session's resolution that both date and time must be shown.
- Rationale: No date-formatting library exists in this codebase today (`DatePicker.vue` only builds `YYYY-MM-DD` strings for date *input*, not display), and pulling one in for a single list column would violate the "no new dependency" constraint for zero benefit — the native `Intl`-backed `Date`/`toLocaleString` API already covers this.
- Alternatives considered: Adding a date-formatting library (e.g., `date-fns`) — rejected, unnecessary dependency for one display line.

## Decision 5: Clear stale success/error state with a `watch` on the form's own reactive fields

- Decision: `SubjectForm.vue` and `TaskForm.vue` each add a `watch(() => [form.name/title, form.description], () => { if (status.value !== 'idle' && status.value !== 'loading') { status.value = 'idle'; errorMessage.value = '' } })`-shaped watcher — directly matching the originating ticket's own implementation hint for `SubjectForm.vue`, applied identically to `TaskForm.vue`. `login.vue`/`register.vue` instead clear only the touched field's own entry in `fieldErrors` (e.g., inside a per-field `@input`, or a `watch` on that one `ref`), not the whole error object, so correcting one field never hides a still-valid complaint about a different field.
- Rationale: This is the exact mechanism the ticket itself proposed, it requires no new primitive beyond Vue's own `watch`, and scoping the auth-form fix to the edited field (not a blanket clear-all) avoids silently hiding an unrelated, still-true validation error.
- Alternatives considered: Clearing state only in `handleSubmit` (i.e., only on the *next* submit attempt) — rejected, that's the status quo bug, not a fix; the whole point is clearing it while the student is still typing, before they submit again.

## Decision 6: Copy the existing character-counter markup verbatim onto the edit forms

- Decision: `SubjectEditForm.vue` and `TaskEditForm.vue` each gain the same `<p class="...">{{ form.x.length }}/{{ LIMIT }}</p>` line already present under the corresponding field in `SubjectForm.vue`/`TaskForm.vue`, using the same `NAME_MAX_LENGTH`/`TITLE_MAX_LENGTH`/`DESCRIPTION_MAX_LENGTH` constants already defined in each edit form.
- Rationale: The creation and edit forms already share the same validation limits and constant names; this is a pure markup gap, not a new limit or a new validation rule.
- Alternatives considered: Extracting a shared `<CharacterCounter>` component now — rejected as scope growth beyond what AC06 asks for; four near-identical lines is not yet a premature-abstraction problem per the constitution's Simplicity principle, and the create/edit forms aren't otherwise deduplicated today either.

## Decision 7: Set the page title once, globally, via `nuxt.config.ts`

- Decision: Add `app: { head: { title: 'StudyFlow' } }` to `nuxt.config.ts`, which currently has no `app.head` configuration at all (hence the Nuxt default title).
- Rationale: Matches the spec's own Assumption that this is a single, static, site-wide title, not per-page dynamic titles — the simplest mechanism Nuxt offers for exactly that, requiring no per-page `useHead()` calls.
- Alternatives considered: Calling `useHead({ title: 'StudyFlow' })` in `app.vue` — equivalent in effect, but the static `nuxt.config.ts` option is the more conventional Nuxt mechanism for a title that never varies by route, and keeps `app.vue` unchanged.

## Decision 8: Test via Playwright E2E, extending the existing spec files rather than adding a new test layer

- Decision: AC01–AC04 (all study-session fixes) are added to the existing `tests/e2e/study-sessions.spec.ts`. AC05–AC08 (subject/task stale banners, login/register stale field errors, edit-form counters, page title) go into a new `tests/e2e/feedback-consistency.spec.ts`, using the existing `gotoForm`/`registerAndLandOnDashboard` helpers from `tests/e2e/helpers.ts`.
- Rationale: This codebase has zero precedent for testing a `.vue` file's behavior via Vue Test Utils/component-level Vitest — every existing UI-behavior assertion is a Playwright test against the rendered page. Introducing a second UI-testing approach for nine small fixes would add tooling complexity this feature doesn't need.
- Alternatives considered: Component-level Vitest tests with `@vue/test-utils` — rejected; it would be a new testing dependency and pattern introduced solely for this feature, contradicting the "reuse what's already established" constraint that governs every other decision in this plan.
