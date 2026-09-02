import assert from "node:assert/strict";
import { after, describe, it, test } from "node:test";

import { RuleTester } from "@typescript-eslint/rule-tester";
import { ESLint } from "eslint";
import tseslint from "typescript-eslint";

import plugin from "../dist/index.js";

RuleTester.afterAll = after;
RuleTester.describe = describe;
RuleTester.describeSkip = describe.skip;
RuleTester.it = it;
RuleTester.itOnly = it.only;
RuleTester.itSkip = it.skip;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      ecmaFeatures: { jsx: true },
    },
  },
});

function run(name, valid, invalid) {
  ruleTester.run(name, plugin.rules[name], {
    valid: valid.map((entry) =>
      typeof entry === "string" ? { code: entry, filename: "test.tsx" } : entry,
    ),
    invalid: invalid.map((entry) => ({ filename: "test.tsx", ...entry })),
  });
}

run(
  "max-boolean-complexity",
  ["const allowed = active && verified;"],
  [
    {
      code: "const allowed = (a && b) || (c && !d);",
      options: [5],
      errors: [{ messageId: "tooComplex" }],
    },
  ],
);

run(
  "max-logical-operands",
  ["const eligible = active && verified && paid;"],
  [
    {
      code: "const eligible = active && verified && paid && !suspended;",
      options: [3],
      errors: [{ messageId: "tooMany" }],
    },
  ],
);

run(
  "no-mixed-and-or-without-parens",
  [
    "const allowed = admin || (owner && active);",
    "const required = active && verified && paid;",
    "const fallback = value ?? defaultValue;",
  ],
  [
    {
      code: "const allowed = admin || owner && active;",
      errors: [{ messageId: "mixed" }],
    },
  ],
);

run(
  "no-nested-negation",
  [
    "const unavailable = !active || !verified;",
    "const count = +value;",
  ],
  [
    {
      code: "const available = !(!active || !verified);",
      errors: [{ messageId: "nested" }],
    },
  ],
);

run(
  "prefer-positive-boolean-names",
  [
    "const isEnabled = !disabled;",
    "const isNotLabel = 'not a boolean';",
    "let isNotReady;",
    "const { isNotReady } = state;",
  ],
  [
    {
      code: "const isNotEnabled = !enabled;",
      errors: [{ messageId: "negativeName" }],
    },
  ],
);

run(
  "no-negative-boolean-condition",
  [
    "if (isAllowed) allow();",
    "for (;;) break;",
  ],
  [
    {
      code: "if (!isNotAllowed) allow();",
      errors: [{ messageId: "doubleNegative" }],
    },
    {
      code: "while (ready && !isNotAllowed) work();",
      errors: [{ messageId: "doubleNegative" }],
    },
    {
      code: "if (ready ? !isNotAllowed : false) allow();",
      errors: [{ messageId: "doubleNegative" }],
    },
    {
      code: "if (ready === !isNotAllowed) allow();",
      errors: [{ messageId: "doubleNegative" }],
    },
    {
      code: "if ((ready, !isNotAllowed)) allow();",
      errors: [{ messageId: "doubleNegative" }],
    },
    {
      code: "if (!!isNotAllowed) allow();",
      errors: [{ messageId: "doubleNegative" }],
    },
  ],
);

run(
  "no-boolean-ternary",
  [
    "const state = ready ? 'ready' : 'waiting';",
    "const first = ready ? true : 'waiting';",
    "const second = ready ? 'ready' : false;",
  ],
  [
    {
      code: "const visible = ready ? true : false;",
      errors: [{ messageId: "redundant" }],
    },
  ],
);

run(
  "no-complex-boolean-return",
  ["function canEdit() { return active && allowed; }"],
  [
    {
      code: "function canEdit() { return active && (admin || owner); }",
      options: [3],
      errors: [{ messageId: "complexReturn" }],
    },
  ],
);

run(
  "prefer-named-boolean-expression",
  ["if (canEdit) edit();"],
  [
    {
      code: "if (active && (admin || owner)) edit();",
      options: [3],
      errors: [{ messageId: "preferName" }],
    },
  ],
);

run(
  "no-complex-jsx-condition",
  ["const view = <div>{canRender && <Panel />}</div>;"],
  [
    {
      code: "const view = <div>{active && (admin || owner) && <Panel />}</div>;",
      options: [3],
      errors: [{ messageId: "complexJsx" }],
    },
  ],
);

run(
  "prefer-semantic-boolean",
  ["function canEdit() { return canAccess; }"],
  [
    {
      code: "function canEdit() { return active && (admin || owner); }",
      options: [3],
      errors: [{ messageId: "preferSemantic" }],
    },
  ],
);

run(
  "no-double-negative-booleans",
  [
    "if (isVerified) activate();",
    "const { isNotVerified } = user;",
    "const isNotStatus = status;",
    "const isNotCount = +count;",
  ],
  [
    {
      code: "if (!isNotVerified) activate();",
      errors: [{ messageId: "negatedName" }],
    },
    {
      code: "const shouldNotDisable = !isInvalid;",
      errors: [{ messageId: "negativeDefinition" }],
    },
    {
      code: "if (!user.isNotVerified) activate();",
      errors: [{ messageId: "negatedName" }],
    },
  ],
);

run(
  "require-distinct-branch-effects",
  [
    "function check(ok) { if (ok) return true; return false; }",
    "function set(ok) { if (ok) value = 1; else value = 2; }",
    "while (active) if (ready) return true;",
  ],
  [
    {
      code: "function check(ok) { if (ok) return true; return true; }",
      errors: [{ messageId: "identical" }],
    },
    {
      code: "if (ready) { value = calculate(); } else { value = calculate(); }",
      errors: [{ messageId: "identical" }],
    },
    {
      code: "if (ready) {}",
      errors: [{ messageId: "empty" }],
    },
    {
      code: "if (ready) { work(); } else {}",
      errors: [{ messageId: "empty" }],
    },
  ],
);

run(
  "no-swallowed-errors",
  [
    "async function run() { try { await work(); } catch (error) { throw error; } }",
    "function run() { try { work(); } catch { return FALLBACK; } }",
    "try { work(); } catch (error) { reportTelemetryError(error); }",
    "try { work(); } catch { /* intentionally ignored: optional cleanup */ }",
    "function run() { try { work(); } catch (error) { reportError(error); return undefined; } }",
  ],
  [
    {
      code: "try { work(); } catch {}",
      errors: [{ messageId: "swallowed" }],
    },
    {
      code: "try { work(); } catch (error) { console.error(error); }",
      errors: [{ messageId: "swallowed" }],
    },
    {
      code: "try { work(); } catch { function later() { throw new Error(); } later(); }",
      errors: [{ messageId: "swallowed" }],
    },
    {
      code: "function run() { try { work(); } catch { return; } }",
      errors: [{ messageId: "swallowed" }],
    },
    {
      code: "function run() { try { work(); } catch { return undefined; } }",
      errors: [{ messageId: "swallowed" }],
    },
    {
      code: "function run() { try { work(); } catch { return null; } }",
      errors: [{ messageId: "swallowed" }],
    },
    {
      code: "function run() { try { work(); } catch { return void cleanup(); } }",
      errors: [{ messageId: "swallowed" }],
    },
  ],
);

run(
  "require-cause-when-rethrowing",
  [
    "try { work(); } catch (error) { throw error; }",
    "try { work(); } catch (error) { throw new PaymentError('charge failed', { cause: error }); }",
    "try { work(); } catch (error) { throw new PaymentError('charge failed', { 'cause': error }); }",
    "try { work(); } catch { throw new PaymentError('charge failed'); }",
    "try { work(); } catch (error) { function later() { throw new PaymentError('later'); } later(); }",
  ],
  [
    {
      code: "try { work(); } catch (error) { throw new PaymentError('charge failed'); }",
      errors: [{ messageId: "missingCause" }],
    },
    {
      code: "try { work(); } catch (error) { throw new PaymentError('charge failed', { cause: other }); }",
      errors: [{ messageId: "missingCause" }],
    },
  ],
);

run(
  "no-log-and-rethrow",
  [
    "try { work(); } catch (error) { throw error; }",
    "function run() { try { work(); } catch (error) { logger.error(error); return FALLBACK; } }",
    "try { work(); } catch (error) { function later() { logger.error(error); throw error; } later(); }",
  ],
  [
    {
      code: "try { work(); } catch (error) { logger.error(error); throw error; }",
      errors: [{ messageId: "duplicate" }],
    },
    {
      code: "try { work(); } catch (error) { reportError(error); throw new ServiceError('failed', { cause: error }); }",
      errors: [{ messageId: "duplicate" }],
    },
  ],
);

run(
  "safe-catch-error-access",
  [
    "try { work(); } catch (error) { if (error instanceof Error) logger.error(error.message); }",
    "try { work(); } catch (error) { if (isServiceError(error)) logger.error(error.code); }",
    "try { work(); } catch (error) { logger.error(toError(error).message); }",
    "try { work(); } catch { logger.error('failed'); }",
    "try { work(); } catch (error) { function later() { return error.message; } later(); }",
  ],
  [
    {
      code: "try { work(); } catch (error) { logger.error(error.message); }",
      errors: [{ messageId: "unsafe" }],
    },
    {
      code: "try { work(); } catch (error) { logger.error((error as Error).message); }",
      errors: [{ messageId: "unsafe" }],
    },
    {
      code: "try { work(); } catch (error) { logger.error(error?.message); }",
      errors: [{ messageId: "unsafe" }],
    },
  ],
);

run(
  "require-contextual-error-message",
  [
    "throw new PaymentError('Could not charge customer');",
    "throw new PaymentError(`Could not charge customer ${customerId}`);",
    "throw new PaymentError(message);",
    "throw existingError;",
  ],
  [
    {
      code: "throw new PaymentError('failed');",
      errors: [{ messageId: "context" }],
    },
    {
      code: "throw PaymentError('something went wrong');",
      errors: [{ messageId: "context" }],
    },
    {
      code: "throw new PaymentError(`error`);",
      errors: [{ messageId: "context" }],
    },
    {
      code: "throw new PaymentError(error.message);",
      errors: [{ messageId: "context" }],
    },
    {
      code: "throw new PaymentError();",
      errors: [{ messageId: "context" }],
    },
  ],
);

run(
  "require-error-message-identifiers",
  [
    "function updateUser(name) { throw new UserError('Failed to update user'); }",
    "function updateUser(userId) { throw new UserError(`Failed to update user ${userId}`); }",
    "const updateUser = (userId) => { throw new UserError('Failed to update user', userId); };",
    "function outer(userId) { return function inner(jobId) { throw new JobError('Failed', jobId); }; }",
  ],
  [
    {
      code: "function updateUser(userId) { throw new UserError('Failed to update user'); }",
      errors: [{ messageId: "identifier" }],
    },
    {
      code: "const processJob = function(jobID) { throw new JobError('Could not process job'); };",
      errors: [{ messageId: "identifier" }],
    },
  ],
);

run(
  "max-try-block-statements",
  [
    {
      code: "try { prepare(); charge(); } catch (error) { throw error; }",
      options: [2],
      filename: "test.tsx",
    },
  ],
  [
    {
      code: "try { prepare(); charge(); notify(); } catch (error) { throw error; }",
      options: [2],
      errors: [{ messageId: "tooLarge" }],
    },
  ],
);

run(
  "no-boolean-parameter-branching",
  [
    "function fetchUser(visibility: string) { if (visibility) return user; }",
    "function fetchUser(includeDeleted: boolean) { return includeDeleted; }",
    "const select = (enabled = true) => value;",
    "function outer(flag: boolean) { return function inner(value: boolean) { return value; }; }",
  ],
  [
    {
      code: "function fetchUser(includeDeleted: boolean) { if (includeDeleted) return deleted; }",
      errors: [{ messageId: "branching" }],
    },
    {
      code: "const select = (enabled = true) => enabled ? first : second;",
      errors: [{ messageId: "branching" }],
    },
    {
      code: "const wait = function(retry: boolean) { while (retry) work(); };",
      errors: [{ messageId: "branching" }],
    },
    {
      code: "function choose(flag: boolean) { switch (flag) { case true: return first; default: return second; } }",
      errors: [{ messageId: "branching" }],
    },
  ],
);

run(
  "no-unobservable-side-effect",
  [
    "function activate(user) { user.active = true; return user; }",
    "const activate = (user) => ({ ...user, active: true });",
    "function calculate(user) { const result = {}; result.active = user.active; }",
    "function inspect(user) { return user.active; }",
  ],
  [
    {
      code: "function activate(user) { user.active = true; }",
      errors: [{ messageId: "mutation" }],
    },
    {
      code: "const increment = function(stats) { stats.count++; };",
      errors: [{ messageId: "mutation" }],
    },
    {
      code: "const rename = (user) => { user.profile.name = 'Ada'; };",
      errors: [{ messageId: "mutation" }],
    },
  ],
);

run(
  "no-ambiguous-boundary-checks",
  [
    "if (age >= MINIMUM_AGE) allow();",
    "if (attempts === 3) stop();",
    "if (status > 'draft') publish();",
  ],
  [
    {
      code: "if (age >= 18) allow();",
      errors: [{ messageId: "boundary" }],
    },
    {
      code: "if (0 < balance) allow();",
      errors: [{ messageId: "boundary" }],
    },
  ],
);

run(
  "no-redundant-condition",
  [
    "if (x > 5 && x < 10) use(x);",
    "if (x > 5 && y > 5) use(x);",
    "const value = input ?? fallback;",
  ],
  [
    {
      code: "if (ready && ready) work();",
      errors: [{ messageId: "redundant" }],
    },
    {
      code: "if (x > 10 && x > 5) work();",
      errors: [{ messageId: "redundant" }],
    },
    {
      code: "if (x > 5 || x > 10) work();",
      errors: [{ messageId: "redundant" }],
    },
    {
      code: "if (10 < x && 5 < x) work();",
      errors: [{ messageId: "redundant" }],
    },
  ],
);

run(
  "no-naked-default-fallback",
  [
    "const retries = config.retries ?? DEFAULT_REQUEST_RETRIES;",
    "const role = user.role || DEFAULT_ROLE;",
    "const ready = active && true;",
    "const label = value ?? `prefix-${id}`;",
  ],
  [
    {
      code: "const retries = config.retries ?? 3;",
      errors: [{ messageId: "fallback" }],
    },
    {
      code: "const role = user.role || 'user';",
      errors: [{ messageId: "fallback" }],
    },
    {
      code: "const label = value ?? `unknown`;",
      errors: [{ messageId: "fallback" }],
    },
  ],
);

run(
  "no-generic-error-contract",
  [
    "throw new InvalidSubscriptionError(id);",
    "throw error;",
  ],
  [
    {
      code: "throw new Error('invalid');",
      errors: [{ messageId: "generic" }],
    },
    {
      code: "throw Error('invalid');",
      errors: [{ messageId: "generic" }],
    },
  ],
);

run(
  "no-high-mutation-density",
  [
    "function eligible(user) { return user.active; }",
    "const identity = (value) => value;",
    "const factory = function() { return () => true; };",
  ],
  [
    {
      code: "function eligible(user) { if (!user.active) return false; return true; }",
      options: [2],
      errors: [{ messageId: "dense" }],
    },
    {
      code: "const eligible = (user) => user.active && !user.banned && user.age > 18;",
      options: [2],
      errors: [{ messageId: "dense" }],
    },
  ],
);

test("exports every custom rule without a company namespace", () => {
  assert.equal(Object.keys(plugin.rules).length, 27);
  assert.equal(
    Object.keys(plugin.rules).some((name) => name.includes("company")),
    false,
  );
});

test("exports layered flat configs", () => {
  assert.ok(Array.isArray(plugin.configs.recommended));
  assert.ok(Array.isArray(plugin.configs.strict));
  assert.ok(Array.isArray(plugin.configs["all-custom"]));

  const serialized = JSON.stringify(plugin.configs.recommended, (key, value) =>
    key === "plugins" ? Object.keys(value) : value,
  );
  assert.match(serialized, /strict-boolean-expressions/);
  assert.match(serialized, /switch-exhaustiveness-check/);
  assert.match(serialized, /only-throw-error/);
  assert.match(serialized, /return-await/);
  assert.match(serialized, /use-unknown-in-catch-callback-variable/);
  assert.match(serialized, /no-unnecessary-condition/);
  assert.match(serialized, /no-constant-binary-expression/);
  assert.match(serialized, /sonarjs\/no-gratuitous-expressions/);
  assert.match(serialized, /sonarjs\/no-redundant-boolean/);
  assert.match(serialized, /sonarjs\/cognitive-complexity/);
  assert.match(serialized, /readable-af\/max-boolean-complexity/);
});

test("recommended flat config runs through ESLint", async () => {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: plugin.configs.recommended,
  });
  const [result] = await eslint.lintText(
    "const eligible = active && verified && paid && !suspended;",
    { filePath: "example.js" },
  );

  assert.ok(result);
  assert.ok(
    result.messages.some(
      (message) => message.ruleId === "readable-af/max-logical-operands",
    ),
  );
});
