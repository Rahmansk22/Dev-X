import fs from "fs";
import path from "path";

type AuditIssue = {
  level: "error" | "warning";
  message: string;
};

type AuditResult = {
  ok: boolean;
  issues: AuditIssue[];
};

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

export function auditProject(rootDir: string = process.cwd()): AuditResult {
  const files = collectSourceFiles(path.join(rootDir, "src"));
  const issues: AuditIssue[] = [];

  const graph = scanImports(files, rootDir, issues);
  checkCircularDeps(graph, issues);
  verifyPaths(rootDir, issues);
  validateNextConfig(rootDir, issues);

  return {
    ok: !issues.some((i) => i.level === "error"),
    issues,
  };
}

function collectSourceFiles(srcDir: string): string[] {
  if (!fs.existsSync(srcDir)) return [];

  const stack = [srcDir];
  const result: string[] = [];

  while (stack.length > 0) {
    const current = stack.pop() as string;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
        stack.push(fullPath);
        continue;
      }
      if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
        result.push(fullPath);
      }
    }
  }

  return result;
}

function scanImports(files: string[], rootDir: string, issues: AuditIssue[]) {
  const graph = new Map<string, string[]>();
  const importRegex = /import\s+(?:type\s+)?(?:[\s\S]*?)\s+from\s+["']([^"']+)["']/g;

  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    const imports: string[] = [];

    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(raw)) !== null) {
      const specifier = match[1];
      imports.push(specifier);

      if (specifier.startsWith("./") || specifier.startsWith("../")) {
        const resolved = resolveRelativeImport(file, specifier);
        if (!resolved) {
          issues.push({
            level: "warning",
            message: `Unresolved relative import '${specifier}' in ${normalizePath(file, rootDir)}`,
          });
        }
      }
    }

    graph.set(file, imports);
  }

  return graph;
}

function resolveRelativeImport(importerFile: string, specifier: string): string | null {
  const base = path.resolve(path.dirname(importerFile), specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.mjs`,
    `${base}.cjs`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
    path.join(base, "index.js"),
    path.join(base, "index.jsx"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function checkCircularDeps(graph: Map<string, string[]>, issues: AuditIssue[]) {
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(node: string, trail: string[]) {
    if (inStack.has(node)) {
      const cycleStart = trail.indexOf(node);
      const cycle = [...trail.slice(cycleStart), node];
      issues.push({
        level: "warning",
        message: `Possible circular import detected: ${cycle.join(" -> ")}`,
      });
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    inStack.add(node);

    const deps = graph.get(node) || [];
    for (const dep of deps) {
      if (dep.startsWith("./") || dep.startsWith("../")) {
        const resolved = resolveRelativeImport(node, dep);
        if (resolved && graph.has(resolved)) {
          dfs(resolved, [...trail, node]);
        }
      }
    }

    inStack.delete(node);
  }

  for (const node of graph.keys()) {
    dfs(node, []);
  }
}

function verifyPaths(rootDir: string, issues: AuditIssue[]) {
  const tsconfigPath = path.join(rootDir, "tsconfig.json");
  if (!fs.existsSync(tsconfigPath)) {
    issues.push({ level: "error", message: "Missing tsconfig.json" });
    return;
  }

  const tsconfigRaw = fs.readFileSync(tsconfigPath, "utf8");
  let tsconfig: any;
  try {
    tsconfig = JSON.parse(tsconfigRaw);
  } catch {
    issues.push({ level: "error", message: "Invalid JSON in tsconfig.json" });
    return;
  }

  const paths = tsconfig?.compilerOptions?.paths;
  if (!paths || typeof paths !== "object") {
    issues.push({ level: "warning", message: "No compilerOptions.paths configured in tsconfig.json" });
  }

  if (paths?.["@/*"]) {
    const entries = paths["@/*"];
    if (!Array.isArray(entries) || entries.length === 0) {
      issues.push({ level: "warning", message: "Path alias @/* is configured but empty" });
    }
  }
}

function validateNextConfig(rootDir: string, issues: AuditIssue[]) {
  const candidates = [
    path.join(rootDir, "next.config.ts"),
    path.join(rootDir, "next.config.mjs"),
    path.join(rootDir, "next.config.js"),
  ];

  const existing = candidates.filter((f) => fs.existsSync(f));
  if (existing.length === 0) {
    issues.push({ level: "error", message: "Missing Next.js config file (next.config.ts|mjs|js)" });
    return;
  }
  if (existing.length > 1) {
    issues.push({
      level: "warning",
      message: `Multiple Next.js config files detected: ${existing.map((f) => path.basename(f)).join(", ")}`,
    });
  }
}

function normalizePath(filePath: string, rootDir: string) {
  return path.relative(rootDir, filePath).replace(/\\/g, "/");
}
