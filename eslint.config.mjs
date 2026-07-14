import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "dist/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "lib/supabase/database.types.ts",
  ]),
]);
