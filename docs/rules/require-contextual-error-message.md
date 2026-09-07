# readable-af/require-contextual-error-message

> Require thrown errors to have a useful contextual message.

|  |  |
| --- | --- |
| **Type** | suggestion |
| **Fixable** | no |
| **Presets** | `strict`, `all-custom` |

## Rule details

`throw new PaymentError("failed")` tells whoever reads the log nothing they did not
already know. This rule reports a `throw` of an error construction (any callee whose
name ends in `Error`) whose message is:

- **missing** — no arguments at all;
- **generic** — a string or expression-free template literal that, trimmed and
  lower-cased, is one of `""`, `error`, `failed`, `failure`, `invalid`, `oops`,
  `something went wrong`, `unknown error`;
- **an echo** — a bare `*.message` member access, which repeats the wrapped error's
  text instead of adding the context of *this* operation.

Any other expression is accepted, including a variable and a template literal with
interpolation.

## Options

This rule has no options.

## Examples

### ❌ Incorrect

```ts
throw new PaymentError("failed");
```

```ts
throw new PaymentError();
```

```ts
throw new PaymentError(error.message);
```

### ✅ Correct

```ts
throw new PaymentError("Could not charge customer");
```

```ts
throw new PaymentError(`Could not charge customer ${customerId}`);
```

```ts
throw new PaymentError(message);
```

## When not to use it

Turn the rule off where messages are assembled by the error class itself from
structured fields, so the constructor argument is intentionally minimal.

## Related rules

- [`require-error-message-identifiers`](./require-error-message-identifiers.md) requires the specific record to be named
- [`no-generic-error-contract`](./no-generic-error-contract.md) requires a domain-specific class
- [`require-cause-when-rethrowing`](./require-cause-when-rethrowing.md)
