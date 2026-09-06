# readable-af/prefer-semantic-boolean

> Require complex inline predicates to be extracted into semantic boolean variables.

|  |  |
| --- | --- |
| **Type** | suggestion |
| **Fixable** | no |
| **Presets** | `all-custom` |

## Rule details

This is the broadest of the complexity rules. It applies the
[boolean complexity score](./max-boolean-complexity.md#rule-details) to every place
a predicate is consumed inline:

- `if`, `while`, `do...while`, and `for` tests
- `return` arguments
- arguments passed to a call

A complex predicate passed straight into a call is the case the other rules miss:
`render(active && (admin || owner))` hides a business rule inside an argument list.

Because its coverage overlaps
[`prefer-named-boolean-expression`](./prefer-named-boolean-expression.md) and
[`no-complex-boolean-return`](./no-complex-boolean-return.md), it is **not** part of
the `strict` preset — enable it deliberately, on its own or through `all-custom`.

## Options

The first option is the maximum score, an integer `>= 0`. It defaults to `3`.

```js
{
  "rules": {
    "readable-af/prefer-semantic-boolean": ["error", 4]
  }
}
```

## Examples

### ❌ Incorrect

```ts
// score 4, hidden inside an argument list
renderPanel(active && (admin || owner));
```

```ts
function canEdit() {
  return active && (admin || owner);
}
```

### ✅ Correct

```ts
const hasWriteRole = admin || owner;
renderPanel(active && hasWriteRole);
```

```ts
function canEdit() {
  return canAccess;
}
```

## When not to use it

Turn the rule off when you already enable
[`prefer-named-boolean-expression`](./prefer-named-boolean-expression.md) and
[`no-complex-boolean-return`](./no-complex-boolean-return.md) and do not want a
third, overlapping diagnostic on the same line.

## Related rules

- [`prefer-named-boolean-expression`](./prefer-named-boolean-expression.md)
- [`no-complex-boolean-return`](./no-complex-boolean-return.md)
