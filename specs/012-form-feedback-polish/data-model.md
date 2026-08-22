# Data Model: Form Feedback and Page Metadata Polish

No schema, table, column, API payload, or persisted entity changes are required.

The feature uses existing in-memory UI state only:

| State                  | Owner                       | Purpose                                                         |
| ---------------------- | --------------------------- | --------------------------------------------------------------- |
| `form.name`            | `SubjectEditForm.vue`       | Existing subject name value used by the new live counter        |
| `form.description`     | `SubjectEditForm.vue`       | Existing subject description value used by the new live counter |
| `fieldErrors.email`    | `register.vue`, `login.vue` | Existing per-field validation message cleared on email input    |
| `fieldErrors.password` | `register.vue`, `login.vue` | Existing per-field validation message cleared on password input |

No state is shared across pages, sent to new endpoints, or persisted.
