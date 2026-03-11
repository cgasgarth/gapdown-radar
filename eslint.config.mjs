import js from "@eslint/js";
import configPrettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
import tseslint from "typescript-eslint";

const typedFiles = ["**/*.{ts,tsx,mts,cts}"];
const typedStrictConfigs = tseslint.configs.strictTypeChecked.map((config) => ({
  ...config,
  files: typedFiles,
}));
const typedStylisticConfigs = tseslint.configs.stylisticTypeChecked.map((config) => ({
  ...config,
  files: typedFiles,
}));

const maxLinesRule = [
  "error",
  {
    max: 400,
    skipBlankLines: false,
    skipComments: false,
  },
];

export default tseslint.config(
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/.turbo/**"],
  },
  js.configs.recommended,
  ...typedStrictConfigs,
  ...typedStylisticConfigs,
  {
    files: typedFiles,
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["eslint.config.mjs"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        Bun: "readonly",
      },
    },
    plugins: {
      import: importPlugin,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "unused-imports": unusedImports,
    },
    settings: {
      "import/core-modules": ["bun:test", "bun:sqlite"],
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          noWarnOnMultipleProjects: true,
          project: ["./apps/*/tsconfig.json", "./packages/*/tsconfig.json"],
        },
      },
    },
    rules: {
      "array-callback-return": "error",
      "import/extensions": [
        "error",
        "ignorePackages",
        {
          ts: "never",
          tsx: "never",
          js: "never",
          jsx: "never",
          mjs: "never",
        },
      ],
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-cycle": "error",
      "import/no-default-export": "error",
      "import/no-duplicates": "error",
      "import/no-unresolved": "error",
      "max-lines": maxLinesRule,
      "no-console": "off",
      "no-implicit-coercion": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "ExportDefaultDeclaration",
          message: "Use named exports only.",
        },
      ],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          vars: "all",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: false,
        },
      ],
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
        },
      ],
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-unnecessary-boolean-literal-compare": "off",
      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/no-unnecessary-template-expression": "error",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowNumber: true,
          allowBoolean: false,
          allowAny: false,
          allowNullish: false,
          allowRegExp: false,
        },
      ],
      "@typescript-eslint/require-array-sort-compare": "error",
      "@typescript-eslint/strict-boolean-expressions": [
        "error",
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: false,
          allowNullableBoolean: false,
          allowNullableString: false,
          allowNullableNumber: false,
        },
      ],
      "@typescript-eslint/switch-exhaustiveness-check": "error",
    },
  },
  {
    files: ["apps/web/src/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "error",
    },
  },
  {
    files: ["scripts/**/*.ts", "**/*.test.ts"],
    rules: {
      "import/no-default-export": "off",
      "max-lines": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
    },
  },
  {
    files: ["apps/api/src/services/persistence/universe-store.ts"],
    rules: {
      "@typescript-eslint/triple-slash-reference": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
    },
  },
  {
    files: ["**/*.config.{js,mjs,ts}", "eslint.config.mjs"],
    rules: {
      "import/no-default-export": "off",
      "no-restricted-syntax": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
    },
  },
  configPrettier,
);
