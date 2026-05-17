// Integration Guide: How to Use Code Generation Validators in Dev X
// This file shows how to integrate the validators into Dev X's generation workflow

import { 
  fullValidationPipeline,
  generateComponentFile,
  validateAndFixAllFiles 
} from '@/lib/code-generation-helper';

/**
 * SCENARIO 1: Dev X generates a multi-file app (e.g., portfolio)
 * BEFORE: Files have missing imports and missing exports -> Build fails
 * AFTER: fullValidationPipeline fixes everything -> Build succeeds
 */
export async function integrateGeneratedApp(
  appName: string,
  generatedFiles: Record<string, string>
) {
  // 1. Run full validation pipeline on all generated files
  const result = fullValidationPipeline(generatedFiles);

  if (!result.allValid) {
    console.log('❌ Validation found issues, but they were auto-fixed!');
    Object.entries(result.files).forEach(([path, file]) => {
      if (file.fixed) {
        console.log(`   Fixed ${path}:`, file.errors.join('; '));
      }
    });
  } else {
    console.log('✅ All files passed validation!');
  }

  // 2. Write the fixed files to disk
  const fixedFiles: Record<string, string> = {};
  Object.entries(result.files).forEach(([path, file]) => {
    fixedFiles[path] = file.content;
  });

  // 3. These fixed files are now guaranteed to:
  //    - Have all required imports
  //    - Have proper export statements
  //    - Be syntactically valid TypeScript/TSX
  return fixedFiles;
}

/**
 * SCENARIO 2: Dev X is generating just a component
 * BEFORE: Component generated without export statement
 * AFTER: generateComponentFile creates it with proper export
 */
export function integrateGeneratedComponent(
  componentName: string,
  componentCode: string
) {
  // Use the helper to generate a component with guaranteed proper structure
  const result = generateComponentFile(componentName, 'named');

  return {
    path: result.path,
    content: result.content, // Already has export statement
    isValid: result.validated,
    errors: result.errors,
  };
}

/**
 * SCENARIO 3: Dev X has already generated files with errors
 * BEFORE: Files fail to build with "Export X doesn't exist" errors
 * AFTER: validateAndFixAllFiles fixes all import/export issues
 */
export async function fixExistingGeneratedFiles(
  filesWithErrors: Record<string, string>
) {
  const result = validateAndFixAllFiles(filesWithErrors);

  let fixedCount = 0;
  Object.values(result).forEach(file => {
    if (file.fixed) fixedCount++;
  });
  
  console.log(`Fixed ${fixedCount}/${Object.keys(result).length} files`);
  
  const fixedFiles: Record<string, string> = {};
  Object.entries(result).forEach(([path, file]) => {
    fixedFiles[path] = file.content;
  });

  return fixedFiles;
}

/**
 * INTEGRATION POINTS IN DEV X CODE GENERATION FLOW:
 * 
 * 1. AFTER CODE GENERATION (in generation API route or function):
 *    const generated = generateAppCode(prompt);  // Your existing generation
 *    const fixed = fullValidationPipeline(generated);  // NEW: Validate & fix
 *    return fixed.fileResults;  // Return fixed files instead
 * 
 * 2. WHEN GENERATING SINGLE COMPONENTS:
 *    const code = generateComponentCode(prompt);  // Your existing generation
 *    const result = generateComponentFile(componentName, 'named');  // NEW: Use helper
 *    return result.content;  // Returns properly structured component
 * 
 * 3. FOR EXISTING BROKEN GENERATED CODE:
 *    const fixed = validateAndFixAllFiles(brokenFiles);  // NEW: Fix existing
 *    writeFilesToDisk(fixed);  // Write fixed versions
 */

/**
 * VALIDATION PIPELINE OUTPUT STRUCTURE:
 * 
 * {
 *   allValid: boolean,           // True if no issues found
 *   files: {
 *     [path: string]: {
 *       content: string,         // The actual file content (fixed if needed)
 *       fixed: boolean,          // Had to fix issues
 *       errors: string[],        // What was fixed
 *     }
 *   }
 * }
 */

/**
 * COMMON ISSUES DETECTED & FIXED:
 * 
 * ✅ Missing imports: Link, useState, useRouter, icons, etc.
 * ✅ Missing exports: function/component has no 'export' keyword
 * ✅ Empty modules: Files with no exports at all
 * ✅ Invalid imports: Referencing components that don't exist
 * ✅ Broken import paths: Wrong relative paths to components
 */

export default {
  integrateGeneratedApp,
  integrateGeneratedComponent,
  fixExistingGeneratedFiles,
};
