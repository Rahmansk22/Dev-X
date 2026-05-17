/**
 * CODE QUALITY PROMPT - Agent Guidelines to Prevent Common Errors
 */

export const CODE_QUALITY_PROMPT = `
## GOLDEN RULES FOR ERROR-FREE CODE GENERATION

### 1. IMPORTS & DEPENDENCIES ⚠️
BEFORE writing ANY code:
- ✅ Check if package is pre-installed (React, Next.js, Tailwind, Lucide, Shadcn UI, Radix UI)
- ✅ npm install --yes [missing packages] FIRST
- ✅ Use correct import paths: @/lib/utils, @/components/ui/button
- ✅ Verify file exists before importing: if file doesn't exist, CREATE IT FIRST
- ✅ Import utilities like 'cn' from @/lib/utils: import { cn } from '@/lib/utils'

❌ ERRORS YOU PREVENT:
- "Cannot find module 'X'" → Install first
- "cn is not defined" → import { cn } from '@/lib/utils'
- "Module not found: '../utils'" → Use @/ paths
- "React is not defined" → If using React.forwardRef/React.memo, add: import * as React from "react"

### 2. REACT HOOKS VIOLATIONS 🎣
✅ DO:
- Call ALL hooks at the top level of function (before if/while/for)
- Call hooks unconditionally
- Use same order every render

❌ DON'T:
- Call hooks inside if/else/loops → CAUSES: "React Hook 'X' called conditionally"
- Call hooks after return statement
- Skip hooks based on conditions
- Call useQuery/useState/useEffect inside if (user) checks

Example ❌ ERROR:
\`\`\`
if (user) {
  const data = useQuery(...);  // ← WRONG! Conditional hook
}
\`\`\`

Example ✅ FIX:
\`\`\`
const data = useQuery(...);    // Top level
if (!data) return null;         // Then check in JSX
\`\`\`

### 3. TYPESCRIPT COMMENT VIOLATIONS 📝
✅ Use: @ts-expect-error → If next line MAY have an error
❌ Use: @ts-ignore → Will fail lint if error doesn't exist

Example ✅ CORRECT:
\`\`\`
// @ts-expect-error - TODO: Fix type mismatch later
const x = someFunction();
\`\`\`

### 4. JSX UNESCAPED ENTITIES 📄
❌ DON'T use raw quotes in JSX text:
\`\`\`
<p>It's working</p>     // ← WRONG!
<p>"Hello world"</p>    // ← WRONG!
\`\`\`

✅ DO escape them:
\`\`\`
<p>It&apos;s working</p>    // Single quote
<p>&quot;Hello world&quot;</p>  // Double quote
// OR use {' '} + variable
<p>It{"'"}s working</p>
\`\`\`

### 5. UNUSED VARIABLES 🗑️
✅ REMOVE or USE all declared variables:
\`\`\`
// ✅ Used
const [count, setCount] = useState(0);
setCount(count + 1);

// ❌ Unused - Remove line
const [unused, setUnused] = useState(0);

// ✅ If intentionally unused, prefix with _
const [_temp, setTemp] = useState(0);
\`\`\`

### 6. IMAGE OPTIMIZATION ⚛️
✅ Use next/image for images:
\`\`\`
import Image from 'next/image';
<Image src="/path" alt="desc" width={100} height={100} />
\`\`\`

❌ DON'T use <img> tags directly:
\`\`\`
<img src="/path" alt="desc" /> // ← Slower, not optimized
\`\`\`

### 7. CLIENT vs SERVER BOUNDARY 🌐
✅ Add "use client" on LINE 1 if you use:
- useState, useEffect, useRef, useCallback, useMemo
- onClick, onChange handlers
- Browser APIs (window, localStorage, document)
- useQuery, useMutation hooks

❌ DON'T use "use client" if only doing:
- Async data fetching
- Database queries
- File system reads
- Server-only secrets

### 8. EXPORT CONSISTENCY 📦
✅ Match import to export:
\`\`\`
// file.ts
export const MyComponent = () => {}

// other.ts
import { MyComponent } from './file'  // Named import ✅
\`\`\`

❌ DON'T mismatch:
\`\`\`
export default MyComponent

import MyComponent from './file'  // ✅
import { MyComponent } from './file'  // ❌
\`\`\`

### 9. TYPE SAFETY ✓
✅ DO:
- Add types to function parameters
- Use descriptive variable names (e.g., userProfile instead of p)
- No console.log in production code

## STRING LITERAL SAFETY
- ✅ Use backticks (\`\`) for any string that contains an apostrophe or single quote
- ❌ Never: toast.success('We\\'ll call you') — the quote often breaks when regenerated
- ✅ Always: toast.success(\`We'll call you\`)

❌ DON'T:
- Use 'any' type (use unknown or specific types)
- Skip types on props
- Mix TypeScript and no-types in same file

Example ✅:
\`\`\`
interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
}

function TodoItem({ todo, onToggle }: { todo: TodoItem; onToggle: () => void }) {
  return <button onClick={onToggle}>{todo.title}</button>;
}
\`\`\`

### 10. COMMON RUNTIME ERRORS TO CATCH 🐛

| Error | Cause | Fix |
|-------|-------|-----|
| "Cannot read property 'X' of undefined" | Accessing property on null/undefined | Add null checks: obj?.prop or if (obj) |
| "X is not a function" | Calling non-function as function | Verify it's a function before calling |
| "Maximum update depth exceeded" | Infinite loop in useEffect | Add dependency array, check state updates |
| "You provided a \`value\` prop to a form field without \`onChange\`" | Controlled input missing handler | Add onChange handler |
| "Module not found" | Wrong import path | Verify path exists, use @/ aliases |
| "useToast is not a function" | sonner does not use hooks | import { toast } from "sonner" |
| "Identifier 'X' has already been declared" | Double import/const | Remove the second declaration (check 'Link') |
| "Duplicate export 'X'" | Repeast export { X } | Ensure each component exported exactly once |

### 11. DUPLICATE DECLARATIONS & HALLUCINATIONS 🚫
❌ DON'T:
- **Double Imports**: Never import the same identifier twice. (e.g., \`import Link from 'next/link'\` followed by \`import { Link } from '@/components/ui/navigation-menu'\`).
- **Double Exports**: Ensure \`export { Card, ... }\` appears exactly once at the bottom of the file.
- **Hallucinated Files**: Never import from a component folder (like \`@/components/ui/navigation-menu\`) unless you have explicitly created that file in the current generation.

✅ DO:
- Use simple \`ul\` and \`li\` for Navbars unless complex Radix primitives are requested and generated.
- Verify every import path maps to a file you are actually providing.

### 12. VALIDATION CHECKLIST ✅ (Before generating code)

- [ ] All imports exist or are pre-installed
- [ ] No hooks called conditionally or in loops
- [ ] No @ts-ignore (use @ts-expect-error)
- [ ] All JSX quotes/apostrophes are escaped
- [ ] No unused variables (remove or prefix with _)
- [ ] Using next/image not <img>
- [ ] "use client" added if using browser/hooks
- [ ] Export/import syntax matches
- [ ] All functions have proper types
- [ ] Null safety checks where needed (?.  optional chaining)

### 12. IF ERROR STILL OCCURS
If the code has an error after generation:
1. Read the exact error message
2. Check the VALIDATION CHECKLIST above
3. Fix at the ROOT (not with ts-ignore)
4. Re-test in browser before returning
`;

export default CODE_QUALITY_PROMPT;
