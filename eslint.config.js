import plugin from "./dist/index.js";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["dist/**", "coverage/**"],
  },
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    plugins: {
      "readable-af": plugin,
    },
    rules: {
      "readable-af/max-boolean-complexity": ["error", 10],
      "readable-af/max-logical-operands": ["error", 5],
      "readable-af/no-double-negative-booleans": "error",
    },
  },
];
