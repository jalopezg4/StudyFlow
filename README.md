# StudyFlow

Shared Nuxt 4 + Vue 3 + TypeScript foundation for the StudyFlow app.
See [`specs/001-project-bootstrap/quickstart.md`](specs/001-project-bootstrap/quickstart.md) for setup and validation.
## Setup

Make sure to install dependencies with npm:

    npm install

Copy the environment template and populate required values (do not commit secrets):

    cp .env.example .env

Then start the app:

    npm run dev

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
