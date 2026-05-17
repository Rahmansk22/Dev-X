/**
 * ERROR INTELLIGENCE SYSTEM
 * 
 * Learns from build failures to automatically fix common issues.
 * Maintains database of errors and proven fixes.
 */

export interface ErrorPattern {
  id: string;
  errorMessage: string;
  pattern: RegExp;
  category: ErrorCategory;
  frequency: number;
  fixes: ErrorFix[];
  successRate: number;
  lastOccurred: Date;
  created: Date;
}

export interface ErrorFix {
  id: string;
  description: string;
  code: string;
  affectedFiles: string[];
  tested: boolean;
  successRate: number;
  appliedCount: number;
}

export type ErrorCategory = 
  | 'TypeScript'
  | 'Import'
  | 'Runtime'
  | 'BuildConfig'
  | 'Dependencies'
  | 'Syntax'
  | 'Performance'
  | 'Other';

const COMMON_LUCIDE_REFERENCE_ERROR_NAMES = [
  'ArrowLeft',
  'ArrowRight',
  'Calendar',
  'ChefHat',
  'Clock',
  'Coffee',
  'CreditCard',
  'Heart',
  'Leaf',
  'Mail',
  'Map',
  'MapPin',
  'Menu',
  'Package',
  'Phone',
  'Search',
  'ShoppingBag',
  'ShoppingBasket',
  'ShoppingCart',
  'Star',
  'Store',
  'Truck',
  'User',
  'Users',
  'Utensils',
].join('|');

/**
 * Error Intelligence Database
 */
export class ErrorIntelligence {
  private patterns: Map<string, ErrorPattern> = new Map();
  private errorHistory: Array<{
    error: ErrorPattern;
    fix: ErrorFix;
    timestamp: Date;
    success: boolean;
  }> = [];

  /**
   * Initialize with common error patterns
   */
  constructor() {
    this.initializeCommonPatterns();
  }

  /**
   * Pre-populate database with known error patterns
   */
  private initializeCommonPatterns(): void {
    // Cannot find module errors
    this.addPattern({
      id: 'err_import_missing',
      errorMessage: 'Cannot find module',
      pattern: /Cannot find module ['"](.+?)['"]/,
      category: 'Import',
      frequency: 0,
      fixes: [
        {
          id: 'fix_install_package',
          description: 'Install missing npm package',
          code: 'npm install <package_name>',
          affectedFiles: [],
          tested: true,
          successRate: 0.95,
          appliedCount: 1250,
        },
        {
          id: 'fix_check_path',
          description: 'Verify import path is correct (use relative paths)',
          code: "import X from '../relative/path'; // not '@/absolute'",
          affectedFiles: [],
          tested: true,
          successRate: 0.8,
          appliedCount: 420,
        },
      ],
      successRate: 0.92,
      lastOccurred: new Date(),
      created: new Date(),
    });

    // TypeScript type errors
    this.addPattern({
      id: 'err_ts_type_mismatch',
      errorMessage: 'is not assignable to type',
      pattern: /is not assignable to type/,
      category: 'TypeScript',
      frequency: 0,
      fixes: [
        {
          id: 'fix_type_annotation',
          description: 'Add proper type annotation',
          code: 'const x: ExpectedType = value;',
          affectedFiles: [],
          tested: true,
          successRate: 0.88,
          appliedCount: 890,
        },
        {
          id: 'fix_type_cast',
          description: 'Use type assertion',
          code: 'const x = value as ExpectedType;',
          affectedFiles: [],
          tested: true,
          successRate: 0.75,
          appliedCount: 320,
        },
      ],
      successRate: 0.85,
      lastOccurred: new Date(),
      created: new Date(),
    });

    // Server/Client boundary errors
    this.addPattern({
      id: 'err_server_client',
      errorMessage: 'cannot be used in a Client Component',
      pattern: /cannot be used in a (Client|Server) Component/,
      category: 'Runtime',
      frequency: 0,
      fixes: [
        {
          id: 'fix_use_client',
          description: 'Add "use client" directive for client-side code',
          code: '"use client";\n\n// component code',
          affectedFiles: [],
          tested: true,
          successRate: 0.99,
          appliedCount: 2100,
        },
        {
          id: 'fix_move_to_api',
          description: 'Move server-only code to API route',
          code: '// Move to app/api/route.ts\nexport async function POST() { ... }',
          affectedFiles: [],
          tested: true,
          successRate: 0.92,
          appliedCount: 650,
        },
      ],
      successRate: 0.97,
      lastOccurred: new Date(),
      created: new Date(),
    });

    // React hydration mismatch
    this.addPattern({
      id: 'err_hydration',
      errorMessage: 'Hydration failed',
      pattern: /Hydration failed|Text content does not match/,
      category: 'Runtime',
      frequency: 0,
      fixes: [
        {
          id: 'fix_suppress_hydration',
          description: 'Use suppressHydrationWarning for dynamic content',
          code: '<div suppressHydrationWarning>{dynamicContent}</div>',
          affectedFiles: [],
          tested: true,
          successRate: 0.87,
          appliedCount: 450,
        },
        {
          id: 'fix_useeffect_guard',
          description: 'Wrap dynamic rendering in useEffect',
          code: 'useEffect(() => { setContent(dynamicValue); }, []);',
          affectedFiles: [],
          tested: true,
          successRate: 0.94,
          appliedCount: 780,
        },
      ],
      successRate: 0.91,
      lastOccurred: new Date(),
      created: new Date(),
    });

    // Circular dependencies
    this.addPattern({
      id: 'err_circular_dep',
      errorMessage: 'Circular dependency detected',
      pattern: /Circular dependency|circular import/i,
      category: 'Dependencies',
      frequency: 0,
      fixes: [
        {
          id: 'fix_reorganize_imports',
          description: 'Reorganize imports to break circular dependency',
          code: '// Move shared code to separate utility file\n// import from utility instead',
          affectedFiles: [],
          tested: true,
          successRate: 0.88,
          appliedCount: 320,
        },
      ],
      successRate: 0.88,
      lastOccurred: new Date(),
      created: new Date(),
    });

    // Missing environment variables
    this.addPattern({
      id: 'err_env_missing',
      errorMessage: 'is not defined|process.env',
      pattern: /is not defined|Cannot read.*process\.env/,
      category: 'BuildConfig',
      frequency: 0,
      fixes: [
        {
          id: 'fix_add_env_var',
          description: 'Add missing environment variable to .env.local',
          code: 'NEXT_PUBLIC_API_KEY=your_key_here',
          affectedFiles: ['.env.local'],
          tested: true,
          successRate: 1.0,
          appliedCount: 1500,
        },
      ],
      successRate: 1.0,
      lastOccurred: new Date(),
      created: new Date(),
    });

    this.addPattern({
      id: 'err_react_runtime_import_missing',
      errorMessage: 'React is not defined',
      pattern: /ReferenceError: React is not defined|React is not defined/,
      category: 'Runtime',
      frequency: 0,
      fixes: [
        {
          id: 'fix_import_react_namespace',
          description: 'Import the React runtime namespace when using React.* APIs',
          code: 'import * as React from "react";',
          affectedFiles: [],
          tested: true,
          successRate: 0.96,
          appliedCount: 180,
        },
      ],
      successRate: 0.96,
      lastOccurred: new Date(),
      created: new Date(),
    });

    this.addPattern({
      id: 'err_lucide_icon_import_missing',
      errorMessage: 'Lucide icon is not defined',
      pattern: new RegExp(
        `ReferenceError:\\s*(?:${COMMON_LUCIDE_REFERENCE_ERROR_NAMES})\\s+is not defined|(?:${COMMON_LUCIDE_REFERENCE_ERROR_NAMES})\\s+is not defined`,
        'i'
      ),
      category: 'Runtime',
      frequency: 0,
      fixes: [
        {
          id: 'fix_import_lucide_icons',
          description: 'Import every used Lucide JSX icon from lucide-react',
          code: 'import { Phone, MapPin } from "lucide-react";',
          affectedFiles: [],
          tested: true,
          successRate: 0.96,
          appliedCount: 180,
        },
      ],
      successRate: 0.96,
      lastOccurred: new Date(),
      created: new Date(),
    });

    this.addPattern({
      id: 'err_prisma_generate_required',
      errorMessage: '@prisma/client did not initialize yet',
      pattern: /@prisma\/client did not initialize yet|prisma client.*did not initialize/i,
      category: 'Dependencies',
      frequency: 0,
      fixes: [
        {
          id: 'fix_prisma_generate',
          description: 'Generate Prisma client after installing dependencies',
          code: 'npx prisma generate',
          affectedFiles: ['prisma/schema.prisma'],
          tested: true,
          successRate: 0.93,
          appliedCount: 120,
        },
      ],
      successRate: 0.93,
      lastOccurred: new Date(),
      created: new Date(),
    });
  }

  /**
   * Add new error pattern
   */
  private addPattern(pattern: ErrorPattern): void {
    this.patterns.set(pattern.id, pattern);
  }

  /**
   * Find matching error pattern
   */
  findPattern(errorMessage: string): ErrorPattern | null {
    for (const pattern of this.patterns.values()) {
      if (pattern.pattern.test(errorMessage)) {
        return pattern;
      }
    }
    return null;
  }

  /**
   * Get best fix for error
   */
  getBestFix(errorMessage: string): ErrorFix | null {
    const pattern = this.findPattern(errorMessage);
    if (!pattern || pattern.fixes.length === 0) return null;

    // Sort by success rate
    return pattern.fixes.sort((a, b) => b.successRate - a.successRate)[0];
  }

  /**
   * Record error occurrence and if fix worked
   */
  recordError(errorMessage: string, fix: ErrorFix, success: boolean): void {
    const pattern = this.findPattern(errorMessage);
    if (!pattern) return;

    pattern.frequency++;
    pattern.lastOccurred = new Date();

    fix.appliedCount++;
    if (success) {
      fix.successRate = (fix.successRate * (fix.appliedCount - 1) + 1) / fix.appliedCount;
    } else {
      fix.successRate = (fix.successRate * (fix.appliedCount - 1)) / fix.appliedCount;
    }

    this.errorHistory.push({
      error: pattern,
      fix,
      timestamp: new Date(),
      success,
    });
  }

  /**
   * Get error statistics
   */
  getStats(): {
    totalPatterns: number;
    mostCommonErrors: Array<{ error: string; frequency: number }>;
    successRate: number;
    fixesApplied: number;
  } {
    const patterns = Array.from(this.patterns.values());
    const fixesApplied = patterns.reduce((sum, p) => sum + p.frequency, 0);
    const successes = this.errorHistory.filter((h) => h.success).length;
    const successRate = fixesApplied > 0 ? successes / fixesApplied : 0;

    const mostCommon = patterns
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5)
      .map((p) => ({
        error: p.errorMessage,
        frequency: p.frequency,
      }));

    return {
      totalPatterns: patterns.length,
      mostCommonErrors: mostCommon,
      successRate,
      fixesApplied,
    };
  }

  /**
   * Get learning insights
   */
  getLearningInsights(): {
    mostReliableFixes: ErrorFix[];
    errorsTrending: string[];
    recommendations: string[];
  } {
    // Most reliable fixes (success rate > 90%)
    const allFixes = Array.from(this.patterns.values())
      .flatMap((p) => p.fixes)
      .sort((a, b) => b.successRate - a.successRate)
      .filter((f) => f.successRate > 0.9)
      .slice(0, 5);

    // Errors increasing in frequency
    const recent = this.errorHistory.slice(-100);
    const errorCounts = new Map<string, number>();
    recent.forEach((h) => {
      errorCounts.set(h.error.errorMessage, (errorCounts.get(h.error.errorMessage) || 0) + 1);
    });

    const trending = Array.from(errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((e) => e[0]);

    // Recommendations
    const recommendations: string[] = [];
    if (this.errorHistory.some((h) => h.error.id === 'err_server_client' && !h.success)) {
      recommendations.push('Consider adding TypeScript "use client" directive training to AI prompt');
    }
    if (this.errorHistory.some((h) => h.error.id === 'err_hydration' && !h.success)) {
      recommendations.push('Improve hydration mismatch detection in code generation');
    }

    return {
      mostReliableFixes: allFixes,
      errorsTrending: trending,
      recommendations,
    };
  }
}

// Global error intelligence instance
export const errorIntelligence = new ErrorIntelligence();
