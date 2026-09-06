# readable-af/no-naked-default-fallback

> Require domain fallbacks used with ?? or || to have semantic names.

|  |  |
| --- | --- |
| **Type** | suggestion |
| **Fixable** | no |
| **Presets** | `strict`, `all-custom` |

## Rule details

`config.retries ?? 3` states a policy without naming it. When the same default is
needed elsewhere it gets copied, and the two copies drift. This rule reports a `??` or
`||` expression whose right-hand side is a bare literal or an expression-free template
literal, and asks for a named constant instead.

A fallback with interpolation (`` value ?? `prefix-${id}` ``) is computed rather than
fixed policy, so it is left alone. `&&` is not checked — its right side is not a
fallback.

## Options

This rule has no options.

## Examples

### ❌ Incorrect

```ts
const retries = config.retries ?? 3;
```

```ts
const role = user.role || "user";
```

```ts
const label = value ?? `unknown`;
```

### ✅ Correct

```ts
const retries = config.retries ?? DEFAULT_REQUEST_RETRIES;
```

```ts
const role = user.role || DEFAULT_ROLE;
```

```ts
const label = value ?? `prefix-${id}`;
```

## When not to use it

Turn the rule off in configuration modules where the literals *are* the named
constants, or in scripts where the indirection costs more than it explains.

## Related rules

- [`no-ambiguous-boundary-checks`](./no-ambiguous-boundary-checks.md) applies the same idea to comparison boundaries
