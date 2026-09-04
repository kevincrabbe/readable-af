import { createRule, isParenthesized } from "../ast.js";

export const noMixedAndOrWithoutParens = createRule({
  name: "no-mixed-and-or-without-parens",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require explicit parentheses when mixing && and || operators.",
    },
    schema: [],
    messages: {
      mixed:
        "Wrap the '{{child}}' expression in parentheses when it is mixed with '{{parent}}'.",
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      LogicalExpression(node) {
        if (node.operator !== "&&" && node.operator !== "||") {
          return;
        }

        for (const child of [node.left, node.right]) {
          if (
            child.type === "LogicalExpression" &&
            (child.operator === "&&" || child.operator === "||") &&
            child.operator !== node.operator &&
            !isParenthesized(sourceCode, child)
          ) {
            context.report({
              node: child,
              messageId: "mixed",
              data: { child: child.operator, parent: node.operator },
            });
          }
        }
      },
    };
  },
});

export const noBooleanTernary = createRule({
  name: "no-boolean-ternary",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow ternaries that merely convert a condition to true or false.",
    },
    schema: [],
    messages: {
      redundant:
        "This ternary only produces boolean literals. Use the condition directly or negate it explicitly.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      ConditionalExpression(node) {
        const consequentIsBoolean =
          node.consequent.type === "Literal" &&
          typeof node.consequent.value === "boolean";
        const alternateIsBoolean =
          node.alternate.type === "Literal" &&
          typeof node.alternate.value === "boolean";

        if (consequentIsBoolean && alternateIsBoolean) {
          context.report({ node, messageId: "redundant" });
        }
      },
    };
  },
});
