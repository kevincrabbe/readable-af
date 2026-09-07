# readable-af/require-error-message-identifiers

> Require errors thrown by functions with identifier parameters to include one of those identifiers.

|  |  |
| --- | --- |
| **Type** | suggestion |
| **Fixable** | no |
| **Presets** | `strict`, `all-custom` |

## Rule details

"Failed to update user" is a class of failure. "Failed to update user 8f21c" is an
incident you can investigate. When a function receives an identifier, the error it
throws should carry it.

This rule collects the parameters of the enclosing function whose names end in `Id` or
`ID`, and reports a `throw` of an error construction (any callee whose name ends in
`Error`) that mentions none of them anywhere in its arguments — message template,
extra argument, or options object all count.

Identifiers are scoped to the nearest enclosing function, so an inner function is
judged by its own parameters rather than the outer function's. Destructured
parameters are not inspected; only plain identifiers, defaulted identifiers, and
TypeScript parameter properties are.

## Options

This rule has no options.

## Examples

### ❌ Incorrect

```ts
function updateUser(userId) {
  throw new UserError("Failed to update user");
}
```

```ts
const processJob = function (jobID) {
  throw new JobError("Could not process job");
};
```

### ✅ Correct

```ts
function updateUser(userId) {
  throw new UserError(`Failed to update user ${userId}`);
}
```

```ts
const updateUser = (userId) => {
  throw new UserError("Failed to update user", userId);
};
```

```ts
function updateUser(name) {
  throw new UserError("Failed to update user");
}
```

## When not to use it

Turn the rule off where identifiers are personal data that must stay out of logs and
error text, or where a structured logging layer already attaches them.

## Related rules

- [`require-contextual-error-message`](./require-contextual-error-message.md)
- [`no-generic-error-contract`](./no-generic-error-contract.md)
