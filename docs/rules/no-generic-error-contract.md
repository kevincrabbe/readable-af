# readable-af/no-generic-error-contract

> Require domain-specific error classes instead of the generic Error constructor.

|  |  |
| --- | --- |
| **Type** | suggestion |
| **Fixable** | no |
| **Presets** | `strict`, `all-custom` |

## Rule details

`throw new Error("invalid subscription")` gives callers nothing to branch on but the
message string. A named class turns the failure into part of the API: callers can
catch exactly the case they can recover from, and tests can assert on the type rather
than on prose that will be reworded.

This rule reports `throw new Error(...)` and `throw Error(...)`. Any other error class
is accepted, and rethrowing an existing value is untouched.

## Options

This rule has no options.

## Examples

### ❌ Incorrect

```ts
throw new Error("invalid");
```

```ts
throw Error("invalid");
```

### ✅ Correct

```ts
throw new InvalidSubscriptionError(id);
```

```ts
throw error;
```

## When not to use it

Turn the rule off in scripts and one-off tooling where a class hierarchy for failures
is more machinery than the code deserves.

## Related rules

- [`require-contextual-error-message`](./require-contextual-error-message.md)
- [`require-cause-when-rethrowing`](./require-cause-when-rethrowing.md)
