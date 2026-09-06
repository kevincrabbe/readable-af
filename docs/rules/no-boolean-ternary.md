# readable-af/no-boolean-ternary

> Disallow ternaries that merely convert a condition to true or false.

|  |  |
| --- | --- |
| **Type** | suggestion |
| **Fixable** | no |
| **Presets** | `strict`, `all-custom` |

## Rule details

`ready ? true : false` is `ready` with extra steps, and `ready ? false : true` is
`!ready`. This rule reports a conditional expression whose consequent **and**
alternate are both boolean literals.

A ternary with only one boolean branch — `ready ? true : "waiting"` — is left alone,
because it is producing a value rather than restating a condition.

## Options

This rule has no options.

## Examples

### ❌ Incorrect

```ts
const visible = ready ? true : false;
```

```ts
const hidden = ready ? false : true;
```

### ✅ Correct

```ts
const visible = ready;
```

```ts
const hidden = !ready;
```

```ts
const state = ready ? "ready" : "waiting";
```

## When not to use it

Turn the rule off where the ternary is a deliberate coercion of a non-boolean value
and you prefer it to `Boolean(value)`.

## Related rules

- [`no-complex-jsx-condition`](./no-complex-jsx-condition.md) scores ternaries rendered in markup
- [`max-boolean-complexity`](./max-boolean-complexity.md) charges `+2` for each ternary
