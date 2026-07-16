import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
    getTsconfigPath,
    loadTsconfig,
    parseTsconfig,
    type TsconfigPreset,
    tsconfigPresets,
} from "../src/tsconfig.js";

interface DocumentedConsumerConfig {
    readonly expectedCompilerOptions: Readonly<Record<string, unknown>>;
    readonly fileName: string;
    readonly value: Readonly<Record<string, unknown>>;
}

const documentedConsumerConfigs: readonly DocumentedConsumerConfig[] = [
    {
        expectedCompilerOptions: {
            declaration: true,
            module: "nodenext",
            moduleResolution: "nodenext",
            noEmit: false,
            types: ["node"],
        },
        fileName: "tsconfig.node-library.json",
        value: {
            compilerOptions: {
                outDir: "./dist/node-library",
                rootDir: "./src",
                tsBuildInfoFile: "./.cache/tsconfig.node-library.tsbuildinfo",
            },
            extends: "tsconfig-nick2bad4u/tsconfig.node-library.json",
            include: ["src/**/*.ts"],
        },
    },
    {
        expectedCompilerOptions: {
            allowJs: true,
            checkJs: true,
            module: "nodenext",
            moduleResolution: "nodenext",
            noEmit: true,
            types: ["node"],
        },
        fileName: "tsconfig.node-eslint.json",
        value: {
            extends: [
                "tsconfig-nick2bad4u/tsconfig.node.json",
                "tsconfig-nick2bad4u/tsconfig.eslint.json",
            ],
            include: ["src/**/*.ts"],
        },
    },
    {
        expectedCompilerOptions: {
            declaration: true,
            module: "esnext",
            moduleResolution: "bundler",
            noEmit: false,
        },
        fileName: "tsconfig.bundler-library.json",
        value: {
            compilerOptions: {
                outDir: "./dist/bundler-library",
                rootDir: "./src",
            },
            extends: "tsconfig-nick2bad4u/tsconfig.bundler-library.json",
            include: ["src/**/*.ts"],
        },
    },
    {
        expectedCompilerOptions: {
            declaration: true,
            module: "esnext",
            moduleResolution: "bundler",
            noEmit: false,
        },
        fileName: "tsconfig.composed-bundler-library.json",
        value: {
            compilerOptions: {
                outDir: "./dist/composed-bundler-library",
                rootDir: "./src",
            },
            extends: [
                "tsconfig-nick2bad4u/tsconfig.bundler.json",
                "tsconfig-nick2bad4u/tsconfig.library.json",
            ],
            include: ["src/**/*.ts"],
        },
    },
    {
        expectedCompilerOptions: {
            isolatedDeclarations: false,
            module: "nodenext",
            moduleResolution: "nodenext",
            noEmit: true,
            types: ["node"],
        },
        fileName: "tsconfig.node-vitest.json",
        value: {
            extends: [
                "tsconfig-nick2bad4u/tsconfig.node.json",
                "tsconfig-nick2bad4u/tsconfig.vitest-typecheck.json",
            ],
            include: ["src/**/*.ts", "test/**/*.ts"],
        },
    },
];

const typescriptCompilers = [
    {
        label: "TypeScript 6",
        path: fileURLToPath(
            new URL("../node_modules/typescript/bin/tsc", import.meta.url)
        ),
    },
    {
        label: "TypeScript 7",
        path: fileURLToPath(
            new URL(
                "../node_modules/@typescript/native/bin/tsc",
                import.meta.url
            )
        ),
    },
] as const;

describe("typescript shared presets", () => {
    it.each(tsconfigPresets)("loads portable %s config", async (preset) => {
        expect.assertions(6);

        const configPath = getTsconfigPath(preset);
        const config = await loadTsconfig(preset);

        expect(path.isAbsolute(configPath)).toBe(true);
        expect(config).not.toHaveProperty("include");
        expect(config).not.toHaveProperty("exclude");
        expect(config).not.toHaveProperty("compilerOptions.rootDir");
        expect(config).not.toHaveProperty("compilerOptions.outDir");
        expect(config).not.toHaveProperty("compilerOptions.tsBuildInfoFile");
    });

    it("keeps environments and globals out of the portable base", async () => {
        expect.assertions(5);

        const base = await loadTsconfig("base");

        expect(base).not.toHaveProperty("compilerOptions.types");
        expect(base).toHaveProperty("compilerOptions.lib", ["ES2024"]);
        expect(base).not.toHaveProperty("compilerOptions.module");
        expect(base).not.toHaveProperty("compilerOptions.moduleResolution");
        expect(base).not.toHaveProperty("compilerOptions.jsx");
    });

    it("keeps Vitest globals explicitly opt-in", async () => {
        expect.assertions(2);

        const typecheck = await loadTsconfig("vitest-typecheck");
        const globals = await loadTsconfig("vitest-globals");

        expect(typecheck).not.toHaveProperty("compilerOptions.types");
        expect(globals).toHaveProperty("compilerOptions.types", [
            "vitest/globals",
        ]);
    });

    it.each(typescriptCompilers)(
        "resolves and compiles documented consumers with $label",
        async ({ path: tscPath }) => {
            expect.hasAssertions();

            const fixtureRoot = await mkdtemp(
                path.join(tmpdir(), "tsconfig-consumer-")
            );

            try {
                const sourceRoot = path.join(fixtureRoot, "src");
                const testRoot = path.join(fixtureRoot, "test");
                const packageRoot = fileURLToPath(
                    new URL("..", import.meta.url)
                );
                const packageLink = path.join(
                    fixtureRoot,
                    "node_modules",
                    "tsconfig-nick2bad4u"
                );
                const nodeTypesRoot = fileURLToPath(
                    new URL("../node_modules/@types/node", import.meta.url)
                );
                const nodeTypesLink = path.join(
                    fixtureRoot,
                    "node_modules",
                    "@types",
                    "node"
                );
                await mkdir(path.dirname(packageLink), { recursive: true });
                await mkdir(path.dirname(nodeTypesLink), { recursive: true });
                await mkdir(sourceRoot);
                await mkdir(testRoot);
                await Promise.all([
                    symlink(nodeTypesRoot, nodeTypesLink, "junction"),
                    symlink(packageRoot, packageLink, "junction"),
                    writeFile(
                        path.join(fixtureRoot, "package.json"),
                        '{"name":"tsconfig-consumer-fixture","private":true,"type":"module"}\n'
                    ),
                    writeFile(
                        path.join(sourceRoot, "index.ts"),
                        "export const ok: true = true;\n"
                    ),
                    writeFile(
                        path.join(testRoot, "index.ts"),
                        'import { ok } from "../src/index.js";\nvoid ok;\n'
                    ),
                    ...documentedConsumerConfigs.map(
                        async ({ fileName, value }) =>
                            writeFile(
                                path.join(fixtureRoot, fileName),
                                `${JSON.stringify(value, null, 2)}\n`
                            )
                    ),
                ]);

                for (const {
                    expectedCompilerOptions,
                    fileName,
                } of documentedConsumerConfigs) {
                    const configPath = path.join(fixtureRoot, fileName);
                    const configResult = spawnSync(
                        process.execPath,
                        [
                            tscPath,
                            "--showConfig",
                            "-p",
                            configPath,
                        ],
                        { encoding: "utf8" }
                    );
                    const compileResult = spawnSync(
                        process.execPath,
                        [
                            tscPath,
                            "--pretty",
                            "false",
                            "-p",
                            configPath,
                        ],
                        { encoding: "utf8" }
                    );

                    expect(
                        configResult.status,
                        `${fileName}: ${configResult.stderr}`
                    ).toBe(0);
                    expect(
                        compileResult.status,
                        `${fileName}: ${compileResult.stdout}${compileResult.stderr}`
                    ).toBe(0);

                    const resolvedConfig: unknown = JSON.parse(
                        configResult.stdout
                    );
                    for (const [option, expected] of Object.entries(
                        expectedCompilerOptions
                    )) {
                        expect(resolvedConfig).toHaveProperty(
                            `compilerOptions.${option}`,
                            expected
                        );
                    }
                }
            } finally {
                await rm(fixtureRoot, { force: true, recursive: true });
            }
        }
    );

    it("rejects unknown presets and consumer-owned project paths", () => {
        expect.assertions(3);

        expect(() => getTsconfigPath("react" as TsconfigPreset)).toThrow(
            RangeError
        );
        expect(() => parseTsconfig({ include: ["src"] })).toThrow(TypeError);
        expect(() =>
            parseTsconfig({ compilerOptions: { outDir: "dist" } })
        ).toThrow(TypeError);
    });
});
