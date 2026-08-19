# Quickstart Validation: Authentication

## Prerequisites

1. A Supabase project exists, with:
   - Email/password auth enabled.
   - "Confirm email" disabled (Clarifications).
   - Minimum password length set to 8.
2. `.env` populated from `.env.example`:
   ```
   NUXT_PUBLIC_SUPABASE_URL=<project-url>
   NUXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   ```
3. Dependencies installed: `npm install` (after `@supabase/supabase-js` and `@supabase/ssr` are added to `package.json`).

## Run

```bash
npm run dev
```

## Manual validation scenarios

1. **Register (CA01/US1, FR-018)**: Open `/register`, submit a new email + an 8+ character password → expect an immediate redirect to `/dashboard` (no separate login step needed).
2. **Duplicate registration (FR-004, FR-019)**: Log out, repeat step 1 with the same email → expect to stay on `/register` with a generic success-looking outcome, no second account, no redirect to `/dashboard`, no confirmation of which email exists.
3. **Invalid registration input (CA04)**: Submit an invalid email or a password under 8 characters → expect client-side field errors, no network call.
4. **Login (CA02/US2)**: Log out, open `/login`, submit the credentials from step 1 → expect redirect to `/dashboard`.
5. **Invalid login (CA03)**: Submit a wrong password → expect one generic error message.
6. **Direct private URL, no session (US4/CA01)**: In a fresh/incognito session, navigate directly to `/dashboard` → expect redirect to `/login`.
7. **Direct private URL, with session (US4/CA02)**: While logged in, navigate directly to `/dashboard` → expect access granted.
8. **Server-level bypass attempt (US4/CA03)**: While logged out, call any protected server route directly (e.g., via curl/Postman) → expect a 401/redirect-equivalent rejection, not data.
9. **Logout (US3/CA01)**: While on `/dashboard`, trigger logout → expect redirect to `/login`.
10. **Post-logout access (US3/CA02)**: After step 9, navigate back to `/dashboard` (including via browser back button) → expect redirect to `/login`, no cached private content shown.
11. **Already-authenticated redirect (FR-015)**: While logged in, navigate to `/login` or `/register` → expect redirect to `/dashboard`.

## Automated coverage (see tasks.md)

- Vitest: Zod schema validation (register/login), `server/middleware/auth.ts` session resolution (mock cookies/JWT), route-protection redirect logic.
- Playwright: at least scenarios 1, 4, 6, 9, 10 above as an end-to-end flow.
