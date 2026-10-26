import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // House style (Airbnb-based): arrow functions everywhere, and small files —
  // anything over 200 lines gets split into its own components or helpers.
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "func-style": ["error", "expression"],
      "prefer-arrow-callback": "error",
      "arrow-body-style": ["error", "as-needed"],
      "react/function-component-definition": [
        "error",
        { namedComponents: "arrow-function", unnamedComponents: "arrow-function" },
      ],
      "@typescript-eslint/no-use-before-define": ["error", { functions: false, variables: false }],
      "max-lines": ["error", { max: 200 }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
