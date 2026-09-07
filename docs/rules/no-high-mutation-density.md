# readable-af/no-high-mutation-density

> Limit mutation-sensitive operations within a single function.

|  |  |
| --- | --- |
| **Type** | suggestion |
| **Fixable** | no |
| **Presets** | `strict`, `all-custom` |

## Rule details

The name comes from mutation testing: this rule counts the operations in a function
that a mutation testing tool would flip — the places where a wrong operator or a wrong
boundary would change behaviour and might slip past your tests. A high count means
many independent rules are entangled in one body, and each additional rule multiplies
the cases a test must cover to pin them all down.

Each of these adds to the function's score:

| Syntax | Weight |
| --- | --- |
| a logical expression (`&&`, `\|\|`, `??`) | `+1` |
| a negation (`!`) | `+1` |
| an arithmetic or relational operator (`+ - * / % **`, `< <= > >=`) | `+1` |
| an `if` statement | `+1` |
| a boolean literal | `+1` |
| a ternary | `+2` |
| a `catch` clause | `+2` |

Nested functions are scored on their own rather than counting toward the enclosing
one.

## Options

The first option is the maximum score, an integer `>= 0`. It defaults to `8`.

```js
{
  "rules": {
    "readable-af/no-high-mutation-density": ["error", 10]
  }
}
```

## Examples

### ❌ Incorrect

```ts
// score 11: two ifs, two logical expressions, two negations,
// three comparisons, and two boolean literals
function canCheckout(cart, user) {
  if (!user.active) return false;
  if (cart.items > 0 && cart.total > 0) {
    return user.age >= 18 && !user.banned;
  }
  return false;
}
```

### ✅ Correct

```ts
function canCheckout(cart, user) {
  const cartHasValue = cart.items > MINIMUM_ITEMS;
  const userCanPurchase = user.active && user.verified;
  return cartHasValue && userCanPurchase;
}
```

## When not to use it

Turn the rule off in code that is inherently arithmetic — geometry, financial
formulas, encoders — where splitting the expression into named predicates would break
up a formula that is clearest whole. Raising the maximum is usually the better first
move.

## Related rules

- [`max-boolean-complexity`](./max-boolean-complexity.md) scores a single expression rather than a function
- [`no-boolean-parameter-branching`](./no-boolean-parameter-branching.md)
- [`no-unobservable-side-effect`](./no-unobservable-side-effect.md)
