import { createConfig } from "prettier-config-nick2bad4u";

/**
 * @type {import("prettier").Config}
 */
const localConfig = createConfig({
    inheritedOverrides: [
        {
            files: ["src/tsconfig.ts", "test/tsconfig.test.ts"],
            inheritFrom: "*.ts",
            options: {
                plugins: [
                    "prettier-plugin-sort-json",
                    "@softonus/prettier-plugin-duplicate-remover",
                    "prettier-plugin-jsdoc",
                    "prettier-plugin-interpolated-html-tags",
                    "prettier-plugin-multiline-arrays-2",
                    "prettier-plugin-merge",
                ],
            },
        },
    ],
});

export default localConfig;
