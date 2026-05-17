/**
 * PROMPT SYSTEM ARCHITECTURE
 * How all prompts work together to prevent agent errors
 * 
 * READ THIS FIRST to understand the 3-layer defense system
 */

export const PROMPT_ARCHITECTURE = `
# 🏗️ DEV X PROMPT SYSTEM - 3-LAYER DEFENSE

## Why old system had errors:
❌ Rules existed but weren't enforced
❌ LLM could skip steps and still generate code
❌ No verification checkpoints
❌ No "must pass these checks" requirement

## New system (3-LAYER DEFENSE):

### LAYER 1: PRE-GENERATION GUARD (code-generation-guard.ts)
Runs BEFORE agent writes any code

Purpose: Stop errors before they happen
Checklist:
  ✓ Import audit - what packages needed?
  ✓ Client/server boundary - "use client" needed?
  ✓ Hooks validation - will hooks be called properly?
  ✓ Path validation - are all paths correct format?
  ✓ JSX audit - any unescaped entities?
  ✓ Variable lifecycle - any unused vars?

Agent MUST answer all 6 questions before proceeding.
If ANY answer fails validation → STOP, fix, retry

---

### LAYER 2: GENERATION RULES (All .ts files combined)

**policy.ts** - Design & structure rules
  - Color system
  - Component patterns
  - Auth system structure
  - Shadcn import rules
  
**tool-validation.ts** - Environment & syntax
  - Pre-installed packages
  - File path format rules
  - Client/server boundaries
  - Next.js 15 patterns
  - Image handling rules
  
**code-quality.ts** - Best practices
  - Hook violations prevention
  - TypeScript conventions
  - JSX entity escaping
  - Type safety guidelines
  - Runtime error prevention

**code-generation-guard.ts** - ENFORCEMENT
  - 11-point validation checklist
  - Pre & post-generation audit
  - Binary PASS/FAIL gates

During generation, agent references these files but:
❌ Old way: Just documentation
✅ New way: Mandatory checkpoints

---

### LAYER 3: POST-GENERATION AUDIT (code-generation-guard.ts)
Runs AFTER agent generates code

11 MANDATORY BLOCKS:
  1. Import validation (format, paths, presence)
  2. Hooks order check (all at top level?)
  3. Client boundary (use client when needed?)
  4. JSX entity check (escaped properly?)
  5. Unused variable audit (clean?)
  6. Export/import matching (syntax correct?)
  7. TypeScript comments (no @ts-ignore?)
  8. Next.js images (using Image not <img>?)
  9. Runtime errors (null checks, optional chaining?)
  10. File paths (correct format?)
  11. Installation order (packages installed first?)

Code MUST PASS ALL 11 before returning to user.
If ANY fails → Agent fixes and re-audits.

---

## HOW TO USE THIS SYSTEM

### For Code Generation (Agent workflow):

1. READ PRE-GENERATION GUARD (Layer 1)
   → Answer all 6 audit questions
   → If any fails: STOP & FIX

2. READ GENERATION RULES (Layer 2)
   → Reference policy.ts, tool-validation.ts, code-quality.ts
   → Generate code following ALL rules
   
3. RUN POST-GENERATION AUDIT (Layer 3)
   → Check code against ALL 11 blocks
   → Fix any failures
   → Loop until ALL 11 PASS ✓

4. RETURN CODE
   → Only after Layer 3 passes 100%

---

## KEY DIFFERENCES FROM OLD SYSTEM

| Old System | New System |
|-----------|-----------|
| Rules = suggestions | Rules = checkpoints |
| No verification | Verify before + after |
| LLM could skip checks | MUST pass all checks |
| Errors found by user | Errors caught by agent |
| "Follow guidelines" | "Pass 11-block audit" |
| Passive documentation | Active enforcement |

---

## COMMON MISTAKES THE SYSTEM PREVENTS

1. ❌ "cn is not defined"
   → Pre-gen Layer 1 catches: imports audit
   → Generation Layer 2 references: import from @/lib/utils
   → Post-gen Layer 3 verifies: all imports present and correct

2. ❌ "React Hook called conditionally"
   → Pre-gen Layer 1 catches: hooks validation
   → Generation Layer 2 enforces: hooks at top level
   → Post-gen Layer 3 verifies: hooks order check

3. ❌ JSX unescaped entities
   → Pre-gen Layer 1 catches: JSX audit
   → Generation Layer 2 enforces: entity escaping rules
   → Post-gen Layer 3 verifies: JSX entity check

4. ❌ Wrong import paths
   → Pre-gen Layer 1 catches: path validation
   → Generation Layer 2 enforces: @/ paths required
   → Post-gen Layer 3 verifies: file path validation

5. ❌ Unused variables in code
   → Pre-gen Layer 1 catches: variable lifecycle
   → Generation Layer 2 enforces: remove or prefix
   → Post-gen Layer 3 verifies: unused variable audit

---

## FILE STRUCTURE

src/prompts/
  ├── policy.ts (Design & structure rules)
  ├── tool-validation.ts (Environment rules)
  ├── code-quality.ts (Best practices)
  ├── code-generation-guard.ts (Enforcement + audit)
  └── prompt-architecture.ts (This file - integration guide)

---

## INTEGRATION EXAMPLE

When generating a Todo app component:

STEP 1: PRE-GENERATION GUARD
\`\`\`
Q1. Imports audit?
  → useState, useCallback from react (pre-installed ✓)
  → cn from @/lib/utils (exists ✓)
  → All good!

Q2. Client/server?
  → Using onClick handlers → Need "use client"

Q3. Hooks validation?
  → useState at top level ✓
  → useCallback at top level ✓
  → No conditional hooks ✓

Q4. Paths? Q5. JSX? Q6. Variables?
  → All pass ✓

DECISION: Proceed to generation ✓
\`\`\`

STEP 2: GENERATE CODE
Reference all 4 rule files while writing

STEP 3: POST-GENERATION AUDIT
\`\`\`
Block 1: Imports - ✅ PASS
  import { useState, useCallback } from 'react'
  import { cn } from '@/lib/utils'
  
Block 2: Hooks - ✅ PASS
  useState called at top, not in loops
  
Block 3: Client - ✅ PASS
  "use client" on line 1
  
Block 4: JSX - ✅ PASS
  All entities escaped
  
... all 11 blocks ...

RESULT: ALL 11 PASS ✓ Return code ✓
\`\`\`

---

## WHY THIS WORKS

Old system: Rules were passive suggestions
New system: Rules are active checkpoints with binary pass/fail

LLM must:
✅ Answer pre-gen questions (layer 1)
✅ Generate code following rules (layer 2)
✅ Pass 11-block audit (layer 3)

If ANY layer fails → Agent fixes and retries
Result: No errors reach user ✓

---

## NEXT STEPS

1. Import CODE_GENERATION_GUARD in your main agent prompt
2. Add to system message: "Always run Pre-Gen Guard BEFORE coding"
3. Add to system message: "Always run Post-Gen Audit AFTER coding"
4. Reference policy.ts, tool-validation.ts, code-quality.ts during generation

Now agent mistakes become nearly impossible because:
❌ Old: "Follow these guidelines"
✅ New: "Must pass this 11-point checklist before returning code"
`;

export default PROMPT_ARCHITECTURE;
