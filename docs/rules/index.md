# Custom rule reference

## max-boolean-complexity

Limits a weighted score for logical operators, negation, nesting, ternaries,
operator switches, and calls. The first numeric option is the maximum; it
defaults to `5`.

```js
// bad
const allowed = (active && verified) || (admin && !suspended);

// good
const accountIsActive = active && verified;
const adminCanOverride = admin && !suspended;
const allowed = accountIsActive || adminCanOverride;
```

## max-logical-operands

Limits the leaf predicates in one logical expression. The first numeric option
defaults to `3`.

```js
// bad
const eligible = active && verified && paid && !suspended;

// good
const accountIsCurrent = active && verified && paid;
const eligible = accountIsCurrent && !suspended;
```

## require-distinct-branch-effects

Rejects empty branches, identical `if`/`else` effects, and an `if` return or
assignment that is immediately repeated on the fallthrough path.

```js
// bad
if (isAdmin) return true;
return true;

// good
if (isAdmin) return true;
return false;
```

## no-swallowed-errors

Requires every catch block to rethrow, return a defined fallback, call an
error-handling function, or contain a comment such as `intentionally ignored`.
Bare returns and `null`, `undefined`, or `void` fallbacks are rejected unless
the catch also reports the error. Logging with `console.error` alone is not
treated as handling the error.

## require-cause-when-rethrowing

Requires an error created inside `catch (error)` to preserve the caught value
in an options object containing `{ cause: error }`. Rethrowing the original
error unchanged is left to the standard `no-useless-catch` rule.

## no-log-and-rethrow

Rejects catch blocks that call a logging or reporting function and also throw.
Choose one layer to report the failure, or propagate it for an upstream layer
to handle.

## safe-catch-error-access

Rejects direct property access such as `error.message` and
`(error as Error).message` until the caught value is narrowed with
`instanceof Error`, an `is*Error` guard, or a normalization helper.

## require-contextual-error-message

Rejects missing messages, generic messages such as `failed` and
`something went wrong`, and wrappers that merely repeat `error.message`.

## require-error-message-identifiers

When a function accepts parameters ending in `Id` or `ID`, requires a thrown
error construction to include at least one of those identifiers in its
arguments or message template.

## max-try-block-statements

Limits the top-level statements in a try block. The first numeric option
defaults to `5`, encouraging each catch to protect one focused operation.

## no-boolean-parameter-branching

Rejects `if`, loop, switch, and ternary branches controlled by a boolean
parameter. Prefer separate functions or an explicit domain option.

```ts
// bad
function fetchUser(includeDeleted: boolean) {
  if (includeDeleted) return fetchDeletedUser();
}

// good
function fetchUser(visibility: UserVisibility) {
  if (visibility === UserVisibility.Deleted) return fetchDeletedUser();
}
```

## no-ambiguous-boundary-checks

Requires numeric inequality boundaries to use named constants rather than
naked numbers such as `18`, `0`, or `3`.

## no-redundant-condition

Rejects duplicate clauses and numeric range clauses subsumed by another clause,
such as `x > 10 && x > 5`.

## no-naked-default-fallback

Requires literal fallbacks used with `??` or `||` to be replaced with semantic
constants such as `DEFAULT_REQUEST_RETRIES`.

## no-unobservable-side-effect

Rejects functions that mutate a parameter and return no observable value.
Returning a new immutable result gives callers and tests an explicit contract.

## no-generic-error-contract

Rejects `throw new Error(...)` and `throw Error(...)`. Use a domain-specific
error class that callers and tests can distinguish.

## no-high-mutation-density

Limits the weighted mutation surface of one function. The first numeric option
defaults to `8`. Logical operators, negation, comparisons, arithmetic,
conditionals, catches, and boolean literals contribute to the score.

## no-mixed-and-or-without-parens

Requires parentheses when `&&` and `||` are mixed.

```js
// bad
const allowed = admin || owner && active;

// good
const allowed = admin || (owner && active);
```

## no-nested-negation

Disallows negation whose argument contains another negation.

```js
// bad
const available = !(!active || !verified);

// good
const available = active && verified;
```

## prefer-positive-boolean-names

Disallows negative names such as `isNotEnabled`, `hasNoAccess`, and
`shouldNotRender` when they store boolean-like expressions.

## no-negative-boolean-condition

Disallows control-flow conditions that negate an already-negative boolean
name, such as `if (!isNotAllowed)`.

## no-boolean-ternary

Disallows ternaries whose two results are boolean literals, such as
`ready ? true : false` and `ready ? false : true`.

## no-complex-boolean-return

Requires complex predicates to be named before they are returned. The first
numeric option is the maximum complexity and defaults to `3`.

## prefer-named-boolean-expression

Requires complex `if`, loop, and ternary conditions to be extracted into a
semantic name. The first numeric option defaults to `3`.

## no-complex-jsx-condition

Disallows dense short-circuit and ternary expressions directly inside JSX.
The first numeric option defaults to `3`.

## prefer-semantic-boolean

Requires complex inline conditions, returns, and boolean call arguments to be
extracted into semantic variables. The first numeric option defaults to `3`.

## no-double-negative-booleans

Disallows both negated negative names (`!isNotVerified`) and negative names
defined with negation (`const shouldNotDisable = !isInvalid`).
