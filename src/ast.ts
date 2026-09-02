import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

export type Node = TSESTree.Node;
export type Expression = TSESTree.Expression;

export interface RuleDocs {
  description: string;
  recommended?: boolean;
}

export const createRule = ESLintUtils.RuleCreator<RuleDocs>(
  (name) =>
    `https://github.com/kevincrabbe/readable-af/blob/main/docs/rules/index.md#${name}`,
);

const NEGATIVE_BOOLEAN_NAME = /^(?:(?:is|are|was|were|has|have|had|should|would|could|will|can|did|does|do)(?:Not|No|Never)|(?:cannot|cant|isnt|arent|wasnt|werent|hasnt|havent|hadnt|shouldnt|wouldnt|couldnt|wont|didnt|doesnt|dont))(?:[A-Z0-9_]|$)/u;

export function isNegativeBooleanName(name: string): boolean {
  return NEGATIVE_BOOLEAN_NAME.test(name);
}

export function getExpressionName(node: Node): string | undefined {
  const expression = unwrapExpression(node);

  if (expression.type === "Identifier") {
    return expression.name;
  }

  if (expression.type === "MemberExpression" && !expression.computed) {
    return expression.property.type === "Identifier"
      ? expression.property.name
      : undefined;
  }

  if (
    expression.type === "MemberExpression" &&
    expression.computed &&
    expression.property.type === "Literal" &&
    typeof expression.property.value === "string"
  ) {
    return expression.property.value;
  }

  return undefined;
}

export function isNegatedNegativeName(node: Node): boolean {
  const expression = unwrapExpression(node);

  return (
    expression.type === "UnaryExpression" &&
    expression.operator === "!" &&
    isNegativeBooleanName(getExpressionName(expression.argument) ?? "")
  );
}

export function unwrapExpression(node: Node): Node {
  let current = node;

  while (
    current.type === "ChainExpression" ||
    current.type === "TSAsExpression" ||
    current.type === "TSNonNullExpression" ||
    current.type === "TSTypeAssertion" ||
    current.type === "TSSatisfiesExpression"
  ) {
    current = current.expression;
  }

  return current;
}

export function isBooleanStructure(node: Node | null | undefined): boolean {
  if (!node) {
    return false;
  }

  const expression = unwrapExpression(node);

  return (
    expression.type === "LogicalExpression" ||
    expression.type === "ConditionalExpression" ||
    (expression.type === "UnaryExpression" && expression.operator === "!")
  );
}

export function isBooleanLike(node: Node | null | undefined): boolean {
  if (!node) {
    return false;
  }

  const expression = unwrapExpression(node);

  if (isBooleanStructure(expression)) {
    return true;
  }

  if (expression.type === "Literal") {
    return typeof expression.value === "boolean";
  }

  return (
    expression.type === "BinaryExpression" &&
    ["==", "===", "!=", "!==", "<", "<=", ">", ">=", "in", "instanceof"].includes(
      expression.operator,
    )
  );
}

export function countLogicalOperands(node: Node): number {
  const expression = unwrapExpression(node);

  if (expression.type !== "LogicalExpression") {
    return 1;
  }

  return (
    countLogicalOperands(expression.left) +
    countLogicalOperands(expression.right)
  );
}

export function scoreBooleanExpression(
  node: Node,
  depth = 0,
  parentLogicalOperator?: "&&" | "||" | "??",
): number {
  const expression = unwrapExpression(node);

  switch (expression.type) {
    case "LogicalExpression": {
      const switchedOperator =
        parentLogicalOperator !== undefined &&
        parentLogicalOperator !== expression.operator
          ? 1
          : 0;
      const nesting = depth > 0 ? 1 : 0;

      return (
        1 +
        switchedOperator +
        nesting +
        scoreBooleanExpression(expression.left, depth + 1, expression.operator) +
        scoreBooleanExpression(expression.right, depth + 1, expression.operator)
      );
    }

    case "UnaryExpression":
      return expression.operator === "!"
        ? 0.5 + scoreBooleanExpression(expression.argument, depth + 1)
        : scoreBooleanExpression(expression.argument, depth);

    case "ConditionalExpression":
      return (
        2 +
        (depth > 0 ? 1 : 0) +
        scoreBooleanExpression(expression.test, depth + 1) +
        scoreBooleanExpression(expression.consequent, depth + 1) +
        scoreBooleanExpression(expression.alternate, depth + 1)
      );

    case "CallExpression":
    case "NewExpression":
      return 0.5;

    case "BinaryExpression":
      return (
        scoreBooleanExpression(expression.left, depth) +
        scoreBooleanExpression(expression.right, depth)
      );

    case "AwaitExpression":
    case "UpdateExpression":
      return scoreBooleanExpression(expression.argument, depth);

    case "SequenceExpression":
      return expression.expressions.reduce(
        (score, child) => score + scoreBooleanExpression(child, depth),
        0,
      );

    default:
      return 0;
  }
}

export function containsNegation(node: Node): boolean {
  const expression = unwrapExpression(node);

  switch (expression.type) {
    case "UnaryExpression":
      return (
        expression.operator === "!" || containsNegation(expression.argument)
      );
    case "LogicalExpression":
    case "BinaryExpression":
      return containsNegation(expression.left) || containsNegation(expression.right);
    case "ConditionalExpression":
      return (
        containsNegation(expression.test) ||
        containsNegation(expression.consequent) ||
        containsNegation(expression.alternate)
      );
    case "CallExpression":
    case "NewExpression":
      return expression.arguments.some(
        (argument) => argument.type !== "SpreadElement" && containsNegation(argument),
      );
    case "AwaitExpression":
    case "UpdateExpression":
      return containsNegation(expression.argument);
    case "SequenceExpression":
      return expression.expressions.some(containsNegation);
    default:
      return false;
  }
}

export function isParenthesized(
  sourceCode: Readonly<{
    getTokenBefore(node: Node): { value: string; range?: [number, number] } | null;
    getTokenAfter(node: Node): { value: string; range?: [number, number] } | null;
  }>,
  node: Node,
): boolean {
  const before = sourceCode.getTokenBefore(node);
  const after = sourceCode.getTokenAfter(node);

  return before?.value === "(" && after?.value === ")";
}

export function getIntegerOption(
  options: readonly unknown[],
  fallback: number,
): number {
  const option = options[0];
  return typeof option === "number" && Number.isInteger(option) && option >= 0
    ? option
    : fallback;
}

export function isNestedBooleanNode(node: Node): boolean {
  const parent = node.parent;

  if (!parent) {
    return false;
  }

  return (
    parent.type === "LogicalExpression" ||
    parent.type === "ConditionalExpression" ||
    (parent.type === "UnaryExpression" && parent.operator === "!")
  );
}

export const integerOptionSchema = [
  {
    type: "integer",
    minimum: 0,
  },
] as const;
