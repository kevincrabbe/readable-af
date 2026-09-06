# readable-af/no-nested-negation

> Disallow boolean expressions that require reasoning through nested negations.

|  |  |
| --- | --- |
| **Type** | suggestion |
| **Fixable** | no |
| **Presets** | `strict`, `all-custom` |

## Rule details

`!(!active || !verified)` is De Morgan's law written out longhand. The reader has to
apply the transformation mentally before they know what the code means — and the
positive form, `active && verified`, is both shorter and directly readable.

This rule reports any `!` whose operand contains another negation anywhere inside it,
including through logical, binary, conditional, call-argument, `await`, update, and
sequence expressions.

## Options

This rule has no options.

## Examples

### ❌ Incorrect

```ts
const available = !(!active || !verified);
```

```ts
const blocked = !(user.banned ? !appealPending : true);
```

### ✅ Correct

```ts
const available = active && verified;
```

```ts
const unavailable = !active || !verified;
```

## When not to use it

Turn the rule off when you mirror an external specification that is itself written in
negated form and the direct translation is easier to audit against the source than a
De Morgan rewrite.

## Related rules

- [`no-double-negative-booleans`](./no-double-negative-booleans.md) catches negation of a negatively *named* boolean
- [`prefer-positive-boolean-names`](./prefer-positive-boolean-names.md) keeps names composable
