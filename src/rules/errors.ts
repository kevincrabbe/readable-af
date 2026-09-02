import type { TSESTree } from "@typescript-eslint/utils";

import {
  createRule,
  getIntegerOption,
  integerOptionSchema,
  type Node,
} from "../ast.js";

type VisitorKeys = Readonly<Record<string, readonly string[] | undefined>>;
type FunctionNode =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression;

function isNode(value: unknown): value is Node {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof value.type === "string"
  );
}

function isFunctionNode(node: Node): node is FunctionNode {
  return (
    node.type === "ArrowFunctionExpression" ||
    node.type === "FunctionDeclaration" ||
    node.type === "FunctionExpression"
  );
}

function children(node: Node, visitorKeys: VisitorKeys): Node[] {
  const result: Node[] = [];
  for (const key of visitorKeys[node.type] ?? []) {
    const value = (node as unknown as Record<string, unknown>)[key];
    if (Array.isArray(value)) {
      result.push(...value.filter(isNode));
    } else if (isNode(value)) {
      result.push(value);
    }
  }
  return result;
}

function walk(
  node: Node,
  visitorKeys: VisitorKeys,
  visit: (child: Node) => boolean | void,
): void {
  if (visit(node) === false) {
    return;
  }
  for (const child of children(node, visitorKeys)) {
    walk(child, visitorKeys, visit);
  }
}

function containsIdentifier(
  node: Node,
  name: string,
  visitorKeys: VisitorKeys,
): boolean {
  let found = false;
  walk(node, visitorKeys, (child) => {
    if (child.type === "Identifier" && child.name === name) {
      found = true;
      return false;
    }
  });
  return found;
}

function catchParameterName(node: TSESTree.CatchClause): string | undefined {
  return node.param?.type === "Identifier" ? node.param.name : undefined;
}

function isErrorConstruction(
  node: Node,
): node is TSESTree.CallExpression | TSESTree.NewExpression {
  return (
    (node.type === "CallExpression" || node.type === "NewExpression") &&
    node.callee.type === "Identifier" &&
    /Error$/u.test(node.callee.name)
  );
}

function hasCause(
  construction: TSESTree.CallExpression | TSESTree.NewExpression,
  caughtName: string,
  visitorKeys: VisitorKeys,
): boolean {
  return construction.arguments.some((argument) => {
    if (argument.type !== "ObjectExpression") {
      return false;
    }
    return argument.properties.some((property) => {
      if (property.type !== "Property") {
        return false;
      }
      const isCause =
        (property.key.type === "Identifier" && property.key.name === "cause") ||
        (property.key.type === "Literal" && property.key.value === "cause");
      return (
        isCause && containsIdentifier(property.value, caughtName, visitorKeys)
      );
    });
  });
}

export const requireCauseWhenRethrowing = createRule({
  name: "require-cause-when-rethrowing",
  meta: {
    type: "problem",
    docs: {
      description:
        "Require errors created in a catch block to preserve the caught value as cause.",
    },
    schema: [],
    messages: {
      missingCause:
        "Wrapped error must preserve '{{name}}' with an options object containing { cause: {{name}} }.",
    },
  },
  defaultOptions: [],
  create(context) {
    const visitorKeys = context.sourceCode.visitorKeys as VisitorKeys;

    return {
      CatchClause(node) {
        const caughtName = catchParameterName(node);
        if (!caughtName) {
          return;
        }
        for (const statement of node.body.body) {
          walk(statement, visitorKeys, (child) => {
            if (isFunctionNode(child)) {
              return false;
            }
            if (
              child.type === "ThrowStatement" &&
              isErrorConstruction(child.argument) &&
              !hasCause(child.argument, caughtName, visitorKeys)
            ) {
              context.report({
                node: child,
                messageId: "missingCause",
                data: { name: caughtName },
              });
            }
          });
        }
      },
    };
  },
});

function calledName(node: TSESTree.CallExpression): string | undefined {
  if (node.callee.type === "Identifier") {
    return node.callee.name;
  }
  if (
    node.callee.type === "MemberExpression" &&
    !node.callee.computed &&
    node.callee.property.type === "Identifier"
  ) {
    return node.callee.property.name;
  }
  return undefined;
}

const LOG_OR_REPORT = /(?:log|error|warn|report|capture|notify)/iu;

export const noLogAndRethrow = createRule({
  name: "no-log-and-rethrow",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow reporting an error in a catch block and then throwing from the same block.",
    },
    schema: [],
    messages: {
      duplicate:
        "Catch block both reports and rethrows the error, which commonly creates duplicate logs. Handle it or propagate it, not both.",
    },
  },
  defaultOptions: [],
  create(context) {
    const visitorKeys = context.sourceCode.visitorKeys as VisitorKeys;

    return {
      CatchClause(node) {
        let reports = false;
        let throws = false;
        for (const statement of node.body.body) {
          walk(statement, visitorKeys, (child) => {
            if (isFunctionNode(child)) {
              return false;
            }
            if (child.type === "ThrowStatement") {
              throws = true;
            }
            if (
              child.type === "CallExpression" &&
              LOG_OR_REPORT.test(calledName(child) ?? "")
            ) {
              reports = true;
            }
          });
        }
        if (reports && throws) {
          context.report({ node, messageId: "duplicate" });
        }
      },
    };
  },
});

function unwrapAccessObject(node: Node): Node {
  let current = node;
  while (
    current.type === "ChainExpression" ||
    current.type === "TSAsExpression" ||
    current.type === "TSNonNullExpression" ||
    current.type === "TSTypeAssertion"
  ) {
    current = current.expression;
  }
  return current;
}

function isIdentifierNamed(node: Node, name: string): boolean {
  return node.type === "Identifier" && node.name === name;
}

function narrowsCaughtValue(test: Node, caughtName: string): boolean {
  if (
    test.type === "BinaryExpression" &&
    test.operator === "instanceof" &&
    isIdentifierNamed(test.left, caughtName) &&
    isIdentifierNamed(test.right, "Error")
  ) {
    return true;
  }
  return (
    test.type === "CallExpression" &&
    test.callee.type === "Identifier" &&
    /^is.*Error$/u.test(test.callee.name) &&
    test.arguments.some((argument) => isIdentifierNamed(argument, caughtName))
  );
}

export const safeCatchErrorAccess = createRule({
  name: "safe-catch-error-access",
  meta: {
    type: "problem",
    docs: {
      description:
        "Require caught values to be narrowed or normalized before property access.",
    },
    schema: [],
    messages: {
      unsafe:
        "Narrow '{{name}}' with instanceof Error or normalize it before accessing properties.",
    },
  },
  defaultOptions: [],
  create(context) {
    const visitorKeys = context.sourceCode.visitorKeys as VisitorKeys;

    return {
      CatchClause(node) {
        const caughtName = catchParameterName(node);
        if (!caughtName) {
          return;
        }
        const safeCaughtName = caughtName;

        function inspect(current: Node, narrowed: boolean): void {
          if (isFunctionNode(current)) {
            return;
          }
          if (current.type === "IfStatement") {
            inspect(current.test, narrowed);
            inspect(
              current.consequent,
              narrowed || narrowsCaughtValue(current.test, safeCaughtName),
            );
            if (current.alternate) {
              inspect(current.alternate, narrowed);
            }
            return;
          }
          const accessObject =
            current.type === "MemberExpression"
              ? unwrapAccessObject(current.object)
              : undefined;
          if (
            current.type === "MemberExpression" &&
            !narrowed &&
            accessObject?.type === "Identifier" &&
            accessObject.name === safeCaughtName
          ) {
            context.report({
              node: current,
              messageId: "unsafe",
              data: { name: safeCaughtName },
            });
          }
          for (const child of children(current, visitorKeys)) {
            inspect(child, narrowed);
          }
        }

        for (const statement of node.body.body) {
          inspect(statement, false);
        }
      },
    };
  },
});

const GENERIC_MESSAGES = new Set([
  "",
  "error",
  "failed",
  "failure",
  "invalid",
  "oops",
  "something went wrong",
  "unknown error",
]);

function messageArgument(
  construction: TSESTree.CallExpression | TSESTree.NewExpression,
): TSESTree.CallExpressionArgument | undefined {
  return construction.arguments[0];
}

function isContextlessMessage(node: Node | undefined): boolean {
  if (!node) {
    return true;
  }
  if (node.type === "Literal" && typeof node.value === "string") {
    return GENERIC_MESSAGES.has(node.value.trim().toLowerCase());
  }
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
    return GENERIC_MESSAGES.has(
      (node.quasis[0]?.value.cooked ?? "").trim().toLowerCase(),
    );
  }
  return (
    node.type === "MemberExpression" &&
    !node.computed &&
    node.property.type === "Identifier" &&
    node.property.name === "message"
  );
}

export const requireContextualErrorMessage = createRule({
  name: "require-contextual-error-message",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require thrown errors to have a useful contextual message.",
    },
    schema: [],
    messages: {
      context:
        "Error message is empty, generic, or merely repeats another error message. Add operation-specific context.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      ThrowStatement(node) {
        if (
          isErrorConstruction(node.argument) &&
          isContextlessMessage(messageArgument(node.argument))
        ) {
          context.report({ node, messageId: "context" });
        }
      },
    };
  },
});

function identifierParameter(
  parameter: TSESTree.Parameter,
): TSESTree.Identifier | undefined {
  if (parameter.type === "Identifier") {
    return parameter;
  }
  if (parameter.type === "AssignmentPattern" && parameter.left.type === "Identifier") {
    return parameter.left;
  }
  if (parameter.type === "TSParameterProperty") {
    return identifierParameter(parameter.parameter);
  }
  return undefined;
}

interface IdentifierFrame {
  identifiers: Set<string>;
}

export const requireErrorMessageIdentifiers = createRule({
  name: "require-error-message-identifiers",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require errors thrown by functions with identifier parameters to include one of those identifiers.",
    },
    schema: [],
    messages: {
      identifier:
        "Include one of the relevant identifiers ({{names}}) in the error construction for observability.",
    },
  },
  defaultOptions: [],
  create(context) {
    const visitorKeys = context.sourceCode.visitorKeys as VisitorKeys;
    const frames: IdentifierFrame[] = [];

    function enter(node: FunctionNode): void {
      const identifiers = new Set<string>();
      for (const parameter of node.params) {
        const identifier = identifierParameter(parameter);
        if (identifier && /(?:Id|ID)$/u.test(identifier.name)) {
          identifiers.add(identifier.name);
        }
      }
      frames.push({ identifiers });
    }

    function exit(): void {
      frames.pop();
    }

    return {
      ArrowFunctionExpression: enter,
      "ArrowFunctionExpression:exit": exit,
      FunctionDeclaration: enter,
      "FunctionDeclaration:exit": exit,
      FunctionExpression: enter,
      "FunctionExpression:exit": exit,
      ThrowStatement(node) {
        const frame = frames.at(-1);
        if (
          !frame ||
          frame.identifiers.size === 0 ||
          !isErrorConstruction(node.argument)
        ) {
          return;
        }
        const construction = node.argument;
        const includesIdentifier = [...frame.identifiers].some((name) =>
          construction.arguments.some(
            (argument) =>
              argument.type !== "SpreadElement" &&
              containsIdentifier(argument, name, visitorKeys),
          ),
        );
        if (!includesIdentifier) {
          context.report({
            node,
            messageId: "identifier",
            data: { names: [...frame.identifiers].join(", ") },
          });
        }
      },
    };
  },
});

export const maxTryBlockStatements = createRule({
  name: "max-try-block-statements",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Limit try blocks so each catch protects a focused operation.",
    },
    schema: integerOptionSchema,
    messages: {
      tooLarge:
        "Try block contains {{count}} statements (maximum {{maximum}}). Extract unrelated work so the catch protects one focused operation.",
    },
  },
  defaultOptions: [5],
  create(context, options) {
    const maximum = getIntegerOption(options, 5);

    return {
      TryStatement(node) {
        const count = node.block.body.length;
        if (count > maximum) {
          context.report({
            node: node.block,
            messageId: "tooLarge",
            data: { count: String(count), maximum: String(maximum) },
          });
        }
      },
    };
  },
});
