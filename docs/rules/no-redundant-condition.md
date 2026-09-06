# readable-af/no-redundant-condition

> Disallow duplicate and subsumed clauses in the same logical expression.

|  |  |
| --- | --- |
| **Type** | problem |
| **Fixable** | no |
| **Presets** | `strict`, `all-custom` |

## Rule details

A clause that cannot change the outcome is usually the residue of a bad merge or a
half-finished edit — and it hides the fact that the *intended* check is missing. This
rule reports two cases in a `&&` or `||` expression:

- **duplicate operands** — the two sides have identical source text, as in
  `ready && ready`.
- **subsumed numeric ranges** — both sides compare the same subject against number
  literals in the same direction, and one implies the other. Under `&&` the weaker
  clause is reported (`x > 10 && x > 5` reports `x > 5`); under `||` the stronger one
  is (`x > 5 || x > 10` reports `x > 10`). Reversed operands are normalized, so
  `10 < x && 5 < x` is caught too.

Clauses over different subjects, or over ranges that genuinely intersect
(`x > 5 && x < 10`), are left alone.

## Options

This rule has no options.

## Examples

### ❌ Incorrect

```ts
if (ready && ready) work();
```

```ts
if (x > 10 && x > 5) work();
```

```ts
if (x > 5 || x > 10) work();
```

### ✅ Correct

```ts
if (ready) work();
```

```ts
if (x > 5 && x < 10) use(x);
```

```ts
if (x > 5 && y > 5) use(x);
```

## When not to use it

Turn the rule off if you already rely on `sonarjs/no-identical-expressions` or a
similar check and prefer its reporting.

## Related rules

- [`require-distinct-branch-effects`](./require-distinct-branch-effects.md)
- [`no-ambiguous-boundary-checks`](./no-ambiguous-boundary-checks.md)
- [`max-logical-operands`](./max-logical-operands.md)
