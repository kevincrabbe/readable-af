# readable-af/no-mixed-and-or-without-parens

> Require explicit parentheses when mixing && and || operators.

|  |  |
| --- | --- |
| **Type** | suggestion |
| **Fixable** | no |
| **Presets** | `strict`, `all-custom` |

## Rule details

`&&` binds tighter than `||`, so `admin || owner && active` means
`admin || (owner && active)`. Readers who do not hold that precedence rule in mind
read it left to right and get the wrong answer. This rule reports a logical
expression whose child uses the *other* operator without parentheses of its own.

The `strict` preset enables this rule and turns off `@stylistic/no-mixed-operators`,
which reports the same shape — enable one or the other, not both. `??` is left alone;
JavaScript already requires parentheses when it is mixed with `&&` or `||`.

## Options

This rule has no options.

## Examples

### ❌ Incorrect

```ts
const allowed = admin || owner && active;
```

```ts
const blocked = suspended && banned || deleted;
```

### ✅ Correct

```ts
const allowed = admin || (owner && active);
```

```ts
const required = active && verified && paid;
```

```ts
const fallback = value ?? defaultValue;
```

## When not to use it

Turn the rule off if you already enable `@stylistic/no-mixed-operators` (or the
equivalent from another config) and prefer its diagnostics.

## Related rules

- [`max-boolean-complexity`](./max-boolean-complexity.md) charges `+1` for switching operators
- [`no-redundant-condition`](./no-redundant-condition.md) catches clauses that cannot change the result
