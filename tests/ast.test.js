import assert from "node:assert/strict";
import { test } from "node:test";

import {
  containsNegation,
  countLogicalOperands,
  getExpressionName,
  getIntegerOption,
  isBooleanLike,
  isBooleanStructure,
  isNegativeBooleanName,
  isNegatedNegativeName,
  isNestedBooleanNode,
  isParenthesized,
  scoreBooleanExpression,
  unwrapExpression,
} from "../dist/ast.js";

const id = (name) => ({ type: "Identifier", name });
const literal = (value) => ({ type: "Literal", value });
const unary = (operator, argument) => ({
  type: "UnaryExpression",
  operator,
  argument,
  prefix: true,
});
const logical = (operator, left, right) => ({
  type: "LogicalExpression",
  operator,
  left,
  right,
});
const binary = (operator, left, right) => ({
  type: "BinaryExpression",
  operator,
  left,
  right,
});
const conditional = (testNode, consequent, alternate) => ({
  type: "ConditionalExpression",
  test: testNode,
  consequent,
  alternate,
});

test("recognizes negative boolean names and expression names", () => {
  assert.equal(isNegativeBooleanName("isNotEnabled"), true);
  assert.equal(isNegativeBooleanName("cannotEdit"), true);
  assert.equal(isNegativeBooleanName("isEnabled"), false);

  assert.equal(getExpressionName(id("ready")), "ready");
  assert.equal(
    getExpressionName({
      type: "MemberExpression",
      object: id("user"),
      property: id("isNotReady"),
      computed: false,
      optional: false,
    }),
    "isNotReady",
  );
  assert.equal(
    getExpressionName({
      type: "MemberExpression",
      object: id("user"),
      property: literal("hasNoAccess"),
      computed: true,
      optional: false,
    }),
    "hasNoAccess",
  );
  assert.equal(
    getExpressionName({
      type: "MemberExpression",
      object: id("user"),
      property: literal(1),
      computed: true,
      optional: false,
    }),
    undefined,
  );
  assert.equal(getExpressionName(literal(true)), undefined);
});

test("unwraps TypeScript and chain expression wrappers", () => {
  const expression = id("ready");
  const wrapped = {
    type: "ChainExpression",
    expression: {
      type: "TSAsExpression",
      expression: {
        type: "TSNonNullExpression",
        expression: {
          type: "TSTypeAssertion",
          expression: {
            type: "TSSatisfiesExpression",
            expression,
          },
        },
      },
    },
  };

  assert.equal(unwrapExpression(wrapped), expression);
  assert.equal(unwrapExpression(expression), expression);
});

test("classifies boolean-shaped expressions", () => {
  assert.equal(isBooleanStructure(null), false);
  assert.equal(isBooleanStructure(logical("&&", id("a"), id("b"))), true);
  assert.equal(isBooleanStructure(conditional(id("a"), id("b"), id("c"))), true);
  assert.equal(isBooleanStructure(unary("!", id("a"))), true);
  assert.equal(isBooleanStructure(unary("+", id("a"))), false);
  assert.equal(isBooleanStructure(id("a")), false);

  assert.equal(isBooleanLike(undefined), false);
  assert.equal(isBooleanLike(logical("||", id("a"), id("b"))), true);
  assert.equal(isBooleanLike(literal(true)), true);
  assert.equal(isBooleanLike(literal("true")), false);
  assert.equal(isBooleanLike(binary("===", id("a"), id("b"))), true);
  assert.equal(isBooleanLike(binary("+", id("a"), id("b"))), false);
  assert.equal(isBooleanLike(id("a")), false);
});

test("counts operands and scores every supported boolean construct", () => {
  const threeOperands = logical(
    "&&",
    id("a"),
    logical("||", id("b"), id("c")),
  );
  assert.equal(countLogicalOperands(id("a")), 1);
  assert.equal(countLogicalOperands(threeOperands), 3);

  assert.equal(scoreBooleanExpression(id("a")), 0);
  assert.equal(scoreBooleanExpression(logical("&&", id("a"), id("b"))), 1);
  assert.equal(scoreBooleanExpression(threeOperands), 4);
  assert.equal(
    scoreBooleanExpression(logical("&&", id("a"), id("b")), 1, "&&"),
    2,
  );
  assert.equal(scoreBooleanExpression(unary("!", id("a"))), 0.5);
  assert.equal(scoreBooleanExpression(unary("+", id("a"))), 0);
  assert.equal(scoreBooleanExpression(conditional(id("a"), id("b"), id("c"))), 2);
  assert.equal(
    scoreBooleanExpression(conditional(id("a"), id("b"), id("c")), 1),
    3,
  );
  assert.equal(
    scoreBooleanExpression({
      type: "CallExpression",
      callee: id("check"),
      arguments: [],
      optional: false,
    }),
    0.5,
  );
  assert.equal(
    scoreBooleanExpression({
      type: "NewExpression",
      callee: id("Boolean"),
      arguments: [],
    }),
    0.5,
  );
  assert.equal(scoreBooleanExpression(binary("===", id("a"), id("b"))), 0);
  assert.equal(
    scoreBooleanExpression({ type: "AwaitExpression", argument: unary("!", id("a")) }),
    0.5,
  );
  assert.equal(
    scoreBooleanExpression({
      type: "UpdateExpression",
      argument: id("counter"),
      operator: "++",
      prefix: false,
    }),
    0,
  );
  assert.equal(
    scoreBooleanExpression({
      type: "SequenceExpression",
      expressions: [unary("!", id("a")), unary("!", id("b"))],
    }),
    1,
  );
});

test("finds negation throughout supported expression shapes", () => {
  const negated = unary("!", id("a"));
  assert.equal(containsNegation(negated), true);
  assert.equal(containsNegation(unary("+", negated)), true);
  assert.equal(containsNegation(unary("+", id("a"))), false);
  assert.equal(containsNegation(logical("&&", negated, id("b"))), true);
  assert.equal(containsNegation(logical("&&", id("a"), negated)), true);
  assert.equal(containsNegation(binary("===", id("a"), negated)), true);
  assert.equal(containsNegation(conditional(negated, id("b"), id("c"))), true);
  assert.equal(containsNegation(conditional(id("a"), negated, id("c"))), true);
  assert.equal(containsNegation(conditional(id("a"), id("b"), negated)), true);
  assert.equal(
    containsNegation({
      type: "CallExpression",
      callee: id("check"),
      arguments: [{ type: "SpreadElement", argument: negated }, negated],
      optional: false,
    }),
    true,
  );
  assert.equal(
    containsNegation({
      type: "NewExpression",
      callee: id("Check"),
      arguments: [id("a")],
    }),
    false,
  );
  assert.equal(
    containsNegation({ type: "AwaitExpression", argument: negated }),
    true,
  );
  assert.equal(
    containsNegation({
      type: "UpdateExpression",
      argument: id("counter"),
      operator: "++",
      prefix: false,
    }),
    false,
  );
  assert.equal(
    containsNegation({ type: "SequenceExpression", expressions: [id("a"), negated] }),
    true,
  );
  assert.equal(containsNegation(id("a")), false);
});

test("handles negated names, parentheses, options, and parent contexts", () => {
  assert.equal(isNegatedNegativeName(unary("!", id("isNotReady"))), true);
  assert.equal(isNegatedNegativeName(unary("+", id("isNotReady"))), false);
  assert.equal(isNegatedNegativeName(unary("!", id("isReady"))), false);

  const node = id("a");
  assert.equal(
    isParenthesized(
      {
        getTokenBefore: () => ({ value: "(" }),
        getTokenAfter: () => ({ value: ")" }),
      },
      node,
    ),
    true,
  );
  assert.equal(
    isParenthesized(
      {
        getTokenBefore: () => null,
        getTokenAfter: () => ({ value: ")" }),
      },
      node,
    ),
    false,
  );
  assert.equal(
    isParenthesized(
      {
        getTokenBefore: () => ({ value: "(" }),
        getTokenAfter: () => null,
      },
      node,
    ),
    false,
  );

  assert.equal(getIntegerOption([0], 3), 0);
  assert.equal(getIntegerOption([1.5], 3), 3);
  assert.equal(getIntegerOption([-1], 3), 3);
  assert.equal(getIntegerOption(["2"], 3), 3);
  assert.equal(getIntegerOption([], 3), 3);

  assert.equal(isNestedBooleanNode(node), false);
  assert.equal(
    isNestedBooleanNode({ ...node, parent: { type: "LogicalExpression" } }),
    true,
  );
  assert.equal(
    isNestedBooleanNode({ ...node, parent: { type: "ConditionalExpression" } }),
    true,
  );
  assert.equal(
    isNestedBooleanNode({
      ...node,
      parent: { type: "UnaryExpression", operator: "!" },
    }),
    true,
  );
  assert.equal(
    isNestedBooleanNode({
      ...node,
      parent: { type: "UnaryExpression", operator: "+" },
    }),
    false,
  );
  assert.equal(
    isNestedBooleanNode({ ...node, parent: { type: "VariableDeclarator" } }),
    false,
  );
});
