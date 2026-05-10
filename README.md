# Personal Media Graph

Local-first macOS desktop app for tracking films, books, series, comics, games, podcasts, tags, notes, and lightweight knowledge-graph relations.

## Stack

- Tauri 2 desktop shell
- React + TypeScript + Vite
- SQLite through `@tauri-apps/plugin-sql`
- Drizzle schema definitions
- React Flow graph view

## Development

```bash
npm install
npm run dev
```

Run the desktop app:

```bash
npm run tauri:dev
```

Checks:

```bash
npm run typecheck
npm run build
npm run test
```

Environment setup notes are in `docs/environment-setup.md`.

## GitHub Setup

Configure this repository before the first commit:

```bash
git config user.name "YOUR_GITHUB_USERNAME"
git config user.email "YOUR_GITHUB_NOREPLY_EMAIL"
git switch -c main
```

After creating an empty GitHub repository:

```bash
git remote add origin git@github.com:YOUR_GITHUB_USERNAME/personal-media-graph.git
git push -u origin main
```
