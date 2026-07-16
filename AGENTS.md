# Repository Instructions

This repository publishes `tsconfig-nick2bad4u`.
Treat every root `tsconfig*.json` file and the typed path/loader API as public package surfaces.

## Priorities

- Never add consumer-owned include/exclude/files/references or output/cache paths to public presets.
- Keep the base environment-neutral; Node, browser, Vite, and Vitest globals belong in named variants.
- Keep `vitest/globals` opt-in.
- Prove presets through effective consumer configs, not JSON parsing alone.
- Keep internal build/typecheck paths under `config/`.

## Commands

```sh
npm run build:runtime
npm run typecheck
npm test
npm run release:verify
```
