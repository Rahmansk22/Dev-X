/**
 * Code Generation Helper
 * Ensures generated code is complete, valid, and production-ready
 */

import { validateGeneratedCode } from './code-generator-validator';
import { CODE_VALIDATION_RULES } from './code-validation-rules';
import { validateImportsAndExports, ensureProperExports, fixExportIssues, generateComponentWithExport } from './import-export-validator';

export interface GeneratedFile {
  path: string;
  content: string;
  validated: boolean;
  errors: string[];
}

/**
 * Generates a complete component with proper imports
 */
export function generateCompleteComponent(
  componentName: string,
  props?: {
    imports?: { module: string; items: string[] }[];
    useState?: boolean;
    useRouter?: boolean;
    useUser?: boolean;
    useEffect?: boolean;
    clientComponent?: boolean;
  }
): string {
  let imports = '';
  const useClient = props?.clientComponent ? '"use client";\n\n' : '';

  // Add use client if needed
  if (props?.clientComponent) {
    imports = '"use client";\n\n';
  }

  // Build imports section
  const importMap: Record<string, Set<string>> = {};

  // Add standard React imports
  if (props?.useState || props?.useEffect) {
    importMap['react'] = new Set();
    if (props?.useState) importMap['react'].add('useState');
    if (props?.useEffect) importMap['react'].add('useEffect');
  }

  // Add Next.js imports
  if (props?.useRouter) {
    if (!importMap['next/navigation']) importMap['next/navigation'] = new Set();
    importMap['next/navigation'].add('useRouter');
  }

  if (props?.useUser) {
    if (!importMap['@clerk/nextjs']) importMap['@clerk/nextjs'] = new Set();
    importMap['@clerk/nextjs'].add('useUser');
  }

  // Add custom imports
  if (props?.imports) {
    props.imports.forEach(imp => {
      if (!importMap[imp.module]) importMap[imp.module] = new Set();
      imp.items.forEach(item => importMap[imp.module].add(item));
    });
  }

  // Generate import statements
  Object.entries(importMap).forEach(([module, items]) => {
    const itemsList = Array.from(items).join(', ');
    imports += `import { ${itemsList} } from '${module}';\n`;
  });

  const template = `${imports}
export default function ${componentName}() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-8 py-12">
        <h1 className="text-4xl font-bold text-foreground">
          Welcome to ${componentName}
        </h1>
        <p className="text-muted-foreground mt-4">
          This is your ${componentName} component
        </p>
      </div>
    </div>
  );
}
`;

  return template;
}

/**
 * Generates a page with proper routing and imports
 */
export function generateCompletePage(
  pageName: string,
  props?: {
    requiresAuth?: boolean;
    hasForm?: boolean;
    hasList?: boolean;
    clientComponent?: boolean;
  }
): string {
  const isClient = props?.clientComponent ?? true;
  let code = isClient ? '"use client";\n\n' : '';

  // Add imports
  const imports: Set<string> = new Set();
  imports.add('React');

  if (isClient) {
    if (props?.requiresAuth) {
      imports.add('useUser');
    }
  }

  if (imports.size > 0) {
    Array.from(imports).forEach((imp, index) => {
      if (imp === 'useUser') {
        code += `import { useUser } from '@clerk/nextjs';\n`;
      } else {
        code += `import ${imp} from 'react';\n`;
      }
    });
    code += '\n';
  }

  // Add component code
  code += `export default function ${pageName}() {\n`;

  if (props?.requiresAuth) {
    code += `  const { user, isLoaded } = useUser();\n\n`;
    code += `  if (!isLoaded) return <div>Loading...</div>;\n`;
    code += `  if (!user) return <div>Please sign in</div>;\n\n`;
  }

  code += `  return (\n`;
  code += `    <div className="min-h-screen bg-background">\n`;
  code += `      <div className="max-w-7xl mx-auto px-8 py-12">\n`;
  code += `        <h1 className="text-4xl font-bold text-foreground">\n`;
  code += `          ${pageName}\n`;
  code += `        </h1>\n`;
  code += `      </div>\n`;
  code += `    </div>\n`;
  code += `  );\n`;
  code += `}\n`;

  return code;
}

/**
 * Validates generated code and returns fixed version if needed
 */
export function generateValidatedCode(code: string, filePath: string): GeneratedFile {
  const fixedCode = fixMetadataConflict(code);
  const validation = validateGeneratedCode(fixedCode);
  return {
    path: filePath,
    content: validation.fixedCode || fixedCode,
    validated: validation.isValid,
    errors: validation.errors,
  };
}

/**
 * Generates multiple files at once with validation
 */
export function generateMultipleFiles(
  files: Record<string, string>
): Record<string, GeneratedFile> {
  const results: Record<string, GeneratedFile> = {};

  Object.entries(files).forEach(([path, content]) => {
    results[path] = generateValidatedCode(content, path);
  });

  return results;
}

/**
 * Generates complete component files with proper exports
 */
export function generateComponentFile(
  componentName: string,
  type: 'named' | 'default' = 'named',
  isClient = true
): GeneratedFile {
  const content = generateComponentWithExport(componentName, type, isClient);
  return {
    path: `src/components/${componentName}.tsx`,
    content,
    validated: true,
    errors: [],
  };
}

/**
 * Validates all files and fixes import/export issues
 */
export function validateAndFixAllFiles(
  files: Record<string, string>
): Record<string, { content: string; fixed: boolean; errors: string[] }> {
  const importValidated: Record<string, { content: string; fixed: boolean; errors: string[] }> = {};

  // First pass: ensure missing imports are added
  Object.entries(files).forEach(([path, content]) => {
    const validation = validateGeneratedCode(content);
    const updatedContent = validation.fixedCode ?? content;
    const fixed = (validation.fixedCode !== undefined && validation.fixedCode !== content) ||
      validation.errors.length > 0 ||
      validation.missingImports.length > 0;

    importValidated[path] = {
      content: updatedContent,
      fixed,
      errors: [...validation.errors],
    };
  });

  // Second pass: ensure exports exist and are correct
  const exportFixed = fixExportIssues(
    Object.fromEntries(
      Object.entries(importValidated).map(([path, value]) => [path, value.content])
    )
  );

  const combined: Record<string, { content: string; fixed: boolean; errors: string[] }> = {};

  Object.entries(exportFixed).forEach(([path, result]) => {
    const importResult = importValidated[path];
    const fixed = importResult.fixed || result.fixed || importResult.errors.length > 0 || result.errors.length > 0;
    combined[path] = {
      content: result.content,
      fixed,
      errors: [...importResult.errors, ...result.errors],
    };
  });

  return combined;
}

/**
 * Complete validation pipeline for generated code
 * 1. Validates imports
 * 2. Validates exports
 * 3. Fixes missing imports
 * 4. Fixes missing exports
 */
export function fullValidationPipeline(
  files: Record<string, string>
): {
  allValid: boolean;
  files: Record<string, { content: string; errors: string[]; fixed: boolean }>;
} {
  const validationResults = validateAndFixAllFiles(files);
  
  const allValid = Object.values(validationResults).every(result => !result.fixed && result.errors.length === 0);

  return {
    allValid,
    files: validationResults,
  };
}

// --- Fix: Remove metadata export from client components ---
export function fixMetadataConflict(code: string): string {
  // Remove "use client" if metadata is exported
  if (code.includes('"use client"') && code.includes("export const metadata")) {
    return code.replace('"use client";\n', '');
  }
  return code;
}
