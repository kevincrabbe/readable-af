# readable-af/max-try-block-statements

> Limit try blocks so each catch protects a focused operation.

|  |  |
| --- | --- |
| **Type** | suggestion |
| **Fixable** | no |
| **Presets** | `strict`, `all-custom` |

## Rule details

A `catch` can only be as precise as its `try` is narrow. When ten statements sit
inside one try block, the handler cannot tell which of them failed, so the recovery
logic degrades to a generic apology — and unrelated failures get the same treatment as
the one you were guarding against.

This rule counts the **top-level** statements in a try block and reports when the count
passes the maximum. Nested statements do not add to the count, so a single `if` with a
large body counts as one.

## Options

The first option is the maximum statement count, an integer `>= 0`. It defaults to `5`.

```js
{
  "rules": {
    "readable-af/max-try-block-statements": ["error", 3]
  }
}
```

## Examples

### ❌ Incorrect

```ts
try {
  const cart = loadCart();
  const user = loadUser();
  const total = price(cart);
  const receipt = charge(user, total);
  notify(user, receipt);
  record(receipt);
} catch (error) {
  throw error;
}
```

### ✅ Correct

```ts
const cart = loadCart();
const user = loadUser();
const total = price(cart);

try {
  const receipt = charge(user, total);
  record(receipt);
} catch (error) {
  throw new PaymentError("Could not charge customer", { cause: error });
}
```

## When not to use it

Turn the rule off around code that must run as one guarded unit — a transaction body,
or an interop boundary where every call throws the same way — or raise the maximum to
match your team's tolerance.

## Related rules

- [`no-swallowed-errors`](./no-swallowed-errors.md)
- [`require-cause-when-rethrowing`](./require-cause-when-rethrowing.md)
