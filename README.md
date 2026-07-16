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

| Preset                           | Purpose                                                                                  |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| `tsconfig.json`                  | Environment-neutral strict policy base; bare `extends: "tsconfig-nick2bad4u"` selects it |
| `tsconfig.node.json`             | Modern Node ESM/CJS resolution with Node globals                                         |
| `tsconfig.node-library.json`     | Node declaration-emitting library defaults                                               |
| `tsconfig.build.json`            | Compatibility alias for the Node library preset                                          |
| `tsconfig.bundler.json`          | ESNext modules with bundler resolution                                                   |
| `tsconfig.library.json`          | Environment-neutral declaration and source-map emit overlay                              |
| `tsconfig.bundler-library.json`  | Bundler resolution plus the reusable library emit overlay                                |
| `tsconfig.browser.json`          | Bundler preset plus DOM libraries                                                        |
| `tsconfig.vite.json`             | Browser preset plus Vite client types                                                    |
| `tsconfig.eslint.json`           | JS-aware no-emit task overlay for ESLint project services                                |
| `tsconfig.js.json`               | `allowJs`/`checkJs` task overlay                                                         |
| `tsconfig.vitest-typecheck.json` | No-emit task overlay for imported Vitest APIs                                            |
| `tsconfig.vitest-globals.json`   | Explicit opt-in to `vitest/globals`                                                      |

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

The later task overlay contributes only task-specific options, so the effective configuration above remains `module: "NodeNext"` and `moduleResolution: "NodeNext"`.

For a bundler-built library, use the ready-made composite:

```json
{
 "extends": "tsconfig-nick2bad4u/tsconfig.bundler-library.json",
 "compilerOptions": {
  "outDir": "./dist",
  "rootDir": "./src"
 },
 "include": ["src/**/*.ts"]
}
```

It is equivalent to composing the environment and task presets directly:

```json
{
 "extends": [
  "tsconfig-nick2bad4u/tsconfig.bundler.json",
  "tsconfig-nick2bad4u/tsconfig.library.json"
 ],
 "compilerOptions": {
  "outDir": "./dist",
  "rootDir": "./src"
 },
 "include": ["src/**/*.ts"]
}
```

For Node tests that import Vitest APIs, preserve Node resolution by composing the Node environment first and the test task second:

```json
{
 "extends": [
  "tsconfig-nick2bad4u/tsconfig.node.json",
  "tsconfig-nick2bad4u/tsconfig.vitest-typecheck.json"
 ],
 "include": ["src/**/*.ts", "test/**/*.ts"]
}
```

Add `tsconfig.vitest-globals.json` as the final entry only when tests deliberately use global `describe`, `it`, and `expect` names.

`include`, `exclude`, `files`, project references, `rootDir`, `outDir`, and `tsBuildInfoFile` intentionally remain consumer-owned. Relative paths inherited from an npm package otherwise stay relative to that package inside `node_modules`.

The root JavaScript API exports typed preset names plus `getTsconfigPath()` and `loadTsconfig()` for automation.

The package's test suite resolves and compiles every example above with both supported TypeScript majors (6 and 7). This guards the published `typescript: ">=6 <8"` peer contract rather than assuming the currently installed compiler is representative.

## Validation

```sh
npm run release:verify
```
