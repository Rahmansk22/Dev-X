/**
 * Import/Export Validator
 * Validates that all imports reference existing exports with proper declarations
 */

export interface ExportValidationResult {
  isValid: boolean;
  missingExports: Array<{ component: string; module: string }>;
  missingFiles: Array<{ filePath: string; importedFrom: string }>;
  exportErrors: Array<{ file: string; error: string }>;
  fixedCode?: string;
}

/**
 * Validates that all imports have corresponding exports
 */
export function validateImportsAndExports(
  code: string,
  existingFiles?: Record<string, string>
): ExportValidationResult {
  const missingExports: Array<{ component: string; module: string }> = [];
  const missingFiles: Array<{ filePath: string; importedFrom: string }> = [];
  const exportErrors: Array<{ file: string; error: string }> = [];

  // Extract all import statements
  const importRegex = /import\s+(?:{([^}]+)}|([^\s]+))\s+from\s+['"](.*?)['"]/g;
  let match: RegExpExecArray | null;

  while ((match = importRegex.exec(code)) !== null) {
    const namedImports = match[1]; // For destructured imports
    const defaultImport = match[2]; // For default imports
    const modulePath = match[3];

    // Skip validation for external modules (non-relative paths)
    const isRelative = modulePath.startsWith('.') || modulePath.startsWith('/');
    if (!isRelative) {
      continue;
    }

    // Handle named imports
    if (namedImports) {
      const imports = namedImports.split(',').map(i => i.trim().split(' as ')[0].trim());
      
      if (existingFiles) {
        imports.forEach(importName => {
          const fileKey = Object.keys(existingFiles).find(key => 
            key.endsWith(modulePath.replace(/^\.\/?/, '')) ||
            key.endsWith(modulePath.replace(/^\.\/?/, '') + '.tsx') ||
            key.endsWith(modulePath.replace(/^\.\/?/, '') + '.ts')
          );

          if (!fileKey) {
            missingFiles.push({ filePath: modulePath, importedFrom: code.substring(0, match?.index ?? 0) });
          } else {
            const fileContent = existingFiles[fileKey];
            if (!hasNamedExport(fileContent, importName)) {
              missingExports.push({ component: importName, module: modulePath });
            }
          }
        });
      }
    }

    // Handle default imports
    if (defaultImport && defaultImport !== 'React') {
      if (existingFiles) {
        const fileKey = Object.keys(existingFiles).find(key =>
          key.endsWith(modulePath.replace(/^\.\/?/, '')) ||
          key.endsWith(modulePath.replace(/^\.\/?/, '') + '.tsx') ||
          key.endsWith(modulePath.replace(/^\.\/?/, '') + '.ts')
        );

        if (!fileKey) {
          missingFiles.push({ filePath: modulePath, importedFrom: code.substring(0, match.index) });
        } else {
          const fileContent = existingFiles[fileKey];
          if (!hasDefaultExport(fileContent)) {
            missingExports.push({ component: defaultImport, module: modulePath });
          }
        }
      }
    }
  }

  const isValid = missingExports.length === 0 && missingFiles.length === 0;

  return {
    isValid,
    missingExports,
    missingFiles,
    exportErrors,
    fixedCode: isValid ? code : generateFixedImports(code, missingExports, missingFiles),
  };
}

/**
 * Checks if a component has a named export
 */
function hasNamedExport(code: string, exportName: string): boolean {
  const namedExportRegex = new RegExp(`export\\s+(?:const|function|default)?\\s*(?:function)?\\s*${exportName}\\b|export\\s*{[^}]*\\b${exportName}\\b[^}]*}`);
  return namedExportRegex.test(code);
}

/**
 * Checks if a component has a default export
 */
function hasDefaultExport(code: string): boolean {
  return /export\s+default\s+(?:function|const|class)/.test(code) ||
         /export\s+default\s+\w+/.test(code);
}

/**
 * Generates fixed imports by removing invalid ones
 */
function generateFixedImports(
  code: string,
  missingExports: Array<{ component: string; module: string }>,
  missingFiles: Array<{ filePath: string; importedFrom: string }>
): string {
  let fixedCode = code;

  // Remove imports for missing files
  missingFiles.forEach(missing => {
    const importRegex = new RegExp(`import\\s+.*?from\\s+['"](${escapeRegex(missing.filePath)})['"](;)?`, 'g');
    fixedCode = fixedCode.replace(importRegex, '');
  });

  // Remove missing named exports from import statements
  missingExports.forEach(missing => {
    const importRegex = new RegExp(
      `import\\s*{([^}]*)\\b${missing.component}\\b([^}]*)}\\s*from\\s+['"]${escapeRegex(missing.module)}['"]`,
      'g'
    );
    
    fixedCode = fixedCode.replace(importRegex, (_match: string, before: string, after: string) => {
      const remaining = (before + after).split(',').map((s: string) => s.trim()).filter((s: string) => s && s !== missing.component);
      if (remaining.length === 0) {
        return ''; // Remove entire import if no exports remain
      }
      return `import { ${remaining.join(', ')} } from '${missing.module}'`;
    });
  });

  // Clean up empty lines
  fixedCode = fixedCode.replace(/\n\n\n+/g, '\n\n');

  return fixedCode;
}

/**
 * Escapes special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generates a proper component file with correct export
 */
export function generateComponentWithExport(
  componentName: string,
  type: 'named' | 'default' = 'named',
  isClient = true
): string {
  const useClient = isClient ? '"use client";\n\n' : '';

  if (type === 'named') {
    return `${useClient}export function ${componentName}() {
  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-foreground">
        ${componentName}
      </h2>
      <p className="text-muted-foreground mt-2">
        Your ${componentName} component content goes here
      </p>
    </div>
  );
}
`;
  } else {
    return `${useClient}export default function ${componentName}() {
  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-foreground">
        ${componentName}
      </h2>
      <p className="text-muted-foreground mt-2">
        Your ${componentName} component content goes here
      </p>
    </div>
  );
}
`;
  }
}

/**
 * Validates and fixes component exports
 */
export function ensureProperExports(code: string, componentName: string): string {
  // Check if component has any export
  if (!code.includes('export')) {
    // Add export to the component
    const functionRegex = /function\s+(\w+)\s*\(/;
    const constRegex = /const\s+(\w+)\s*=/;

    const functionMatch = code.match(functionRegex);
    const constMatch = code.match(constRegex);

    if (functionMatch || constMatch) {
      const match = functionMatch || constMatch;
      const name = match ? match[1] : componentName;
      
      if (code.includes(`function ${name}`) && !code.includes(`export function ${name}`)) {
        return code.replace(`function ${name}`, `export function ${name}`);
      }
      if (code.includes(`const ${name}`) && !code.includes(`export const ${name}`)) {
        return code.replace(`const ${name}`, `export const ${name}`);
      }
    }
  }

  return code;
}

/**
 * Fixes all export issues in generated files
 */
export function fixExportIssues(
  files: Record<string, string>
): Record<string, { content: string; fixed: boolean; errors: string[] }> {
  const results: Record<string, { content: string; fixed: boolean; errors: string[] }> = {};

  Object.entries(files).forEach(([filePath, content]) => {
    let fixed = false;
    let fixedContent = content;
    const fileErrors: string[] = [];

    // Extract component name from file path
    const fileName = filePath.split('/').pop()?.replace('.tsx', '').replace('.ts', '') || '';
    
    // Ensure proper exports
    if (!content.includes('export')) {
      fixedContent = ensureProperExports(fixedContent, fileName);
      fixed = true;
      fileErrors.push(`${filePath}: Added missing export`);
    }

    // Validate imports and exports
    const validation = validateImportsAndExports(fixedContent, files);
    if (!validation.isValid) {
      fixedContent = validation.fixedCode || fixedContent;
      fixed = true;
      fileErrors.push(...validation.missingExports.map(e => `${filePath}: Missing export ${e.component} from ${e.module}`));
      fileErrors.push(...validation.missingFiles.map(e => `${filePath}: Missing file ${e.filePath}`));
      fileErrors.push(...validation.exportErrors.map(e => `${e.file}: ${e.error}`));
    }

    results[filePath] = {
      content: fixedContent,
      fixed,
      errors: fileErrors,
    };
  });

  return results;
}
