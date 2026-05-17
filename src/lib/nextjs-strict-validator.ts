/**
 * NextJS Strict Validator
 * Enforces production-grade safety rules for Next.js generated code
 * Prevents common mistakes and ensures code quality before deployment
 */

interface ValidationError {
  file: string;
  message: string;
  rule: string;
}

interface ValidationWarning {
  file: string;
  message: string;
  rule: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface BatchValidationResult extends ValidationResult {
  totalFiles: number;
  validFiles: number;
}

export class NextJSStrictValidator {
  private forbiddenImports = [
    'fs',
    'os',
    'path',
    'child_process',
    'exec',
    'require.cache',
  ];

  private apiRouteReservedNames = [
    'page',
    'layout',
    'error',
    'loading',
    'not-found',
  ];

  /**
   * Validate a single file
   */
  validate(path: string, content: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // Rule 1: No forbidden imports
    if (this.hasForbiddenImports(content)) {
      errors.push({
        file: path,
        message: 'Contains forbidden imports (fs, os, path, child_process, etc.)',
        rule: 'RULE_1_FORBIDDEN_IMPORTS',
      });
    }

    // Rule 2: Use client directive must be first
    if (path.endsWith('.tsx') || path.endsWith('.jsx')) {
      if (content.includes('"use client"') || content.includes("'use client'")) {
        const lines = content.split('\n');
        const useClientLine = lines.findIndex(
          (line) =>
            line.includes('"use client"') || line.includes("'use client'")
        );
        if (useClientLine > 0) {
          // Check if there's any code before use client (excluding comments/whitespace)
          const beforeUseClient = lines.slice(0, useClientLine).join('\n').trim();
          if (beforeUseClient.length > 0 && !beforeUseClient.startsWith('//')) {
            errors.push({
              file: path,
              message: '"use client" must be the first statement in the file',
              rule: 'RULE_2_USE_CLIENT_PLACEMENT',
            });
          }
        }
      }
    }

    // Rule 3: API routes must not have "use client"
    if (path.startsWith('app/api/') && path.endsWith('.ts')) {
      if (content.includes('"use client"') || content.includes("'use client'")) {
        errors.push({
          file: path,
          message: 'API routes (app/api/*) must not contain "use client" directive',
          rule: 'RULE_3_API_ROUTE_NO_CLIENT',
        });
      }
    }

    // Rule 4: Page components must have default export
    if (path.endsWith('page.tsx') || path.endsWith('page.jsx')) {
      if (!content.includes('export default')) {
        errors.push({
          file: path,
          message: 'Page component must have a default export',
          rule: 'RULE_4_PAGE_DEFAULT_EXPORT',
        });
      }
    }

    // Rule 5: Layout components must have default export
    if (path.endsWith('layout.tsx') || path.endsWith('layout.jsx')) {
      if (!content.includes('export default')) {
        errors.push({
          file: path,
          message: 'Layout component must have a default export',
          rule: 'RULE_5_LAYOUT_DEFAULT_EXPORT',
        });
      }
    }

    // Rule 6: API route handlers must export GET, POST, etc.
    if (path.startsWith('app/api/') && path.endsWith('route.ts')) {
      const hasRouteHandler =
        /export\s+(async\s+)?(function|const)\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)/i.test(
          content
        );
      if (!hasRouteHandler) {
        errors.push({
          file: path,
          message: 'API route must export at least one HTTP method (GET, POST, etc.)',
          rule: 'RULE_6_API_ROUTE_HANDLER',
        });
      }
    }

    // Rule 7: Check file naming conventions
    if (path.includes('app/')) {
      const validSegments = /^app\/([\w-]+\/)*[\w-]+(\.tsx?|\/route\.ts|\/layout\.tsx|\/page\.tsx|\/error\.tsx|\/loading\.tsx|\/not-found\.tsx)?$/.test(
        path
      );
      if (!validSegments && !path.includes('app/api/')) {
        // More lenient for component files
        if (!path.match(/app\/[\w-]+\/[\w-]+\.tsx$/)) {
          errors.push({
            file: path,
            message: 'Invalid file naming convention for Next.js app directory',
            rule: 'RULE_7_NAMING_CONVENTION',
          });
        }
      }
    }

    // Rule 8: Check for missing imports in file references
    if (this.hasUnresolvedImports(path, content)) {
      errors.push({
        file: path,
        message: 'Contains imports that reference non-existent files',
        rule: 'RULE_8_MISSING_IMPORTS',
      });
    }

    return errors;
  }

  /**
   * Validate multiple files (batch)
   */
  validateBatch(
    files: Array<{ path: string; content: string }>
  ): BatchValidationResult {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];
    let validFiles = 0;

    for (const file of files) {
      const errors = this.validate(file.path, file.content);
      if (errors.length === 0) {
        validFiles++;
      } else {
        allErrors.push(...errors);
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      totalFiles: files.length,
      validFiles,
    };
  }

  /**
   * Check if content has forbidden imports
   */
  private hasForbiddenImports(content: string): boolean {
    for (const forbidden of this.forbiddenImports) {
      const importPattern = new RegExp(
        `(import|require)\\s*\\(?\\s*['"](${forbidden})['"]\\s*\\)?`,
        'g'
      );
      if (importPattern.test(content)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check for unresolved imports (basic check)
   * More thorough checking would require full AST analysis
   */
  private hasUnresolvedImports(path: string, content: string): boolean {
    // This is a basic implementation
    // In a real scenario, you'd parse imports and check against actual file structure
    const importMatches = content.match(/import\s+.*?from\s+['"]([^'"]+)['"]/g);
    
    if (!importMatches) return false;

    // Check for obviously wrong paths like importing from deleted files
    const knownBadPatterns = [
      /from\s+['"]\.\.\/context\/AuthContext['"]/,  // Example: known deleted file
    ];

    for (const pattern of knownBadPatterns) {
      if (pattern.test(content)) {
        return true;
      }
    }

    return false;
  }
}
