// Scope-aware Apps Script merge guard. Input is source JSON via stdin, never argv.
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

function globalNames(files) {
  const names = new Set();
  function addBinding(name) {
    if (ts.isIdentifier(name)) names.add(name.text);
    else
      for (const element of name.elements) {
        if (ts.isBindingElement(element)) addBinding(element.name);
      }
  }
  for (const file of files.filter((item) => item.type === "SERVER_JS")) {
    const source = ts.createSourceFile(
      file.name,
      file.source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.JS,
    );
    if (source.parseDiagnostics.length) throw new Error("Invalid JavaScript in project source");
    function visit(node, depth) {
      if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) {
        if (node.name) names.add(node.name.text);
        return; // Never enter a function/class scope.
      }
      if (ts.isVariableDeclarationList(node)) {
        if (depth === 0 || !(node.flags & ts.NodeFlags.BlockScoped)) {
          for (const declaration of node.declarations) addBinding(declaration.name);
        }
        return; // Initializers can contain function-local declarations.
      }
      if (ts.isFunctionLike(node) || ts.isClassExpression(node)) return;
      const nextDepth =
        depth +
        (ts.isBlock(node) ||
        ts.isForStatement(node) ||
        ts.isForOfStatement(node) ||
        ts.isForInStatement(node) ||
        ts.isCaseBlock(node)
          ? 1
          : 0);
      ts.forEachChild(node, (child) => visit(child, nextDepth));
    }
    ts.forEachChild(source, (child) => visit(child, 0));
  }
  return names;
}

export function checkProject(before, additions) {
  const oldNames = globalNames(before);
  const conflicts = [...globalNames(additions)].filter((name) => oldNames.has(name));
  if (conflicts.length)
    throw new Error(`Global declaration collision: ${conflicts.sort().join(", ")}`);
  // Compile without executing anything; also catches project-wide syntax errors.
  try {
    new Script(
      [...before, ...additions]
        .filter((f) => f.type === "SERVER_JS")
        .map((f) => f.source)
        .join("\n"),
    );
  } catch {
    throw new Error("Merged Apps Script does not compile");
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [before, additions] = JSON.parse(readFileSync(0, "utf8"));
    checkProject(before, additions);
    console.log(JSON.stringify({ valid: true }));
  } catch (error) {
    console.log(JSON.stringify({ valid: false, message: error.message }));
    process.exitCode = 1;
  }
}
