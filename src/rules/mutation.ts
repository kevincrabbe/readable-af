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

function walk(
  node: Node,
  visitorKeys: VisitorKeys,
  visit: (child: Node) => boolean | void,
): void {
  if (visit(node) === false) {
    return;
  }

  for (const key of visitorKeys[node.type] ?? []) {
    const value = (node as unknown as Record<string, unknown>)[key];

    if (Array.isArray(value)) {
      for (const child of value) {
        if (isNode(child)) {
          walk(child, visitorKeys, visit);
        }
      }
    } else if (isNode(value)) {
      walk(value, visitorKeys, visit);
    }
  }
}

function isFunctionNode(node: Node): node is FunctionNode {
  return (
    node.type === "ArrowFunctionExpression" ||
    node.type === "FunctionDeclaration" ||
    node.type === "FunctionExpression"
  );
}

function singleStatement(statement: TSESTree.Statement): TSESTree.Statement | null {
  if (statement.type !== "BlockStatement") {
    return statement;
  }

  return statement.body.length === 1 ? statement.body[0] ?? null : null;
}

function branchEffect(
  statement: TSESTree.Statement,
  getText: (node: Node) => string,
): string | undefined {
  if (statement.type === "BlockStatement" && statement.body.length === 0) {
    return "empty";
  }

  const single = singleStatement(statement);
  if (!single) {
    return undefined;
  }

  switch (single.type) {
    case "ReturnStatement":
      return `return:${single.argument ? getText(single.argument) : "void"}`;
    case "ThrowStatement":
      return `throw:${getText(single.argument)}`;
    case "ExpressionStatement":
      if (
        single.expression.type === "AssignmentExpression" ||
        single.expression.type === "UpdateExpression" ||
        single.expression.type === "CallExpression"
      ) {
        return `effect:${getText(single.expression)}`;
      }
      return undefined;
    default:
      return undefined;
  }
}

function nextStatement(node: TSESTree.IfStatement): TSESTree.Statement | undefined {
  const parent = node.parent;
  if (parent.type !== "Program" && parent.type !== "BlockStatement") {
    return undefined;
  }

  const index = parent.body.indexOf(node);
  const next = parent.body[index + 1];
  return next?.type === "ImportDeclaration" ||
    next?.type === "ExportAllDeclaration" ||
    next?.type === "ExportNamedDeclaration" ||
    next?.type === "ExportDefaultDeclaration"
    ? undefined
    : next;
}

export const requireDistinctBranchEffects = createRule({
  name: "require-distinct-branch-effects",
  meta: {
    type: "problem",
    docs: {
      description:
        "Require conditional branches to produce observably distinct effects.",
    },
    schema: [],
    messages: {
      empty: "This conditional branch is empty and can be mutated away unnoticed.",
      identical:
        "Both paths produce the same '{{effect}}' effect. Remove the meaningless condition.",
    },
  },
  defaultOptions: [],
  create(context) {
    const getText = (node: Node): string => context.sourceCode.getText(node);

    return {
      IfStatement(node) {
        const consequentEffect = branchEffect(node.consequent, getText);
        if (consequentEffect === "empty") {
          context.report({ node: node.consequent, messageId: "empty" });
        }

        if (node.alternate) {
          const alternateEffect = branchEffect(node.alternate, getText);
          if (alternateEffect === "empty") {
            context.report({ node: node.alternate, messageId: "empty" });
          }
          if (
            consequentEffect !== undefined &&
            consequentEffect !== "empty" &&
            consequentEffect === alternateEffect
          ) {
            context.report({
              node,
              messageId: "identical",
              data: { effect: consequentEffect },
            });
          }
          return;
        }

        const following = nextStatement(node);
        const followingEffect = following
          ? branchEffect(following, getText)
          : undefined;
        if (
          consequentEffect !== undefined &&
          consequentEffect !== "empty" &&
          consequentEffect === followingEffect
        ) {
          context.report({
            node,
            messageId: "identical",
            data: { effect: consequentEffect },
          });
        }
      },
    };
  },
});

const ERROR_HANDLER_NAME = /(?:handle|report|capture|notify|logError|onError)/iu;
const INTENTIONAL_SUPPRESSION = /intentionally\s+(?:ignored|swallowed|suppressed)/iu;

function callName(node: TSESTree.CallExpression): string | undefined {
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

function isObservableCatchReturn(node: TSESTree.ReturnStatement): boolean {
  const argument = node.argument;
  if (argument === null) {
    return false;
  }
  if (argument.type === "Identifier") {
    return argument.name !== "undefined";
  }
  if (argument.type === "Literal") {
    return argument.value !== null;
  }
  return argument.type !== "UnaryExpression" || argument.operator !== "void";
}

export const noSwallowedErrors = createRule({
  name: "no-swallowed-errors",
  meta: {
    type: "problem",
    docs: {
      description:
        "Require catch blocks to rethrow, return a fallback, report the error, or document intentional suppression.",
    },
    schema: [],
    messages: {
      swallowed:
        "This catch block swallows an error. Rethrow, return a fallback, call an error handler, or add an intentional-suppression comment.",
    },
  },
  defaultOptions: [],
  create(context) {
    const visitorKeys = context.sourceCode.visitorKeys as VisitorKeys;

    return {
      CatchClause(node) {
        const documented = context.sourceCode
          .getCommentsInside(node.body)
          .some((comment) => INTENTIONAL_SUPPRESSION.test(comment.value));
        let handled = documented;

        for (const statement of node.body.body) {
          walk(statement, visitorKeys, (child) => {
            if (isFunctionNode(child)) {
              return false;
            }
            if (
              child.type === "ThrowStatement" ||
              (child.type === "ReturnStatement" && isObservableCatchReturn(child))
            ) {
              handled = true;
            }
            if (
              child.type === "CallExpression" &&
              ERROR_HANDLER_NAME.test(callName(child) ?? "")
            ) {
              handled = true;
            }
          });
        }

        if (!handled) {
          context.report({ node, messageId: "swallowed" });
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

function isBooleanParameter(parameter: TSESTree.Parameter): boolean {
  const identifier = identifierParameter(parameter);
  if (
    identifier?.typeAnnotation?.typeAnnotation.type === "TSBooleanKeyword"
  ) {
    return true;
  }

  return (
    parameter.type === "AssignmentPattern" &&
    parameter.right.type === "Literal" &&
    typeof parameter.right.value === "boolean"
  );
}

function containsIdentifier(
  node: Node,
  names: ReadonlySet<string>,
  visitorKeys: VisitorKeys,
): string | undefined {
  let found: string | undefined;
  walk(node, visitorKeys, (child) => {
    if (child.type === "Identifier" && names.has(child.name)) {
      found = child.name;
      return false;
    }
  });
  return found;
}

interface BooleanParameterFrame {
  names: Set<string>;
}

export const noBooleanParameterBranching = createRule({
  name: "no-boolean-parameter-branching",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow branching directly on boolean parameters that create multiple function modes.",
    },
    schema: [],
    messages: {
      branching:
        "Boolean parameter '{{name}}' controls branching. Prefer separate functions or an explicit domain option.",
    },
  },
  defaultOptions: [],
  create(context) {
    const visitorKeys = context.sourceCode.visitorKeys as VisitorKeys;
    const frames: BooleanParameterFrame[] = [];

    function enter(node: FunctionNode): void {
      const names = new Set<string>();
      for (const parameter of node.params) {
        if (isBooleanParameter(parameter)) {
          const identifier = identifierParameter(parameter);
          if (identifier) {
            names.add(identifier.name);
          }
        }
      }
      frames.push({ names });
    }

    function exit(): void {
      frames.pop();
    }

    function check(node: Node): void {
      const frame = frames.at(-1);
      if (!frame || frame.names.size === 0) {
        return;
      }
      const name = containsIdentifier(node, frame.names, visitorKeys);
      if (name) {
        context.report({
          node,
          messageId: "branching",
          data: { name },
        });
      }
    }

    return {
      ArrowFunctionExpression: enter,
      "ArrowFunctionExpression:exit": exit,
      FunctionDeclaration: enter,
      "FunctionDeclaration:exit": exit,
      FunctionExpression: enter,
      "FunctionExpression:exit": exit,
      IfStatement: (node) => check(node.test),
      ConditionalExpression: (node) => check(node.test),
      WhileStatement: (node) => check(node.test),
      DoWhileStatement: (node) => check(node.test),
      ForStatement(node) {
        if (node.test) {
          check(node.test);
        }
      },
      SwitchStatement: (node) => check(node.discriminant),
    };
  },
});

function baseObjectName(node: Node): string | undefined {
  let current = node;
  while (current.type === "MemberExpression") {
    current = current.object;
  }
  return current.type === "Identifier" ? current.name : undefined;
}

interface SideEffectFrame {
  functionNode: FunctionNode;
  parameterNames: Set<string>;
  mutations: Node[];
  returnsValue: boolean;
}

export const noUnobservableSideEffect = createRule({
  name: "no-unobservable-side-effect",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow void functions that mutate parameters without returning an observable result.",
    },
    schema: [],
    messages: {
      mutation:
        "Function mutates parameter '{{names}}' without returning a value. Prefer an immutable result that tests can observe.",
    },
  },
  defaultOptions: [],
  create(context) {
    const frames: SideEffectFrame[] = [];

    function enter(functionNode: FunctionNode): void {
      const parameterNames = new Set<string>();
      for (const parameter of functionNode.params) {
        const identifier = identifierParameter(parameter);
        if (identifier) {
          parameterNames.add(identifier.name);
        }
      }
      frames.push({
        functionNode,
        parameterNames,
        mutations: [],
        returnsValue: functionNode.body.type !== "BlockStatement",
      });
    }

    function exit(): void {
      const frame = frames.pop();
      if (!frame || frame.returnsValue || frame.mutations.length === 0) {
        return;
      }
      const names = [
        ...new Set(
          frame.mutations
            .map(baseObjectName)
            .filter((name): name is string => name !== undefined),
        ),
      ];
      context.report({
        node: frame.functionNode,
        messageId: "mutation",
        data: { names: names.join(", ") },
      });
    }

    function recordMutation(node: Node, target: Node): void {
      const frame = frames.at(-1);
      if (
        frame &&
        target.type === "MemberExpression" &&
        frame.parameterNames.has(baseObjectName(target) ?? "")
      ) {
        frame.mutations.push(node);
      }
    }

    return {
      ArrowFunctionExpression: enter,
      "ArrowFunctionExpression:exit": exit,
      FunctionDeclaration: enter,
      "FunctionDeclaration:exit": exit,
      FunctionExpression: enter,
      "FunctionExpression:exit": exit,
      AssignmentExpression: (node) => recordMutation(node, node.left),
      UpdateExpression: (node) => recordMutation(node, node.argument),
      ReturnStatement(node) {
        const frame = frames.at(-1);
        if (frame && node.argument) {
          frame.returnsValue = true;
        }
      },
    };
  },
});

type ComparisonOperator = ">" | ">=" | "<" | "<=";

interface Comparison {
  subject: string;
  operator: ComparisonOperator;
  boundary: number;
  node: TSESTree.BinaryExpression;
}

function invertComparison(operator: ComparisonOperator): ComparisonOperator {
  return ({ ">": "<", ">=": "<=", "<": ">", "<=": ">=" } as const)[
    operator
  ];
}

function comparison(
  node: Node,
  getText: (node: Node) => string,
): Comparison | undefined {
  if (
    node.type !== "BinaryExpression" ||
    ![">", ">=", "<", "<="].includes(node.operator)
  ) {
    return undefined;
  }
  const operator = node.operator as ComparisonOperator;

  if (node.right.type === "Literal" && typeof node.right.value === "number") {
    return {
      subject: getText(node.left),
      operator,
      boundary: node.right.value,
      node,
    };
  }
  if (node.left.type === "Literal" && typeof node.left.value === "number") {
    return {
      subject: getText(node.right),
      operator: invertComparison(operator),
      boundary: node.left.value,
      node,
    };
  }
  return undefined;
}

export const noAmbiguousBoundaryChecks = createRule({
  name: "no-ambiguous-boundary-checks",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require named constants for numeric inequality boundaries.",
    },
    schema: [],
    messages: {
      boundary:
        "Replace the naked boundary '{{value}}' with a named domain constant.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      BinaryExpression(node) {
        const parsed = comparison(node, (child) => context.sourceCode.getText(child));
        if (parsed) {
          context.report({
            node,
            messageId: "boundary",
            data: { value: String(parsed.boundary) },
          });
        }
      },
    };
  },
});

function implies(left: Comparison, right: Comparison): boolean {
  if (left.subject !== right.subject) {
    return false;
  }
  const leftGreater = left.operator === ">" || left.operator === ">=";
  const rightGreater = right.operator === ">" || right.operator === ">=";
  if (leftGreater !== rightGreater) {
    return false;
  }

  if (leftGreater) {
    if (left.boundary > right.boundary) {
      return true;
    }
    if (left.boundary < right.boundary) {
      return false;
    }
  } else {
    if (left.boundary < right.boundary) {
      return true;
    }
    if (left.boundary > right.boundary) {
      return false;
    }
  }

  return left.operator === ">" || left.operator === "<" || left.operator === right.operator;
}

export const noRedundantCondition = createRule({
  name: "no-redundant-condition",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow duplicate and subsumed clauses in the same logical expression.",
    },
    schema: [],
    messages: {
      redundant: "This condition is redundant because another clause subsumes it.",
    },
  },
  defaultOptions: [],
  create(context) {
    const getText = (node: Node): string => context.sourceCode.getText(node);

    return {
      LogicalExpression(node) {
        if (node.operator !== "&&" && node.operator !== "||") {
          return;
        }
        if (getText(node.left) === getText(node.right)) {
          context.report({ node: node.right, messageId: "redundant" });
          return;
        }

        const left = comparison(node.left, getText);
        const right = comparison(node.right, getText);
        if (!left || !right) {
          return;
        }

        if (implies(left, right)) {
          context.report({
            node: node.operator === "&&" ? right.node : left.node,
            messageId: "redundant",
          });
        } else if (implies(right, left)) {
          context.report({
            node: node.operator === "&&" ? left.node : right.node,
            messageId: "redundant",
          });
        }
      },
    };
  },
});

function isNakedFallback(node: Node): boolean {
  return (
    node.type === "Literal" ||
    (node.type === "TemplateLiteral" && node.expressions.length === 0)
  );
}

export const noNakedDefaultFallback = createRule({
  name: "no-naked-default-fallback",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require domain fallbacks used with ?? or || to have semantic names.",
    },
    schema: [],
    messages: {
      fallback:
        "Replace this naked fallback with a named constant that explains its domain meaning.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      LogicalExpression(node) {
        if ((node.operator === "??" || node.operator === "||") && isNakedFallback(node.right)) {
          context.report({ node: node.right, messageId: "fallback" });
        }
      },
    };
  },
});

export const noGenericErrorContract = createRule({
  name: "no-generic-error-contract",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require domain-specific error classes instead of the generic Error constructor.",
    },
    schema: [],
    messages: {
      generic:
        "Throw a domain-specific error class so callers and tests can assert the failure contract.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      ThrowStatement(node) {
        if (
          (node.argument.type === "NewExpression" ||
            node.argument.type === "CallExpression") &&
          node.argument.callee.type === "Identifier" &&
          node.argument.callee.name === "Error"
        ) {
          context.report({ node, messageId: "generic" });
        }
      },
    };
  },
});

const MUTATING_BINARY_OPERATORS = new Set([
  "+",
  "-",
  "*",
  "/",
  "%",
  "**",
  "<",
  "<=",
  ">",
  ">=",
]);

function mutationDensity(
  functionNode: FunctionNode,
  visitorKeys: VisitorKeys,
): number {
  let score = 0;
  walk(functionNode.body, visitorKeys, (node) => {
    if (isFunctionNode(node)) {
      return false;
    }
    if (node.type === "LogicalExpression") {
      score += 1;
    } else if (node.type === "UnaryExpression" && node.operator === "!") {
      score += 1;
    } else if (
      node.type === "BinaryExpression" &&
      MUTATING_BINARY_OPERATORS.has(node.operator)
    ) {
      score += 1;
    } else if (node.type === "ConditionalExpression") {
      score += 2;
    } else if (node.type === "IfStatement") {
      score += 1;
    } else if (node.type === "CatchClause") {
      score += 2;
    } else if (node.type === "Literal" && typeof node.value === "boolean") {
      score += 1;
    }
  });
  return score;
}

export const noHighMutationDensity = createRule({
  name: "no-high-mutation-density",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Limit mutation-sensitive operations within a single function.",
    },
    schema: integerOptionSchema,
    messages: {
      dense:
        "Function contains {{score}} mutation-sensitive operations (maximum {{maximum}}). Decompose its business rules into independently testable predicates.",
    },
  },
  defaultOptions: [8],
  create(context, options) {
    const maximum = getIntegerOption(options, 8);
    const visitorKeys = context.sourceCode.visitorKeys as VisitorKeys;

    function check(node: FunctionNode): void {
      const score = mutationDensity(node, visitorKeys);
      if (score > maximum) {
        context.report({
          node,
          messageId: "dense",
          data: { score: String(score), maximum: String(maximum) },
        });
      }
    }

    return {
      ArrowFunctionExpression: check,
      FunctionDeclaration: check,
      FunctionExpression: check,
    };
  },
});
