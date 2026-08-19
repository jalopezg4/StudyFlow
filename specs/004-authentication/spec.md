# Feature Specification: Authentication (Registration, Login, Logout & Route Protection)

**Feature Branch**: `[004-authentication]`

**Created**: 2026-08-18

**Status**: Draft

**Input**: User description: "HU01 - Registro e inicio de sesión / HU02 - Cerrar sesión y proteger rutas privadas: como estudiante quiero registrarme, iniciar sesión, cerrar sesión y que mis páginas privadas (dashboard, materias, tareas, estudio) estén protegidas para usuarios no autenticados, usando Supabase Auth como proveedor de identidad."

## Clarifications

### Session 2026-08-18

- Q: Should registration require email confirmation before a student can log in? → A: No. Email confirmation is disabled; a successful registration immediately allows login.
- Q: What concrete private page does this feature build to demonstrate route protection? → A: A minimal dashboard placeholder page, protected by the route-protection mechanism, that later becomes the real HU10 dashboard.
- Q: What minimum password length is enforced and documented? → A: 8 characters minimum, configured in the Supabase Auth project and documented here for deterministic acceptance testing.

### Session 2026-08-19

- Q: Should a successful registration redirect the student straight into the dashboard, or leave them on the registration form to log in separately? → A: Redirect straight to the dashboard. Since email confirmation is disabled, registration already establishes a session; requiring a separate manual login is redundant friction.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Account Registration (Priority: P1)

As a student without an account, I want to register with my email and a password, so that StudyFlow can identify me and keep my academic data private to me.

**Why this priority**: Without an account there is no identity to attach any other feature to; this is the entry point for every other user story in the product.

**Independent Test**: Can be fully tested by submitting a valid, previously-unused email and a password that meets the configured policy, and observing that an account is created and the visitor lands directly in the authenticated dashboard.

**Acceptance Scenarios**:

1. **Given** a visitor without a registered account, **When** they submit a valid email and a password that meets the policy, **Then** the system creates the account, establishes an authenticated session immediately, and takes the student directly to the dashboard without a separate manual login step.
2. **Given** a visitor without a registered account, **When** they submit an email that is already registered, **Then** the system does not create a duplicate account, does not start a session, stays on the registration screen, and shows a generic outcome that does not confirm or deny which specific account exists.
3. **Given** a visitor on the registration form, **When** they submit an invalid email format or a password that does not meet the policy, **Then** the form blocks submission and identifies the fields that need correction, without contacting the server for the invalid case.
4. **Given** a visitor on the registration form, **When** they leave required fields empty and attempt to submit, **Then** the system prevents submission and indicates the missing fields.

---

### User Story 2 - Login (Priority: P1)

As a student with an existing account, I want to log in with my email and password, so that I can access my personal academic data.

**Why this priority**: Registration alone delivers no recurring value; a student must be able to return and authenticate to use the product session after session.

**Independent Test**: Can be fully tested by submitting the credentials of an existing account and observing that an authenticated session starts and the student is redirected to the dashboard.

**Acceptance Scenarios**:

1. **Given** a student with a valid account, **When** they submit the correct email and password, **Then** the system starts an authenticated session and redirects them to the dashboard.
2. **Given** a student on the login screen, **When** they submit an incorrect password or an email with no matching account, **Then** the system does not start a session and shows a single generic error message that does not reveal which of the two was wrong.
3. **Given** a student on the login screen, **When** they submit an invalid email format or leave a field empty, **Then** the form blocks submission and identifies the fields that need correction.

---

### User Story 3 - Logout (Priority: P2)

As an authenticated student, I want to end my session, so that my academic data is not exposed if someone else uses my device afterward.

**Why this priority**: Ending a session correctly is what makes the protection in User Story 4 meaningful on shared or public devices; it is slightly lower priority than establishing a session because it has no effect until a session exists.

**Independent Test**: Can be fully tested by logging in, triggering logout, and then verifying the session is gone and any subsequent attempt to reach a private page redirects to login.

**Acceptance Scenarios**:

1. **Given** a student with an active session, **When** they choose to log out, **Then** the system ends the session and redirects them to the login screen.
2. **Given** a student who just logged out, **When** they attempt to reach a previously-open private page without logging in again, **Then** the system denies access and redirects to login.

---

### User Story 4 - Private Route Protection (Priority: P1)

As a student, I want pages containing my academic information (dashboard, subjects, tasks, study sessions) to be inaccessible to anyone who is not authenticated as me, so that my data stays private.

**Why this priority**: This is the security guarantee the rest of the product depends on; without it, authentication would be cosmetic rather than a real access control.

**Independent Test**: Can be fully tested by attempting to open the dashboard placeholder URL directly with no active session (expect redirect to login) and again with a valid active session (expect access granted), including a direct request to the underlying data operation, not only the page.

**Acceptance Scenarios**:

1. **Given** a visitor with no active session, **When** they try to open a private URL directly, **Then** the system denies access and redirects them to login.
2. **Given** a student with a valid active session, **When** they open a private URL, **Then** the system grants access.
3. **Given** a visitor with no active session, **When** they call a server operation that reads or modifies private data directly (bypassing the page), **Then** the server rejects the operation regardless of what the frontend would have shown.

---

### Edge Cases

- What happens when a visitor resubmits the registration form multiple times in quick succession with the same email? The system must not create duplicate accounts and must keep responding with the same generic outcome.
- What happens when a student's session expires while they are on a private page? The next action requiring server data must redirect them to login rather than silently failing or showing stale data.
- What happens when the same account is used to log in from two different browsers/devices at once? Both sessions are allowed to remain valid independently; logging out from one does not need to end the other (concurrent sessions are in scope for this feature and require no special handling).
- What happens when the email/password combination is correct but the account was never completed (if any account confirmation step exists)? The error shown must remain generic and must not reveal account existence or state.
- What happens when a student who is already authenticated navigates directly to the login or registration page? They are redirected to the dashboard instead of being shown the form again.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a visitor to register a new account using an email address and a password.
- **FR-002**: The system MUST reject registration when the email format is invalid, presenting field-level feedback before any server round-trip is required.
- **FR-003**: The system MUST enforce a minimum password length of 8 characters at registration and MUST reject shorter passwords, with feedback identifying that the password is the problem.
- **FR-004**: The system MUST NOT create a second account for an email address that is already registered, and MUST respond in a way that does not disclose whether the blocking reason was "email already exists" versus any other server-side validation failure.
- **FR-005**: The system MUST allow a student with a registered account to log in using their email and password.
- **FR-006**: The system MUST reject login attempts with incorrect credentials and MUST show one generic error message that does not indicate whether the email or the password was the incorrect part.
- **FR-007**: The system MUST establish an authenticated session upon successful login and MUST redirect the student to the dashboard.
- **FR-008**: The system MUST allow an authenticated student to explicitly log out, ending their session.
- **FR-009**: The system MUST redirect a student to the login screen immediately after logout.
- **FR-010**: The system MUST NOT store account passwords in any table owned by StudyFlow; credential storage and verification are delegated entirely to the authentication provider.
- **FR-011**: The system MUST NOT write passwords, session tokens, or other credential material to application logs.
- **FR-012**: The system MUST deny access to any private page (including, at minimum, dashboard, subjects, tasks, and study sessions) when there is no valid authenticated session, and MUST redirect the visitor to login.
- **FR-013**: The system MUST grant access to private pages when a valid authenticated session exists.
- **FR-014**: The system MUST enforce the same access denial described in FR-012 at the level of every server operation that reads or writes private data, independent of what the frontend does or does not display.
- **FR-015**: The system MUST allow an already-authenticated student who navigates to the login or registration screen to be redirected to the dashboard instead of seeing the form again.
- **FR-016**: The system MUST NOT require any email confirmation step between registration and the ability to log in.
- **FR-017**: The system MUST provide at least one real, navigable private page (a dashboard placeholder) protected end-to-end by the mechanisms in FR-012 through FR-014, so route protection is demonstrable beyond automated tests alone.
- **FR-018**: The system MUST redirect a student directly to the dashboard immediately after a successful registration, without requiring a separate manual login step, since registration already establishes the session (FR-016).
- **FR-019**: The system MUST NOT redirect to the dashboard when registration did not establish a session (the FR-004 duplicate-email case); the student remains on the registration screen and sees the generic outcome instead.

*Out of scope for this feature (explicitly excluded per the backlog)*:
- Social login (OAuth providers such as Google/GitHub).
- Password recovery / "forgot password" flow.
- Multi-factor authentication (MFA).

### Key Entities

- **Account / User**: The identity a student authenticates as. Owns all other academic data created in the product (subjects, tasks, study sessions). Represented by the identity the authentication provider manages; StudyFlow only stores a reference to it, never the credential itself.
- **Session**: The proof that a request is being made by a specific authenticated Account. Has a start (login) and an end (logout, or expiration). All private-data operations depend on a valid Session being present.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new student can go from the registration form to a created account in under 2 minutes.
- **SC-002**: A returning student can go from the login form to seeing their dashboard in under 30 seconds under normal conditions.
- **SC-003**: 100% of attempts to open a private URL without an active session result in a redirect to login, with zero private data shown or returned.
- **SC-004**: 100% of direct server-level requests for private data without a valid session are rejected, verified independently of the page-level redirect.
- **SC-005**: After logout, 100% of subsequent attempts to reach a previously-open private page redirect to login instead of showing cached private content.
- **SC-006**: Invalid-credential and duplicate-registration attempts never reveal, through response content or timing differences visible to a normal user, which specific piece of information (email existence vs. password correctness) was wrong.

## Assumptions

- Supabase Auth is the authentication provider, per project constitution; StudyFlow's own database tables never receive or store raw passwords.
- Email confirmation is disabled in the Supabase Auth project for this feature (see Clarifications); registration success and login availability are the same moment.
- Minimum password length is 8 characters, configured in the Supabase Auth project (see Clarifications); no other password complexity rule is required beyond the provider's remaining defaults.
- Concurrent sessions across multiple devices/browsers for the same account are allowed; there is no requirement in the backlog to enforce single-session-per-account.
- The dashboard placeholder page built for this feature (see Clarifications and FR-017) is intentionally minimal; its real content (metrics, recommended task, etc.) is delivered later by HU10 and is out of scope here. Additional private pages introduced by later user stories (HU03+: subjects, tasks, study sessions) reuse the same protection mechanism this feature establishes.
- Standard web session security practices (e.g., session data not exposed to unrelated scripts, session invalidated on logout) apply; this feature does not introduce requirements beyond what the authentication provider already guarantees.
