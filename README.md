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
