import {
  containsNegation,
  createRule,
  getExpressionName,
  isBooleanLike,
  isNegativeBooleanName,
  isNegatedNegativeName,
  unwrapExpression,
  type Node,
} from "../ast.js";

export const noNestedNegation = createRule({
  name: "no-nested-negation",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow boolean expressions that require reasoning through nested negations.",
    },
    schema: [],
    messages: {
      nested:
        "Avoid nested negation. Rewrite the expression in positive terms or name the intermediate predicate.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      UnaryExpression(node) {
        if (node.operator === "!" && containsNegation(node.argument)) {
          context.report({ node, messageId: "nested" });
        }
      },
    };
  },
});

export const preferPositiveBooleanNames = createRule({
  name: "prefer-positive-boolean-names",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer positive names for variables that hold boolean expressions.",
    },
    schema: [],
    messages: {
      negativeName:
        "Boolean name '{{name}}' is phrased negatively. Prefer a positive name that is easier to compose.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      VariableDeclarator(node) {
        if (
          node.id.type === "Identifier" &&
          isNegativeBooleanName(node.id.name) &&
          isBooleanLike(node.init)
        ) {
          context.report({
            node: node.id,
            messageId: "negativeName",
            data: { name: node.id.name },
          });
        }
      },
    };
  },
});

function findNegatedNegativeNames(node: Node, matches: Node[]): void {
  const expression = unwrapExpression(node);

  if (isNegatedNegativeName(expression)) {
    matches.push(expression);
    return;
  }

  switch (expression.type) {
    case "LogicalExpression":
    case "BinaryExpression":
      findNegatedNegativeNames(expression.left, matches);
      findNegatedNegativeNames(expression.right, matches);
      break;
    case "ConditionalExpression":
      findNegatedNegativeNames(expression.test, matches);
      findNegatedNegativeNames(expression.consequent, matches);
      findNegatedNegativeNames(expression.alternate, matches);
      break;
    case "UnaryExpression":
    case "AwaitExpression":
    case "UpdateExpression":
      findNegatedNegativeNames(expression.argument, matches);
      break;
    case "SequenceExpression":
      for (const child of expression.expressions) {
        findNegatedNegativeNames(child, matches);
      }
      break;
  }
}

export const noNegativeBooleanCondition = createRule({
  name: "no-negative-boolean-condition",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow conditions that negate an already-negative boolean name.",
    },
    schema: [],
    messages: {
      doubleNegative:
        "Condition negates the negative boolean '{{name}}'. Use a positive predicate instead.",
    },
  },
  defaultOptions: [],
  create(context) {
    function check(test: Node | null): void {
      if (!test) {
        return;
      }

      const matches: Node[] = [];
      findNegatedNegativeNames(test, matches);

      for (const match of matches) {
        const expression = unwrapExpression(match);
        const argument =
          expression.type === "UnaryExpression" ? expression.argument : expression;
        context.report({
          node: match,
          messageId: "doubleNegative",
          data: { name: getExpressionName(argument) ?? "boolean" },
        });
      }
    }

    return {
      IfStatement: (node) => check(node.test),
      WhileStatement: (node) => check(node.test),
      DoWhileStatement: (node) => check(node.test),
      ForStatement: (node) => check(node.test),
      ConditionalExpression: (node) => check(node.test),
    };
  },
});

export const noDoubleNegativeBooleans = createRule({
  name: "no-double-negative-booleans",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow negating negatively named booleans and defining negative names with negation.",
      recommended: true,
    },
    schema: [],
    messages: {
      negatedName:
        "Negating '{{name}}' creates a double negative. Use a positive boolean name.",
      negativeDefinition:
        "'{{name}}' combines a negative name with a negated value. Store the positive predicate instead.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      UnaryExpression(node) {
        if (isNegatedNegativeName(node)) {
          context.report({
            node,
            messageId: "negatedName",
            data: { name: getExpressionName(node.argument) ?? "boolean" },
          });
        }
      },
      VariableDeclarator(node) {
        if (
          node.id.type === "Identifier" &&
          isNegativeBooleanName(node.id.name) &&
          node.init?.type === "UnaryExpression" &&
          node.init.operator === "!"
        ) {
          context.report({
            node: node.id,
            messageId: "negativeDefinition",
            data: { name: node.id.name },
          });
        }
      },
    };
  },
});
