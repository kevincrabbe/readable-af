# readable-af/no-double-negative-booleans

> Disallow negating negatively named booleans and defining negative names with negation.

|  |  |
| --- | --- |
| **Type** | suggestion |
| **Fixable** | no |
| **Presets** | `recommended`, `strict`, `all-custom` |

## Rule details

This rule reports two shapes of the same problem, from opposite ends:

- **`negatedName`** — a `!` applied to a negatively named boolean, anywhere in the
  file: `!isNotVerified`, `!user.isNotVerified`.
- **`negativeDefinition`** — a variable with a negative name whose initializer is
  itself a negation: `const shouldNotDisable = !isInvalid;`. Here the double negative
  is created at the definition, so every later use inherits it.

A name counts as negative when it starts with an auxiliary plus a negation
(`isNot`, `hasNo`, `shouldNever`, …) or with a contraction (`cannot`, `wont`, …).

## Options

This rule has no options.

## Examples

### ❌ Incorrect

```ts
if (!isNotVerified) activate();
```

```ts
if (!user.isNotVerified) activate();
```

```ts
const shouldNotDisable = !isInvalid;
```

### ✅ Correct

```ts
if (isVerified) activate();
```

```ts
const shouldEnable = isValid;
```

```ts
const { isNotVerified } = user;
```

## When not to use it

Turn the rule off when negative names are fixed by an external contract you cannot
rename around.

## Related rules

- [`prefer-positive-boolean-names`](./prefer-positive-boolean-names.md) prevents the names in the first place
- [`no-negative-boolean-condition`](./no-negative-boolean-condition.md) reports the same negations, scoped to control flow
- [`no-nested-negation`](./no-nested-negation.md) covers structural rather than name-based double negatives
