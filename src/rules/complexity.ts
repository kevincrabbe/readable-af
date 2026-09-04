import type { TSESTree } from "@typescript-eslint/utils";

import {
  countLogicalOperands,
  createRule,
  getIntegerOption,
  integerOptionSchema,
  isBooleanStructure,
  isNestedBooleanNode,
  scoreBooleanExpression,
  type Node,
} from "../ast.js";

export const maxBooleanComplexity = createRule({
  name: "max-boolean-complexity",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Limit the cognitive weight of a single boolean expression.",
      recommended: true,
    },
    schema: integerOptionSchema,
    messages: {
      tooComplex:
        "Boolean expression complexity is {{score}} (maximum {{maximum}}). Extract meaningful intermediate boolean variables.",
    },
  },
  defaultOptions: [5],
  create(context, options) {
    const maximum = getIntegerOption(options, 5);

    function check(node: Node): void {
      if (isNestedBooleanNode(node)) {
        return;
      }

      const score = scoreBooleanExpression(node);
      if (score > maximum) {
        context.report({
          node,
          messageId: "tooComplex",
          data: { score: String(score), maximum: String(maximum) },
        });
      }
    }

    return {
      LogicalExpression: check,
      ConditionalExpression: check,
      UnaryExpression(node) {
        if (node.operator === "!") {
          check(node);
        }
      },
    };
  },
});

export const maxLogicalOperands = createRule({
  name: "max-logical-operands",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Limit how many predicates are combined in one logical expression.",
      recommended: true,
    },
    schema: integerOptionSchema,
    messages: {
      tooMany:
        "This logical expression combines {{count}} predicates (maximum {{maximum}}). Extract a semantically named boolean.",
    },
  },
  defaultOptions: [3],
  create(context, options) {
    const maximum = getIntegerOption(options, 3);

    return {
      LogicalExpression(node) {
        if (node.parent.type === "LogicalExpression") {
          return;
        }

        const count = countLogicalOperands(node);
        if (count > maximum) {
          context.report({
            node,
            messageId: "tooMany",
            data: { count: String(count), maximum: String(maximum) },
          });
        }
      },
    };
  },
});

export const noComplexBooleanReturn = createRule({
  name: "no-complex-boolean-return",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require complex returned predicates to be given a semantic name.",
    },
    schema: integerOptionSchema,
    messages: {
      complexReturn:
        "Returned boolean complexity is {{score}} (maximum {{maximum}}). Name the predicate before returning it.",
    },
  },
  defaultOptions: [3],
  create(context, options) {
    const maximum = getIntegerOption(options, 3);

    function check(node: Node, expression: Node | null): void {
      if (!expression || !isBooleanStructure(expression)) {
        return;
      }

      const score = scoreBooleanExpression(expression);
      if (score > maximum) {
        context.report({
          node,
          messageId: "complexReturn",
          data: { score: String(score), maximum: String(maximum) },
        });
      }
    }

    return {
      ReturnStatement(node) {
        check(node, node.argument);
      },
      ArrowFunctionExpression(node) {
        if (node.body.type !== "BlockStatement") {
          check(node.body, node.body);
        }
      },
    };
  },
});

export const preferNamedBooleanExpression = createRule({
  name: "prefer-named-boolean-expression",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require complex control-flow conditions to be extracted into named predicates.",
    },
    schema: integerOptionSchema,
    messages: {
      preferName:
        "Condition complexity is {{score}} (maximum {{maximum}}). Extract it into a semantically named boolean.",
    },
  },
  defaultOptions: [3],
  create(context, options) {
    const maximum = getIntegerOption(options, 3);

    function check(expression: Node): void {
      if (!isBooleanStructure(expression)) {
        return;
      }

      const score = scoreBooleanExpression(expression);
      if (score > maximum) {
        context.report({
          node: expression,
          messageId: "preferName",
          data: { score: String(score), maximum: String(maximum) },
        });
      }
    }

    return {
      IfStatement: (node) => check(node.test),
      WhileStatement: (node) => check(node.test),
      DoWhileStatement: (node) => check(node.test),
      ForStatement(node) {
        if (node.test) {
          check(node.test);
        }
      },
      ConditionalExpression: (node) => check(node.test),
    };
  },
});

export const preferSemanticBoolean = createRule({
  name: "prefer-semantic-boolean",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require complex inline predicates to be extracted into semantic boolean variables.",
    },
    schema: integerOptionSchema,
    messages: {
      preferSemantic:
        "Inline predicate complexity is {{score}} (maximum {{maximum}}). Extract semantic boolean variables.",
    },
  },
  defaultOptions: [3],
  create(context, options) {
    const maximum = getIntegerOption(options, 3);

    function check(expression: Node | null): void {
      if (!expression || !isBooleanStructure(expression)) {
        return;
      }

      const score = scoreBooleanExpression(expression);
      if (score > maximum) {
        context.report({
          node: expression,
          messageId: "preferSemantic",
          data: { score: String(score), maximum: String(maximum) },
        });
      }
    }

    return {
      IfStatement: (node) => check(node.test),
      WhileStatement: (node) => check(node.test),
      DoWhileStatement: (node) => check(node.test),
      ForStatement: (node) => check(node.test),
      ReturnStatement: (node) => check(node.argument),
      CallExpression(node) {
        for (const argument of node.arguments) {
          if (argument.type !== "SpreadElement") {
            check(argument);
          }
        }
      },
    };
  },
});

export const noComplexJsxCondition = createRule({
  name: "no-complex-jsx-condition",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prevent dense short-circuit and ternary expressions in JSX.",
    },
    schema: integerOptionSchema,
    messages: {
      complexJsx:
        "JSX condition complexity is {{score}} (maximum {{maximum}}). Move it into a named value before rendering.",
    },
  },
  defaultOptions: [3],
  create(context, options) {
    const maximum = getIntegerOption(options, 3);

    return {
      JSXExpressionContainer(node) {
        if (
          node.expression.type === "JSXEmptyExpression" ||
          !isBooleanStructure(node.expression)
        ) {
          return;
        }

        const score = scoreBooleanExpression(node.expression);
        if (score > maximum) {
          context.report({
            node: node.expression as TSESTree.Expression,
            messageId: "complexJsx",
            data: { score: String(score), maximum: String(maximum) },
          });
        }
      },
    };
  },
});
