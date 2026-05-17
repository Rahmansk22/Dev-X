/**
 * CODE GENERATION GUARD - Pre/Post Validation System
 * Enforces ALL rules BEFORE and AFTER code generation
 * LLMs must use this to prevent mistakes
 */

export const CODE_GENERATION_GUARD = `
## 🛡️ PRE-GENERATION CHECKLIST (Agent MUST answer ALL before coding)

Before generating ANY code, answer these questions:

1. IMPORTS AUDIT
   [ ] What packages will I import?
   [ ] Are they pre-installed? (React, Next.js, Tailwind, Lucide, Shadcn UI, Radix UI)
   [ ] Which must be installed first? (framer-motion, zod, react-hook-form, date-fns, etc.)
   [ ] Example: If using 'cn', I MUST import from @/lib/utils
   [ ] Will I use React.forwardRef? → Must import: import * as React from 'react'

2. CLIENT vs SERVER BOUNDARY
   [ ] Does this file use useState/useEffect/useRef? → Add "use client"
   [ ] Does it have onClick/onChange handlers? → Add "use client"
   [ ] Does it access window/localStorage? → Add "use client"
   [ ] Does it ONLY fetch data? → NO "use client" needed
   Decision: "use client" ON LINE 1? YES / NO

3. HOOKS VALIDATION
   [ ] Will I call hooks AFTER any if/else statements? → STOP, violates rules
   [ ] Will I call hooks inside loops? → STOP, violates rules
   [ ] Will I conditionally call hooks (if user) { useQuery() }? → STOP, violates rules
   [ ] All hooks are at TOP LEVEL? → YES = proceed, NO = restructure

4. IMPORT PATHS CHECK
   [ ] Will I use relative paths like '../utils'? → WRONG, use @/lib/utils
   [ ] Will I use @/ in file creation path? → WRONG, use app/page.tsx not @/app/page.tsx
   [ ] All paths are correct format? → YES = proceed

5. JSX CONTENT AUDIT
   [ ] Will my JSX contain apostrophes like "It's"? → Must escape: It&apos;s
   [ ] Will my JSX contain quotes like "Hello"? → Must escape: &quot;Hello&quot;
   [ ] Any special characters? → Check escape rules

6. VARIABLE LIFECYCLE
   [ ] Will I declare any variable and NOT use it? → STOP, remove it
   [ ] If unused intentionally? → Prefix with _ (like _temp)
   [ ] All declared variables are used? → YES = proceed

7. STRING LITERAL AUDIT
   [ ] Will my mock data or metadata contain quotes or apostrophes? → Use backticks (\` \` \`) for safety.
   [ ] Any nested quotes found? → Use backticks.
   [ ] All strings are syntax-safe? → YES = proceed

---

## ✅ POST-GENERATION AUDIT (Agent MUST verify ALL before returning)

After generating code, run this validation:

### BLOCK 1: IMPORT VALIDATION
\`\`\`
For each import statement:
  ❌ import { Button, Card } from "@/components/ui"  
  ✅ import { Button } from "@/components/ui/button"
  ✅ import { Card } from "@/components/ui/card"
  ✅ Prefer tested shadcn primitives from "@/components/ui/<component>" before creating custom primitive UI

For local imports:
  ❌ import { cn } from '../lib/utils'
  ✅ import { cn } from '@/lib/utils'

Missing imports:
  ❌ No import for 'cn' but used in className={cn(...)}
  ✅ Add: import { cn } from '@/lib/utils'
\`\`\`

### BLOCK 2: HOOKS ORDER CHECK
\`\`\`
Scan entire function body BEFORE first if/else:
  ❌ if (user) { useQuery(...) }
  ❌ for (let i = 0; i < 5; i++) { useState() }
  ❌ if (condition) { useEffect(...) }
  
  ✅ useQuery(...)              // TOP LEVEL
  ✅ if (!data) return null;   // THEN check result
  ✅ return <Component data={data} />

If any hook inside if/else/loop: FIX before returning
\`\`\`

### BLOCK 3: CLIENT BOUNDARY CHECK
\`\`\`
Find "use client"?
  ❌ Missing but file has useState → ADD "use client" on LINE 1
  ❌ Missing but file has onClick → ADD "use client" on LINE 1
  ❌ Missing but accesses window → ADD "use client" on LINE 1
  
  ✅ "use client" present and file uses hooks ✓
  ✅ No "use client" and file only fetches data ✓
\`\`\`

### BLOCK 4: JSX ENTITY CHECK
\`\`\`
Scan all JSX text content:
  ❌ <p>It's working</p>
  ❌ <h1>The "best" app</h1>
  
  ✅ <p>It&apos;s working</p>
  ✅ <h1>The &quot;best&quot; app</h1>
  ✅ <p>It{"'"}s working</p>  // Alternative

If apostrophes/quotes found in JSX text: FIX before returning
\`\`\`

### BLOCK 5: UNUSED VARIABLE AUDIT
\`\`\`
For each const/let/const [...] = :
  ❌ const [unused, setUnused] = useState(0);  // Never used
  ❌ let tempVar = "hello";  // Never referenced
  
  ✅ const [count, setCount] = useState(0);
     setCount(count + 1);  // Used ✓
     
  ✅ const [_temp, setTemp] = useState(0);  // Prefixed with _ ✓

If unused variable found: REMOVE or prefix with _ before returning
\`\`\`

### BLOCK 6: EXPORT/IMPORT MATCHING
\`\`\`
Check all imports match exports:
  ❌ export default function Page()
     import { Page } from './page'  ← WRONG (named import for default export)
  
  ❌ export const Button = () => {}
     import Button from './button'  ← WRONG (default import for named export)
  
  ✅ export const Button = () => {}
     import { Button } from './button'
  
  ✅ export default function Page() {}
     import Page from './page'

If mismatch found: FIX before returning
\`\`\`

### BLOCK 7: TYPESCRIPT COMMENTS
\`\`\`
Check for @ts-ignore:
  ❌ // @ts-ignore
     const x = something();
  
  ✅ // @ts-expect-error - TODO: fix later
     const x = something();

If @ts-ignore found: REPLACE with @ts-expect-error before returning
\`\`\`

### BLOCK 8: NEXT.JS IMAGE USAGE
\`\`\`
Check all images:
  ❌ <img src="/photo.jpg" alt="photo" />
  
  ✅ import Image from 'next/image';
     <Image src="/photo.jpg" alt="photo" width={100} height={100} />

If external image URL:
  ✅ Add domain to next.config.ts images.remotePatterns FIRST

If <img> tag found: CONVERT to next/image or verify <img> is correct
\`\`\`

### BLOCK 9: COMMON RUNTIME ERRORS
\`\`\`
Check for these patterns:

❌ Accessing property on possibly undefined:
   const name = user.name  ← If user could be undefined
   ✅ const name = user?.name

❌ Calling undefined as function:
   onClick={() => callback()}  ← If callback may not exist
   ✅ onClick={() => callback?.()}

❌ Missing onChange on controlled input:
   <input value={text} />  ← NO onChange
   ✅ <input value={text} onChange={(e) => setText(e.target.value)} />

❌ No dependency array on useEffect:
   useEffect(() => { ... })  ← Missing array, infinite loop
   ✅ useEffect(() => { ... }, [dependency])

❌ Using hallucinated useToast() hook:
   const toast = useToast()  ← WRONG
   ✅ import { toast } from "sonner"
      toast.success("...")

If patterns found: FIX before returning
\`\`\`

### BLOCK 10: FILE PATH VALIDATION
\`\`\`
Check all file creation paths:
  ❌ createOrUpdateFiles("@/app/page.tsx")  ← Using @ in path
  ❌ createOrUpdateFiles("/home/user/app/page.tsx")  ← Absolute path
  
  ✅ createOrUpdateFiles("app/page.tsx")
  ✅ createOrUpdateFiles("src/components/button.tsx")
  ✅ createOrUpdateFiles("lib/utils.ts")

If wrong paths found: FIX before returning
\`\`\`

### BLOCK 11: INSTALLATION ORDER
\`\`\`
Check npm install commands:
  ❌ Creating code that uses 'framer-motion' but no npm install
  ❌ Using 'zod' without installing first
  
  ✅ npm install --yes framer-motion  ← BEFORE using in code
  ✅ npm install --yes zod
  ✅ Then create files that import these

If package used without install: ADD npm install command FIRST
\`\`\`

### BLOCK 12: STRUCTURAL INTEGRITY CHECK (CRITICAL FOR BIG APPS)
\`\`\`
For EVERY internal import starting with "@/":
  ❌ import { Button } from "@/components/ui/button" 
     (But I didn't create components/ui/button.tsx) ← FAIL
  
  ✅ import { Button } from "@/components/ui/button"
     (And I included components/ui/button.tsx in my tool call) ✓

Hallucination Alert (CRITICAL):
  ❌ import Providers from "@/components/providers" 
     (But I didn't create components/providers.tsx) ← FAIL
  
  ❌ import Providers from "@/components/providers"
     (But components/providers.tsx uses 'export function Providers') ← FAIL (Mixed default/named)

CROSS-FILE EXPORT NAME MATCHING (CRITICAL — BUILD BREAKER):
  ❌ import { getMovies } from "@/lib/data"
     (But lib/data.ts exports: categories, getCategories) ← FAIL: getMovies does NOT exist
  
  ❌ import { fetchPosts } from "@/lib/api"
     (But lib/api.ts exports: getPosts, createPost) ← FAIL: fetchPosts does NOT exist
  
  ✅ BEFORE writing any import, verify the EXACT export name in the target file.
  ✅ If you create lib/data.ts with "export function getCategories()", 
     then page.tsx MUST import { getCategories } — NOT { getMovies }.
  ✅ The function/variable name in the import MUST be IDENTICAL to the export name.

  ✅ I have verified that EVERY file I import from exists in my generation queue.
  ✅ I have verified that Default Imports match Default Exports.
  ✅ I have verified that EVERY named import matches an actual named export in the target file.
\`\`\`

### BLOCK 13: STYLING & LAYOUT AUDIT
\`\`\`
Check the root of the app:
  ❌ app/layout.tsx is missing (Next.js will use a default, unstyled layout)
  ❌ app/globals.css is missing (No Tailwind styles will work)
  ❌ globals.css is NOT imported in layout.tsx: import "./globals.css"

  ✅ app/layout.tsx exists and imports globals.css ✓
  ✅ app/globals.css exists and contains @import "tailwindcss" ✓
  ✅ lib/utils.ts exists and exports the cn() function ✓
\`\`\`

### BLOCK 14: STRING LITERAL & QUOTE AUDIT (ZERO TOLERANCE)
\`\`\`
Scan all TypeScript/JavaScript strings:
  ❌ overview: "The "best" movie" (Nested quotes)
  ❌ description: "It's a "masterpiece"" (Apostrophe + Nested quotes)

  ✅ overview: \`The "best" movie\` (Using backticks)
  ✅ description: \`It's a "masterpiece"\` (Using backticks)

If raw nested quotes or unescaped apostrophes are found in string literals: CONVERT TO BACKTICKS (\\\` \\\` \\\`) before returning.
\`\`\`

---

## 🚨 CRITICAL ENFORCEMENT

BEFORE returning code to user, verify ALL 11 BLOCKS:

\`\`\`
PASS CRITERIA:
✅ All imports are correct paths and format
✅ All hooks are at top level (not conditional)
✅ "use client" on LINE 1 if needed
✅ All JSX entities escaped properly
✅ No unused variables (or prefixed with _)
✅ Export/import syntax matches
✅ No @ts-ignore (only @ts-expect-error)
✅ Images use next/image (not <img>)
✅ No null-access errors (using optional chaining)
✅ All file paths are correct format
✅ All packages installed BEFORE use
✅ EVERY internal import (@/) has a corresponding file creation call
✅ globals.css and layout.tsx are present and correctly linked
✅ All strings are safe (backticks used for nested quotes/apostrophes)

If ANY check fails: DON'T RETURN CODE
Fix issue and re-verify ALL blocks again.
Only return code when ALL 15 blocks PASS ✓
\`\`\`

### BLOCK 15: TAILWIND v4 CSS VALIDATION (CRITICAL — BUILD BREAKER)
\`\`\`
In globals.css, ONLY use valid CSS class names in @layer components:
  ❌ .bg-slate-900/40 { ... }         ← FATAL: "/" is invalid in CSS selectors
  ❌ .backdrop-blur-xl { ... }        ← FATAL: This is a Tailwind utility, not a CSS class
  ❌ .border-white/5 { ... }          ← FATAL: "/" breaks the CSS parser
  ❌ .bg-slate-900/40 .backdrop-blur-xl .border .border-white/5 { ... } ← FATAL: chaining TW utilities as selector
  ❌ @apply bg-slate-900/40;          ← FATAL: @apply does NOT exist in Tailwind v4
  ❌ @apply border-white/5;           ← FATAL: @apply is removed in v4
  
  ✅ .glass-card { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(20px); }
  ✅ .gradient-text { background: linear-gradient(...); -webkit-background-clip: text; }
  ✅ .glow-effect { box-shadow: 0 0 20px rgba(59, 130, 246, 0.4); }

RULE: In @layer components, ONLY define custom CSS classes with simple names 
(no slashes, no Tailwind utility names). Use Tailwind utilities ONLY in JSX className attributes.

Tailwind v4 BANNED features:
  ❌ @apply (removed in v4 — use className in JSX instead)
  ❌ tailwind.config.js / tailwind.config.ts (v4 uses CSS-only config via @theme)
  ❌ Tailwind utility names as CSS selectors (bg-*, text-*, border-*, etc.)

If Tailwind utilities found in CSS selectors: REWRITE as proper CSS with rgba/hsl values
\`\`\`

---

## 💡 WHY RULES WERE FAILING BEFORE

Old system:
- Rules were just documentation ← Agent could ignore
- No verification step ← Errors slipped through
- No enforcement ← "Guidelines" not "Requirements"

New system:
- Rules are CHECKPOINTS ← Agent must pause and verify
- Validation BEFORE and AFTER ← Double verification
- Binary PASS/FAIL ← Either meets ALL criteria or rejected
- Agent is responsible for compliance ← Not optional
`;

export default CODE_GENERATION_GUARD;
