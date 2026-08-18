# Security Testing Baseline

Future StudyFlow features that touch protected data should include tests for:

- invalid input rejection (body, params, query),
- unauthenticated request rejection,
- unauthorized ownership rejection,
- sanitized error response behavior.

## Recommended Test Pattern

1. Arrange a server context with and without authenticated principal.
2. Act through the target handler or helper with valid and invalid inputs.
3. Assert expected status/error code and verify no sensitive leakage.

## Minimum Assertions

- Validation failures produce predictable client-safe errors.
- Missing principal fails with authentication error.
- Ownership mismatch fails with forbidden error.
- Unknown runtime errors return generic safe message.
