export const DEVX_ALWAYS_GENERATED_FILES = [
  "package.json",
  "tsconfig.json",
  "next.config.ts",
  "postcss.config.mjs",
  ".env.example",
  "app/globals.css",
  "app/layout.tsx",
  "app/page.tsx",
  "lib/utils.ts",
  "components/ui/button.tsx",
  "components/ui/card.tsx",
] as const;

export const DEVX_CORE_REQUIRED_FILES = [
  "package.json",
  "tsconfig.json",
  "next.config.ts",
  "postcss.config.mjs",
  "app/globals.css",
  "app/layout.tsx",
  "app/page.tsx",
  "lib/utils.ts",
] as const;

export const DEVX_FORBIDDEN_GENERATED_FILES = [
  "middleware.ts",
  "middleware.js",
  "middleware.jsx",
  "src/middleware.ts",
  "next.config.js",
  "next.config.mjs",
  "tailwind.config.ts",
  "tailwind.config.js",
  "tailwind.config.mjs",
] as const;

export const DEVX_OPTIONAL_FILE_RULES = [
  "components/ui/input.tsx -> when forms are present",
  "components/ui/label.tsx -> when form labels are present",
  "components/ui/textarea.tsx -> when textarea UI is present",
  "components/ui/badge.tsx -> when tags or status pills are present",
  "components/ui/dialog.tsx -> when modals are present",
  "components/ui/select.tsx -> when dropdown selects are present",
  "components/ui/tabs.tsx -> when tabs are present",
  "components/ui/skeleton.tsx -> when loading states are present",
  "components/ui/avatar.tsx -> when user avatars are present",
  "components/ui/separator.tsx -> when visual dividers are present",
  "components/ui/scroll-area.tsx -> when scrollable panes are present",
  "components/ui/tooltip.tsx -> when tooltips are present",
  "components/ui/switch.tsx -> when toggles are present",
  "components/ui/checkbox.tsx -> when checkboxes are present",
  "components/ui/dropdown-menu.tsx -> when action menus are present",
  "app/api/**/route.ts -> when APIs are needed",
  "lib/auth.ts -> when local auth is needed",
  "lib/db.ts -> when persistence is needed",
  "prisma/schema.prisma -> when persistence is needed",
] as const;

export function canonicalizeDevxGeneratedPath(path: string): string {
  let cleanPath = path.replace(/\\/g, "/").trim();
  cleanPath = cleanPath.replace(/^\.\//, "").replace(/^\/+/, "");
  // Strip absolute sandbox paths the AI sometimes hallucinates
  cleanPath = cleanPath.replace(/^home\/user\/app\//, "");
  // Loop: keep stripping duplicated directory prefixes until stable
  // Catches app/app/page.tsx, app/app/app/page.tsx, components/components/Button.tsx, etc.
  let prev = "";
  while (prev !== cleanPath) {
    prev = cleanPath;
    cleanPath = cleanPath.replace(/^(app|components|lib|src)\/\1\//, "$1/");
  }
  cleanPath = cleanPath.replace(/^src\//, "");
  return cleanPath;
}

export function getMissingDevxAlwaysFiles(paths: Iterable<string>): string[] {
  const normalized = new Set(
    Array.from(paths, (path) => canonicalizeDevxGeneratedPath(path))
  );
  return DEVX_ALWAYS_GENERATED_FILES.filter((path) => !normalized.has(path));
}

export function getMissingDevxCoreFiles(paths: Iterable<string>): string[] {
  const normalized = new Set(
    Array.from(paths, (path) => canonicalizeDevxGeneratedPath(path))
  );
  return DEVX_CORE_REQUIRED_FILES.filter((path) => !normalized.has(path));
}

export function getDevxAppSchemaPrompt(): string {
  return `
DEVX APP SCHEMA - CANONICAL FILE CONTRACT

Use root-level paths only. Never prefix generated files with src/.

Always generate:
${DEVX_ALWAYS_GENERATED_FILES.map((path) => `- ${path}`).join("\n")}

Generate when needed:
${DEVX_OPTIONAL_FILE_RULES.map((rule) => `- ${rule}`).join("\n")}

Never generate:
${DEVX_FORBIDDEN_GENERATED_FILES.map((path) => `- ${path}`).join("\n")}
`.trim();
}
