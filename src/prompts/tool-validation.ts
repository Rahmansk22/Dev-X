/**
 * TOOL VALIDATION PROMPT - Compressed Sandbox Rules
 */

export const TOOL_VALIDATION_PROMPT = `
## SANDBOX ENVIRONMENT

TOOLS:
- createOrUpdateFiles: Write files to sandbox
- terminal: Run commands (npm install <pkg> --yes)
- readFiles: Read existing files

PRE-INSTALLED: React, Next.js, Shadcn UI (@/components/ui/*), Tailwind, Lucide React, Radix UI
MUST INSTALL: framer-motion, zod, react-hook-form, date-fns, @dnd-kit/*, axios, etc.

## PATH RULES (CRITICAL)

✅ File paths: app/page.tsx, lib/utils.ts, components/button.tsx
✅ Imports: @/components/ui/button, @/lib/utils  
❌ File paths with @/: createOrUpdateFiles("@/app/page.tsx") ← WRONG
❌ Absolute paths: /home/user/app/page.tsx ← WRONG

## CLIENT/SERVER BOUNDARY

"use client" on LINE 1 for:
- useState, useEffect, useRef hooks
- onClick, onChange handlers
- Browser APIs (localStorage, window)

Server components (NO "use client"):
- async/await data fetching
- Database access
- File system operations

## COMMON BUILD ERRORS TO PREVENT

❌ "Cannot find module 'X'" → npm install X --yes FIRST
❌ "Module not found: '../utils'" → Use @/lib/utils
❌ "Invalid src prop on next/image" → Add domain to next.config.ts images.remotePatterns
❌ "Cannot use Hook in server component" → Add "use client"
❌ "Export default doesn't exist" → Match import syntax to export (named vs default)
❌ "is not an existing route" → Disable experimental.typedRoutes in next.config.ts OR import type { Route } from "next" and use <Link href={"/path" as Route} />

❌ "React is not defined" → If you use React.forwardRef, React.useState, React.memo, or any runtime React.* API, add import * as React from "react" or switch to named imports
❌ "Phone is not defined" / "MapPin is not defined" → Lucide icon JSX is missing imports; add every used icon to import { Phone, MapPin } from "lucide-react"

## IMPORT VALIDATION

BEFORE writing any file:
1. List all imports needed
2. Verify each package is installed or pre-installed
3. Verify each local file exists
4. Match import syntax: export function X → import { X }, export default X → import X

## FILE STRUCTURE RULES

Single component: components/calculator.tsx
Component with subfiles: 
  components/calculator/index.tsx (main)
  components/calculator/display.tsx (sub)
  
❌ NEVER: components/calculator.tsx + components/calculator/display.tsx

## EXTERNAL IMAGES

BEFORE using Image with external URLs, add to next.config.ts:
\`\`\`ts
const config = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org', pathname: '/t/p/**' },
    ],
  },
};
\`\`\`

## SHADCN RULES

✅ Prefer tested shadcn primitives for Button, Card, Input, Label, Badge, Tabs, Dialog, Sheet, DropdownMenu, Select, Separator, Skeleton, Alert, Form
✅ Individual imports: import { Button } from "@/components/ui/button"
❌ Group imports: import { Button, Card } from "@/components/ui"
❌ Never import from "shadcn/ui"; use "@/components/ui/<component>"
✅ SelectItem value="all" (non-empty)
❌ SelectItem value="" (empty = error)

## NEXT.JS 15 APP ROUTER

- Pages: app/*/page.tsx → export default function Page()
- Layouts: app/*/layout.tsx → export default function Layout({ children })
- API: app/api/*/route.ts → export async function GET/POST(req)
- Metadata: export const metadata = {} (server components only)
- Error: app/*/error.tsx → "use client" required
- If you use runtime React namespace APIs like React.forwardRef or React.useState, MUST import: \`import * as React from "react"\`
- If you use Lucide icon JSX like <Phone />, <MapPin />, <ShoppingCart />, or <Coffee />, MUST import every icon from "lucide-react"

## PROVIDERS RULE (CRITICAL)

If layout.tsx wraps {children} in a <Providers> component, you MUST also generate an app/providers.tsx file:
\`\`\`tsx
"use client";
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
\`\`\`
❌ NEVER reference <Providers> in layout.tsx without creating the providers.tsx file
❌ NEVER use a default import for Providers if it's a named export (and vice versa)
✅ If no context providers are needed, do NOT use <Providers> — just render {children} directly in layout.tsx

## FULL-STACK ARCHITECTURE (CRITICAL)

When the user requests a full-stack application, database, or authentication, YOU MUST FOLLOW THESE RULES:

1. DATABASE: 
   - ALWAYS use Prisma with SQLite. Set \`provider = "sqlite"\` and \`url = "file:./dev.db"\` in schema.prisma.
   - NEVER use PostgreSQL, MySQL, or MongoDB as they require external credentials.
   - Example schema.prisma:
     \`\`\`prisma
     datasource db {
       provider = "sqlite"
       url      = "file:./dev.db"
     }
     generator client {
       provider = "prisma-client-js"
     }
     \`\`\`
   - ALWAYS run \`npm install prisma @prisma/client --yes\` in the terminal.

2. AUTHENTICATION (FULL-STACK LOCAL AUTH):
   - NEVER configure NextAuth, Auth.js, Clerk, or OAuth providers unless explicitly requested. They will crash the sandbox without secrets.
   - ALWAYS build a custom full-stack auth flow using the SQLite database:
     1. Create a \`User\` model in \`schema.prisma\`.
     2. Create Next.js API routes (\`/api/auth/register\` and \`/api/auth/login\`) that write/read users from the SQLite database.
     3. On the frontend, use React Context to manage the user state and store a session token/user data in \`localStorage\`.
     4. Protect routes using a Client Component wrapper (e.g., \`<ProtectedRoute>\`) that checks the localStorage state.
   - NEVER use \`middleware.ts\` for route protection as it is explicitly banned in the sandbox environment.
`;

