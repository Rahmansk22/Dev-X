/**
 * PROMPTS INDEX - Import all prompts from here
 * Central hub for all agent rules and guidelines
 */

export { POLICY_PROMPT } from './policy';
export { TOOL_VALIDATION_PROMPT } from './tool-validation';
export { CODE_QUALITY_PROMPT } from './code-quality';
export { CODE_GENERATION_GUARD } from './code-generation-guard';
export { PROMPT_ARCHITECTURE } from './prompt-architecture';
export { PREMIUM_UI_PROMPT } from './premium-ui';

/**
 * QUICK REFERENCE - What each prompt does
 */

export const PROMPT_REFERENCE = {
  POLICY_PROMPT: {
    file: 'policy.ts',
    purpose: 'Design system, colors, components, auth rules, shadcn best practices',
    when: 'Use when generating UI components or auth flows',
    scope: 'Structure and design conventions'
  },
  
  TOOL_VALIDATION_PROMPT: {
    file: 'tool-validation.ts',
    purpose: 'Sandbox environment, file paths, client/server boundaries, Next.js 15 patterns',
    when: 'Use when creating files, routes, or checking environment',
    scope: 'Technical environment and syntax rules'
  },
  
  CODE_QUALITY_PROMPT: {
    file: 'code-quality.ts',
    purpose: 'Prevents common code errors: hooks, imports, TypeScript, JSX, variables',
    when: 'Use during code generation to maintain quality',
    scope: 'Code best practices and error prevention'
  },
  
  CODE_GENERATION_GUARD: {
    file: 'code-generation-guard.ts',
    purpose: 'Pre/post-generation audit system - 11 mandatory validation blocks',
    when: 'Use BEFORE coding (pre-gen checklist) and AFTER coding (post-gen audit)',
    scope: 'ENFORCEMENT - Code must pass all 11 blocks before returning to user'
  },
  
  PROMPT_ARCHITECTURE: {
    file: 'prompt-architecture.ts',
    purpose: 'Integration guide - how all prompts work together in 3-layer defense',
    when: 'Read first to understand the system',
    scope: 'System overview and workflow'
  },
  
  PREMIUM_UI_PROMPT: {
    file: 'premium-ui.ts',
    purpose: 'Master-level frontend design, Framer Motion parity, Micro-interactions',
    when: 'Use when generating components to achieve top-tier SaaS look',
    scope: 'Aesthetics and animation engine'
  }
};

/**
 * SYSTEM MESSAGE TEMPLATE - Use this to instruct your agent
 */

export const AGENT_SYSTEM_MESSAGE = `
You are DEV X Code Agent - Generate ZERO-ERROR code using the 3-layer defense system.

## LAYER 1: PRE-GENERATION GUARD (MANDATORY)
BEFORE writing ANY code, use CODE_GENERATION_GUARD.

Answer all 6 questions:
1. IMPORTS AUDIT - What packages? Pre-installed? Any 'cn' usage?
2. CLIENT vs SERVER - Need "use client"?
3. HOOKS VALIDATION - All at top level?
4. IMPORT PATHS - All using @/ format?
5. JSX CONTENT - Any unescaped entities?
6. VARIABLE LIFECYCLE - Any unused vars?

If ANY fails: STOP, FIX, RETRY before proceeding.

## LAYER 2: GENERATION RULES (FOLLOW WHILE CODING)
Reference ALL prompt files:
- policy.ts (design & structure)
- tool-validation.ts (environment & syntax)
- code-quality.ts (best practices)

Generate code following EVERY rule.

## LAYER 3: POST-GENERATION AUDIT (MANDATORY)
AFTER generating code, verify ALL 11 blocks pass:
1. ✅ Import validation
2. ✅ Hooks order check
3. ✅ Client boundary
4. ✅ JSX entity check
5. ✅ Unused variable audit
6. ✅ Export/import matching
7. ✅ TypeScript comments
8. ✅ Next.js images
9. ✅ Runtime errors
10. ✅ File paths
11. ✅ Installation order

Code MUST PASS ALL 11 before returning.

## CRITICAL RULES
❌ Never @ts-ignore (only @ts-expect-error)
❌ Never call hooks conditionally
❌ Never import multiple from same @/components/ui (use individual imports)
❌ Never use <img> instead of next/image
❌ Never use relative imports like '../utils'
❌ Never skip "use client" when using hooks

✅ Prefer tested shadcn primitives from @/components/ui/<component> for Button, Card, Input, Label, Badge, Tabs, Dialog, Sheet, DropdownMenu, Select, Separator, Skeleton, Alert, and Form
✅ Always verify imports before coding
✅ Always run pre-gen checklist FIRST
✅ Always pass all 11 audit blocks BEFORE returning
✅ Always escape JSX entities (It&apos;s not It's)
✅ Always test code mentally against ALL rules

## FAILURE = RESTART
If code fails any audit block: Fix it and re-audit.
Only return code when ALL 11 blocks PASS ✓
`;

/**
 * INTEGRATION INSTRUCTIONS
 */

export const INTEGRATION_INSTRUCTIONS = `
## How to use these prompts in your agent:

### Option 1: Add to System Message
\\\`\\\`\\\`
import { AGENT_SYSTEM_MESSAGE } from '@/prompts/index';

// In your AI model call:
const response = await model.generateMessage({
  systemPrompt: AGENT_SYSTEM_MESSAGE,
  userMessage: userRequest
});
\\\`\\\`\\\`

### Option 2: Reference in Agent Function
\\\`\\\`\\\`
import { 
  CODE_GENERATION_GUARD,
  POLICY_PROMPT,
  TOOL_VALIDATION_PROMPT,
  CODE_QUALITY_PROMPT
} from '@/prompts/index';

async function generateCode(request: string) {
  // 1. Pre-generation
  const preGenChecklist = CODE_GENERATION_GUARD;
  console.log("Running pre-generation audit...");
  
  // 2. Generate
  const code = await agent.generate({
    request,
    rules: [POLICY_PROMPT, TOOL_VALIDATION_PROMPT, CODE_QUALITY_PROMPT]
  });
  
  // 3. Post-generation audit
  const auditResult = await auditCode(code, CODE_GENERATION_GUARD);
  if (!auditResult.passedAll11Blocks) {
    console.error("Code failed audit, fixing...");
    // Fix and retry
  }
  
  return code;
}
\\\`\\\`\\\`

### Option 3: Quick Copy-Paste
Just copy any prompt constant and paste into your agent's system message.

## Files Structure
\\\`\\\`\\\`
src/prompts/
  ├── policy.ts                    (Design rules)
  ├── tool-validation.ts           (Environment rules)
  ├── code-quality.ts              (Best practices)
  ├── code-generation-guard.ts     (Enforcement - READ THIS FIRST)
  ├── prompt-architecture.ts       (Integration guide)
  └── index.ts                     (This file)
\\\`\\\`\\\`
`;

export default {
  PROMPT_REFERENCE,
  AGENT_SYSTEM_MESSAGE,
  INTEGRATION_INSTRUCTIONS
};
