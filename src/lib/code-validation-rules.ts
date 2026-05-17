// code-validation-rules.ts
// This file is auto-generated/shared for both prompt and validator logic.
// Update this file to keep rules in sync between agent prompt and validator.

export const CODE_VALIDATION_RULES = {
  importValidation: {
    enforce: true,
    zeroTolerance: true,
    auditChecklist: [
      'Every import must reference an existing file or package',
      'No phantom imports',
      'No grouped Shadcn imports',
      'Prefer tested Shadcn primitives for Button, Card, Input, Label, Badge, Tabs, Dialog, Sheet, DropdownMenu, Select, Separator, Skeleton, Alert, and Form',
      'Lucide icons: import { IconName } from "lucide-react"',
      'Shadcn: import { ComponentName } from "@/components/ui/component-name"',
      'Hooks: import { useState, useEffect } from "react"',
      'If you use React.forwardRef or any runtime React.* API, import * as React from "react"',
      'Next.js: import Link from "next/link", import Image from "next/image"',
      'If importing a component you are creating, create it first',
      'Verify every export matches what you are importing',
      'No data imports from ../data/*',
      'All data must be inline or passed as props',
      'No use of identifiers without import',
      'No missing imports for capitalized identifiers',
      'No missing imports for Lucide, Shadcn, React hooks, Next.js features',
      'No undefined identifiers',
      'No incorrect import paths',
    ]
  },
  typescriptStrictness: {
    enforce: true,
    rules: [
      'All function parameters must have type annotations',
      'Use interfaces for complex objects',
      'Add return types to functions',
      'Handle null/undefined explicitly',
      'Never use any type unless necessary',
      'Fix all red squiggly lines',
    ]
  },
  buildErrorPrevention: {
    enforce: true,
    rules: [
      'All components using useState, useEffect, useRouter, or browser APIs must have "use client" at line 1',
      'No mixing server/client code in same file',
      'Do not keep preinstall/install/postinstall/prepare scripts in preview package.json',
      'No missing await on async operations',
      'No undefined variables or props',
      'No incorrect import paths',
    ]
  },
  lovableStyle: {
    enforce: true,
    rules: [
      'Use modern design trends: gradients, glassmorphism, subtle shadows, depth',
      'Use Tailwind CSS for all styling',
      'Use Shadcn UI components from @/components/ui/*',
      'Use Lucide React icons',
      'Responsive and accessible by default',
      'No local/external image URLs, use emojis or divs with aspect ratios/colors',
      'Complete, realistic layout structure',
      'Functional clones must include realistic features and interactivity',
      'No static/hardcoded content for interactive features',
      'Modular, reusable components',
    ]
  }
};
