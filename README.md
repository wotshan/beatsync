# beatsync

![beatsync demo](https://raw.githubusercontent.com/wotshan/beatsync/main/.github/assets/demo.gif)

beatsync is a monorepo that contains an API server and a frontend sandbox for prototyping and demonstrating components. It uses TypeScript across the workspace and modern tooling (pnpm, Vite, React, Express, Drizzle ORM, and Zod). This README provides a concise, professional, and animated overview to help contributors and users get started quickly.

---

## Quick demo

The animated image above demonstrates the current UI prototype and interaction flow. If you want to replace it with your own recording, add a GIF at `.github/assets/demo.gif` or update the image URL.

## Features

- TypeScript-first monorepo
- API server with Express and Pino logging
- Drizzle ORM + type-safe schemas
- React + Vite sandbox for rapid prototyping
- Zod-based contract definitions for API types

## Table of contents

- [Requirements](#requirements)
- [Install](#install)
- [Run (development)](#run-development)
- [Build](#build)
- [Project structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Requirements

- Node.js 18+ (recommended)
- pnpm (recommended)

Install pnpm if you don't have it:

```bash
npm install -g pnpm
```

## Install

From the repository root:

```bash
pnpm install
```

This will install dependencies for the workspace.

## Run (development)

Two main packages are available for local development.

Frontend sandbox:

```bash
cd artifacts/mockup-sandbox
pnpm dev
```

API server:

```bash
cd artifacts/api-server
pnpm dev
```

Open the sandbox in your browser (Vite will print the local URL). The API server prints its listening URL to the console.

## Build

To run project type checks and build packages from the root:

```bash
pnpm run typecheck
pnpm run build
```

Or build an individual package:

```bash
cd artifacts/mockup-sandbox
pnpm run build

cd ../api-server
pnpm run build
```

## Project structure

- artifacts/
  - api-server/ — Express-based API implementation
  - mockup-sandbox/ — Vite + React sandbox for UI prototypes
- package.json — root workspace config and scripts

## Contributing

Thanks for wanting to contribute! A few guidelines:

- Follow the existing TypeScript configurations and run `pnpm run typecheck` before opening PRs.
- Keep changes small and focused; include tests or screenshots for UI changes.
- Use conventional commits for clear history (optional but recommended).

If you're unsure where to start, open an issue describing the improvement and tag it as `good first issue`.

## Replacing the demo animation

To add your own animated demo:

1. Create a `.github/assets` directory (if it doesn't exist).
2. Add a GIF and name it `demo.gif`.
3. Commit and push. The README will display the animation automatically.

## License

This repository is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

If you have questions, issues, or suggestions, open an issue in this repository or reach out to the maintainers.
