# readable-af/max-logical-operands

> Limit how many predicates are combined in one logical expression.

|  |  |
| --- | --- |
| **Type** | suggestion |
| **Fixable** | no |
| **Presets** | `recommended`, `strict`, `all-custom` |

## Rule details

This rule counts the leaf operands of a logical expression — the parts that are
not themselves `&&`/`||`/`??` expressions — and reports when the count passes the
maximum. Where
[`max-boolean-complexity`](./max-boolean-complexity.md) weights *shape*, this rule
measures *breadth*: how many independent facts a reader must track at once.

Only the outermost logical expression is checked, so a chain such as
`a && b && c && d` is reported once with a count of `4`.

## Options

The first option is the maximum operand count, an integer `>= 0`. It defaults to `3`.

```js
{
  "rules": {
    "readable-af/max-logical-operands": ["error", 4]
  }
}
```

## Examples

### ❌ Incorrect

```ts
// 4 predicates in one expression
const eligible = active && verified && paid && !suspended;
```

### ✅ Correct

```ts
const accountIsCurrent = active && verified && paid;
const eligible = accountIsCurrent && !suspended;
```

## When not to use it

Turn the rule off where a flat list of predicates is the clearest possible form —
a guard that enumerates required feature flags, for example — or raise the maximum
to match the arity your team reads comfortably.

## Related rules

- [`max-boolean-complexity`](./max-boolean-complexity.md) weights operators, nesting, and negation
- [`no-redundant-condition`](./no-redundant-condition.md) catches operands that add nothing
