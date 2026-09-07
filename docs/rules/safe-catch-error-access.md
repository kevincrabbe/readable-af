# readable-af/safe-catch-error-access

> Require caught values to be narrowed or normalized before property access.

|  |  |
| --- | --- |
| **Type** | problem |
| **Fixable** | no |
| **Presets** | `strict`, `all-custom` |

## Rule details

A caught value is `unknown`: JavaScript lets you throw a string, a number, or
`undefined`. Reading `error.message` straight out of a `catch` therefore risks
`undefined` — or a second exception thrown from inside your error handler.

This rule reports property access on the caught binding until it has been narrowed.
Three things narrow it:

- `error instanceof Error`
- a type-guard call matching `is*Error`, such as `isServiceError(error)`
- a normalization helper, such as `toError(error).message` — the access is on the
  helper's result, not on the caught value, so it is never reported

Narrowing applies to the consequent of the `if` that performs it, not to the `else`
branch or to code after the block. Type assertions and optional chaining do not
narrow anything: `(error as Error).message` and `error?.message` are both reported,
since neither changes what the value actually is at runtime.

## Options

This rule has no options.

## Examples

### ❌ Incorrect

```ts
try { work(); } catch (error) { logger.error(error.message); }
```

```ts
try { work(); } catch (error) { logger.error((error as Error).message); }
```

```ts
try { work(); } catch (error) { logger.error(error?.message); }
```

### ✅ Correct

```ts
try { work(); } catch (error) {
  if (error instanceof Error) logger.error(error.message);
}
```

```ts
try { work(); } catch (error) {
  if (isServiceError(error)) logger.error(error.code);
}
```

```ts
try { work(); } catch (error) { logger.error(toError(error).message); }
```

## When not to use it

Turn the rule off in a codebase where every throw site is under your control and
already guaranteed to throw `Error` instances, and the narrowing is pure ceremony.

## Related rules

- [`no-swallowed-errors`](./no-swallowed-errors.md)
- [`require-contextual-error-message`](./require-contextual-error-message.md)
