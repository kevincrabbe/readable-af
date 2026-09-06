# readable-af/no-ambiguous-boundary-checks

> Require named constants for numeric inequality boundaries.

|  |  |
| --- | --- |
| **Type** | suggestion |
| **Fixable** | no |
| **Presets** | `strict`, `all-custom` |

## Rule details

`if (age >= 18)` hides a policy inside a literal. The number cannot be searched for,
cannot be reused, and gives no hint whether `18` is a legal age, a retry cap, or a
page size. This rule reports a numeric inequality (`<`, `<=`, `>`, `>=`) where one
side is a number literal, in either order — `0 < balance` is reported just like
`balance > 0`.

Only inequalities are checked. Equality comparisons (`===`, `!==`) and non-numeric
comparisons are left alone.

## Options

This rule has no options.

## Examples

### ❌ Incorrect

```ts
if (age >= 18) allow();
```

```ts
if (0 < balance) allow();
```

### ✅ Correct

```ts
if (age >= MINIMUM_AGE) allow();
```

```ts
if (attempts === 3) stop();
```

```ts
if (status > "draft") publish();
```

## When not to use it

Turn the rule off in tests, in mathematical code where the literal *is* the meaning
(`index > 0` in a loop guard), or wherever naming every bound would add indirection
without adding information.

## Related rules

- [`no-naked-default-fallback`](./no-naked-default-fallback.md) applies the same idea to fallback values
- [`no-redundant-condition`](./no-redundant-condition.md) compares boundaries against each other
