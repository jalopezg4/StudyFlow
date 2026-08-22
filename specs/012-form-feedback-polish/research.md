# Research: Form Feedback and Page Metadata Polish

## Decision 1: Mirror the existing subject creation counter markup

- **Decision**: Render `form.name.length / NAME_MAX_LENGTH` and `form.description.length / DESCRIPTION_MAX_LENGTH` beneath the corresponding edit controls, matching `SubjectForm.vue`.
- **Rationale**: The edit form already owns the same limits and reactive values. Reusing that established display convention avoids a second UX pattern and keeps initial values and live updates correct.
- **Alternatives considered**: A reusable counter component was rejected because this is a two-file presentation pattern with no meaningful complexity reduction, and shared-component changes are explicitly out of scope.

## Decision 2: Clear only the field being edited

- **Decision**: Add small field-specific input handlers in `register.vue` and `login.vue` that remove only the matching key from `fieldErrors`; bind them to email and password controls.
- **Rationale**: The existing submit path can produce errors for both fields. Replacing the entire error object on one input would hide useful feedback for the other field, while a targeted update satisfies AC07.
- **Alternatives considered**: Revalidate the whole form on every keystroke was rejected because it changes current submit-time validation behavior and is not required by the acceptance criterion.

## Decision 3: Use Nuxt application head configuration for the title

- **Decision**: Set `app: { head: { title: 'StudyFlow' } }` in `nuxt.config.ts`.
- **Rationale**: This is Nuxt's application-level configuration for the document title and applies consistently to pages without introducing page-specific metadata duplication.
- **Alternatives considered**: Adding `useHead` to individual pages was rejected because the requirement is the real application title and page-local declarations would be incomplete or repetitive.

## Decision 4: Focused tests plus existing regression commands

- **Decision**: Add focused coverage only where it fits the current test harness, then run existing lint, typecheck, unit, E2E, and build checks.
- **Rationale**: The change is client-side and narrow, but AC06–AC08 each has a directly observable behavior. Existing project conventions should determine whether a test is unit or browser-level; no new testing dependency is justified.
- **Alternatives considered**: Adding a new component-testing framework was rejected because it expands the dependency and test architecture for three small UI behaviors.
