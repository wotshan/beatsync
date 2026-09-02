# beatsync

[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [![TypeScript](https://img.shields.io/badge/TypeScript-%5E5.9-blue?logo=typescript)](https://www.typescriptlang.org/) [![pnpm](https://img.shields.io/badge/pnpm-Workspace-%2346B0FF?logo=pnpm)](https://pnpm.io/) [![Vite](https://img.shields.io/badge/Vite-%23197AFA?logo=vite&logoColor=white)](https://vitejs.dev/) [![React](https://img.shields.io/badge/React-%2320232a?logo=react&logoColor=%2361DAFB)](https://reactjs.org/)

![beatsync demo](https://raw.githubusercontent.com/wotshan/beatsync/main/.github/assets/demo.gif)

beatsync is a TypeScript-first monorepo containing an API server and a frontend sandbox for prototyping and demonstrating UI components. The README shows animated placeholders for interactive carousels (tech stack and a glassmorphism-styled showcase) — replace the GIFs in .github/assets with your exported recordings to make them live.

---

## Quick demo

The animated image above demonstrates the current UI prototype and interaction flow. If you want to replace it with your own recording, add a GIF at `.github/assets/demo.gif` or update the image URL.

## Features

- TypeScript-first monorepo
- API server with Express and Pino logging
- Drizzle ORM + type-safe schemas
- React + Vite sandbox for rapid prototyping
- Zod-based contract definitions for API types
- Animated tech stack and glassmorphism carousels (placeholders)

## Table of contents

- [Requirements](#requirements)
- [Install](#install)
- [Run (development)](#run-development)
- [Build](#build)
- [Tech stack carousel](#tech-stack-carousel)
- [Glassmorphism carousel](#glassmorphism-carousel)
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

## Tech stack carousel

Animated showcase of the primary technologies used across the workspace. This is a looping carousel GIF placeholder; add your exported recording as `.github/assets/tech-stack-carousel.gif` to display it here.

![tech stack carousel](https://raw.githubusercontent.com/wotshan/beatsync/main/.github/assets/tech-stack-carousel.gif)

Suggested items to show in the carousel (looping):
- TypeScript
- React + Vite
- pnpm workspace
- Express
- Drizzle ORM
- Zod

## Glassmorphism carousel

A small glassmorphism-styled UI showcase to demonstrate visual design ideas (blur, translucent panels, soft shadows). Replace the placeholder GIF at `.github/assets/glassmorphism-carousel.gif` with your own recording.

![glassmorphism carousel](https://raw.githubusercontent.com/wotshan/beatsync/main/.github/assets/glassmorphism-carousel.gif)

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

## Replacing the demo & carousel animations

To add your own animated demos:

1. Create a `.github/assets` directory (if it doesn't exist).
2. Add GIFs and name them `demo.gif`, `tech-stack-carousel.gif`, and `glassmorphism-carousel.gif`.
3. Commit and push. The README will display the animations automatically.

## License

This repository is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

If you have questions, issues, or suggestions, open an issue in this repository or reach out to the maintainers.
