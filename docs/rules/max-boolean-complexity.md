# readable-af/max-boolean-complexity

> Limit the cognitive weight of a single boolean expression.

|  |  |
| --- | --- |
| **Type** | suggestion |
| **Fixable** | no |
| **Presets** | `recommended`, `strict`, `all-custom` |

## Rule details

A predicate becomes hard to verify long before it becomes long. This rule scores
each boolean expression by the syntax that forces a reader to hold state in their
head, and reports the expression when the score passes the configured maximum.

| Syntax | Weight |
| --- | --- |
| a logical operator (`&&`, `\|\|`, `??`) | `+1` |
| switching to a different logical operator than the parent | `+1` |
| nesting a logical or ternary expression inside another | `+1` |
| a negation (`!`) | `+0.5` |
| a ternary | `+2` |
| a call inside the expression | `+0.5` |

Only the outermost boolean expression is reported, so one dense predicate produces
one actionable diagnostic instead of a cascade of nested ones.

## Options

The first option is the maximum score, an integer `>= 0`. It defaults to `5`.

```js
{
  "rules": {
    "readable-af/max-boolean-complexity": ["error", 6]
  }
}
```

## Examples

### ❌ Incorrect

```ts
// score 7.5: two nested groups, each switching operator, plus a negation
const allowed = (active && verified) || (admin && !suspended);
```

```ts
// score 6.5: a ternary nested inside a logical expression
const tier = premium && (trialExpired ? standardTier : trialTier) && !banned;
```

### ✅ Correct

```ts
const accountIsActive = active && verified;
const adminCanOverride = admin && !suspended;
const allowed = accountIsActive || adminCanOverride;
```

```ts
const canEdit = active && allowed;
```

## When not to use it

Turn the rule off in generated code, or in code that mirrors an external truth
table where naming each intermediate predicate would obscure rather than clarify
the mapping. Raising the maximum is usually a better first step than disabling it.

## Related rules

- [`max-logical-operands`](./max-logical-operands.md) counts predicates instead of weighting syntax
- [`prefer-named-boolean-expression`](./prefer-named-boolean-expression.md) applies the same score to control-flow conditions
- [`no-complex-boolean-return`](./no-complex-boolean-return.md) applies it to returned predicates
