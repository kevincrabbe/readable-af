# readable-af/no-swallowed-errors

> Require catch blocks to rethrow, return a fallback, report the error, or document intentional suppression.

|  |  |
| --- | --- |
| **Type** | problem |
| **Fixable** | no |
| **Presets** | `strict`, `all-custom` |

## Rule details

An empty or near-empty `catch` turns a failure into silence: the operation did not
happen, and nothing downstream can tell. This rule requires each catch block to do at
least one of four things:

1. **Rethrow** — any `throw` inside the block.
2. **Return an observable fallback** — a `return` with a value that is not `null`,
   `undefined`, or `void ...`. A bare `return;` does not count.
3. **Call an error handler** — a call whose name matches
   `handle`, `report`, `capture`, `notify`, `logError`, or `onError`
   (case-insensitive, matched anywhere in the callee name).
4. **Document the suppression** — a comment inside the block matching
   `intentionally ignored`, `intentionally swallowed`, or `intentionally suppressed`.

`console.error(error)` alone is deliberately **not** enough: it satisfies neither the
caller nor the tests, and the operation still fails silently from their point of view.
Nested function declarations are not searched, so a `throw` inside a callback defined
in the catch does not count as handling.

## Options

This rule has no options.

## Examples

### ❌ Incorrect

```ts
try { work(); } catch {}
```

```ts
try { work(); } catch (error) { console.error(error); }
```

```ts
function run() {
  try { work(); } catch { return null; }
}
```

### ✅ Correct

```ts
async function run() {
  try { await work(); } catch (error) { throw error; }
}
```

```ts
function run() {
  try { work(); } catch { return FALLBACK; }
}
```

```ts
try { work(); } catch (error) { reportTelemetryError(error); }
```

```ts
try { work(); } catch { /* intentionally ignored: optional cleanup */ }
```

## When not to use it

Turn the rule off in code where suppressing failures is the whole contract — a
best-effort cleanup pass, or a polyfill probe — and the suppression comments would be
noise on every block.

## Related rules

- [`no-log-and-rethrow`](./no-log-and-rethrow.md) covers the opposite failure: reporting *and* propagating
- [`require-cause-when-rethrowing`](./require-cause-when-rethrowing.md) keeps the original failure attached
- [`safe-catch-error-access`](./safe-catch-error-access.md) makes the caught value safe to read
