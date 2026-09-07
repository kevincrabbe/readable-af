# readable-af/no-unobservable-side-effect

> Disallow void functions that mutate parameters without returning an observable result.

|  |  |
| --- | --- |
| **Type** | suggestion |
| **Fixable** | no |
| **Presets** | `strict`, `all-custom` |

## Rule details

A function that mutates its argument and returns nothing has no contract a caller can
read or a test can assert against — you have to know what it touched. This rule
reports a function that assigns to (or updates) a property of one of its own
parameters and never returns a value.

Assignment and update expressions both count, at any depth of member access
(`user.profile.name = ...`). Returning a value anywhere in the function — or being a
concise arrow whose body *is* the result — satisfies the rule. Mutating a local
variable rather than a parameter is not reported.

## Options

This rule has no options.

## Examples

### ❌ Incorrect

```ts
function activate(user) {
  user.active = true;
}
```

```ts
const increment = function (stats) {
  stats.count++;
};
```

```ts
const rename = (user) => {
  user.profile.name = "Ada";
};
```

### ✅ Correct

```ts
function activate(user) {
  user.active = true;
  return user;
}
```

```ts
const activate = (user) => ({ ...user, active: true });
```

```ts
function calculate(user) {
  const result = {};
  result.active = user.active;
}
```

## When not to use it

Turn the rule off in hot paths where in-place mutation is a measured performance
requirement, or in visitor-style callbacks whose contract is mutation by design.

## Related rules

- [`no-high-mutation-density`](./no-high-mutation-density.md)
- [`require-distinct-branch-effects`](./require-distinct-branch-effects.md)
