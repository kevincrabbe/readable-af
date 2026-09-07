# readable-af/require-cause-when-rethrowing

> Require errors created in a catch block to preserve the caught value as cause.

|  |  |
| --- | --- |
| **Type** | problem |
| **Fixable** | no |
| **Presets** | `strict`, `all-custom` |

## Rule details

Wrapping a failure in a domain error is good practice — right up until the original
stack disappears with it. This rule reports a `throw` inside a `catch (error)` that
constructs a new error (any callee whose name ends in `Error`) without passing an
options object containing `{ cause: error }`, where `error` is the caught binding.

Both `new PaymentError(...)` and `PaymentError(...)` are checked, and the `cause` key
may be written as an identifier or a string literal. Rethrowing the caught value
unchanged is not this rule's concern — the core `no-useless-catch` rule covers that —
and a `catch` with no binding has nothing to preserve, so it is skipped. Nested
functions declared inside the catch are not searched.

## Options

This rule has no options.

## Examples

### ❌ Incorrect

```ts
try { work(); } catch (error) { throw new PaymentError("charge failed"); }
```

```ts
try { work(); } catch (error) { throw new PaymentError("charge failed", { cause: other }); }
```

### ✅ Correct

```ts
try { work(); } catch (error) { throw new PaymentError("charge failed", { cause: error }); }
```

```ts
try { work(); } catch (error) { throw error; }
```

```ts
try { work(); } catch { throw new PaymentError("charge failed"); }
```

## When not to use it

Turn the rule off when targeting a runtime without support for the `cause` option and
you attach the original error some other way.

## Related rules

- [`no-swallowed-errors`](./no-swallowed-errors.md) requires the catch to do *something*
- [`no-generic-error-contract`](./no-generic-error-contract.md) requires the wrapper to be domain-specific
- [`require-contextual-error-message`](./require-contextual-error-message.md) requires the wrapper to say what failed
