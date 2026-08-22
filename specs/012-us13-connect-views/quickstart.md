# Quickstart: Validate US13 AC04/AC05

## Prerequisites

- App dependencies installed
- Auth environment configured for local run

## Run app

```bash
npm run dev
```

## Scenario 1: AC04 Subject inline tasks

1. Log in as student user.
2. Open /subjects.
3. Click View tasks on a subject row.
4. Confirm inline task list appears under that row.
5. Confirm Hide tasks collapses the panel.
6. Confirm empty state for subjects with no tasks.

## Scenario 2: AC05 Recommendation action and reason

1. Open /dashboard.
2. Locate recommended task card.
3. Confirm reason text appears.
4. Click Mark complete.
5. Confirm card refreshes with next recommendation or empty state.

## Validation commands

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build
```
