# eslint-plugin-readable-af

Opinionated ESLint rules for boolean code that should be easy to scan, verify,
and safely change.

The plugin combines proven rules from ESLint, typescript-eslint, SonarJS, and
ESLint Stylistic with focused custom checks for boolean readability. It uses
ESLint's flat config format and supports ESLint 9 and 10.

## Install

```sh
npm install --save-dev eslint eslint-plugin-readable-af typescript@^6.0.3
```

## Use

```js
// eslint.config.js
import readable from "eslint-plugin-readable-af";

export default [
  ...readable.configs.recommended,
];
```

The recommended config enables type-aware rules for TypeScript files with
`parserOptions.projectService: true`. Keep a `tsconfig.json` that includes the
files being linted. JavaScript files still receive all non-type-aware checks.

For the full opinionated rule set:

```js
import readable from "eslint-plugin-readable-af";

export default [
  ...readable.configs.strict,
];
```

## Presets

### `recommended`

The adoption-friendly preset uses the layered combination proposed in the
source discussion:

- `@typescript-eslint/strict-boolean-expressions`
- `@typescript-eslint/no-unnecessary-condition`
- `@typescript-eslint/only-throw-error`
- `@typescript-eslint/return-await` in try/catch
- `@typescript-eslint/switch-exhaustiveness-check`
- `@typescript-eslint/use-unknown-in-catch-callback-variable`
- `no-constant-binary-expression`
- `no-throw-literal` for JavaScript files
- `no-useless-catch`
- `sonarjs/no-gratuitous-expressions`
- `sonarjs/no-redundant-boolean`
- `sonarjs/cognitive-complexity` with a maximum of 10
- `@stylistic/no-mixed-operators` for mixed `&&` and `||`
- `readable-af/max-boolean-complexity` with a maximum of 5
- `readable-af/max-logical-operands` with a maximum of 3
- `readable-af/no-double-negative-booleans`

### `strict`

Includes `recommended` and adds a curated set of stronger custom readability
checks. It avoids rules whose diagnostics overlap and uses the custom
mixed-operator rule instead of the Stylistic equivalent.

### `all-custom`

Registers and enables every `readable-af` rule without enabling third-party
rules. This is useful when composing your own preset.

## Custom rules

| Rule | Default behavior |
| --- | --- |
| `max-boolean-complexity` | Limits a weighted boolean complexity score to 5 |
| `max-logical-operands` | Limits one logical expression to 3 predicates |
| `max-try-block-statements` | Limits a try block to 5 focused statements |
| `require-distinct-branch-effects` | Rejects empty or observably identical conditional paths |
| `no-swallowed-errors` | Prevents silent catches and nullish/void error fallbacks |
| `require-cause-when-rethrowing` | Preserves caught failures through the standard `cause` option |
| `no-log-and-rethrow` | Prevents duplicate reporting across propagation layers |
| `safe-catch-error-access` | Requires caught values to be narrowed or normalized before access |
| `require-contextual-error-message` | Rejects empty, generic, and context-free error messages |
| `require-error-message-identifiers` | Includes relevant `*Id` parameters in thrown errors |
| `no-boolean-parameter-branching` | Prevents boolean parameters from creating hidden function modes |
| `no-ambiguous-boundary-checks` | Requires named constants for numeric inequality boundaries |
| `no-redundant-condition` | Rejects duplicate and subsumed logical clauses |
| `no-naked-default-fallback` | Requires semantic names for literal `??` and `\|\|` fallbacks |
| `no-unobservable-side-effect` | Rejects void functions that mutate their parameters |
| `no-generic-error-contract` | Requires domain-specific errors instead of generic `Error` |
| `no-high-mutation-density` | Limits weighted mutation-sensitive operations in a function to 8 |
| `no-mixed-and-or-without-parens` | Requires parentheses when mixing `&&` and `\|\|` |
| `no-nested-negation` | Rejects expressions such as `!(!a \|\| !b)` |
| `prefer-positive-boolean-names` | Rejects names such as `isNotEnabled` for boolean values |
| `no-negative-boolean-condition` | Rejects conditions such as `if (!isNotAllowed)` |
| `no-boolean-ternary` | Rejects `condition ? true : false` and its inverse |
| `no-complex-boolean-return` | Requires complex returned predicates to be named |
| `prefer-named-boolean-expression` | Requires complex control-flow conditions to be named |
| `no-complex-jsx-condition` | Moves dense logical/ternary JSX expressions out of markup |
| `prefer-semantic-boolean` | Extracts complex inline predicates into semantic variables |
| `no-double-negative-booleans` | Rejects negated negative names and negative names defined by negation |

Rules with numeric limits accept the limit as their first option:

```js
import readable from "eslint-plugin-readable-af";

export default [
  {
    plugins: { "readable-af": readable },
    rules: {
      "readable-af/max-boolean-complexity": ["error", 6],
      "readable-af/max-logical-operands": ["error", 4],
      "readable-af/no-complex-jsx-condition": ["warn", 4],
    },
  },
];
```

## Boolean complexity score

`max-boolean-complexity` gives weight to the syntax that makes a predicate
harder to verify mentally:

- each logical operator: `+1`
- each negation: `+0.5`
- switching logical operators: `+1`
- nesting a logical or ternary expression: `+1`
- each ternary: `+2`
- a function call inside the expression: `+0.5`

The rule reports only the outer boolean expression, so one dense predicate
produces one actionable diagnostic.

## Development

```sh
npm test
npm run typecheck
npm run lint
npm pack --dry-run
```

`npm test` enforces at least 90% line coverage and 90% branch coverage across
the compiled plugin. All twenty-seven custom rules have valid and invalid
`RuleTester` cases, and the suite also loads the recommended flat config
through ESLint as an integration check.
