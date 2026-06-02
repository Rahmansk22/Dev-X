/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AUTO-HEAL IMPORTS — Infrastructure-Level Build Error Prevention
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This runs BEFORE files are written to the sandbox. It:
 * 1. Scans every .tsx/.ts file for JSX components used but never imported
 * 2. Auto-injects the missing import statements
 * 3. Ensures every referenced @/components/ui/* file actually exists
 * 4. Adds missing packages to package.json dependencies
 *
 * This is the ROOT FIX — it doesn't rely on the AI being perfect.
 */

// ── Known Shadcn UI component → file mappings ──
const SHADCN_COMPONENT_MAP: Record<string, { file: string; exports: string[] }> = {
  // button.tsx
  Button: { file: "components/ui/button", exports: ["Button", "buttonVariants"] },
  buttonVariants: { file: "components/ui/button", exports: ["Button", "buttonVariants"] },
  // card.tsx
  Card: { file: "components/ui/card", exports: ["Card", "CardHeader", "CardFooter", "CardTitle", "CardDescription", "CardContent"] },
  CardHeader: { file: "components/ui/card", exports: ["Card", "CardHeader", "CardFooter", "CardTitle", "CardDescription", "CardContent"] },
  CardFooter: { file: "components/ui/card", exports: ["Card", "CardHeader", "CardFooter", "CardTitle", "CardDescription", "CardContent"] },
  CardTitle: { file: "components/ui/card", exports: ["Card", "CardHeader", "CardFooter", "CardTitle", "CardDescription", "CardContent"] },
  CardDescription: { file: "components/ui/card", exports: ["Card", "CardHeader", "CardFooter", "CardTitle", "CardDescription", "CardContent"] },
  CardContent: { file: "components/ui/card", exports: ["Card", "CardHeader", "CardFooter", "CardTitle", "CardDescription", "CardContent"] },
  // input.tsx
  Input: { file: "components/ui/input", exports: ["Input"] },
  // label.tsx
  Label: { file: "components/ui/label", exports: ["Label"] },
  // textarea.tsx
  Textarea: { file: "components/ui/textarea", exports: ["Textarea"] },
  // badge.tsx
  Badge: { file: "components/ui/badge", exports: ["Badge", "badgeVariants"] },
  badgeVariants: { file: "components/ui/badge", exports: ["Badge", "badgeVariants"] },
  // separator.tsx
  Separator: { file: "components/ui/separator", exports: ["Separator"] },
  // avatar.tsx
  Avatar: { file: "components/ui/avatar", exports: ["Avatar", "AvatarImage", "AvatarFallback"] },
  AvatarImage: { file: "components/ui/avatar", exports: ["Avatar", "AvatarImage", "AvatarFallback"] },
  AvatarFallback: { file: "components/ui/avatar", exports: ["Avatar", "AvatarImage", "AvatarFallback"] },
  // dialog.tsx
  Dialog: { file: "components/ui/dialog", exports: ["Dialog", "DialogPortal", "DialogOverlay", "DialogClose", "DialogTrigger", "DialogContent", "DialogHeader", "DialogFooter", "DialogTitle", "DialogDescription"] },
  DialogTrigger: { file: "components/ui/dialog", exports: ["Dialog", "DialogTrigger", "DialogContent", "DialogHeader", "DialogFooter", "DialogTitle", "DialogDescription"] },
  DialogContent: { file: "components/ui/dialog", exports: ["Dialog", "DialogTrigger", "DialogContent", "DialogHeader", "DialogFooter", "DialogTitle", "DialogDescription"] },
  DialogHeader: { file: "components/ui/dialog", exports: ["Dialog", "DialogTrigger", "DialogContent", "DialogHeader", "DialogFooter", "DialogTitle", "DialogDescription"] },
  DialogFooter: { file: "components/ui/dialog", exports: ["Dialog", "DialogTrigger", "DialogContent", "DialogHeader", "DialogFooter", "DialogTitle", "DialogDescription"] },
  DialogTitle: { file: "components/ui/dialog", exports: ["Dialog", "DialogTrigger", "DialogContent", "DialogHeader", "DialogFooter", "DialogTitle", "DialogDescription"] },
  DialogDescription: { file: "components/ui/dialog", exports: ["Dialog", "DialogTrigger", "DialogContent", "DialogHeader", "DialogFooter", "DialogTitle", "DialogDescription"] },
  // dropdown-menu.tsx
  DropdownMenu: { file: "components/ui/dropdown-menu", exports: ["DropdownMenu", "DropdownMenuTrigger", "DropdownMenuContent", "DropdownMenuItem", "DropdownMenuCheckboxItem", "DropdownMenuRadioItem", "DropdownMenuLabel", "DropdownMenuSeparator", "DropdownMenuShortcut", "DropdownMenuGroup", "DropdownMenuSub", "DropdownMenuSubContent", "DropdownMenuSubTrigger", "DropdownMenuRadioGroup"] },
  DropdownMenuTrigger: { file: "components/ui/dropdown-menu", exports: ["DropdownMenu", "DropdownMenuTrigger", "DropdownMenuContent", "DropdownMenuItem", "DropdownMenuSeparator"] },
  DropdownMenuContent: { file: "components/ui/dropdown-menu", exports: ["DropdownMenu", "DropdownMenuTrigger", "DropdownMenuContent", "DropdownMenuItem", "DropdownMenuSeparator"] },
  DropdownMenuItem: { file: "components/ui/dropdown-menu", exports: ["DropdownMenu", "DropdownMenuTrigger", "DropdownMenuContent", "DropdownMenuItem", "DropdownMenuSeparator"] },
  DropdownMenuSeparator: { file: "components/ui/dropdown-menu", exports: ["DropdownMenu", "DropdownMenuTrigger", "DropdownMenuContent", "DropdownMenuItem", "DropdownMenuSeparator"] },
  DropdownMenuLabel: { file: "components/ui/dropdown-menu", exports: ["DropdownMenu", "DropdownMenuTrigger", "DropdownMenuContent", "DropdownMenuItem", "DropdownMenuLabel", "DropdownMenuSeparator"] },
  // select.tsx
  Select: { file: "components/ui/select", exports: ["Select", "SelectGroup", "SelectValue", "SelectTrigger", "SelectContent", "SelectLabel", "SelectItem", "SelectSeparator"] },
  SelectTrigger: { file: "components/ui/select", exports: ["Select", "SelectTrigger", "SelectContent", "SelectItem", "SelectValue"] },
  SelectContent: { file: "components/ui/select", exports: ["Select", "SelectTrigger", "SelectContent", "SelectItem", "SelectValue"] },
  SelectItem: { file: "components/ui/select", exports: ["Select", "SelectTrigger", "SelectContent", "SelectItem", "SelectValue"] },
  SelectValue: { file: "components/ui/select", exports: ["Select", "SelectTrigger", "SelectContent", "SelectItem", "SelectValue"] },
  // tabs.tsx
  Tabs: { file: "components/ui/tabs", exports: ["Tabs", "TabsList", "TabsTrigger", "TabsContent"] },
  TabsList: { file: "components/ui/tabs", exports: ["Tabs", "TabsList", "TabsTrigger", "TabsContent"] },
  TabsTrigger: { file: "components/ui/tabs", exports: ["Tabs", "TabsList", "TabsTrigger", "TabsContent"] },
  TabsContent: { file: "components/ui/tabs", exports: ["Tabs", "TabsList", "TabsTrigger", "TabsContent"] },
  // tooltip.tsx
  Tooltip: { file: "components/ui/tooltip", exports: ["Tooltip", "TooltipTrigger", "TooltipContent", "TooltipProvider"] },
  TooltipTrigger: { file: "components/ui/tooltip", exports: ["Tooltip", "TooltipTrigger", "TooltipContent", "TooltipProvider"] },
  TooltipContent: { file: "components/ui/tooltip", exports: ["Tooltip", "TooltipTrigger", "TooltipContent", "TooltipProvider"] },
  TooltipProvider: { file: "components/ui/tooltip", exports: ["Tooltip", "TooltipTrigger", "TooltipContent", "TooltipProvider"] },
  // switch.tsx
  Switch: { file: "components/ui/switch", exports: ["Switch"] },
  // checkbox.tsx
  Checkbox: { file: "components/ui/checkbox", exports: ["Checkbox"] },
  // scroll-area.tsx
  ScrollArea: { file: "components/ui/scroll-area", exports: ["ScrollArea", "ScrollBar"] },
  ScrollBar: { file: "components/ui/scroll-area", exports: ["ScrollArea", "ScrollBar"] },
  // popover.tsx
  Popover: { file: "components/ui/popover", exports: ["Popover", "PopoverTrigger", "PopoverContent"] },
  PopoverTrigger: { file: "components/ui/popover", exports: ["Popover", "PopoverTrigger", "PopoverContent"] },
  PopoverContent: { file: "components/ui/popover", exports: ["Popover", "PopoverTrigger", "PopoverContent"] },
  // slider.tsx
  Slider: { file: "components/ui/slider", exports: ["Slider"] },
  // progress.tsx
  Progress: { file: "components/ui/progress", exports: ["Progress"] },
  // accordion.tsx
  Accordion: { file: "components/ui/accordion", exports: ["Accordion", "AccordionItem", "AccordionTrigger", "AccordionContent"] },
  AccordionItem: { file: "components/ui/accordion", exports: ["Accordion", "AccordionItem", "AccordionTrigger", "AccordionContent"] },
  AccordionTrigger: { file: "components/ui/accordion", exports: ["Accordion", "AccordionItem", "AccordionTrigger", "AccordionContent"] },
  AccordionContent: { file: "components/ui/accordion", exports: ["Accordion", "AccordionItem", "AccordionTrigger", "AccordionContent"] },
  // table.tsx
  Table: { file: "components/ui/table", exports: ["Table", "TableHeader", "TableBody", "TableFooter", "TableHead", "TableRow", "TableCell", "TableCaption"] },
  TableHeader: { file: "components/ui/table", exports: ["Table", "TableHeader", "TableBody", "TableHead", "TableRow", "TableCell"] },
  TableBody: { file: "components/ui/table", exports: ["Table", "TableHeader", "TableBody", "TableHead", "TableRow", "TableCell"] },
  TableHead: { file: "components/ui/table", exports: ["Table", "TableHeader", "TableBody", "TableHead", "TableRow", "TableCell"] },
  TableRow: { file: "components/ui/table", exports: ["Table", "TableHeader", "TableBody", "TableHead", "TableRow", "TableCell"] },
  TableCell: { file: "components/ui/table", exports: ["Table", "TableHeader", "TableBody", "TableHead", "TableRow", "TableCell"] },
  TableCaption: { file: "components/ui/table", exports: ["Table", "TableHeader", "TableBody", "TableHead", "TableRow", "TableCell", "TableCaption"] },
  // radio-group.tsx
  RadioGroup: { file: "components/ui/radio-group", exports: ["RadioGroup", "RadioGroupItem"] },
  RadioGroupItem: { file: "components/ui/radio-group", exports: ["RadioGroup", "RadioGroupItem"] },
};

// ── Known React/Next.js/library imports ──
const LIBRARY_COMPONENT_MAP: Record<string, string> = {
  // next
  Link: "next/link",
  Image: "next/image",
  // framer-motion
  motion: "framer-motion",
  AnimatePresence: "framer-motion",
  // sonner
  toast: "sonner",
  Toaster: "sonner",
};

// ── Lucide icon detection ──
const LUCIDE_ICON_REGEX = /\b([A-Z][a-z]+(?:[A-Z][a-z]+)*)\b/g;
const COMMON_LUCIDE_ICONS = new Set([
  "Menu", "X", "ChevronDown", "ChevronUp", "ChevronLeft", "ChevronRight",
  "Search", "Plus", "Minus", "Check", "Copy", "Trash", "Edit", "Pencil",
  "Settings", "User", "Users", "Mail", "Phone", "Calendar", "Clock",
  "Star", "Heart", "Home", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
  "ExternalLink", "Download", "Upload", "File", "Folder", "Image",
  "Camera", "Video", "Music", "Volume", "VolumeX", "Bell", "BellOff",
  "Sun", "Moon", "Cloud", "Zap", "Shield", "Lock", "Unlock", "Key",
  "Eye", "EyeOff", "Filter", "RefreshCw", "RotateCw", "Loader2",
  "AlertCircle", "AlertTriangle", "Info", "HelpCircle", "XCircle",
  "CheckCircle", "Circle", "Square", "Triangle", "Hexagon",
  "BarChart", "LineChart", "PieChart", "TrendingUp", "TrendingDown",
  "LogIn", "LogOut", "Send", "Share", "Bookmark", "Flag",
  "Globe", "Map", "MapPin", "Navigation", "Compass",
  "Wifi", "WifiOff", "Bluetooth", "Battery", "Monitor", "Smartphone",
  "Laptop", "Tablet", "Printer", "Server", "Database", "HardDrive",
  "Code", "Terminal", "GitBranch", "Github", "Linkedin", "Twitter",
  "Facebook", "Instagram", "Youtube", "Twitch", "Slack",
  "DollarSign", "CreditCard", "ShoppingCart", "ShoppingBag", "Package",
  "Truck", "Inbox", "Archive", "Trash2", "MoreHorizontal", "MoreVertical",
  "GripVertical", "GripHorizontal", "Maximize", "Minimize",
  "PanelLeft", "PanelRight", "Sidebar", "LayoutDashboard", "LayoutGrid",
  "List", "ListOrdered", "AlignLeft", "AlignCenter", "AlignRight",
  "Bold", "Italic", "Underline", "Strikethrough", "Type",
  "Heading1", "Heading2", "Heading3", "Quote", "LinkIcon",
  "Paperclip", "Scissors", "Clipboard", "ClipboardCheck",
  "Save", "FileText", "FileCode", "FilePlus", "FileX",
  "FolderOpen", "FolderPlus", "FolderX",
  "Activity", "Gauge", "Thermometer", "Droplet", "Wind",
  "Sparkles", "Wand", "Rocket", "Award", "Trophy", "Target",
  "Crosshair", "MousePointer", "Hand", "ThumbsUp", "ThumbsDown",
  "MessageSquare", "MessageCircle", "MessagesSquare",
  "AtSign", "Hash", "Percent",
  "PlayCircle", "PauseCircle", "StopCircle", "SkipForward", "SkipBack",
  "Repeat", "Shuffle", "FastForward", "Rewind",
  "Layers", "Layout", "Columns", "Rows", "Grid",
  "Move", "Expand", "Shrink", "ZoomIn", "ZoomOut",
  "ToggleLeft", "ToggleRight", "Power", "Plug",
  "Headphones", "Mic", "MicOff", "Speaker",
  "Palette", "Brush", "Eraser", "Pipette",
  "Crop", "FlipHorizontal", "FlipVertical", "RotateCcw",
  "SlidersHorizontal", "Wrench", "Hammer", "Cog",
  "Bug", "TestTube", "Beaker", "FlaskConical",
  "BookOpen", "Library", "GraduationCap", "School",
  "Building", "Factory", "Store", "Warehouse",
  "Car", "Plane", "Train", "Ship", "Bike",
  "Utensils", "Coffee", "Wine", "Pizza", "Apple",
  "Cat", "Dog", "Bird", "Fish", "Bug",
  "Flower", "Trees", "Leaf", "Sprout", "Mountain",
]);

/**
 * Extracts all JSX component names used in a file's JSX (e.g., <Button>, <Card>)
 */
function extractJSXComponents(content: string): Set<string> {
  const components = new Set<string>();
  // Match <ComponentName or <ComponentName> but not <div, <span, <html etc.
  const jsxRegex = /<([A-Z][A-Za-z0-9.]*)\b/g;
  let match: RegExpExecArray | null;
  while ((match = jsxRegex.exec(content)) !== null) {
    const name = match[1];
    // Skip namespaced (motion.div) — handled separately
    if (!name.includes(".")) {
      components.add(name);
    }
  }
  return components;
}

/**
 * Extracts all already-imported identifiers from the file
 */
function extractExistingImports(content: string): Set<string> {
  const imported = new Set<string>();
  // Match: import { A, B, C } from "..."
  const namedImportRegex = /import\s*\{([^}]+)\}\s*from\s*['"][^'"]+['"]/g;
  let match: RegExpExecArray | null;
  while ((match = namedImportRegex.exec(content)) !== null) {
    const names = match[1].split(",").map(s => s.trim().split(" as ")[0].trim());
    names.forEach(n => { if (n) imported.add(n); });
  }
  // Match: import DefaultName from "..."
  const defaultImportRegex = /import\s+([A-Za-z_$][A-Za-z0-9_$]*)\s+from\s*['"][^'"]+['"]/g;
  while ((match = defaultImportRegex.exec(content)) !== null) {
    imported.add(match[1]);
  }
  // Match: import DefaultName, { A, B } from "..." (mixed default + named)
  const mixedImportRegex = /import\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*,\s*\{([^}]+)\}\s*from\s*['"][^'"]+['"]/g;
  while ((match = mixedImportRegex.exec(content)) !== null) {
    imported.add(match[1]); // default export name
    const names = match[2].split(",").map(s => s.trim().split(" as ")[0].trim());
    names.forEach(n => { if (n) imported.add(n); });
  }
  // Match: import * as Name from "..."
  const starImportRegex = /import\s*\*\s*as\s+([A-Za-z_$][A-Za-z0-9_$]*)\s+from\s*['"][^'"]+['"]/g;
  while ((match = starImportRegex.exec(content)) !== null) {
    imported.add(match[1]);
  }
  return imported;
}

/**
 * Extracts all locally defined component names (function/const declarations)
 */
function extractLocalDefinitions(content: string): Set<string> {
  const locals = new Set<string>();
  // function ComponentName
  const funcRegex = /(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([A-Z][A-Za-z0-9]*)/g;
  let match: RegExpExecArray | null;
  while ((match = funcRegex.exec(content)) !== null) {
    locals.add(match[1]);
  }
  // const ComponentName =
  const constRegex = /(?:export\s+)?const\s+([A-Z][A-Za-z0-9]*)\s*[:=]/g;
  while ((match = constRegex.exec(content)) !== null) {
    locals.add(match[1]);
  }
  // interface/type names
  const typeRegex = /(?:export\s+)?(?:interface|type)\s+([A-Z][A-Za-z0-9]*)/g;
  while ((match = typeRegex.exec(content)) !== null) {
    locals.add(match[1]);
  }
  return locals;
}

/**
 * MAIN FUNCTION: Auto-heal all files in a generated project.
 * Runs BEFORE files are written to sandbox.
 * Returns the healed files map.
 */
export function autoHealAllFiles(files: Record<string, string>): Record<string, string> {
  const healed = { ...files };
  let totalFixes = 0;

  for (const [filePath, content] of Object.entries(healed)) {
    if (!/\.(tsx?|jsx?)$/.test(filePath)) continue;
    if (filePath === "package.json") continue;
    if (filePath.includes("components/ui/")) continue; // Don't modify UI primitives

    const result = autoHealFileImports(filePath, content, healed);
    if (result.content !== content) {
      healed[filePath] = result.content;
      totalFixes += result.fixCount;
    }
  }

  // ── Dependency Reconciliation ──
  // Scan all files for library imports and ensure they are in package.json
  const requiredPackages = new Set<string>();
  for (const [filePath, content] of Object.entries(healed)) {
    if (!/\.(tsx?|jsx?)$/.test(filePath)) continue;
    
    // Simple regex to find imports from node_modules (non-relative, non-alias)
    const importRegex = /import\s+[\s\S]*?from\s+['"](@?[a-z0-9-][a-z0-9-._/]*?)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const pkg = match[1];
      // Skip relative imports and internal aliases
      if (pkg.startsWith(".") || pkg.startsWith("@/")) continue;
      
      // Get the base package name (e.g., @radix-ui/react-textarea -> @radix-ui/react-textarea)
      // but handle scoped packages and sub-paths
      const parts = pkg.split("/");
      const basePkg = pkg.startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
      
      // Only track common UI/Next libraries we know we might need to heal
      if (basePkg.startsWith("@radix-ui/") || 
          basePkg === "lucide-react" || 
          basePkg === "framer-motion" || 
          basePkg === "sonner" ||
          basePkg === "clsx" ||
          basePkg === "tailwind-merge") {
        requiredPackages.add(basePkg);
      }
    }
  }

  if (requiredPackages.size > 0 && healed["package.json"]) {
    try {
      const pkgJson = JSON.parse(healed["package.json"]);
      pkgJson.dependencies = pkgJson.dependencies || {};
      let pkgFixes = 0;

      for (const reqPkg of requiredPackages) {
        if (!pkgJson.dependencies[reqPkg]) {
          // Use a reasonable default version if missing (or "*" to let npm decide)
          pkgJson.dependencies[reqPkg] = "latest";
          pkgFixes++;
        }
      }

      if (pkgFixes > 0) {
        healed["package.json"] = JSON.stringify(pkgJson, null, 2);
        console.log(`[auto-heal] 📦 Injected ${pkgFixes} missing packages into package.json`);
      }
    } catch (e) {
      console.warn("[auto-heal] Failed to parse package.json for dependency reconciliation");
    }
  }

  if (totalFixes > 0) {
    console.log(`[auto-heal] 🩹 Fixed ${totalFixes} missing imports across ${Object.keys(healed).length} files`);
  }

  // ── Cross-File Import/Export Validation ──
  // Scans all files for named imports from @/ paths, verifies the target file
  // actually exports those names. If not, rewrites the import to use the closest matching export.
  let crossFileFixes = 0;
  for (const [filePath, content] of Object.entries(healed)) {
    if (!/\.(tsx?|jsx?)$/.test(filePath)) continue;

    // Find all named imports from @/ paths
    const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]@\/([^'"]+)['"]/g;
    let importMatch;
    let fixedContent = content;

    while ((importMatch = importRegex.exec(content)) !== null) {
      const importedNames = importMatch[1].split(",").map(s => s.trim().split(" as ")[0].trim()).filter(Boolean);
      const importPath = importMatch[2]; // e.g., "lib/data"

      // Resolve the target file path (try .ts, .tsx, /index.ts, /index.tsx)
      const candidates = [
        importPath + ".ts",
        importPath + ".tsx",
        importPath + "/index.ts",
        importPath + "/index.tsx",
        importPath,
      ];

      let targetContent: string | undefined;
      for (const candidate of candidates) {
        if (healed[candidate]) {
          targetContent = healed[candidate];
          break;
        }
        // Also try with app/ prefix
        if (healed["app/" + candidate]) {
          targetContent = healed["app/" + candidate];
          break;
        }
      }

      if (!targetContent) continue; // Can't validate — file not in this generation batch

      // Extract all exports from the target file
      const exportNames = new Set<string>();
      // Named exports: export const/function/class Name
      const namedExportRegex = /export\s+(?:const|let|function|class|type|interface|enum|async\s+function)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g;
      let em;
      while ((em = namedExportRegex.exec(targetContent)) !== null) {
        exportNames.add(em[1]);
      }
      // Destructured exports: export const { a, b } = ...
      const destructuredExportRegex = /export\s+const\s+\{([^}]+)\}/g;
      while ((em = destructuredExportRegex.exec(targetContent)) !== null) {
        em[1].split(",").forEach(s => {
          const name = s.trim().split(":")[0].trim();
          if (name) exportNames.add(name);
        });
      }
      // Re-exports: export { Name } from "..."
      const reExportRegex = /export\s*\{([^}]+)\}/g;
      while ((em = reExportRegex.exec(targetContent)) !== null) {
        em[1].split(",").forEach(s => {
          const name = s.trim().split(" as ").pop()?.trim();
          if (name) exportNames.add(name);
        });
      }

      if (exportNames.size === 0) continue;

      // Check each imported name against the exports
      for (const importedName of importedNames) {
        if (exportNames.has(importedName)) continue; // ✅ Valid

        // ❌ Mismatch! Try fuzzy match by function purpose
        const exportArray = Array.from(exportNames);
        // Find closest match by lowercase similarity
        const lowerImport = importedName.toLowerCase();
        const bestMatch = exportArray.find(e => {
          const le = e.toLowerCase();
          // Check if they share key words (e.g., getMovies ↔ getCategories both start with "get")
          return le.includes(lowerImport.slice(3)) || lowerImport.includes(le.slice(3));
        }) || exportArray.find(e => e.toLowerCase().startsWith(lowerImport.slice(0, 3)));

        if (bestMatch) {
          // Replace the specific import name
          fixedContent = fixedContent.replace(
            new RegExp(`\\b${importedName}\\b`, 'g'),
            bestMatch
          );
          console.log(`[cross-file-heal] 🔗 ${filePath}: ${importedName} → ${bestMatch} (from @/${importPath})`);
          crossFileFixes++;
        } else {
          console.warn(`[cross-file-heal] ⚠️ ${filePath}: import { ${importedName} } from "@/${importPath}" — export not found! Available: ${exportArray.join(", ")}`);
        }
      }
    }

    if (fixedContent !== content) {
      healed[filePath] = fixedContent;
    }
  }

  if (crossFileFixes > 0) {
    console.log(`[cross-file-heal] 🔗 Fixed ${crossFileFixes} import/export mismatches`);
  }

  // ── Default/Named Import-Export Reconciliation ──
  // The #1 cause of "Element type is invalid: got undefined" runtime errors in big apps.
  // When AI generates 10-20+ component files, it inconsistently mixes default vs named exports:
  //   page.tsx:    import Navbar from "@/components/Navbar"     (default import)
  //   Navbar.tsx:  export function Navbar() { ... }             (named export, NO default)
  // → Navbar is undefined at runtime → crash.
  // This phase detects and fixes the mismatch BEFORE files reach the sandbox.
  let defaultImportFixes = 0;
  for (const [filePath, content] of Object.entries(healed)) {
    if (!/\.(tsx?|jsx?)$/.test(filePath)) continue;

    // Find all default imports from @/ paths:
    //   import Navbar from "@/components/Navbar"
    //   import Hero from "@/components/Hero"
    // But NOT: import React from "react" (no @/ prefix)
    // But NOT: import { Button } from "@/components/ui/button" (named import)
    const defaultImportRegex = /import\s+([A-Z][A-Za-z0-9_$]*)\s+from\s*['"]@\/([^'"]+)['"]/g;
    let dimMatch;
    let fixedContent = healed[filePath]; // use healed version (may have been modified by cross-file step)

    while ((dimMatch = defaultImportRegex.exec(content)) !== null) {
      const importedName = dimMatch[1]; // e.g. "Navbar"
      const importPath = dimMatch[2];   // e.g. "components/Navbar"

      // Resolve the target file
      const candidates = [
        importPath + ".ts",
        importPath + ".tsx",
        importPath + "/index.ts",
        importPath + "/index.tsx",
        importPath,
      ];

      let targetFilePath: string | undefined;
      let targetContent: string | undefined;
      for (const candidate of candidates) {
        if (healed[candidate]) {
          targetFilePath = candidate;
          targetContent = healed[candidate];
          break;
        }
        if (healed["app/" + candidate]) {
          targetFilePath = "app/" + candidate;
          targetContent = healed["app/" + candidate];
          break;
        }
      }

      if (!targetContent || !targetFilePath) continue; // Target not in this batch

      // Check if target has a default export
      const hasDefaultExport = /export\s+default\s+/.test(targetContent);

      if (hasDefaultExport) continue; // ✅ Default import matches default export — all good

      // ❌ MISMATCH: default import but target has NO default export
      // Check if the target has a named export matching the imported name
      const hasMatchingNamedExport = new RegExp(
        `export\\s+(?:const|function|class|async\\s+function)\\s+${importedName}\\b`
      ).test(targetContent);

      if (hasMatchingNamedExport) {
        // Strategy A: Rewrite the import from default to named
        // import Navbar from "@/..." → import { Navbar } from "@/..."
        const oldImport = dimMatch[0]; // full match: import Navbar from "@/components/Navbar"
        const newImport = `import { ${importedName} } from "@/${importPath}"`;
        fixedContent = fixedContent.replace(oldImport, newImport);
        console.log(`[default-import-heal] 🔗 ${filePath}: ${importedName} — rewrote default import to named (target has named export)`);
        defaultImportFixes++;
      } else {
        // Strategy B: Target has a function/const with this name but doesn't export it,
        // OR target has an export default with a different name.
        // Check if there's a matching function/const (not exported default)
        const hasLocalDef = new RegExp(
          `(?:function|const|class)\\s+${importedName}\\b`
        ).test(targetContent);

        if (hasLocalDef) {
          // Add "export default <name>;" at the end of the target file
          healed[targetFilePath] = targetContent.trimEnd() + `\n\nexport default ${importedName};\n`;
          console.log(`[default-import-heal] 🔗 ${targetFilePath}: added "export default ${importedName}" to match default import in ${filePath}`);
          defaultImportFixes++;
        } else {
          // Last resort: check if target exports anything we can alias
          // e.g. target exports "export function NavBar()" (case difference)
          const anyExportMatch = targetContent.match(
            /export\s+(?:const|function|class|async\s+function)\s+([A-Z][A-Za-z0-9_$]*)/
          );
          if (anyExportMatch) {
            const actualExportName = anyExportMatch[1];
            // Rewrite import to use the actual name
            const oldImport = dimMatch[0];
            const newImport = `import { ${actualExportName} as ${importedName} } from "@/${importPath}"`;
            fixedContent = fixedContent.replace(oldImport, newImport);
            console.log(`[default-import-heal] 🔗 ${filePath}: ${importedName} — aliased to ${actualExportName} (no default export, no exact match)`);
            defaultImportFixes++;
          }
        }
      }
    }

    if (fixedContent !== healed[filePath]) {
      healed[filePath] = fixedContent;
    }
  }

  if (defaultImportFixes > 0) {
    console.log(`[default-import-heal] 🔗 Fixed ${defaultImportFixes} default/named import-export mismatches`);
  }

  return healed;
}

/**
 * Auto-heal a single file's imports
 */
function autoHealFileImports(
  filePath: string,
  content: string,
  allFiles: Record<string, string>
): { content: string; fixCount: number } {
  const usedComponents = extractJSXComponents(content);
  const existingImports = extractExistingImports(content);
  const localDefs = extractLocalDefinitions(content);
  let fixCount = 0;

  // Collect missing imports grouped by source file
  const missingBySource: Record<string, Set<string>> = {};

  for (const comp of Array.from(usedComponents)) {
    // Skip if already imported or locally defined
    if (existingImports.has(comp) || localDefs.has(comp)) continue;

    // 1. Check Shadcn component map
    if (SHADCN_COMPONENT_MAP[comp]) {
      const info = SHADCN_COMPONENT_MAP[comp];
      const source = `@/${info.file}`;
      if (!missingBySource[source]) missingBySource[source] = new Set();
      // Add all exports from this component file so we don't miss siblings
      const usedFromSameFile = Array.from(usedComponents).filter(c =>
        SHADCN_COMPONENT_MAP[c]?.file === info.file && !existingImports.has(c) && !localDefs.has(c)
      );
      usedFromSameFile.forEach(c => missingBySource[source].add(c));
      continue;
    }

    // 2. Check library components (Link, Image, motion, toast, etc.)
    if (LIBRARY_COMPONENT_MAP[comp]) {
      const source = LIBRARY_COMPONENT_MAP[comp];
      if (!missingBySource[source]) missingBySource[source] = new Set();
      missingBySource[source].add(comp);
      continue;
    }

    // 3. Check if it's a Lucide icon
    if (COMMON_LUCIDE_ICONS.has(comp) && content.includes(`<${comp}`)) {
      const source = "lucide-react";
      if (!missingBySource[source]) missingBySource[source] = new Set();
      missingBySource[source].add(comp);
      continue;
    }
  }

  // Also check for non-JSX usage patterns: toast("..."), motion.div, etc.
  if (content.includes("toast(") && !existingImports.has("toast")) {
    if (!missingBySource["sonner"]) missingBySource["sonner"] = new Set();
    missingBySource["sonner"].add("toast");
  }
  if (content.includes("motion.") && !existingImports.has("motion")) {
    if (!missingBySource["framer-motion"]) missingBySource["framer-motion"] = new Set();
    missingBySource["framer-motion"].add("motion");
  }
  if (content.includes("AnimatePresence") && !existingImports.has("AnimatePresence")) {
    if (!missingBySource["framer-motion"]) missingBySource["framer-motion"] = new Set();
    missingBySource["framer-motion"].add("AnimatePresence");
  }
  if (content.includes("cn(") && !existingImports.has("cn")) {
    if (!missingBySource["@/lib/utils"]) missingBySource["@/lib/utils"] = new Set();
    missingBySource["@/lib/utils"].add("cn");
  }
  if (content.includes("useRouter(") && !existingImports.has("useRouter")) {
    if (!missingBySource["next/navigation"]) missingBySource["next/navigation"] = new Set();
    missingBySource["next/navigation"].add("useRouter");
  }
  if (content.includes("usePathname(") && !existingImports.has("usePathname")) {
    if (!missingBySource["next/navigation"]) missingBySource["next/navigation"] = new Set();
    missingBySource["next/navigation"].add("usePathname");
  }
  if (content.includes("useSearchParams(") && !existingImports.has("useSearchParams")) {
    if (!missingBySource["next/navigation"]) missingBySource["next/navigation"] = new Set();
    missingBySource["next/navigation"].add("useSearchParams");
  }
  if (content.includes("clsx(") && !existingImports.has("clsx")) {
    if (!missingBySource["clsx"]) missingBySource["clsx"] = new Set();
    missingBySource["clsx"].add("clsx");
  }
  // React hooks
  if (/\buseState\b/.test(content) && !existingImports.has("useState")) {
    if (!missingBySource["react"]) missingBySource["react"] = new Set();
    missingBySource["react"].add("useState");
  }
  if (/\buseEffect\b/.test(content) && !existingImports.has("useEffect")) {
    if (!missingBySource["react"]) missingBySource["react"] = new Set();
    missingBySource["react"].add("useEffect");
  }
  if (/\buseRef\b/.test(content) && !existingImports.has("useRef")) {
    if (!missingBySource["react"]) missingBySource["react"] = new Set();
    missingBySource["react"].add("useRef");
  }
  if (/\buseMemo\b/.test(content) && !existingImports.has("useMemo")) {
    if (!missingBySource["react"]) missingBySource["react"] = new Set();
    missingBySource["react"].add("useMemo");
  }
  if (/\buseCallback\b/.test(content) && !existingImports.has("useCallback")) {
    if (!missingBySource["react"]) missingBySource["react"] = new Set();
    missingBySource["react"].add("useCallback");
  }

  // Build import lines (with dedup safety net)
  if (Object.keys(missingBySource).length === 0) {
    return { content, fixCount: 0 };
  }

  // Safety: re-scan content for ALL imported names to catch edge cases
  const allImportedNames = extractExistingImports(content);

  const importLines: string[] = [];
  for (const [source, names] of Object.entries(missingBySource)) {
    // Filter out any names that are actually already imported (safety net)
    const trulyMissing = Array.from(names).filter(n => !allImportedNames.has(n));
    if (trulyMissing.length === 0) continue;
    const nameList = trulyMissing.sort();
    // Default imports (Link, Image)
    if (source === "next/link" && names.has("Link")) {
      importLines.push(`import Link from "next/link";`);
      fixCount++;
      continue;
    }
    if (source === "next/image" && names.has("Image")) {
      importLines.push(`import Image from "next/image";`);
      fixCount++;
      continue;
    }
    importLines.push(`import { ${nameList.join(", ")} } from "${source}";`);
    fixCount += nameList.length;
  }

  // Insert after existing imports or at the top (after "use client" if present)
  let newContent = content;
  const useClientMatch = newContent.match(/^(['"]use client['"];?\s*\n)/);
  const lastImportMatch = newContent.match(/^([\s\S]*import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*\n)/);

  if (lastImportMatch) {
    // Find the position after the last import line
    const allImportRegex = /import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*\n/g;
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = allImportRegex.exec(newContent)) !== null) {
      lastIndex = m.index + m[0].length;
    }
    newContent = newContent.slice(0, lastIndex) + importLines.join("\n") + "\n" + newContent.slice(lastIndex);
  } else if (useClientMatch) {
    // Insert after "use client"
    const pos = useClientMatch[0].length;
    newContent = newContent.slice(0, pos) + importLines.join("\n") + "\n" + newContent.slice(pos);
  } else {
    // Insert at the very top
    newContent = importLines.join("\n") + "\n" + newContent;
  }

  if (fixCount > 0) {
    console.log(`[auto-heal] 🩹 ${filePath}: injected ${fixCount} missing imports`);
  }

  return { content: newContent, fixCount };
}
