# readable-af/prefer-named-boolean-expression

> Require complex control-flow conditions to be extracted into named predicates.

|  |  |
| --- | --- |
| **Type** | suggestion |
| **Fixable** | no |
| **Presets** | `strict`, `all-custom` |

## Rule details

This rule applies the
[boolean complexity score](./max-boolean-complexity.md#rule-details) to the test of
every branching construct — `if`, `while`, `do...while`, `for`, and ternaries — and
reports when the score passes the maximum. A named condition tells the reader *why*
the branch exists; a dense inline condition only tells them *what* it computes.

Only boolean structures are scored, so simple tests such as `if (user.active)` and
`if (count === 0)` are never reported.

## Options

The first option is the maximum score, an integer `>= 0`. It defaults to `3`.

```js
{
  "rules": {
    "readable-af/prefer-named-boolean-expression": ["error", 4]
  }
}
```

## Examples

### ❌ Incorrect

```ts
// score 4
if (active && (admin || owner)) edit();
```

```ts
// score 4
while (retriesLeft > 0 && (transient || recoverable)) retry();
```

### ✅ Correct

```ts
if (canEdit) edit();
```

```ts
const hasWriteRole = admin || owner;
if (active && hasWriteRole) edit();
```

## When not to use it

Turn the rule off if your team prefers reading the condition inline, or raise the
maximum where the surrounding code is dense by nature (parsers, state machines).

## Related rules

- [`no-complex-boolean-return`](./no-complex-boolean-return.md) covers returned predicates
- [`prefer-semantic-boolean`](./prefer-semantic-boolean.md) covers the same conditions plus returns and call arguments
- [`no-complex-jsx-condition`](./no-complex-jsx-condition.md) covers conditions rendered inside JSX
