# Implementation Plan: Form Feedback and Page Metadata Polish

**Branch**: `feat/US12-form-feedback-polish` | **Date**: 2026-08-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/012-form-feedback-polish/spec.md`

## Summary

Implement the three clarified acceptance criteria through four production-file changes: add live name and description counters to `SubjectEditForm.vue` using the exact display pattern already present in `SubjectForm.vue`; add per-field `input` handlers to `register.vue` and `login.vue` that remove only the edited field's validation error; and configure the Nuxt application title as exactly `StudyFlow` in `nuxt.config.ts`. Add focused tests where the existing test structure supports them. No backend, database, shared-component, schema, or unrelated Issue #60 changes are included.

## Technical Context

**Language/Version**: TypeScript 5.9.x, Vue 3, Nuxt 4, Node.js 22+

**Primary Dependencies**: Existing Nuxt/Vue/Tailwind stack, Zod auth schemas, existing Playwright/Vitest setup. No new dependencies.

**Storage**: None. No tables, migrations, persistence, or API contracts change.

**Testing**: Focused tests for the subject edit counter, per-field authentication error clearing, and configured document title, using the repository's existing test conventions. Run the standard lint, typecheck, unit-test, E2E, and build checks as regression validation.

**Target Platform**: Existing Nuxt web application; unchanged.

**Project Type**: Single Nuxt full-stack web application.

**Performance Goals**: No measurable performance change expected. Counters and input handlers are local synchronous UI state updates.

**Constraints**: Production implementation is limited to `app/components/subjects/SubjectEditForm.vue`, `app/pages/register.vue`, `app/pages/login.vue`, and `nuxt.config.ts`. The six other Issue #60 subtasks remain independent. `PasswordInput.vue` and shared auth schemas are not modified.

## Constitution Check

- Pass: Specification-First Development — implementation traces to `spec.md` and AC06–AC08.
- Pass: Nuxt-Native and Type-Safe Architecture — use existing Vue bindings and Nuxt configuration; no new abstraction or dependency.
- Pass: Security by Default — no authentication, authorization, API, or persistence behavior changes; only client-side presentation state is adjusted.
- Pass: Validation and Automated Quality — focused tests plus the existing standard quality commands are required.
- Pass: Simplicity, Traceability and Deployability — four small production-file edits, no schema or service changes, and clear Issue #60 scope boundaries.

No constitution violations or exceptions are identified.

## Project Structure

### Documentation (this feature)

```text
specs/012-form-feedback-polish/
├── spec.md          # Feature requirements and clarified decisions
├── plan.md          # This implementation plan
├── research.md      # Implementation decisions and alternatives
├── data-model.md    # No persisted data; UI state only
└── quickstart.md    # Focused validation and regression commands
```

### Source Code

```text
app/
├── components/subjects/SubjectEditForm.vue  # Add matching live counters
├── pages/register.vue                       # Clear edited field error on input
└── pages/login.vue                          # Clear edited field error on input

nuxt.config.ts                                # Set app.head.title to StudyFlow
```

Focused tests may be added in the existing `tests/` structure without changing production ownership boundaries.

**Structure Decision**: Keep all behavior local to the files that already own the relevant form or application configuration. Reuse the existing maximum constants and `fieldErrors` state; do not create a shared counter component, composable, schema change, or new API surface.

## Implementation Sequence

1. Add the two counters to `SubjectEditForm.vue`, initialized from the existing reactive form values and rendered with the same `current/max` convention as `SubjectForm.vue`.
2. Add field-specific input handlers to `register.vue` and `login.vue`, wiring both the email input and `PasswordInput` to clear only their own `fieldErrors` entry.
3. Add the Nuxt `app.head.title` configuration with the exact value `StudyFlow`.
4. Add or update focused tests for AC06–AC08, then run the standard validation commands and record evidence.

## Risks and Mitigations

- Password input event propagation could differ from native input behavior. Verify the existing `PasswordInput` v-model/input contract through the focused authentication test before considering any broader change; `PasswordInput.vue` remains out of scope.
- Clearing an error by replacing the whole error object could remove another field's feedback. Update the targeted property while preserving the remaining `fieldErrors` entries.
- The title configuration could be placed under the wrong Nuxt key. Validate the built or running document title and typecheck the configuration.
