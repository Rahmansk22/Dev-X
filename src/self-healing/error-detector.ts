// src/self-healing/error-detector.ts
// Pattern-based error detection and classification

export type ErrorPattern = {
  id: string;
  name: string;
  regex: RegExp;
  severity: "critical" | "warning" | "info";
  suggestedFix: string;
};

const COMMON_LUCIDE_REFERENCE_ERROR_NAMES = [
  "ArrowLeft",
  "ArrowRight",
  "Calendar",
  "ChefHat",
  "Clock",
  "Coffee",
  "CreditCard",
  "Heart",
  "Leaf",
  "Mail",
  "Map",
  "MapPin",
  "Menu",
  "Package",
  "Phone",
  "Search",
  "ShoppingBag",
  "ShoppingBasket",
  "ShoppingCart",
  "Star",
  "Store",
  "Truck",
  "User",
  "Users",
  "Utensils",
].join("|");

export const COMMON_BUILD_ERRORS: ErrorPattern[] = [
  {
    id: "typescript-error",
    name: "TypeScript Compilation Error",
    regex: /error TS\d+:|Type '.*?' is not assignable/i,
    severity: "critical",
    suggestedFix: "Run type check and fix compilation errors",
  },
  {
    id: "missing-dependency",
    name: "Missing Module/Dependency",
    regex: /Cannot find module|ERR! 404|No such file or directory/i,
    severity: "critical",
    suggestedFix: "Run npm install or npm ci to resolve dependencies",
  },
  {
    id: "syntax-error",
    name: "Syntax Error",
    regex: /SyntaxError:|Unexpected token|Expected/i,
    severity: "critical",
    suggestedFix: "Check and fix syntax errors in source files",
  },
  {
    id: "eslint-error",
    name: "ESLint/Linting Error",
    regex: /eslint error|parsing error|rule violation/i,
    severity: "warning",
    suggestedFix: "Run eslint --fix to auto-correct linting issues",
  },
  {
    id: "memory-error",
    name: "Memory/Resource Error",
    regex: /ENOMEM|out of memory|heap out of memory|ENOSPC/i,
    severity: "critical",
    suggestedFix: "Increase Node.js memory limit or optimize build",
  },
  {
    id: "network-error",
    name: "Network Error",
    regex: /ENOTFOUND|ECONNREFUSED|ETIMEDOUT|ERR_HTTP2_/i,
    severity: "warning",
    suggestedFix: "Check network connectivity and retry",
  },
  {
    id: "react-runtime-import-missing",
    name: "React Runtime Import Missing",
    regex: /ReferenceError: React is not defined|React is not defined/i,
    severity: "critical",
    suggestedFix: "Add `import * as React from \"react\"` when using runtime React.* APIs like React.forwardRef.",
  },
  {
    id: "lucide-icon-import-missing",
    name: "Lucide Icon Import Missing",
    regex: new RegExp(
      `ReferenceError:\\s*(?:${COMMON_LUCIDE_REFERENCE_ERROR_NAMES})\\s+is not defined|(?:${COMMON_LUCIDE_REFERENCE_ERROR_NAMES})\\s+is not defined`,
      "i"
    ),
    severity: "critical",
    suggestedFix: "Import every used Lucide JSX icon from `lucide-react`, e.g. `import { Phone, MapPin } from \"lucide-react\"`.",
  },
  {
    id: "prisma-client-not-generated",
    name: "Prisma Client Not Generated",
    regex: /@prisma\/client did not initialize yet|prisma client.*did not initialize/i,
    severity: "critical",
    suggestedFix: "Install `prisma` and run `prisma generate` before starting the preview server.",
  },
];

// Next.js Strict Build Rules
export const NEXTJS_BUILD_ERRORS: ErrorPattern[] = [
  {
    id: "use-client-metadata-conflict",
    name: '"use client" + Metadata Export in page.tsx',
    regex: /"use client"|'use client'[\s\S]*export const metadata|export const metadata[\s\S]*"use client"|export const metadata[\s\S]*'use client'/i,
    severity: "critical",
    suggestedFix: "Remove 'use client' from page.tsx if exporting metadata. Make it a server component.",
  },
  {
    id: "hooks-without-use-client",
    name: "React Hooks in Server Component",
    regex: /(useState|useEffect|useContext|useReducer|useCallback|useMemo)\s*\(/i,
    severity: "critical",
    suggestedFix: "Add 'use client' as the first line if component uses hooks.",
  },
  {
    id: "export-import-mismatch",
    name: "Export/Import Style Mismatch",
    regex: /import\s+(\w+)\s+from\s+['"]\./i,
    severity: "critical",
    suggestedFix: "Match export style: default import requires 'export default function', named import requires 'export function'.",
  },
  {
    id: "missing-react-type-import",
    name: "React Type Without Import",
    regex: /React\.(FormEvent|MouseEvent|ChangeEvent|KeyboardEvent)/i,
    severity: "critical",
    suggestedFix: "Import React types: import type { FormEvent } from 'react' or import React from 'react'.",
  },
  {
    id: "multiple-components-per-file",
    name: "Multiple Components in One File",
    regex: /^export\s+(function|const)\s+\w+[\s\S]*^export\s+(function|const)\s+\w+/m,
    severity: "critical",
    suggestedFix: "Split into separate files: each component must have its own file under app/components/.",
  },
  {
    id: "use-client-not-first-line",
    name: "'use client' Not First Line",
    regex: /^[^"]*['"]use client['"]|import[\s\S]*['"]use client['"]/,
    severity: "critical",
    suggestedFix: "'use client' must be the first line in the file, before any imports or code.",
  },
  {
    id: "unused-import",
    name: "Unused Import",
    regex: /import\s+{?\s*\w+\s*}?\s+from|import\s+\w+\s+from/i,
    severity: "warning",
    suggestedFix: "Remove unused imports to keep code clean.",
  },
];

export class ErrorDetector {
  detect(log: string): ErrorPattern | null {
    for (const pattern of [...COMMON_BUILD_ERRORS, ...NEXTJS_BUILD_ERRORS]) {
      if (pattern.regex.test(log)) {
        return pattern;
      }
    }
    return null;
  }

  detectAll(log: string): ErrorPattern[] {
    return [...COMMON_BUILD_ERRORS, ...NEXTJS_BUILD_ERRORS].filter((pattern) =>
      pattern.regex.test(log)
    );
  }

  getSeverity(log: string): "critical" | "warning" | "info" {
    const patterns = this.detectAll(log);
    if (patterns.some((p) => p.severity === "critical")) return "critical";
    if (patterns.some((p) => p.severity === "warning")) return "warning";
    return "info";
  }
}

export const errorDetector = new ErrorDetector();
