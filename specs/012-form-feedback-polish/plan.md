# Implementation Plan: Form Feedback Polish (US12 subtasks 7-10)

**Branch**: `012-form-feedback-polish` | **Date**: 2026-08-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/012-form-feedback-polish/spec.md`

## Summary

Four small, single-file, independent UI fixes from the shared US12 issue (#60): a character
counter on the subject edit form, immediate field-error clearing on register/login, and a
correct browser tab title. No backend, database, or shared-component changes required — every
fix reuses a pattern already established elsewhere in the codebase.

## Technical Context

**Language/Version**: TypeScript 5.9.x, Vue 3.5, Nuxt 4.5

**Primary Dependencies**: None new — reuses existing `reactive`/`ref` form state and Zod schemas already in the codebase

**Storage**: N/A — no data changes

**Testing**: Vitest for the two auth pages' error-clearing logic (extracted as small pure/composable-level checks where practical); manual + existing Playwright coverage exercises the forms end-to-end already

**Target Platform**: Same Nuxt web app, no new surface

**Project Type**: Web application — UI-only polish

**Constraints**: Must not change the validation rules themselves (max lengths, what counts as invalid) — only presentation/feedback timing

**Scale/Scope**: 4 files touched: `app/components/subjects/SubjectEditForm.vue`, `app/pages/register.vue`, `app/pages/login.vue`, `nuxt.config.ts`

## Constitution Check

- Pass: Specification-First Development — spec.md exists and is scoped before any code change.
- Pass: Nuxt-Native and Type-Safe Architecture — no new dependencies, pure Vue/Nuxt reactivity.
- Pass: Security by Default — no auth/authorization logic is touched; only client-side presentation of already-computed validation results.
- Pass: Validation and Automated Quality — validation rules themselves are unchanged; existing Zod schemas remain the source of truth.
- Pass: Simplicity, Traceability and Deployability — each fix stays in its existing file, traceable to Issue #60 subtasks 7-10.

No constitution violations.

## Project Structure

### Documentation (this feature)

```text
specs/012-form-feedback-polish/
├── plan.md
├── spec.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (files touched)

```text
app/components/subjects/SubjectEditForm.vue   # add character counters (mirrors SubjectForm.vue)
app/pages/register.vue                        # clear field error on input
app/pages/login.vue                            # clear field error on input
nuxt.config.ts                                 # app.head.title = "StudyFlow"
```

**Structure Decision**: No new files, no new structure — each fix lands in its existing file, consistent with the issue's own framing ("ten independent, single-file fixes").

## Complexity Tracking

None — no constitution violations or exceptions needed.
