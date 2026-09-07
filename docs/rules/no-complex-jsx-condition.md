# readable-af/no-complex-jsx-condition

> Prevent dense short-circuit and ternary expressions in JSX.

|  |  |
| --- | --- |
| **Type** | suggestion |
| **Fixable** | no |
| **Presets** | `strict`, `all-custom` |

## Rule details

Markup is read for structure, not for logic. When a JSX expression container holds
a dense predicate, the shape of the rendered tree disappears behind it. This rule
scores every JSX expression container with the
[boolean complexity score](./max-boolean-complexity.md#rule-details) and reports when
the score passes the maximum.

Only boolean structures are scored, so `{title}`, `{items.map(renderItem)}`, and a
single `{canRender && <Panel />}` guard are never reported.

## Options

The first option is the maximum score, an integer `>= 0`. It defaults to `3`.

```js
{
  "rules": {
    "readable-af/no-complex-jsx-condition": ["warn", 4]
  }
}
```

## Examples

### ❌ Incorrect

```tsx
// score 6
const view = <div>{active && (admin || owner) && <Panel />}</div>;
```

```tsx
// score 5: chained ternaries
const view = <div>{loading ? <Spinner /> : error ? <Error /> : <Panel />}</div>;
```

### ✅ Correct

```tsx
const view = <div>{canRender && <Panel />}</div>;
```

```tsx
const canRender = active && hasWriteRole;
const view = <div>{canRender && <Panel />}</div>;
```

## When not to use it

Turn the rule off in files that are deliberately markup-heavy prototypes, or raise
the maximum if your team is comfortable with one level of nested rendering logic.

## Related rules

- [`prefer-named-boolean-expression`](./prefer-named-boolean-expression.md) covers non-JSX conditions
- [`no-boolean-ternary`](./no-boolean-ternary.md) catches ternaries that only produce booleans
