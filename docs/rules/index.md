# Rule reference

Every `readable-af` rule has its own page with rule details, options, incorrect and
correct examples, and guidance on when not to use it. Each rule also reports its page
as `meta.docs.url`, so editors and `eslint --format` output link straight to it.

The examples on these pages are executed against the rules they document, so they
cannot drift from the implementation.

## Presets

| Preset | Contents |
| --- | --- |
| `recommended` | Third-party boolean-correctness rules plus the three custom rules marked ✅ below |
| `strict` | `recommended` plus every custom rule marked ✅ or 🔒 |
| `all-custom` | Every custom rule, and no third-party rules |

## Complexity

| Rule | Description | Options | Preset |
| --- | --- | --- | --- |
| [`max-boolean-complexity`](./max-boolean-complexity.md) | Limits a weighted boolean complexity score | max score, default `5` | ✅ |
| [`max-logical-operands`](./max-logical-operands.md) | Limits one logical expression to N predicates | max operands, default `3` | ✅ |
| [`no-complex-boolean-return`](./no-complex-boolean-return.md) | Requires complex returned predicates to be named | max score, default `3` | 🔒 |
| [`prefer-named-boolean-expression`](./prefer-named-boolean-expression.md) | Requires complex control-flow conditions to be named | max score, default `3` | 🔒 |
| [`prefer-semantic-boolean`](./prefer-semantic-boolean.md) | Extracts complex inline predicates, including call arguments | max score, default `3` | ⚙️ |
| [`no-complex-jsx-condition`](./no-complex-jsx-condition.md) | Moves dense logical and ternary expressions out of JSX | max score, default `3` | 🔒 |

## Negation and naming

| Rule | Description | Options | Preset |
| --- | --- | --- | --- |
| [`no-double-negative-booleans`](./no-double-negative-booleans.md) | Rejects negated negative names and negative names defined by negation | — | ✅ |
| [`no-nested-negation`](./no-nested-negation.md) | Rejects expressions such as `!(!a \|\| !b)` | — | 🔒 |
| [`prefer-positive-boolean-names`](./prefer-positive-boolean-names.md) | Rejects names such as `isNotEnabled` for boolean values | — | 🔒 |
| [`no-negative-boolean-condition`](./no-negative-boolean-condition.md) | Rejects conditions such as `if (!isNotAllowed)` | — | ⚙️ |

## Expression style

| Rule | Description | Options | Preset |
| --- | --- | --- | --- |
| [`no-mixed-and-or-without-parens`](./no-mixed-and-or-without-parens.md) | Requires parentheses when mixing `&&` and `\|\|` | — | 🔒 |
| [`no-boolean-ternary`](./no-boolean-ternary.md) | Rejects `condition ? true : false` and its inverse | — | 🔒 |
| [`no-redundant-condition`](./no-redundant-condition.md) | Rejects duplicate and subsumed logical clauses | — | 🔒 |
| [`no-ambiguous-boundary-checks`](./no-ambiguous-boundary-checks.md) | Requires named constants for numeric inequality boundaries | — | 🔒 |
| [`no-naked-default-fallback`](./no-naked-default-fallback.md) | Requires semantic names for literal `??` and `\|\|` fallbacks | — | 🔒 |

## Error handling

| Rule | Description | Options | Preset |
| --- | --- | --- | --- |
| [`no-swallowed-errors`](./no-swallowed-errors.md) | Prevents silent catches and nullish or void error fallbacks | — | 🔒 |
| [`require-cause-when-rethrowing`](./require-cause-when-rethrowing.md) | Preserves caught failures through the standard `cause` option | — | 🔒 |
| [`no-log-and-rethrow`](./no-log-and-rethrow.md) | Prevents duplicate reporting across propagation layers | — | 🔒 |
| [`safe-catch-error-access`](./safe-catch-error-access.md) | Requires caught values to be narrowed before property access | — | 🔒 |
| [`require-contextual-error-message`](./require-contextual-error-message.md) | Rejects empty, generic, and context-free error messages | — | 🔒 |
| [`require-error-message-identifiers`](./require-error-message-identifiers.md) | Includes relevant `*Id` parameters in thrown errors | — | 🔒 |
| [`no-generic-error-contract`](./no-generic-error-contract.md) | Requires domain-specific errors instead of generic `Error` | — | 🔒 |
| [`max-try-block-statements`](./max-try-block-statements.md) | Limits a try block to N focused statements | max statements, default `5` | 🔒 |

## Structure and testability

| Rule | Description | Options | Preset |
| --- | --- | --- | --- |
| [`require-distinct-branch-effects`](./require-distinct-branch-effects.md) | Rejects empty or observably identical conditional paths | — | 🔒 |
| [`no-boolean-parameter-branching`](./no-boolean-parameter-branching.md) | Prevents boolean parameters from creating hidden function modes | — | 🔒 |
| [`no-unobservable-side-effect`](./no-unobservable-side-effect.md) | Rejects void functions that mutate their parameters | — | 🔒 |
| [`no-high-mutation-density`](./no-high-mutation-density.md) | Limits mutation-sensitive operations in one function | max score, default `8` | 🔒 |

✅ `recommended` and `strict`  ·  🔒 `strict`  ·  ⚙️ `all-custom` only

The two ⚙️ rules overlap other rules' diagnostics, so `strict` leaves them out —
enable them deliberately when you want their wider coverage.
