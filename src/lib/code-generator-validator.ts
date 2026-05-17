const COMMON_LUCIDE_IMPORTS = [
  "Activity",
  "AlarmClock",
  "AlertCircle",
  "AlertTriangle",
  "Apple",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "Award",
  "BadgeCheck",
  "BarChart",
  "BarChart3",
  "Bean",
  "Beef",
  "Bell",
  "BookOpen",
  "Box",
  "Briefcase",
  "Building",
  "Building2",
  "CakeSlice",
  "Calendar",
  "Car",
  "Carrot",
  "Check",
  "CheckCircle",
  "CheckCircle2",
  "ChefHat",
  "ChevronDown",
  "ChevronLeft",
  "ChevronRight",
  "ChevronUp",
  "Cherry",
  "CircleDollarSign",
  "Citrus",
  "Clock",
  "Cloud",
  "Code2",
  "Coffee",
  "Cookie",
  "CreditCard",
  "DollarSign",
  "Download",
  "Egg",
  "Edit",
  "ExternalLink",
  "Eye",
  "EyeOff",
  "Facebook",
  "FileText",
  "Filter",
  "Fish",
  "FolderOpen",
  "Gift",
  "Globe",
  "GraduationCap",
  "Grid3X3",
  "Heart",
  "Home",
  "IceCream",
  "Info",
  "Instagram",
  "Leaf",
  "LifeBuoy",
  "Loader2",
  "Lock",
  "Mail",
  "Map",
  "MapPin",
  "Menu",
  "MessageCircle",
  "MessageSquare",
  "Milk",
  "Minus",
  "MoreHorizontal",
  "MoreVertical",
  "Navigation",
  "Package",
  "PanelLeft",
  "Pencil",
  "Phone",
  "Pizza",
  "Plus",
  "Quote",
  "RefreshCw",
  "Salad",
  "Sandwich",
  "Search",
  "Send",
  "Settings",
  "Share2",
  "Shield",
  "ShoppingBag",
  "ShoppingBasket",
  "ShoppingCart",
  "SlidersHorizontal",
  "Sparkles",
  "Star",
  "Store",
  "Tag",
  "Trash",
  "Trash2",
  "Truck",
  "Twitter",
  "Upload",
  "User",
  "Users",
  "Utensils",
  "Wallet",
  "Wheat",
  "X",
  "Zap",
] as const;

// Common imports needed for different component types
const COMMON_IMPORTS = {
  next: {
    Link: 'next/link',
    Image: 'next/image',
    useRouter: 'next/navigation',
    usePathname: 'next/navigation',
    useSearchParams: 'next/navigation',
    redirect: 'next/navigation',
  },
  react: {
    useState: 'react',
    useEffect: 'react',
    useCallback: 'react',
    useContext: 'react',
    useRef: 'react',
    useMemo: 'react',
  },
  lucideReact: Object.fromEntries(
    COMMON_LUCIDE_IMPORTS.map((iconName) => [iconName, 'lucide-react'])
  ) as Record<string, string>,
};

const DEFAULT_IMPORT_MODULES: Record<string, string> = {
  'next/link': 'Link',
  'next/image': 'Image',
};
/**
 * Code Generator Validator
 * Ensures all generated code has proper imports and is production-ready
 */

interface ImportRequirement {
  module: string;
  items: string[];
  isDefault?: boolean;
}

interface CodeValidationResult {
  isValid: boolean;
  missingImports: ImportRequirement[];
  errors: string[];
  warnings: string[];
  fixedCode?: string;
}

function usesReactNamespaceRuntime(code: string): boolean {
  return /\bReact\.(forwardRef|memo|lazy|Fragment|Children|cloneElement|createContext|createElement|createRef|isValidElement|startTransition|Suspense|use[A-Z][A-Za-z0-9_]*)\b/.test(
    code
  );
}

function hasReactNamespaceImport(code: string): boolean {
  return /import\s+(?:type\s+)?(?:\*\s+as\s+React|React(?:\s*,\s*\{[^}]*\})?)\s+from\s+['"]react['"]/.test(
    code
  );
}

function getImportLocalName(specifier: string): string {
  const cleaned = specifier.trim().replace(/^type\s+/, "");
  const alias = cleaned.match(/\s+as\s+([A-Za-z_$][\w$]*)$/);
  return alias?.[1] ?? cleaned.match(/^([A-Za-z_$][\w$]*)/)?.[1] ?? cleaned;
}

export function validateGeneratedCode(code: string): CodeValidationResult {
  // --- String literal validation and auto-fix for apostrophes ---
  code = code.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (match: string, inner: string) => {
    if (inner.includes("'")) {
      const fixed = inner.replace(/\"/g, '\\"');
      return '"' + fixed + '"';
    }
    return match;
  });

  const errors: string[] = [];
  const warnings: string[] = [];
  // --- General JS/TS/React error checks ---
  // Unclosed brackets/parentheses/braces
  const openClosePairs = [
    { open: '(', close: ')' },
    { open: '{', close: '}' },
    { open: '[', close: ']' },
  ];
  openClosePairs.forEach(({ open, close }) => {
    const openCount = (code.match(new RegExp(`\\${open}`, 'g')) || []).length;
    const closeCount = (code.match(new RegExp(`\\${close}`, 'g')) || []).length;
    if (openCount !== closeCount) {
      errors.push(`Unmatched '${open}' and '${close}' in code`);
    }
  });

  // Duplicate object keys
  // Use 'g' only for compatibility if 's' is not supported
  let objectKeyRegex: RegExp;
  try {
    objectKeyRegex = new RegExp('{([^}]*)}', 'gs');
  } catch {
    objectKeyRegex = new RegExp('{([^}]*)}', 'g');
  }
  let match: RegExpExecArray | null;
  while ((match = objectKeyRegex.exec(code)) !== null) {
    const keys = match[1].split(',').map(k => k.split(':')[0].trim().replace(/['"`]/g, ''));
    const seen = new Set<string>();
    for (const key of keys) {
      if (key && seen.has(key)) {
        errors.push(`Duplicate object key '${key}'`);
      }
      seen.add(key);
    }
  }

  // Extract all imports from the code
  const importRegex =
    /import\s+(?:type\s+)?(?:\*\s+as\s+[^\s]+|{[^}]+}|[^\s,{]+(?:\s*,\s*{[^}]+})?)\s+from\s+['"][^'"]+['"]/g;
  const existingImports = code.match(importRegex) || [];
  const importedItems = new Set<string>();

  existingImports.forEach((imp: string) => {
    const parsedImport = imp.match(
      /import\s+(?:type\s+)?(?:\*\s+as\s+([^\s]+)|{([^}]+)}|([^\s,{]+)(?:\s*,\s*{([^}]+)})?)\s+from/
    );
    if (parsedImport) {
      if (parsedImport[1]) {
        importedItems.add(parsedImport[1]);
      }
      if (parsedImport[2]) {
        parsedImport[2].split(',').forEach((item: string) => {
          importedItems.add(getImportLocalName(item));
        });
      }
      if (parsedImport[3]) {
        importedItems.add(parsedImport[3]);
      }
      if (parsedImport[4]) {
        parsedImport[4].split(',').forEach((item: string) => {
          importedItems.add(getImportLocalName(item));
        });
      }
    }
  });

  // Undefined variables (simple heuristic)
  const varUsage = Array.from(code.matchAll(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g)).map((m: any) => m[1]);
  const varDefs = Array.from(code.matchAll(/(const|let|var|function|class)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g)).map((m: any) => m[2]);
  varUsage.forEach((v: string) => {
    if (!varDefs.includes(v) && !importedItems.has(v) && !['return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue', 'function', 'class', 'const', 'let', 'var', 'export', 'import', 'from', 'default', 'extends', 'super', 'new', 'this', 'true', 'false', 'null', 'undefined', 'typeof', 'instanceof', 'await', 'async', 'try', 'catch', 'finally', 'throw', 'get', 'set', 'static', 'public', 'private', 'protected', 'interface', 'implements', 'package', 'yield', 'do', 'with', 'delete', 'in', 'of', 'as', 'void', 'enum', 'namespace', 'abstract', 'readonly', 'keyof', 'require', 'module', 'global', 'window', 'document', 'console', 'process', 'Math', 'Date', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Symbol', 'BigInt', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise', 'RegExp', 'Error', 'JSON', 'Intl', 'Reflect', 'Proxy', 'Buffer', 'URL', 'Event', 'HTMLElement', 'Node', 'Element', 'Text', 'EventTarget', 'File', 'Blob', 'FormData', 'Headers', 'Request', 'Response', 'fetch', 'localStorage', 'sessionStorage', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'require', 'module', 'exports', 'arguments', 'NaN', 'Infinity', 'isNaN', 'isFinite', 'parseInt', 'parseFloat', 'encodeURI', 'decodeURI', 'encodeURIComponent', 'decodeURIComponent', 'escape', 'unescape', 'alert', 'prompt', 'confirm', 'open', 'close', 'print', 'stop', 'scroll', 'scrollTo', 'scrollBy', 'moveTo', 'moveBy', 'resizeTo', 'resizeBy', 'focus', 'blur', 'getComputedStyle', 'matchMedia', 'requestAnimationFrame', 'cancelAnimationFrame', 'btoa', 'atob', 'setImmediate', 'clearImmediate', 'queueMicrotask', 'performance', 'navigator', 'screen', 'history', 'location', 'crypto', 'Notification', 'WebSocket', 'EventSource', 'XMLHttpRequest', 'FormData', 'URLSearchParams', 'AbortController', 'AbortSignal', 'TextEncoder', 'TextDecoder', 'Image', 'Audio', 'Video', 'CanvasRenderingContext2D', 'OffscreenCanvas', 'Worker', 'SharedWorker', 'MessageChannel', 'MessagePort', 'BroadcastChannel', 'DataView', 'ArrayBuffer', 'Uint8Array', 'Uint16Array', 'Uint32Array', 'Int8Array', 'Int16Array', 'Int32Array', 'Float32Array', 'Float64Array', 'BigInt64Array', 'BigUint64Array', 'Atomics', 'DataView', 'WebAssembly', 'requestIdleCallback', 'cancelIdleCallback'].includes(v)) {
      errors.push(`Possible undefined variable '${v}'`);
    }
  });

  // Missing return in functions (simple heuristic)
  let functionBlocks: any[] = [];
  functionBlocks = Array.from(code.matchAll(/function\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)\s*{([^}]*)}/g)).map((fb: any) => fb);
  functionBlocks.forEach((fb: any) => {
    if (!/return\s+/.test(fb[1])) {
      warnings.push('Function may be missing a return statement');
    }
  });


  // Invalid JSX (simple heuristic)
  if (/<[A-Za-z][A-Za-z0-9]*\s*[^>]*=[^"'{][^>]*>/.test(code)) {
    errors.push('Possible invalid JSX attribute value (should be in quotes or curly braces)');
  }

  // Check for common missing imports
  const missingImports: ImportRequirement[] = [];
  Object.values(COMMON_IMPORTS).forEach((items) => {
    Object.entries(items).forEach(([item, importPath]) => {
      const regex =
        importPath === 'lucide-react'
          ? new RegExp(`<${item}(?:\\s|/|>)`)
          : new RegExp(`\\b${item}\\b(?!\\s*[:=]\\s*(?:require|import))`);
      if (regex.test(code) && !importedItems.has(item) && !varDefs.includes(item)) {
        const existingImport = missingImports.find(m => m.module === importPath);
        if (existingImport) {
          existingImport.items.push(item);
        } else {
          missingImports.push({
            module: importPath,
            items: [item],
          });
        }
      }
    });
  });

  // Validation checks
  if (!code.includes('"use client"') && !code.includes("'use client'")) {
    warnings.push('Consider adding "use client" directive if this is a client component');
  }

  if (code.includes('useState') && !importedItems.has('useState')) {
    errors.push('useState is used but not imported from react');
  }

  if (usesReactNamespaceRuntime(code) && !hasReactNamespaceImport(code)) {
    errors.push('React namespace is used at runtime but not imported from react');
  }

  if (code.includes('<Link') && !importedItems.has('Link')) {
    errors.push('Link component is used but not imported from next/link');
  }

  const isValid = errors.length === 0 && missingImports.length === 0;


  return {
    isValid,
    missingImports,
    errors,
    warnings,
    fixedCode: isValid ? code : generateFixedCode(code, missingImports),
  };
}

// Generates fixed code with all required imports
function generateFixedCode(code: string, missingImports: ImportRequirement[]): string {
  const needsReactNamespaceImport =
    usesReactNamespaceRuntime(code) && !hasReactNamespaceImport(code);

  if (missingImports.length === 0 && !needsReactNamespaceImport) return code;

  // Group imports by module
  const importsByModule: Record<string, string[]> = {};
  missingImports.forEach(imp => {
    if (!importsByModule[imp.module]) {
      importsByModule[imp.module] = [];
    }
    importsByModule[imp.module].push(...imp.items);
  });

  // Generate import statements
  let importStatements = '';
  if (needsReactNamespaceImport) {
    importStatements += `import * as React from 'react';\n`;
  }
  Object.entries(importsByModule).forEach(([module, items]) => {
    const uniqueItems = [...new Set(items)];
    const defaultName = DEFAULT_IMPORT_MODULES[module];
    if (defaultName && uniqueItems.length === 1 && uniqueItems[0] === defaultName) {
      importStatements += `import ${defaultName} from '${module}';\n`;
    } else {
      importStatements += `import { ${uniqueItems.join(', ')} } from '${module}';\n`;
    }
  });

  // Find the position after existing imports
  const lastImportMatch = code.match(/import\s+.*?from\s+['"][^'"]+['"]/g);
  let insertPosition = 0;

  if (lastImportMatch && lastImportMatch.length > 0) {
    const lastImport = lastImportMatch[lastImportMatch.length - 1];
    insertPosition = code.indexOf(lastImport) + lastImport.length + 1;
  } else {
    // If no imports exist, add after "use client" directive if present
    const useClientMatch = code.match(/['"]use client['"]/);
    if (useClientMatch) {
      insertPosition = code.indexOf(useClientMatch[0]) + useClientMatch[0].length + 1;
    }
  }

  const beforeImports = code.substring(0, insertPosition);
  const afterImports = code.substring(insertPosition);
  const separator = beforeImports.length === 0 || beforeImports.endsWith('\n') ? '' : '\n';

  return beforeImports + separator + importStatements + afterImports;
}

/**
 * Validates and fixes all generated files
 */
export function validateAllGeneratedCode(files: Record<string, string>): Record<string, CodeValidationResult> {
  const results: Record<string, CodeValidationResult> = {};

  Object.entries(files).forEach(([filePath, code]) => {
    results[filePath] = validateGeneratedCode(code);
  });

  return results;
}
