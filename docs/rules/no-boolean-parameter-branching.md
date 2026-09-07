# readable-af/no-boolean-parameter-branching

> Disallow branching directly on boolean parameters that create multiple function modes.

|  |  |
| --- | --- |
| **Type** | suggestion |
| **Fixable** | no |
| **Presets** | `strict`, `all-custom` |

## Rule details

`fetchUser(id, true)` tells the reader nothing at the call site, and inside the
function the flag splits one name across two behaviours. This rule reports a branch
whose condition mentions a boolean parameter of the enclosing function.

A parameter counts as boolean when it is annotated `: boolean` or has a boolean
literal default (`enabled = true`). The branches checked are `if`, ternary, `while`,
`do...while`, `for`, and `switch` discriminants. The parameter may appear anywhere
inside the condition, not only as the whole test.

Parameters are scoped to the nearest enclosing function, so an inner function is
judged by its own parameters. Using the parameter for anything other than branching —
returning it, passing it on — is not reported.

## Options

This rule has no options.

## Examples

### ❌ Incorrect

```ts
function fetchUser(includeDeleted: boolean) {
  if (includeDeleted) return deleted;
}
```

```ts
const select = (enabled = true) => enabled ? first : second;
```

```ts
function choose(flag: boolean) {
  switch (flag) {
    case true: return first;
    default: return second;
  }
}
```

### ✅ Correct

```ts
function fetchUser(visibility: UserVisibility) {
  if (visibility === UserVisibility.Deleted) return deleted;
}
```

```ts
function fetchUser() { return active; }
function fetchDeletedUser() { return deleted; }
```

```ts
function fetchUser(includeDeleted: boolean) {
  return includeDeleted;
}
```

## When not to use it

Turn the rule off when implementing an interface whose boolean parameter you do not
control, or in adapter layers whose whole job is to translate a flag into a call.

## Related rules

- [`require-distinct-branch-effects`](./require-distinct-branch-effects.md)
- [`no-high-mutation-density`](./no-high-mutation-density.md)
