import stylistic from "@stylistic/eslint-plugin";
import type { TSESLint } from "@typescript-eslint/utils";
import sonarjs from "eslint-plugin-sonarjs";
import tseslint from "typescript-eslint";

import {
  maxTryBlockStatements,
  noLogAndRethrow,
  requireCauseWhenRethrowing,
  requireContextualErrorMessage,
  requireErrorMessageIdentifiers,
  safeCatchErrorAccess,
} from "./rules/errors.js";
import {
  maxBooleanComplexity,
  maxLogicalOperands,
  noComplexBooleanReturn,
  noComplexJsxCondition,
  preferNamedBooleanExpression,
  preferSemanticBoolean,
} from "./rules/complexity.js";
import {
  noDoubleNegativeBooleans,
  noNegativeBooleanCondition,
  noNestedNegation,
  preferPositiveBooleanNames,
} from "./rules/negation.js";
import {
  noBooleanTernary,
  noMixedAndOrWithoutParens,
} from "./rules/style.js";
import {
  noAmbiguousBoundaryChecks,
  noBooleanParameterBranching,
  noGenericErrorContract,
  noHighMutationDensity,
  noNakedDefaultFallback,
  noRedundantCondition,
  noSwallowedErrors,
  noUnobservableSideEffect,
  requireDistinctBranchEffects,
} from "./rules/mutation.js";

const rules = {
  "max-boolean-complexity": maxBooleanComplexity,
  "max-logical-operands": maxLogicalOperands,
  "max-try-block-statements": maxTryBlockStatements,
  "no-ambiguous-boundary-checks": noAmbiguousBoundaryChecks,
  "no-boolean-ternary": noBooleanTernary,
  "no-boolean-parameter-branching": noBooleanParameterBranching,
  "no-complex-boolean-return": noComplexBooleanReturn,
  "no-complex-jsx-condition": noComplexJsxCondition,
  "no-double-negative-booleans": noDoubleNegativeBooleans,
  "no-generic-error-contract": noGenericErrorContract,
  "no-high-mutation-density": noHighMutationDensity,
  "no-log-and-rethrow": noLogAndRethrow,
  "no-mixed-and-or-without-parens": noMixedAndOrWithoutParens,
  "no-naked-default-fallback": noNakedDefaultFallback,
  "no-negative-boolean-condition": noNegativeBooleanCondition,
  "no-nested-negation": noNestedNegation,
  "no-redundant-condition": noRedundantCondition,
  "no-swallowed-errors": noSwallowedErrors,
  "no-unobservable-side-effect": noUnobservableSideEffect,
  "prefer-named-boolean-expression": preferNamedBooleanExpression,
  "prefer-positive-boolean-names": preferPositiveBooleanNames,
  "prefer-semantic-boolean": preferSemanticBoolean,
  "require-cause-when-rethrowing": requireCauseWhenRethrowing,
  "require-contextual-error-message": requireContextualErrorMessage,
  "require-distinct-branch-effects": requireDistinctBranchEffects,
  "require-error-message-identifiers": requireErrorMessageIdentifiers,
  "safe-catch-error-access": safeCatchErrorAccess,
};

const plugin = {
  meta: {
    name: "eslint-plugin-readable-af",
    version: "0.1.0",
  },
  rules,
  configs: {} as {
    recommended: TSESLint.FlatConfig.ConfigArray;
    strict: TSESLint.FlatConfig.ConfigArray;
    "all-custom": TSESLint.FlatConfig.ConfigArray;
  },
};

const pluginRegistration = {
  name: "readable-af/plugins",
  plugins: {
    "@stylistic": stylistic,
    "@typescript-eslint": tseslint.plugin,
    "readable-af": plugin,
    sonarjs,
  },
} satisfies TSESLint.FlatConfig.Config;

const baseReadability = {
  name: "readable-af/recommended",
  files: ["**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}"],
  languageOptions: {
    ecmaVersion: "latest" as const,
    sourceType: "module" as const,
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
  },
  rules: {
    "@stylistic/no-mixed-operators": [
      "error",
      {
        groups: [["&&", "||"]],
        allowSamePrecedence: true,
      },
    ],
    "no-constant-binary-expression": "error",
    "no-throw-literal": "error",
    "no-useless-catch": "error",
    "readable-af/max-boolean-complexity": ["error", 5],
    "readable-af/max-logical-operands": ["error", 3],
    "readable-af/no-double-negative-booleans": "error",
    "sonarjs/cognitive-complexity": ["error", 10],
    "sonarjs/no-gratuitous-expressions": "error",
    "sonarjs/no-redundant-boolean": "error",
  },
} satisfies TSESLint.FlatConfig.Config;

const typedBooleanCorrectness = {
  name: "readable-af/recommended-type-checked",
  files: ["**/*.{ts,mts,cts,tsx}"],
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      projectService: true,
    },
  },
  rules: {
    "no-throw-literal": "off",
    "@typescript-eslint/no-unnecessary-condition": "error",
    "@typescript-eslint/only-throw-error": "error",
    "@typescript-eslint/return-await": ["error", "in-try-catch"],
    "@typescript-eslint/strict-boolean-expressions": "error",
    "@typescript-eslint/switch-exhaustiveness-check": "error",
    "@typescript-eslint/use-unknown-in-catch-callback-variable": "error",
  },
} satisfies TSESLint.FlatConfig.Config;

const strictCustomRules = {
  name: "readable-af/strict",
  files: ["**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}"],
  rules: {
    "@stylistic/no-mixed-operators": "off",
    "readable-af/max-try-block-statements": ["error", 5],
    "readable-af/no-ambiguous-boundary-checks": "error",
    "readable-af/no-boolean-parameter-branching": "error",
    "readable-af/no-boolean-ternary": "error",
    "readable-af/no-complex-boolean-return": ["error", 3],
    "readable-af/no-complex-jsx-condition": ["error", 3],
    "readable-af/no-generic-error-contract": "error",
    "readable-af/no-high-mutation-density": ["error", 8],
    "readable-af/no-log-and-rethrow": "error",
    "readable-af/no-mixed-and-or-without-parens": "error",
    "readable-af/no-naked-default-fallback": "error",
    "readable-af/no-nested-negation": "error",
    "readable-af/no-redundant-condition": "error",
    "readable-af/no-swallowed-errors": "error",
    "readable-af/no-unobservable-side-effect": "error",
    "readable-af/prefer-named-boolean-expression": ["error", 3],
    "readable-af/prefer-positive-boolean-names": "error",
    "readable-af/require-cause-when-rethrowing": "error",
    "readable-af/require-contextual-error-message": "error",
    "readable-af/require-distinct-branch-effects": "error",
    "readable-af/require-error-message-identifiers": "error",
    "readable-af/safe-catch-error-access": "error",
  },
} satisfies TSESLint.FlatConfig.Config;

plugin.configs.recommended = [
  pluginRegistration,
  baseReadability,
  typedBooleanCorrectness,
];

plugin.configs.strict = [
  pluginRegistration,
  baseReadability,
  typedBooleanCorrectness,
  strictCustomRules,
];

plugin.configs["all-custom"] = [
  pluginRegistration,
  {
    name: "readable-af/all-custom",
    files: ["**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}"],
    rules: Object.fromEntries(
      Object.keys(rules).map((name) => [`readable-af/${name}`, "error"]),
    ),
  } as TSESLint.FlatConfig.Config,
];

export { rules };
export default plugin;
