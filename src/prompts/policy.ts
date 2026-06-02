/**
 * POLICY PROMPT - Compressed Design & Auth Rules
 */

export const POLICY_PROMPT = `
## DESIGN SYSTEM (Quick Reference)

UI/UX INSPIRATION (MANDATORY): Massively draw inspiration from MotionSite, Skipper UI, Framer Motion UI, Aceternity UI, and top-tier browser component libraries. Create continuous scrolling, highly animated Framer Motion UIs that feel attractive, interactive, and premium ("high-worth"). Use Framer Motion extensively for scroll animations (useScroll, useTransform), hover effects, and staggering items.

COLORS: Contextual (primary), Slate/Zinc (secondary), Emerald (success), Rose (danger), Amber (warning)
TYPOGRAPHY: text-5xl (hero) → text-base (body) → text-xs (tiny) | font-bold/semibold/normal
SPACING: 4px → 8px → 16px → 24px → 32px → 48px (p-1 → p-2 → p-4 → p-6 → p-8 → p-12)
TOAST: import { toast } from "sonner" | Never use useToast()

COMPONENT VARIANTS:
- Button: primary/secondary/danger/outline/ghost + hover:opacity-90 + active:scale-95
- Input: p-2.5 border rounded-lg focus:ring-2 focus:ring-accent
- Card: shadow-md rounded-lg p-4 hover:shadow-lg transition
- Modal: fixed inset-0 backdrop-blur flex items-center justify-center

RESPONSIVE: base (mobile) → sm:640px → md:768px → lg:1024px → xl:1280px
DARK MODE: dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800

ICONS (lucide-react):
- Actions: Plus, Edit, Trash2, Copy, Check, X
- Status: AlertCircle, Info, Loader2 (animate-spin)
- Nav: ChevronRight, ArrowRight, Menu
- Auth: LogIn, LogOut, User

## AUTH SYSTEM (When needed)

ROUTES:
- POST /api/auth/login → Verify password, create JWT, return in HTTP-only cookie
- POST /api/auth/signup → Hash password (bcrypt), create user, return JWT
- POST /api/auth/logout → Clear cookie
- GET /api/auth/me → Return current user (protected)

FILES TO CREATE:
1. lib/auth.ts → JWT sign/verify with jsonwebtoken
2. app/api/auth/*/route.ts → Login, signup, logout, me endpoints
3. lib/auth-context.tsx → AuthProvider + useAuth hook
4. components/ProtectedRoute.tsx → Redirect if !user (Client-side guard)

SECURITY:
✅ Passwords: bcrypt 10+ rounds
✅ Tokens: HTTP-only cookies, Secure, SameSite=Strict
✅ Protected routes: Checked in API routes or ProtectedRoute component
❌ Never: localStorage for tokens, plain text passwords, exposed JWT secrets

## CHAT/MESSAGING (If real-time app)

SCHEMA: User (id, email, name) → Conversation (id, participants[]) → Message (id, content, senderId, conversationId)
POLLING: Fetch /api/messages?lastId=X every 1 second
UI: MessageBubble (align right=self, left=others), TypingIndicator, MessageInput

## SHADCN CRITICAL RULES

✅ Import from exact path: import { Button } from "@/components/ui/button"
✅ SelectItem needs value prop (never empty string): value="all" not value=""
✅ Dialog needs state: const [open, setOpen] = useState(false)
❌ Never group imports: import { Button, Card } from "@/components/ui"

## COLOR RESTRICTIONS

❌ No dark purple/blue or purple/pink gradients (generic)
❌ No gradients on >20% of viewport
❌ No AI emojis 🤖🧠 → Use lucide-react icons only
✅ Use contextually appropriate, modern colors
✅ Ensure WCAG AA contrast ratios
`;

