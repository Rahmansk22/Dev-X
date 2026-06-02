# Dev X - Complete Architecture & Operations Guide

## Executive Summary

**Dev X** is an **agentic orchestration engine for autonomous full-stack development**. It's a Next.js-based platform that leverages AI agents, event-driven workflows, and sandboxed code execution to enable users to describe application ideas in natural language and automatically generate, build, test, and deploy fully functional applications.

---

## 🎯 Core Abilities

### 1. **Intent-Driven Code Generation**

- **Input**: Natural language project descriptions (text-based prompts)
- **Process**: AI analyzes intent → generates full-stack code (React frontend + Node.js backend)
- **Output**: Ready-to-build Next.js project with TypeScript, Tailwind CSS, and tRPC APIs
- **Timeline**: Outputs complete codebase in minutes

### 2. **Autonomous Build & Validation**

- **Sandbox Execution**: Uses E2B (isolated VMs) to safely execute code
- **Build Pipeline**: `npm ci → npm run build` with real-time error detection
- **Error Classification**: AI categorizes build errors (missing dependencies, syntax errors, type mismatches)
- **Self-Healing**: Automatically detects and fixes common issues (import errors, missing packages)

### 3. **Multi-Environment Deployment**

- **Providers**: Vercel (default), Railway, Fly.io, Netlify
- **Automation**: One-click deployment from generated code
- **Rollback**: Version control and deployment history for quick rollbacks
- **Real-time Monitoring**: Track deployment status and live logs

### 4. **Real-time Project Management**

- **Versioning**: Snapshot and track all project iterations
- **History**: Full build history with error logs and performance metrics
- **File Tracking**: Monitor code changes and file modifications in real-time
- **Deployment Timeline**: Complete audit trail of deployment events

### 5. **AI-Powered Error Recovery**

- **Sentry Integration**: Tracks production errors across deployed apps
- **Error Intelligence**: Analyzes error patterns and suggests fixes
- **Auto-Healing**: Automatically patches common issues in generated code
- **Recovery Workflow**: Multi-step recovery with validation

### 6. **Analytics & Observability**

- **Build Metrics**: Success/failure rates, build duration, error frequencies
- **Usage Tracking**: API calls, project counts, deployment counts
- **PostHog Analytics**: Product usage insights
- **OpenTelemetry**: Instrumentation for performance monitoring
- **Winston Logging**: Centralized log collection

---

## 🏗️ Technical Architecture

### **Technology Stack**

| Layer             | Technologies                                                  |
| ----------------- | ------------------------------------------------------------- |
| **Frontend**      | Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion |
| **Backend**       | tRPC (type-safe APIs), Next.js API routes, Inngest (events)   |
| **Database**      | PostgreSQL + Prisma ORM, Prisma Accelerate (edge support)     |
| **Auth**          | Clerk (user authentication & management)                      |
| **Sandbox**       | E2B (code execution in isolated VMs)                          |
| **Deployment**    | Vercel, Railway, Fly.io, Netlify                              |
| **Events**        | Inngest (async orchestration, retries, concurrency control)   |
| **Observability** | Sentry (errors), PostHog (analytics), OpenTelemetry (tracing) |
| **UI Components** | shadcn/ui (Radix primitives), Lucide icons, Sonner toasts     |

### **Directory Structure Overview**

```
Dev X -Extend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (home)/            # Homepage (logged-in & logged-out views)
│   │   ├── dashboard/         # Protected user dashboard
│   │   ├── api/               # API routes (tRPC, webhooks, builds)
│   │   └── [marketing pages]  # /about, /pricing, /features, etc.
│   │
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── 21stdev/           # Custom design components
│   │   ├── code-view/         # Code display components
│   │   └── [core components]  # Navigation, auth, build monitor, etc.
│   │
│   ├── lib/                   # Core business logic
│   │   ├── build-executor.ts  # Build pipeline (npm ci → npm run build)
│   │   ├── code-generation-helper.ts  # Code gen utilities
│   │   ├── error-intelligence.ts      # Error analysis
│   │   ├── sandbox-lifecycle-manager.ts  # E2B management
│   │   └── [utilities]        # DB, auth, memory, analytics
│   │
│   ├── inngest/               # Event orchestration
│   │   ├── analyzer-functions.ts      # AI analysis jobs
│   │   ├── client.ts          # Inngest client setup
│   │   └── functions/         # Async handlers (deploy, heal, etc.)
│   │
│   ├── modules/               # Feature modules
│   │   ├── projects/          # Project CRUD & business logic
│   │   ├── messages/          # Chat/messaging
│   │   ├── usage/             # Usage tracking
│   │   └── home/              # Homepage logic
│   │
│   ├── self-healing/          # Error recovery agent
│   │   ├── agent.ts           # Self-healing logic
│   │   ├── auto-fixer.ts      # Automatic fixes
│   │   └── [helpers]          # Validators, detectors
│   │
│   ├── deployment/            # Deployment orchestration
│   │   ├── auto-deployer.ts   # Deployment pipeline
│   │   └── adapters/          # Provider integrations (Vercel, Netlify)
│   │
│   ├── trpc/                  # Type-safe API setup
│   │   └── routers/           # API endpoints
│   │
│   ├── prompts/               # AI system prompts
│   │   ├── prompt.ts          # Main code generation prompt
│   │   ├── analyzer-prompt.ts # Intent analysis
│   │   └── [specialized prompts]
│   │
│   ├── hooks/                 # React hooks
│   ├── types/                 # TypeScript types
│   └── middleware.ts          # Auth middleware
│
├── prisma/                    # Database
│   ├── schema.prisma          # Data models
│   ├── seed.ts                # Database seeding
│   └── migrations/            # Migration history
│
├── e2b-template/              # Sandbox configuration
│   ├── e2b.Dockerfile        # Docker image for sandboxing
│   ├── e2b.toml              # E2B template config
│   └── package.json          # Pre-installed dependencies
│
├── public/                    # Static assets
└── [config files]            # next.config.ts, tailwind.config.ts, etc.
```

---

## 🔄 How It Works: The Complete Flow

### **Phase 1: Intent Analysis**

1. User inputs a project description (e.g., "Create a todo app with authentication and database")
2. **Analyzer Agent** reads the `analyzer-prompt.ts`
3. **AI extracts**:
   - Project type (frontend/fullstack/API)
   - Technology requirements (React, Node, database)
   - Key features (auth, payments, real-time, etc.)
   - Deployment targets
4. **Result**: Structured intent document

### **Phase 2: Code Generation**

1. **Inngest Event** triggered: `project.generate`
2. **Generation Agent** reads `prompt.ts` (DEV X v3 system prompt)
3. **AI generates** complete codebase:
   - Next.js app structure
   - React components with Tailwind styling
   - tRPC API routes with TypeScript types
   - Prisma database models
   - Environment configuration
   - Build scripts
4. **Validation**: Code passes schema and linting checks
5. **Storage**: Project created in PostgreSQL with code snapshot

### **Phase 3: Sandbox Build**

1. **Inngest Event** triggered: `project.build`
2. **Build Executor** (`build-executor.ts`):
   - Spins up E2B sandbox (isolated VM)
   - Pulls generated code into sandbox
   - Runs: `npm ci` (install dependencies)
   - Runs: `npm run build` (Next.js build)
3. **Real-time Logging**:
   - Captures stdout/stderr
   - Sends logs to UI via WebSocket
   - Stores logs in database
4. **Outcomes**:
   - ✅ **Success**: Build artifacts generated
   - ❌ **Failure**: Error logs captured, triggers Phase 4

### **Phase 4: Error Detection & Self-Healing**

1. **Error Classifier** analyzes build errors:
   - Missing dependencies
   - Type mismatches
   - Syntax errors
   - Runtime issues
2. **Self-Healing Agent** (`self-healing/agent.ts`):
   - Identifies root cause
   - Generates fix (e.g., add missing package, fix import)
   - Applies fix to code
   - Triggers rebuild (retry)
3. **Repeat** until build succeeds or max retries reached
4. **Fallback**: If auto-heal fails, suggest manual fixes to user

### **Phase 5: Preview Generation**

1. Once build succeeds, create preview:
   - Start Next.js dev server in sandbox
   - Generate preview URL (accessible for 24 hours)
   - Health checks (GET /, /api/health)
2. User can test generated app in real-time

### **Phase 6: Deployment**

1. **Inngest Event** triggered: `project.deploy`
2. **Deployment Manager** selects provider (Vercel by default)
3. **Adapter** (e.g., `vercel-adapter.ts`):
   - Authenticates with provider API
   - Creates project (if new)
   - Uploads build artifacts
   - Triggers deployment
   - Polls for status
4. **Real-time Updates**:
   - UI shows deployment progress
   - Logs streamed to UI
   - Final URL provided once live
5. **Monitoring**:
   - Store deployment record in database
   - Enable Sentry monitoring
   - Track analytics

### **Phase 7: Post-Deployment Monitoring**

1. **Sentry Integration**:
   - Catches production errors
   - Groups errors by type
   - Triggers alerts
2. **Error Recovery**:
   - If production error detected, self-healing agent activates
   - Analyzes error, generates patch
   - Triggers hotfix deployment
3. **Analytics**:
   - PostHog tracks feature usage
   - OpenTelemetry measures performance
   - Build metrics collected for insights

---

## 🔌 Key Integration Points

### **Inngest - Event Orchestration**

- **Queue System**: All long-running tasks (builds, deployments) are async
- **Concurrency Control**: Max 1 build per project (sequential)
- **Retries**: 2 automatic retries with exponential backoff
- **Timeout**: 15 minutes for complex generation tasks
- **Events**:
  - `project.analyze` → Intent analysis
  - `project.generate` → Code generation
  - `project.build` → Build execution
  - `project.deploy` → Deployment
  - `project.heal` → Error recovery
  - `sentry.webhook` → Error handling

### **Clerk - Authentication**

- **Public Routes**: `/`, `/sign-in`, `/sign-up`, `/pricing`, `/about`, `/guide`, etc.
- **Protected Routes**: `/dashboard` and all children
- **User Context**: Available via `useUser()` hook
- **Session**: Persistent across pages

### **E2B - Code Sandboxing**

- **Environment**: Isolated VM with Node.js, npm, Docker
- **Template**: "builder" template with pre-installed Next.js deps
- **Lifecycle**:
  1. Spawn sandbox
  2. Upload project code
  3. Execute build commands
  4. Start dev server (for preview)
  5. Clean up sandbox
- **Safety**: No network access to host, resource limits

### **PostgreSQL + Prisma**

- **Models**:
  - `Project`: Main project record
  - `ProjectSnapshot`: Historical versions
  - `BuildHistory`: Build logs and metadata
  - `Deployment`: Deployment records
  - `Message`: Chat/conversation history
  - `Fragment`: Code fragments/components
- **Features**:
  - Automatic timestamps
  - Cascade deletes
  - Prisma Accelerate for edge queries

### **Deployment Providers**

- **Vercel** (Primary):
  - Native Next.js support
  - Zero-config deployments
  - Preview URLs
- **Railway**: Full-stack deployments
- **Fly.io**: Global distribution
- **Netlify**: Static/frontend deployments

---

## 📊 Data Flow Diagram

```
User Input (Text Prompt)
    ↓
┌─────────────────────────────────────┐
│ Intent Analysis (Inngest)           │
│ - Parse requirements                │
│ - Extract tech stack                │
│ - Define scope                      │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Code Generation (Inngest + AI)      │
│ - Generate Next.js app              │
│ - Components, pages, APIs           │
│ - Validation & schema checks        │
└─────────────────────────────────────┘
    ↓
    Storage (PostgreSQL)
    ↓
┌─────────────────────────────────────┐
│ Sandbox Build (E2B + Inngest)       │
│ - npm ci & npm run build            │
│ - Capture logs                      │
│ - Build succeed? ✅ → Phase 5       │
│                      ❌ → Phase 4   │
└─────────────────────────────────────┘
    ↓ (if build failed)
┌─────────────────────────────────────┐
│ Self-Healing (Inngest)              │
│ - Analyze error                     │
│ - Auto-fix (retry)                  │
│ - Max 2 retries                     │
└─────────────────────────────────────┘
    ↓ (if build succeeded)
┌─────────────────────────────────────┐
│ Preview Generation (E2B)            │
│ - Start dev server                  │
│ - Generate preview URL              │
│ - Health checks                     │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Deployment (Inngest + Provider API) │
│ - Upload build artifacts            │
│ - Trigger provider build            │
│ - Poll for completion               │
└─────────────────────────────────────┘
    ↓
    Live App (Vercel/Railway/Fly/Netlify)
    ↓
┌─────────────────────────────────────┐
│ Monitoring (Sentry + PostHog)       │
│ - Error tracking                    │
│ - Analytics collection              │
│ - Self-healing on errors            │
└─────────────────────────────────────┘
```

---

## 🎛️ Configuration & Constants

### **Build Settings**

- **Node Version**: Latest LTS
- **Memory Limit**: 4GB (Next.js build)
- **Timeout**: 15 minutes per build
- **Retries**: 2 automatic retries on failure

### **Deployment Settings**

- **Default Provider**: Vercel
- **Preview Duration**: 24 hours
- **Health Check Interval**: Every 30 seconds
- **Rollback Support**: Full version history

### **Sandbox (E2B)**

- **Template**: "builder" (Node.js + npm + Docker)
- **Resource Limits**: 4GB RAM, 2 CPUs
- **Network**: Internal only (no external access)

### **Database**

- **Host**: PostgreSQL (Neon or local dev)
- **Connection Pool**: Prisma Accelerate
- **Migrations**: Auto-run on deploy

### **Analytics**

- **PostHog**: Product usage metrics
- **Sentry**: Error tracking & source maps
- **OpenTelemetry**: Performance instrumentation

---

## 🚀 Key Features in Detail

### **1. Real-time Build Monitoring**

- Live logs streamed to UI via WebSocket
- Color-coded error output
- Build duration tracking
- Memory usage monitoring

### **2. Version Control & History**

- Every project iteration is snapshotted
- Full rollback capability
- Build history with timestamps
- Deployment timeline

### **3. AI-Powered Error Recovery**

- Intelligent error classification (80+ error types)
- Automatic import fixing
- Dependency resolution
- Type error corrections

### **4. Multi-User Support**

- Clerk authentication
- User projects isolation
- Team collaboration (implied from Message model)
- Usage quotas per user

### **5. Preview Generation**

- Live preview of generated apps
- 24-hour preview links
- Health checks & status monitoring
- One-click fallback to latest deployment

---

## 🔐 Security & Best Practices

### **Sandboxing**

- E2B isolates code execution
- No access to production secrets
- Resource limits prevent DoS
- Timeout protection (15 minutes max)

### **Authentication**

- Clerk handles all auth flows
- Middleware protects /dashboard routes
- Session validation on every request

### **Database**

- Prisma prevents SQL injection
- Row-level security implied via user context
- Cascade deletes prevent orphaned records

### **Error Handling**

- Sentry captures all errors
- PII filtering enabled
- Source maps for stack traces
- Self-healing prevents cascading failures

---

## 📈 Development Workflow

```bash
npm run dev              # Start dev server + watch
npm run dev:trigger     # Dev + trigger test events
npm run build           # Production build
npm run inngest         # Start Inngest dashboard
npm run trigger         # Trigger single event
npm run trigger:all     # Trigger all test events
```

### **Local Development**

1. Clone repo
2. `npm install`
3. `cp .env.example .env` (set API keys)
4. `npx prisma migrate dev` (sync DB)
5. `npm run dev` (start dev server)
6. Visit `http://localhost:3000`

---

## 🎯 Use Cases

### **1. Rapid Prototyping**

- "Create a landing page with sign-up form and email verification"
- Generated, tested, and deployed in < 5 minutes

### **2. MVP Development**

- "Build a social media app with posts, comments, and user profiles"
- Full CRUD APIs, database schema, and UI components auto-generated

### **3. Business Automation**

- "Create an internal tool for inventory management"
- Database design, dashboards, and API endpoints auto-generated

### **4. Learning & Education**

- Students learn by examining generated, production-quality code
- Safe sandbox for experimentation

### **5. Production Deployments**

- Apps auto-deploy to Vercel/Railway/Fly
- Error monitoring via Sentry
- Self-healing for common issues

---

## 🔮 Future Roadmap (Implied)

- Multi-agent collaboration for complex projects
- Advanced code optimization
- Performance profiling
- A/B testing framework
- Team collaboration features
- Custom domain management
- Database backups & recovery
- CI/CD pipeline customization

---

## 📞 Support & Troubleshooting

### **Common Issues**

| Issue               | Solution                           |
| ------------------- | ---------------------------------- |
| Build timeout       | Increase timeout in Inngest config |
| Deployment failed   | Check provider API keys in .env    |
| Preview not loading | Restart E2B sandbox                |
| Database errors     | Run `npx prisma migrate dev`       |
| Auth errors         | Verify Clerk publishable key       |

### **Debugging**

- Check build logs in UI
- Review Sentry dashboard for errors
- Check Inngest event timeline
- Run `npm run lint` for code issues
- Monitor E2B sandbox status

---

## 🎓 Architecture Principles

1. **Event-Driven**: All async work via Inngest
2. **Type-Safe**: tRPC for API, TypeScript throughout
3. **Modular**: Feature modules in `/modules`, lib utilities separate
4. **Observable**: Sentry, PostHog, OpenTelemetry
5. **Scalable**: Stateless API, horizontal scaling ready
6. **Secure**: Auth middleware, sandboxed execution, PII filtering
7. **Resilient**: Retries, fallbacks, self-healing

---

## 🏁 Conclusion

**Dev X** is a sophisticated, production-grade platform that automates the entire software development lifecycle—from idea to deployed app. It combines AI code generation, automated testing, error recovery, and multi-provider deployment into a seamless, orchestrated workflow powered by Inngest events, E2B sandboxing, and comprehensive observability.

The platform is designed for speed, safety, and reliability, enabling both rapid prototyping and production-grade deployments with minimal manual intervention.
