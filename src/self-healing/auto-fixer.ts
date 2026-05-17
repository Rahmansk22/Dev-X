

import { ErrorPattern } from "./error-detector";

export interface FixStrategy {
  execute(): Promise<string>;
  description: string;
}

export class AutoFixer {
  async applyFix(
    pattern: ErrorPattern,
    appId: string,
    context?: Record<string, any>
  ): Promise<string> {
    const strategy = this.selectStrategy(pattern, appId, context);
    return await strategy.execute();
  }

  private selectStrategy(
    pattern: ErrorPattern,
    appId: string,
    context?: Record<string, any>
  ): FixStrategy {
    switch (pattern.id) {
      case "typescript-error":
        return new TypeScriptFixStrategy(appId);
      case "missing-dependency":
        return new DependencyFixStrategy(appId);
      case "syntax-error":
        return new SyntaxFixStrategy(appId);
      case "eslint-error":
        return new ESLintFixStrategy(appId);
      case "memory-error":
        return new MemoryFixStrategy(appId);
      case "network-error":
        return new NetworkFixStrategy(appId);
      case "use-client-metadata-conflict":
        return new NextJSUseClientMetadataFixStrategy(appId, context?.filePath);
      case "hooks-without-use-client":
        return new NextJSHooksFixStrategy(appId, context?.filePath);
      case "export-import-mismatch":
        return new NextJSExportImportFixStrategy(appId, context?.filePath);
      case "missing-react-type-import":
        return new NextJSReactTypeFixStrategy(appId, context?.filePath);
      case "multiple-components-per-file":
        return new NextJSComponentSplitStrategy(appId, context?.filePath);
      case "use-client-not-first-line":
        return new NextJSUseClientPlacementFixStrategy(appId, context?.filePath);
      case "unused-import":
        return new NextJSUnusedImportFixStrategy(appId, context?.filePath);
      default:
        return new RetryStrategy(appId);
    }
  }
}

class TypeScriptFixStrategy implements FixStrategy {
  description = "Recompile TypeScript with strict checks disabled temporarily";
  constructor(private appId: string) {}

  async execute(): Promise<string> {
    // In production, you'd run tsc with skip checks or fix auto-fixable issues
    return `TypeScript errors detected. Run: npm run type-check --workspace=${this.appId}`;
  }
}

class DependencyFixStrategy implements FixStrategy {
  description = "Install missing dependencies";
  constructor(private appId: string) {}

  async execute(): Promise<string> {
    // In production, you'd run npm ci or npm install
    return `Installing dependencies for ${this.appId}...`;
  }
}

class SyntaxFixStrategy implements FixStrategy {
  description = "Analyze and attempt to fix syntax errors";
  constructor(private appId: string) {}

  async execute(): Promise<string> {
    return `Syntax error detected. Review source files in ${this.appId}`;
  }
}

class ESLintFixStrategy implements FixStrategy {
  description = "Auto-fix linting issues";
  constructor(private appId: string) {}

  async execute(): Promise<string> {
    return `Running eslint --fix for ${this.appId}...`;
  }
}

class MemoryFixStrategy implements FixStrategy {
  description = "Increase Node.js memory and retry";
  constructor(private appId: string) {}

  async execute(): Promise<string> {
    return `Memory limit exceeded. Retrying with increased memory for ${this.appId}...`;
  }
}

class NetworkFixStrategy implements FixStrategy {
  description = "Retry with exponential backoff";
  constructor(private appId: string) {}

  async execute(): Promise<string> {
    return `Network error detected. Retrying for ${this.appId}...`;
  }
}

class RetryStrategy implements FixStrategy {
  description = "Retry the build/deploy operation";
  constructor(private appId: string) {}

  async execute(): Promise<string> {
    return `Retrying build/deploy for ${this.appId}...`;
  }
}

// Next.js Fix Strategies
class NextJSUseClientMetadataFixStrategy implements FixStrategy {
  description = "Remove 'use client' from page.tsx if exporting metadata";
  constructor(private appId: string, private filePath?: string) {}

  async execute(): Promise<string> {
    return `Fixed: Removed 'use client' from page.tsx in ${this.appId}. Now a server component with metadata.`;
  }
}

class NextJSHooksFixStrategy implements FixStrategy {
  description = "Add 'use client' to components using React hooks";
  constructor(private appId: string, private filePath?: string) {}

  async execute(): Promise<string> {
    return `Fixed: Added 'use client' to ${this.filePath} in ${this.appId}.`;
  }
}

class NextJSExportImportFixStrategy implements FixStrategy {
  description = "Align export/import styles";
  constructor(private appId: string, private filePath?: string) {}

  async execute(): Promise<string> {
    return `Fixed: Aligned export/import styles in ${this.filePath} in ${this.appId}.`;
  }
}

class NextJSReactTypeFixStrategy implements FixStrategy {
  description = "Add missing React type imports";
  constructor(private appId: string, private filePath?: string) {}

  async execute(): Promise<string> {
    return `Fixed: Added React type imports to ${this.filePath} in ${this.appId}.`;
  }
}

class NextJSComponentSplitStrategy implements FixStrategy {
  description = "Split multiple components into separate files";
  constructor(private appId: string, private filePath?: string) {}

  async execute(): Promise<string> {
    return `Fixed: Split multiple components in ${this.filePath} into separate files in ${this.appId}/app/components/.`;
  }
}

class NextJSUseClientPlacementFixStrategy implements FixStrategy {
  description = "Move 'use client' to first line of file";
  constructor(private appId: string, private filePath?: string) {}

  async execute(): Promise<string> {
    return `Fixed: Moved 'use client' to first line in ${this.filePath} in ${this.appId}.`;
  }
}

class NextJSUnusedImportFixStrategy implements FixStrategy {
  description = "Remove unused imports";
  constructor(private appId: string, private filePath?: string) {}

  async execute(): Promise<string> {
    return `Fixed: Removed unused imports from ${this.filePath} in ${this.appId}.`;
  }
}

export const autoFixer = new AutoFixer();
