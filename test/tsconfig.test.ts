import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
    getTsconfigPath,
    loadTsconfig,
    parseTsconfig,
    tsconfigPresets,
} from "../src/tsconfig.js";

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

    it("keeps environment globals out of the portable base", async () => {
        expect.assertions(5);

        const base = await loadTsconfig("base");

        expect(base).not.toHaveProperty("compilerOptions.types");
        expect(base).toHaveProperty("compilerOptions.lib", ["ES2024"]);
        expect(base).toHaveProperty("compilerOptions.module", "ESNext");
        expect(base).toHaveProperty(
            "compilerOptions.moduleResolution",
            "Bundler"
        );
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

    it("resolves a preset from a consumer node_modules directory", async () => {
        expect.assertions(6);

        const fixtureRoot = await mkdtemp(
            path.join(tmpdir(), "tsconfig-consumer-")
        );
        const sourceRoot = path.join(fixtureRoot, "src");
        const packageRoot = fileURLToPath(new URL("..", import.meta.url));
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
        await Promise.all([
            symlink(nodeTypesRoot, nodeTypesLink, "junction"),
            symlink(packageRoot, packageLink, "junction"),
        ]);
        await Promise.all([
            writeFile(
                path.join(fixtureRoot, "package.json"),
                '{"name":"tsconfig-consumer-fixture","private":true,"type":"module"}\n'
            ),
            writeFile(
                path.join(sourceRoot, "index.ts"),
                "export const ok = true;\n"
            ),
            writeFile(
                path.join(fixtureRoot, "tsconfig.json"),
                `${JSON.stringify(
                    {
                        compilerOptions: {
                            noEmit: true,
                            outDir: "./dist",
                            rootDir: "./src",
                        },
                        extends:
                            "tsconfig-nick2bad4u/tsconfig.node-library.json",
                        include: ["src/**/*.ts"],
                    },
                    null,
                    2
                )}\n`
            ),
        ]);

        const tscPath = fileURLToPath(
            new URL("../node_modules/typescript/bin/tsc", import.meta.url)
        );
        const configResult = spawnSync(
            process.execPath,
            [
                tscPath,
                "--showConfig",
                "-p",
                fixtureRoot,
            ],
            { encoding: "utf8" }
        );
        const compileResult = spawnSync(
            process.execPath,
            [
                tscPath,
                "--noEmit",
                "-p",
                fixtureRoot,
            ],
            { encoding: "utf8" }
        );
        const resolvedConfig: unknown = JSON.parse(configResult.stdout);

        expect(configResult.status).toBe(0);
        expect(configResult.stderr).toBe("");
        expect(resolvedConfig).toHaveProperty("compilerOptions.strict", true);
        expect(resolvedConfig).toHaveProperty(
            "compilerOptions.rootDir",
            "./src"
        );
        expect(resolvedConfig).toHaveProperty(
            "compilerOptions.outDir",
            "./dist"
        );
        expect(compileResult.status).toBe(0);
    });

    it("rejects consumer-owned project paths", () => {
        expect.assertions(2);

        expect(() => parseTsconfig({ include: ["src"] })).toThrow(TypeError);
        expect(() =>
            parseTsconfig({ compilerOptions: { outDir: "dist" } })
        ).toThrow(TypeError);
    });
});
