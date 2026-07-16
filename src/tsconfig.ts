import type { UnknownRecord } from "type-fest";

import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { keyIn } from "ts-extras";

/** Parsed JSON object from one package-owned TypeScript preset. */
export type Tsconfig = Readonly<UnknownRecord>;

/** Public TypeScript configuration variants shipped by this package. */
export type TsconfigPreset =
    | "base"
    | "browser"
    | "build"
    | "bundler"
    | "eslint"
    | "javascript"
    | "node"
    | "node-library"
    | "vite"
    | "vitest-globals"
    | "vitest-typecheck";

/** All public presets. */
export const tsconfigPresets: readonly TsconfigPreset[] = [
    "base",
    "browser",
    "build",
    "bundler",
    "eslint",
    "javascript",
    "node",
    "node-library",
    "vite",
    "vitest-globals",
    "vitest-typecheck",
];

const presetFileNames: Readonly<Record<TsconfigPreset, string>> = {
    base: "tsconfig.json",
    browser: "tsconfig.browser.json",
    build: "tsconfig.build.json",
    bundler: "tsconfig.bundler.json",
    eslint: "tsconfig.eslint.json",
    javascript: "tsconfig.js.json",
    node: "tsconfig.node.json",
    "node-library": "tsconfig.node-library.json",
    vite: "tsconfig.vite.json",
    "vitest-globals": "tsconfig.vitest-globals.json",
    "vitest-typecheck": "tsconfig.vitest-typecheck.json",
};

const isRecord = (value: unknown): value is UnknownRecord =>
    typeof value === "object" && value !== null && !Array.isArray(value);

/** Return the absolute path to one package-owned preset. */
export function getTsconfigPath(preset: TsconfigPreset = "base"): string {
    return fileURLToPath(
        new URL(`../${presetFileNames[preset]}`, import.meta.url)
    );
}

/** Load and validate one package-owned TypeScript preset. */
export async function loadTsconfig(
    preset: TsconfigPreset = "base"
): Promise<Tsconfig> {
    const configPath = getTsconfigPath(preset);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- package-owned path selected from a closed preset map
    const contents = await readFile(configPath, "utf8");
    const parsed: unknown = JSON.parse(contents);

    return parseTsconfig(parsed);
}

/**
 * Validate that a shared preset contains no consumer-owned project paths.
 *
 * @throws When a preset contains a consumer-owned path or invalid shape.
 */
export function parseTsconfig(value: unknown): Tsconfig {
    if (!isRecord(value)) {
        throw new TypeError(
            "Expected the TypeScript configuration to be an object."
        );
    }

    const forbiddenRootKeys = [
        "exclude",
        "files",
        "include",
        "references",
    ];

    for (const key of forbiddenRootKeys) {
        if (keyIn(value, key)) {
            throw new TypeError(
                `Shared TypeScript presets must not declare consumer-owned ${key}.`
            );
        }
    }

    const compilerOptions = value["compilerOptions"];

    if (keyIn(value, "compilerOptions") && !isRecord(compilerOptions)) {
        throw new TypeError("compilerOptions must be an object when present.");
    }

    if (isRecord(compilerOptions)) {
        for (const key of [
            "outDir",
            "rootDir",
            "tsBuildInfoFile",
        ]) {
            if (keyIn(compilerOptions, key)) {
                throw new TypeError(
                    `Shared TypeScript presets must not declare consumer-owned ${key}.`
                );
            }
        }
    }

    return value;
}

const defaultTsconfigPath = getTsconfigPath();
// eslint-disable-next-line n/no-sync, security/detect-non-literal-fs-filename -- the default export must be immediately usable by config consumers
const bundledDefaultTsconfig = readFileSync(defaultTsconfigPath, "utf8");

/** Package-owned portable base configuration. */
const defaultTsconfig: Tsconfig = parseTsconfig(
    JSON.parse(bundledDefaultTsconfig)
);

export default defaultTsconfig;
