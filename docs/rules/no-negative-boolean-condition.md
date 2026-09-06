# readable-af/no-negative-boolean-condition

> Disallow conditions that negate an already-negative boolean name.

|  |  |
| --- | --- |
| **Type** | suggestion |
| **Fixable** | no |
| **Presets** | `all-custom` |

## Rule details

`if (!isNotAllowed)` states a permission twice inverted. This rule searches the test
of every branching construct — `if`, `while`, `do...while`, `for`, and ternaries — for
a negation applied to a negatively named boolean, and reports each one it finds.

The search walks into logical, binary, conditional, unary, and sequence expressions,
so the double negative is caught wherever it sits inside the condition rather than
only at the top level. Member expressions count too: `!user.isNotVerified` is
reported on the property name.

Its coverage overlaps
[`no-double-negative-booleans`](./no-double-negative-booleans.md), which is why it is
**not** part of the `strict` preset — enable it deliberately, on its own or through
`all-custom`.

## Options

This rule has no options.

## Examples

### ❌ Incorrect

```ts
if (!isNotAllowed) allow();
```

```ts
while (ready && !isNotAllowed) work();
```

```ts
if (!!isNotAllowed) allow();
```

### ✅ Correct

```ts
if (isAllowed) allow();
```

```ts
if (ready && isAllowed) work();
```

## When not to use it

Turn the rule off if you already enable
[`no-double-negative-booleans`](./no-double-negative-booleans.md) — which reports the
same negations plus their definitions — and do not want two diagnostics on one line.

## Related rules

- [`no-double-negative-booleans`](./no-double-negative-booleans.md)
- [`prefer-positive-boolean-names`](./prefer-positive-boolean-names.md)
