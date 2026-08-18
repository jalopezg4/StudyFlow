## Summary

- [ ] Linked Issue / Ticket: TECH-03 or related HU reference
- [ ] Scope is clear and bounded

## Validation

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run build`

## Security Review Checklist

- [ ] All untrusted inputs (body, params, query) are validated.
- [ ] Authentication is enforced server-side where required.
- [ ] Authorization and ownership checks are enforced server-side.
- [ ] User A cannot access User B data through this change.
- [ ] Supabase RLS implications are identified for user-owned data.
- [ ] No secrets, tokens, private keys, or credentials are exposed.
- [ ] Error responses are sanitized and do not leak internals.
- [ ] Security-focused automated tests were added or updated.

## Notes

- [ ] Any known residual risk is documented.
