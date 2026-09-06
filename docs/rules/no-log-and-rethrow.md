# readable-af/no-log-and-rethrow

> Disallow reporting an error in a catch block and then throwing from the same block.

|  |  |
| --- | --- |
| **Type** | suggestion |
| **Fixable** | no |
| **Presets** | `strict`, `all-custom` |

## Rule details

When every layer logs the error it is about to rethrow, one failure produces a stack
of near-identical log entries and the real handler is buried among them. This rule
reports a catch block that both reports and throws.

A call counts as reporting when its callee name contains `log`, `error`, `warn`,
`report`, `capture`, or `notify` (case-insensitive) — so `logger.error(...)`,
`reportError(...)`, and `captureException(...)` all match. Nested functions declared
inside the catch are not searched.

Pick one layer to report the failure and let the others propagate it untouched.

## Options

This rule has no options.

## Examples

### ❌ Incorrect

```ts
try { work(); } catch (error) { logger.error(error); throw error; }
```

```ts
try { work(); } catch (error) {
  reportError(error);
  throw new ServiceError("sync failed", { cause: error });
}
```

### ✅ Correct

```ts
try { work(); } catch (error) { throw error; }
```

```ts
function run() {
  try { work(); } catch (error) { logger.error(error); return FALLBACK; }
}
```

## When not to use it

Turn the rule off in a boundary layer that is required to record every failure it sees
before propagating — an audited request handler, for instance — where the duplicate
entries are intentional.

## Related rules

- [`no-swallowed-errors`](./no-swallowed-errors.md) covers the opposite failure: neither reporting nor propagating
- [`require-cause-when-rethrowing`](./require-cause-when-rethrowing.md)
