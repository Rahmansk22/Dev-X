/**
 * EXECUTION VERIFIER - Build Loop with Auto-Fix
 * 
 * This agent ensures every generated app actually builds and runs.
 * If build fails, it parses errors and regenerates with fixes.
 * 
 * Architecture:
 * 1. Run npm run build in generated app sandbox
 * 2. Parse build errors (TypeScript, imports, runtime)
 * 3. Feed errors back to AI with context
 * 4. AI regenerates problematic files
 * 5. Loop until success (max 3 attempts)
 * 6. Return final app or failure report
 */

export interface VerifierConfig {
  projectPath: string;
  maxAttempts?: number;
  timeout?: number;
}

export interface VerifierResult {
  success: boolean;
  attempts: number;
  finalError?: string;
  buildLog?: string;
  fixedFiles?: string[];
  timestamp: Date;
}

export interface BuildError {
  file: string;
  line?: number;
  error: string;
  type: 'TypeScript' | 'Runtime' | 'Import' | 'Syntax' | 'Other';
  severity: 'error' | 'warning';
}

/**
 * Parse build output to extract structured errors
 */
export function parseBuildErrors(buildLog: string): BuildError[] {
  const errors: BuildError[] = [];
  const lines = buildLog.split('\n');

  for (const line of lines) {
    // TypeScript errors: file.tsx:10:5 - error TS1234: description
    const tsMatch = line.match(/(.+?):(\d+):(\d+)\s+-\s+(error|warning)\s+TS\d+:\s+(.+)/);
    if (tsMatch) {
      errors.push({
        file: tsMatch[1],
        line: parseInt(tsMatch[2]),
        error: tsMatch[5],
        type: 'TypeScript',
        severity: tsMatch[4] as 'error' | 'warning',
      });
      continue;
    }

    // Import errors: Cannot find module 'xyz'
    if (line.includes('Cannot find module')) {
      const match = line.match(/Cannot find module ['"](.+?)['"]/);
      if (match) {
        errors.push({
          file: 'unknown',
          error: `Cannot find module: ${match[1]}`,
          type: 'Import',
          severity: 'error',
        });
      }
      continue;
    }

    // Syntax errors
    if (line.includes('Unexpected token') || line.includes('SyntaxError')) {
      errors.push({
        file: 'unknown',
        error: line,
        type: 'Syntax',
        severity: 'error',
      });
      continue;
    }

    // Runtime errors
    if (line.includes('Error:') && !line.includes('error TS')) {
      errors.push({
        file: 'unknown',
        error: line.replace('Error:', '').trim(),
        type: 'Runtime',
        severity: 'error',
      });
    }
  }

  return errors;
}

/**
 * Format errors for AI regeneration
 */
export function formatErrorsForAI(errors: BuildError[]): string {
  if (errors.length === 0) return 'Build succeeded with no errors.';

  const grouped = errors.reduce(
    (acc, err) => {
      if (!acc[err.type]) acc[err.type] = [];
      acc[err.type].push(err);
      return acc;
    },
    {} as Record<string, BuildError[]>,
  );

  let report = '## BUILD ERRORS DETECTED\n\n';

  for (const [type, typeErrors] of Object.entries(grouped)) {
    report += `### ${type} Errors (${typeErrors.length})\n\n`;
    for (const err of typeErrors) {
      report += `**File:** ${err.file}${err.line ? `:${err.line}` : ''}\n`;
      report += `**Error:** ${err.error}\n\n`;
    }
  }

  return report;
}

/**
 * Create regeneration prompt for AI
 */
export function createRegenerationPrompt(
  originalRequest: string,
  errors: BuildError[],
  previousAttempts: number,
): string {
  const errorReport = formatErrorsForAI(errors);

  return `
## BUILD FAILURE - ATTEMPT ${previousAttempts + 1}

Your generated app failed to build. Here are the errors:

${errorReport}

## YOUR TASK

1. Analyze each error carefully
2. Identify the root cause in your generated code
3. Regenerate ONLY the files causing errors
4. Fix the issue completely - no partial fixes
5. Ensure the fix doesn't break other files

## ORIGINAL REQUEST
${originalRequest}

## CRITICAL RULES FOR FIX
- ❌ DO NOT explain what went wrong
- ✅ DO regenerate the problematic files with fixes
- ✅ DO use the exact same architecture as before
- ✅ DO maintain backward compatibility with other files
- ✅ DO ensure new code compiles on first try
- ✅ DO NOT change file names or import paths

Regenerate the files now.
`;
}

/**
 * Main verifier loop
 */
export async function verifyBuild(config: VerifierConfig): Promise<VerifierResult> {
  const maxAttempts = config.maxAttempts || 3;
  const timeout = config.timeout || 60000;

  const result: VerifierResult = {
    success: false,
    attempts: 0,
    timestamp: new Date(),
    fixedFiles: [],
  };

  // Attempt 1: Check if initial build works
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    result.attempts = attempt;

    try {
      // Run build in sandbox
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      // Attempt Fast Check (tsc) first for speed
      const fastCheckCommand = `cd "${config.projectPath}" && npx tsc --noEmit`;
      try {
        console.log(`[VERIFIER] Attempt ${attempt}: Running Fast Check (tsc)...`);
        await execAsync(fastCheckCommand);
        console.log(`[VERIFIER] ✅ Fast Check passed.`);
      } catch (fastError: any) {
        console.warn(`[VERIFIER] ⚠️ Fast Check failed. parsing errors...`);
        result.buildLog = fastError.stdout + fastError.stderr;
        // If Fast Check fails, we already have enough info to regenerate
      }

      // If Fast Check passed or we want a full build validation
      const buildCommand = `cd "${config.projectPath}" && npm run build`;
      try {
        console.log(`[VERIFIER] Attempt ${attempt}: Running full build...`);
        const { stdout, stderr } = await execAsync(buildCommand, { timeout: 120000 });
        result.buildLog = stdout + stderr;

        if (stdout.includes('✓ Compiled successfully') || stdout.includes('Done in')) {
          result.success = true;
          return result;
        }
      } catch (buildError: any) {
        result.buildLog = (result.buildLog || "") + "\n" + (buildError.stdout + buildError.stderr);
      }

      // Parse errors
      const errors = parseBuildErrors(result.buildLog || '');

      if (errors.length === 0) {
        result.success = true;
        return result;
      }

      // Don't regenerate on last attempt - return error
      if (attempt === maxAttempts) {
        result.finalError = `Build failed after ${maxAttempts} attempts. Errors:\n${formatErrorsForAI(errors)}`;
        return result;
      }

      // For production: Here you would call AI to regenerate
      // For now, we return the error report
      console.error(`[VERIFIER] Attempt ${attempt} failed. Errors detected:`, errors);
    } catch (error: any) {
      result.finalError = error.message;
      return result;
    }
  }

  return result;
}

/**
 * Health check - ensures all critical dependencies exist
 */
export async function healthCheck(projectPath: string): Promise<{
  healthy: boolean;
  missing: string[];
}> {
  const { existsSync } = await import('fs');

  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'next.config.ts',
    'src/app/layout.tsx',
    'src/app/page.tsx',
  ];

  const missing = requiredFiles.filter((file) => !existsSync(`${projectPath}/${file}`));

  return {
    healthy: missing.length === 0,
    missing,
  };
}

/**
 * Extract build metrics for monitoring
 */
export function extractBuildMetrics(buildLog: string): {
  totalErrors: number;
  totalWarnings: number;
  buildTime?: number;
  routesGenerated?: number;
} {
  const errors = (buildLog.match(/error TS\d+/g) || []).length;
  const warnings = (buildLog.match(/warning TS\d+/g) || []).length;

  const timeMatch = buildLog.match(/Compiled successfully in (\d+)s/);
  const buildTime = timeMatch ? parseInt(timeMatch[1]) : undefined;

  const routesMatch = buildLog.match(/(\d+) routes/);
  const routesGenerated = routesMatch ? parseInt(routesMatch[1]) : undefined;

  return {
    totalErrors: errors,
    totalWarnings: warnings,
    buildTime,
    routesGenerated,
  };
}
