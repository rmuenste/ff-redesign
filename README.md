# FeatFloWer Redesign

React/Vite migration of the FeatFloWer benchmark website.

## Requirements

- Node.js with npm
- Dependencies installed with:

```bash
npm install
```

## Development Server

Use the Vite dev server while actively editing code:

```bash
npm run dev
```

Vite prints the local URL, usually:

```text
http://localhost:5173/
```

If that port is already in use, Vite will choose another one.

## Preview Server

Use the preview server to inspect the production build locally:

```bash
npm run build
npm run preview
```

Vite prints the preview URL, usually:

```text
http://localhost:4173/
```

If that port is already in use, Vite will choose another one. You can request a
specific port with:

```bash
npm run preview -- --port 4317
```

Then open:

```text
http://localhost:4317/
```

## Useful Checks

```bash
npm run test
npm run build
```

## Stopping A Server

Stop a running dev or preview server with `Ctrl+C` in the terminal where it is
running.

If the original terminal is gone, find the process:

```bash
ps -eo pid,ppid,cmd | rg "(vite|npm run (dev|preview)|node .*vite)"
```

Then stop it:

```bash
kill <pid>
```

## Deployment

The site is published to GitHub Pages at
<https://rmuenste.github.io/ff-redesign/> by
`.github/workflows/pages.yml`, which runs on every push to `master` (and can be
triggered manually from the Actions tab). The workflow installs with `npm ci`,
runs the tests, builds, and uploads `dist/` to Pages.

One-time repository setup: **Settings → Pages → Build and deployment → Source:
GitHub Actions**. The workflow's first run fails without it.

### Base path

The base path is not hard-coded. `actions/configure-pages` reports it and the
workflow passes it as `VITE_BASE_PATH`, which `vite.config.ts` turns into Vite's
`base`, which in turn feeds `import.meta.env.BASE_URL` — read by the router
basename in `src/main.tsx` and by `benchmarkAssetPath` in `src/data/assets.ts`.
The same workflow is therefore correct for the current project site
(`/ff-redesign/`), a user site, or a custom domain.

To reproduce a deployment build locally:

```bash
VITE_BASE_PATH=/ff-redesign/ npx vite build --outDir /tmp/pagesbuild
```

### Deep links

GitHub Pages has no rewrite rules, so a direct request for
`/benchmarks/drafting-kissing-tumbling` would 404 before React Router runs. The
workflow handles this in two steps:

1. `dist/index.html` is copied to `dist/404.html`, so any unknown path still
   boots the app, which then renders the right route.
2. `scripts/prerender-routes.mjs` writes an `index.html` for each known route so
   Pages resolves them as directory indexes and returns a real `200`.

`src/data/routes.test.ts` fails if a route is added to `App.tsx` without being
covered by the prerender list.

Note that `npm run preview` has SPA fallback built in and will **not** reproduce
the Pages 404 behaviour. To test it properly, serve the build with a static
server that falls back to `404.html`.
