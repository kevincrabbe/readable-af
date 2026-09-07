# readable-af/no-complex-boolean-return

> Require complex returned predicates to be given a semantic name.

|  |  |
| --- | --- |
| **Type** | suggestion |
| **Fixable** | no |
| **Presets** | `strict`, `all-custom` |

## Rule details

A returned predicate is a function's contract. When that contract is a dense
expression, every caller has to re-derive the rule from syntax. This rule scores
the returned expression with the
[boolean complexity score](./max-boolean-complexity.md#rule-details) and reports
when it passes the maximum, asking you to name the predicate first.

It checks both `return` statements and the implicit return of a concise arrow
function body. Only boolean *structures* are scored — logical expressions,
ternaries, and negations — so `return user.active;` and `return a === b;` are
never reported.

## Options

The first option is the maximum score, an integer `>= 0`. It defaults to `3`.

```js
{
  "rules": {
    "readable-af/no-complex-boolean-return": ["error", 4]
  }
}
```

## Examples

### ❌ Incorrect

```ts
function canEdit() {
  // score 4: a nested group and an operator switch
  return active && (admin || owner);
}
```

```ts
const canPublish = () => draftReady && (editorApproved || legalApproved);
```

### ✅ Correct

```ts
function canEdit() {
  return active && allowed;
}
```

```ts
function canEdit() {
  const hasWriteRole = admin || owner;
  return active && hasWriteRole;
}
```

## When not to use it

Turn the rule off in small predicate helpers whose whole purpose is to express
one composed rule, where extracting a name would just restate the function's own
name on the line above.

## Related rules

- [`prefer-semantic-boolean`](./prefer-semantic-boolean.md) also covers call arguments
- [`prefer-named-boolean-expression`](./prefer-named-boolean-expression.md) covers control-flow conditions
