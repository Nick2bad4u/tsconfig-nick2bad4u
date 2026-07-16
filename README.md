# tsconfig-nick2bad4u

[![Continuous Integration](https://github.com/Nick2bad4u/tsconfig-nick2bad4u/actions/workflows/ci.yml/badge.svg)](https://github.com/Nick2bad4u/tsconfig-nick2bad4u/actions/workflows/ci.yml)

Strict, composable TypeScript configurations for Nick2bad4u projects.

The package preserves the requested `tsconfig.json`, `tsconfig.build.json`, `tsconfig.eslint.json`, `tsconfig.js.json`, and `tsconfig.vitest-typecheck.json` entrypoints while removing repository-owned paths that would resolve inside `node_modules`.

## Install

```sh
npm install --save-dev tsconfig-nick2bad4u typescript
```

Install the environment types used by the selected preset, such as `@types/node`, Vite, or Vitest.

## Presets

| Preset                           | Purpose                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------ |
| `tsconfig.json`                  | Portable strict bundler base; bare `extends: "tsconfig-nick2bad4u"` selects it |
| `tsconfig.node.json`             | Modern Node ESM/CJS resolution with Node globals                               |
| `tsconfig.node-library.json`     | Node declaration-emitting library defaults                                     |
| `tsconfig.build.json`            | Compatibility alias for the Node library preset                                |
| `tsconfig.bundler.json`          | ESNext modules with bundler resolution                                         |
| `tsconfig.browser.json`          | Bundler preset plus DOM libraries                                              |
| `tsconfig.vite.json`             | Browser preset plus Vite client types                                          |
| `tsconfig.eslint.json`           | JS-aware no-emit overlay for ESLint project services                           |
| `tsconfig.js.json`               | Strict `checkJs` overlay                                                       |
| `tsconfig.vitest-typecheck.json` | No-emit bundler overlay for imported Vitest APIs                               |
| `tsconfig.vitest-globals.json`   | Explicit opt-in to `vitest/globals`                                            |

## Consumer wrappers

```json
{
 "extends": "tsconfig-nick2bad4u/tsconfig.node-library.json",
 "compilerOptions": {
  "outDir": "./dist",
  "rootDir": "./src",
  "tsBuildInfoFile": "./.cache/tsconfig.build.tsbuildinfo"
 },
 "include": ["src/**/*.ts"]
}
```

TypeScript 5+ also supports composable `extends` arrays:

```json
{
 "extends": [
  "tsconfig-nick2bad4u/tsconfig.node.json",
  "tsconfig-nick2bad4u/tsconfig.eslint.json"
 ],
 "include": ["**/*", "**/.*"],
 "exclude": ["coverage", "dist", "node_modules"]
}
```

`include`, `exclude`, `files`, project references, `rootDir`, `outDir`, and `tsBuildInfoFile` intentionally remain consumer-owned. Relative paths inherited from an npm package otherwise stay relative to that package inside `node_modules`.

The root JavaScript API exports typed preset names plus `getTsconfigPath()` and `loadTsconfig()` for automation.

## Validation

```sh
npm run release:verify
```
