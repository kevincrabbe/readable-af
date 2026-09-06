# readable-af/require-distinct-branch-effects

> Require conditional branches to produce observably distinct effects.

|  |  |
| --- | --- |
| **Type** | problem |
| **Fixable** | no |
| **Presets** | `strict`, `all-custom` |

## Rule details

A branch that changes nothing is a branch no test can hold in place. This rule reports
two shapes:

- **`empty`** — an `if` or `else` whose body is an empty block. The condition can be
  inverted, deleted, or broken by a refactor with no observable consequence.
- **`identical`** — both paths produce the same effect, so the condition is decorative.
  The rule compares the source text of single-statement branches, covering a `return`,
  a `throw`, an assignment, an update expression, and a call. It compares an `if`
  against its `else`, and — when there is no `else` — against the statement that
  immediately follows on the fallthrough path.

Multi-statement branches are not compared; the rule stays with the cases where
sameness is unambiguous.

## Options

This rule has no options.

## Examples

### ❌ Incorrect

```ts
function check(ok) {
  if (ok) return true;
  return true;
}
```

```ts
if (ready) { value = calculate(); } else { value = calculate(); }
```

```ts
if (ready) {}
```

```ts
if (ready) { work(); } else {}
```

### ✅ Correct

```ts
function check(ok) {
  if (ok) return true;
  return false;
}
```

```ts
function set(ok) {
  if (ok) value = 1;
  else value = 2;
}
```

```ts
if (ready) { work(); }
```

## When not to use it

Turn the rule off where empty branches are placeholders in scaffolded code that a
generator will fill in.

## Related rules

- [`no-redundant-condition`](./no-redundant-condition.md) covers redundancy inside one condition
- [`no-boolean-ternary`](./no-boolean-ternary.md) covers ternaries that restate their condition
