import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, test } from "node:test";

import { ESLint } from "eslint";
import tseslint from "typescript-eslint";

import plugin from "../dist/index.js";

const docsDirectory = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "docs",
  "rules",
);

const ruleNames = Object.keys(plugin.rules);

function documentationPath(name) {
  return path.join(docsDirectory, `${name}.md`);
}

/**
 * Collects the fenced code blocks under the "Incorrect" and "Correct" headings
 * so the documented examples can be linted with the rule they illustrate.
 */
function extractExamples(markdown) {
  const examples = [];
  let expectation = null;
  let fence = null;

  for (const line of markdown.split("\n")) {
    if (fence) {
      if (line.trim() === "```") {
        examples.push({ expectation, code: fence.join("\n") });
        fence = null;
      } else {
        fence.push(line);
      }
      continue;
    }

    if (line.startsWith("#")) {
      if (line.startsWith("### ❌")) {
        expectation = "incorrect";
      } else if (line.startsWith("### ✅")) {
        expectation = "correct";
      } else {
        expectation = null;
      }
      continue;
    }

    if (expectation && line.startsWith("```")) {
      fence = [];
    }
  }

  return examples;
}

function lintWithSingleRule(name) {
  return new ESLint({
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ["**/*.tsx"],
        plugins: { "readable-af": plugin },
        languageOptions: {
          parser: tseslint.parser,
          parserOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            ecmaFeatures: { jsx: true },
          },
        },
        rules: { [`readable-af/${name}`]: "error" },
      },
    ],
  });
}

test("every rule has a documentation page", () => {
  const missing = ruleNames.filter((name) => !existsSync(documentationPath(name)));
  assert.deepEqual(missing, []);
});

test("every documentation page belongs to a rule", () => {
  const orphaned = readdirSync(docsDirectory)
    .filter((file) => file.endsWith(".md") && file !== "index.md")
    .map((file) => path.basename(file, ".md"))
    .filter((name) => !ruleNames.includes(name));
  assert.deepEqual(orphaned, []);
});

test("every rule links to its own documentation page", () => {
  for (const name of ruleNames) {
    assert.equal(
      plugin.rules[name].meta.docs.url,
      `https://github.com/kevincrabbe/readable-af/blob/main/docs/rules/${name}.md`,
    );
  }
});

test("the documentation index links every rule page", () => {
  const index = readFileSync(path.join(docsDirectory, "index.md"), "utf8");
  for (const name of ruleNames) {
    assert.ok(index.includes(`(./${name}.md)`), `index.md is missing ${name}`);
  }
});

describe("documented examples match rule behavior", () => {
  for (const name of ruleNames) {
    it(name, async () => {
      const examples = extractExamples(
        readFileSync(documentationPath(name), "utf8"),
      );
      const incorrect = examples.filter(
        (example) => example.expectation === "incorrect",
      );
      const correct = examples.filter(
        (example) => example.expectation === "correct",
      );

      assert.ok(incorrect.length > 0, `${name} documents no incorrect example`);
      assert.ok(correct.length > 0, `${name} documents no correct example`);

      const eslint = lintWithSingleRule(name);

      for (const example of examples) {
        const [result] = await eslint.lintText(example.code, {
          filePath: "example.tsx",
        });
        const reported = result.messages.filter(
          (message) => message.ruleId === `readable-af/${name}`,
        );

        assert.deepEqual(
          result.messages.filter((message) => message.fatal),
          [],
          `example does not parse:\n${example.code}`,
        );

        if (example.expectation === "incorrect") {
          assert.ok(
            reported.length > 0,
            `documented violation is not reported:\n${example.code}`,
          );
        } else {
          assert.deepEqual(
            reported.map((message) => message.message),
            [],
            `documented valid example is reported:\n${example.code}`,
          );
        }
      }
    });
  }
});
