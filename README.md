# Personal Media Graph

A local-first desktop application for cataloging and exploring your personal media library. Track films, books, anime, series, comics, games, and podcasts — then connect them through a lightweight knowledge graph.

## Features

- **Media Library** — Add, edit, and organize media entries with titles, creators, years, ratings, reviews, and cover images
- **Tagging System** — Group and filter your collection with custom tags
- **Knowledge Graph** — Link related media through typed relations: adaptations, shared creators, series continuity, and more
- **Graph Visualization** — Interactive node graph powered by React Flow
- **Local-First** — All data stored in a local SQLite database — no accounts, no cloud dependency
- **Cross-Platform** — Runs on macOS, Windows, and Linux via Tauri

## Tech Stack

| Layer       | Technology                                   |
|-------------|----------------------------------------------|
| Desktop     | [Tauri 2](https://tauri.app)                 |
| Frontend    | React 18, TypeScript, Vite                   |
| Database    | SQLite via `@tauri-apps/plugin-sql`          |
| ORM         | [Drizzle ORM](https://orm.drizzle.team)      |
| Graph UI    | [React Flow](https://reactflow.dev)          |
| Validation  | [Zod](https://zod.dev)                       |
| Testing     | [Vitest](https://vitest.dev) + Testing Library |
| Styling     | Plain CSS                                    |

## Project Structure

```
src/
├── components/        # React UI components
│   ├── Sidebar.tsx        # Navigation sidebar
│   ├── MediaCollection.tsx# Media list and grid views
│   ├── DetailPanel.tsx    # Media detail editor
│   ├── GraphView.tsx      # Knowledge graph visualization
│   └── Toolbar.tsx        # Top toolbar
├── data/              # Data layer
│   ├── schema.ts          # Drizzle ORM schema definitions
│   ├── repository.ts      # Repository interface
│   ├── memoryRepository.ts# In-memory implementation (tests)
│   ├── sqlRepository.ts   # SQLite implementation
│   ├── validation.ts      # Zod schemas and validation
│   └── id.ts              # ID generation
├── domain/            # Shared domain types
│   └── types.ts           # MediaItem, Tag, MediaRelation, etc.
├── hooks/             # React hooks
│   └── useMediaLibrary.ts # Media library state management
└── test/              # Test setup
src-tauri/
├── src/
│   ├── main.rs            # Tauri entry point
│   └── lib.rs             # Plugin registration
├── Cargo.toml
└── tauri.conf.json
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) ≥ 18
- [Rust](https://rustup.rs) ≥ 1.77.2

### Development

```bash
# Install Node dependencies
npm install

# Start Vite dev server (frontend only)
npm run dev

# Launch the full desktop app
npm run tauri:dev

# Run type checking
npm run typecheck

# Run tests
npm run test

# Build for production
npm run tauri:build
```

Detailed environment setup instructions are available in [docs/environment-setup.md](docs/environment-setup.md).

## License

MIT
