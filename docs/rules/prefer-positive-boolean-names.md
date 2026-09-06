# readable-af/prefer-positive-boolean-names

> Prefer positive names for variables that hold boolean expressions.

|  |  |
| --- | --- |
| **Type** | suggestion |
| **Fixable** | no |
| **Presets** | `strict`, `all-custom` |

## Rule details

A negatively named boolean composes badly. `isNotEnabled` reads fine on its own, but
every later use — `!isNotEnabled`, `isNotEnabled || isNotVisible` — costs the reader a
mental inversion. This rule reports a variable declarator whose name is phrased
negatively **and** whose initializer is boolean-like.

A name is treated as negative when it starts with an auxiliary plus a negation
(`isNot`, `hasNo`, `shouldNever`, `willNot`, …) or with a contraction
(`cannot`, `isnt`, `wont`, `doesnt`, …).

An initializer is boolean-like when it is a logical expression, a ternary, a
negation, a boolean literal, or a comparison (`===`, `!==`, `<`, `in`,
`instanceof`, …). Because the check is syntactic, a negatively named variable that
holds a non-boolean value, an uninitialized `let`, and a destructured property are
all left alone.

## Options

This rule has no options.

## Examples

### ❌ Incorrect

```ts
const isNotEnabled = !enabled;
```

```ts
const hasNoAccess = role === "guest";
```

### ✅ Correct

```ts
const isEnabled = !disabled;
```

```ts
const isNotLabel = "not a boolean";
```

```ts
const { isNotReady } = state;
```

## When not to use it

Turn the rule off when a domain term is genuinely negative — a field mirroring an
external API's `isNotSyncable`, for example — and renaming it would break the link to
the source system.

## Related rules

- [`no-double-negative-booleans`](./no-double-negative-booleans.md) catches the negation of these names
- [`no-negative-boolean-condition`](./no-negative-boolean-condition.md) catches them in control flow
