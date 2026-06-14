import { Sandbox as E2BSandboxRuntime, type Sandbox } from "e2b";
import { canonicalizeDevxGeneratedPath } from "@/lib/devx-app-schema";

export const SANDBOX_WORKSPACE_DIR = "/home/user/app";
export const PREVIEW_FALLBACK_SERVER_FILE = ".devx-diag-hud.mjs";
export const PRIMARY_E2B_TEMPLATE_NAME = "builder";

export const DEFAULT_E2B_TEMPLATE =
  process.env.E2B_TEMPLATE_ID ||
  process.env.E2B_TEMPLATE_NAME ||
  process.env.E2B_TEMPLATE ||
  PRIMARY_E2B_TEMPLATE_NAME;

/**
 * Canonical next.config.ts — single source of truth.
 * Used by normalizePreviewFiles, sanitizePreviewFile, and autofix.
 * The AI-generated version is ALWAYS replaced by this.
 */
export const CANONICAL_NEXT_CONFIG_TS = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  serverExternalPackages: ["@prisma/client"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "source.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
};

export default nextConfig;
`;

export const PREVIEW_CORE_RUNTIME_DEPENDENCIES: Record<string, string> = {
  next: "15.4.10",
  react: "19.1.4",
  "react-dom": "19.1.4",
};

export const PREVIEW_STYLE_DEPENDENCIES: Record<string, string> = {
  tailwindcss: "4.1.18",
  "@tailwindcss/postcss": "4.1.18",
  postcss: "8.4.47",
};

export const PREVIEW_UI_RUNTIME_DEPENDENCIES: Record<string, string> = {
  // EMPTY ON PURPOSE. All UI packages are installed dynamically based on
  // what the generated code actually imports (via inferPreviewRuntimePackages).
  // Version hints for all known packages live in PREVIEW_DEPENDENCY_HINTS.
};

// Full list of known package versions — used for version hints when
// inferPreviewRuntimePackages detects an import that needs installing.
export const PREVIEW_OPTIONAL_UI_PACKAGES: Record<string, string> = {
  clsx: "2.1.1",
  "tailwind-merge": "3.3.1",
  "class-variance-authority": "0.7.1",
  "lucide-react": "0.525.0",
  "@radix-ui/react-slot": "1.2.4",
  "framer-motion": "12.23.13",
  "react-hook-form": "7.61.1",
  "@hookform/resolvers": "3.9.1",
  zod: "4.3.2",
  "date-fns": "4.1.0",
  sonner: "2.0.7",
  "@radix-ui/react-dialog": "1.1.2",
  "@radix-ui/react-dropdown-menu": "2.1.2",
  "@radix-ui/react-label": "2.1.0",
  "@radix-ui/react-popover": "1.1.2",
  "@radix-ui/react-tabs": "1.1.1",
  "@radix-ui/react-toggle": "1.1.0",
  "@radix-ui/react-toast": "1.2.2",
  "@radix-ui/react-tooltip": "1.1.3",
  "@radix-ui/react-select": "2.1.2",
  "@radix-ui/react-separator": "1.1.0",
  "@radix-ui/react-scroll-area": "1.2.0",
  "@radix-ui/react-accordion": "1.2.1",
  "@radix-ui/react-checkbox": "1.1.2",
  "@radix-ui/react-switch": "1.1.1",
  "@radix-ui/react-slider": "1.2.1",
  "@radix-ui/react-progress": "1.1.0",
  "@radix-ui/react-radio-group": "1.2.1",
  "@radix-ui/react-collapsible": "1.1.1",
  "@radix-ui/react-avatar": "1.1.1",
  "@radix-ui/react-navigation-menu": "1.2.1",
  "@radix-ui/react-aspect-ratio": "1.1.0",
  "@radix-ui/react-menubar": "1.1.2",
  "@radix-ui/react-context-menu": "2.2.2",
  "@radix-ui/react-textarea": "1.2.2",
  "@radix-ui/react-alert-dialog": "1.1.2",
};

export const PREVIEW_DEV_DEPENDENCIES: Record<string, string> = {
  typescript: "^5",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "@types/node": "^20",
};

const PREVIEW_INVALID_VERSION_OVERRIDES: Record<string, Record<string, string>> = {
  "@types/node": {
    "20.20.0": "^20",
  },
  "@types/react": {
    "19.2.4": "^19",
  },
  "@types/react-dom": {
    "19.2.4": "^19",
  },
  typescript: {
    "5.7.3": "^5",
  },
};

export const PREVIEW_DEPENDENCY_HINTS: Record<string, string> = {
  ...PREVIEW_CORE_RUNTIME_DEPENDENCIES,
  ...PREVIEW_STYLE_DEPENDENCIES,
  ...PREVIEW_UI_RUNTIME_DEPENDENCIES,
  ...PREVIEW_OPTIONAL_UI_PACKAGES,
  ...PREVIEW_DEV_DEPENDENCIES,
  "@clerk/nextjs": "^6.32.0",
  "@clerk/themes": "^2.4.7",
  "@prisma/client": "^6.19.1",
  "@radix-ui/react-dialog": "1.1.2",
  "@radix-ui/react-dropdown-menu": "2.1.2",
  "@radix-ui/react-collapsible": "1.1.1",
  "@radix-ui/react-label": "2.1.0",
  "@radix-ui/react-popover": "1.1.2",
  "@radix-ui/react-radio-group": "1.2.1",
  "@radix-ui/react-select": "2.1.2",
  "@radix-ui/react-separator": "1.1.0",
  "@radix-ui/react-tabs": "1.1.1",
  "@radix-ui/react-toast": "1.2.2",
  "@radix-ui/react-tooltip": "1.1.3",
  "@tanstack/react-query": "^5.83.0",
  "@trpc/client": "^11.8.1",
  "@trpc/react-query": "^11.8.1",
  "@trpc/server": "^11.8.1",
  "@trpc/tanstack-react-query": "^11.8.1",
  axios: "^1.7.9",
  "next-themes": "^0.4.6",
  prisma: "^6.12.0",
  recharts: "^2.15.0",
  "react-icons": "^5.5.0",
  "react-resizable-panels": "^3.0.3",
  superjson: "^2.2.2",
  zustand: "^5.0.2",
};

const PREVIEW_LIFECYCLE_SCRIPT_KEYS = [
  "preinstall",
  "install",
  "postinstall",
  "prepare",
] as const;

const PREVIEW_SHADCN_UI_COMPONENTS: Record<string, string> = {
  button: `import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline: "border border-slate-700 bg-slate-950 hover:bg-slate-800 hover:text-slate-50",
        secondary: "bg-slate-800 text-slate-50 hover:bg-slate-700",
        ghost: "hover:bg-slate-800 hover:text-slate-50",
        link: "text-blue-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
`,
  card: `import * as React from "react";
import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-xl border border-slate-800 bg-slate-900 text-slate-50 shadow", className)} {...props} />;
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-sm text-slate-400", className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
`,
  input: `import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 ring-offset-slate-950 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
`,
  textarea: `import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-24 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
`,
  label: `"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
      {...props}
    />
  );
}

export { Label };
`,
  badge: `import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500",
  {
    variants: {
      variant: {
        default: "border-transparent bg-blue-600 text-white hover:bg-blue-700",
        secondary: "border-transparent bg-slate-800 text-slate-50 hover:bg-slate-700",
        destructive: "border-transparent bg-red-600 text-white hover:bg-red-700",
        outline: "text-slate-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
`,
  separator: `"use client";

import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "@/lib/utils";

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      decorative={decorative}
      orientation={orientation}
      className={cn("shrink-0 bg-slate-800", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className)}
      {...props}
    />
  );
}

export { Separator };
`,
  skeleton: `import * as React from "react";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("animate-pulse rounded-md bg-slate-800", className)} {...props} />;
}

export { Skeleton };
`,
  alert: `import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva("relative w-full rounded-lg border p-4", {
  variants: {
    variant: {
      default: "bg-slate-950 text-slate-50",
      destructive: "border-red-500/50 text-red-500",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function Alert({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

function AlertTitle({ className, ...props }: React.ComponentProps<"h5">) {
  return <h5 className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-sm", className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription };
`,
  tabs: `"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root className={cn("flex flex-col", className)} {...props} />;
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cn("inline-flex h-10 items-center justify-center rounded-md bg-slate-800 p-1 text-slate-400", className)} {...props} />;
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return <TabsPrimitive.Trigger className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-slate-950 data-[state=active]:text-slate-50 data-[state=active]:shadow-sm", className)} {...props} />;
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn("mt-2 ring-offset-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500", className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
`,
  dialog: `"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return <DialogPrimitive.Overlay className={cn("fixed inset-0 z-50 bg-black/80", className)} {...props} />;
}

function DialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn("fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border border-slate-800 bg-slate-950 p-6 text-slate-50 shadow-lg sm:rounded-lg", className)}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-sm text-slate-400", className)} {...props} />;
}

export { Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription };
`,
  sheet: `"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return <SheetPrimitive.Overlay className={cn("fixed inset-0 z-50 bg-black/80", className)} {...props} />;
}

function SheetContent({
  side = "right",
  className,
  children,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left";
}) {
  const sideClasses = {
    top: "inset-x-0 top-0 border-b",
    right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
    bottom: "inset-x-0 bottom-0 border-t",
    left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
  };

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content className={cn("fixed z-50 gap-4 bg-slate-950 p-6 text-slate-50 shadow-lg", sideClasses[side], className)} {...props}>
        {children}
        <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />;
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title className={cn("text-lg font-semibold text-slate-50", className)} {...props} />;
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return <SheetPrimitive.Description className={cn("text-sm text-slate-400", className)} {...props} />;
}

export { Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription };
`,
  "dropdown-menu": `"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

function DropdownMenuContent({ className, sideOffset = 4, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content sideOffset={sideOffset} className={cn("z-50 min-w-32 overflow-hidden rounded-md border border-slate-800 bg-slate-950 p-1 text-slate-50 shadow-md", className)} {...props} />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuItem({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Item>) {
  return <DropdownMenuPrimitive.Item className={cn("relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-slate-800 focus:text-slate-50", className)} {...props} />;
}

function DropdownMenuCheckboxItem({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return <DropdownMenuPrimitive.CheckboxItem className={cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-slate-800 focus:text-slate-50", className)} {...props} />;
}

function DropdownMenuRadioItem({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return <DropdownMenuPrimitive.RadioItem className={cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-slate-800 focus:text-slate-50", className)} {...props} />;
}

function DropdownMenuLabel({ className, inset, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & { inset?: boolean }) {
  return <DropdownMenuPrimitive.Label className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)} {...props} />;
}

function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return <DropdownMenuPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-slate-800", className)} {...props} />;
}

function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("ml-auto text-xs tracking-widest opacity-60", className)} {...props} />;
}

const DropdownMenuSubTrigger = DropdownMenuPrimitive.SubTrigger;
const DropdownMenuSubContent = DropdownMenuPrimitive.SubContent;

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
};
`,
  select: `"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger className={cn("flex h-10 w-full items-center justify-between rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm ring-offset-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50", className)} {...props}>
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectScrollUpButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return <SelectPrimitive.ScrollUpButton className={cn("flex cursor-default items-center justify-center py-1", className)} {...props}><ChevronUp className="h-4 w-4" /></SelectPrimitive.ScrollUpButton>;
}

function SelectScrollDownButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return <SelectPrimitive.ScrollDownButton className={cn("flex cursor-default items-center justify-center py-1", className)} {...props}><ChevronDown className="h-4 w-4" /></SelectPrimitive.ScrollDownButton>;
}

function SelectContent({ className, children, position = "popper", ...props }: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content className={cn("relative z-50 max-h-96 min-w-32 overflow-hidden rounded-md border border-slate-800 bg-slate-950 text-slate-50 shadow-md", position === "popper" && "translate-y-1", className)} position={position} {...props}>
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return <SelectPrimitive.Label className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)} {...props} />;
}

function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item className={cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-slate-800 focus:text-slate-50", className)} {...props}>
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return <SelectPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-slate-800", className)} {...props} />;
}

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton };
`,
  "radio-group": `"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root className={cn("grid gap-2", className)} {...props} />;
}

function RadioGroupItem({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item className={cn("aspect-square h-4 w-4 rounded-full border border-blue-600 text-blue-600 ring-offset-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50", className)} {...props}>
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <span className="h-2.5 w-2.5 rounded-full bg-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
`,
  tooltip: `"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

function TooltipContent({ className, sideOffset = 4, ...props }: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return <TooltipPrimitive.Content sideOffset={sideOffset} className={cn("z-50 overflow-hidden rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white shadow-md", className)} {...props} />;
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
`,
  form: `"use client";

import * as React from "react";
import { Controller, FormProvider, type ControllerProps, type FieldPath, type FieldValues } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const Form = FormProvider;

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(props: ControllerProps<TFieldValues, TName>) {
  return <Controller {...props} />;
}

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

function FormLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return <Label className={cn(className)} {...props} />;
}

function FormControl({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-slate-400", className)} {...props} />;
}

function FormMessage({ className, children, ...props }: React.ComponentProps<"p">) {
  if (!children) return null;
  return <p className={cn("text-sm font-medium text-red-500", className)} {...props}>{children}</p>;
}

export { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage };
`,
  avatar: `"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

function Avatar({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return <AvatarPrimitive.Root className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)} {...props} />;
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return <AvatarPrimitive.Image className={cn("aspect-square h-full w-full", className)} {...props} />;
}

function AvatarFallback({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return <AvatarPrimitive.Fallback className={cn("flex h-full w-full items-center justify-center rounded-full bg-slate-700 text-slate-100 text-sm font-medium", className)} {...props} />;
}

export { Avatar, AvatarImage, AvatarFallback };
`,
  switch: `"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn("peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-700", className)}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0" />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
`,
  checkbox: `"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn("peer h-4 w-4 shrink-0 rounded-sm border border-slate-700 shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white", className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <Check className="h-4 w-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
`,
  "scroll-area": `"use client";

import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";

function ScrollArea({ className, children, ...props }: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root className={cn("relative overflow-hidden", className)} {...props}>
      <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({ className, orientation = "vertical", ...props }: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      orientation={orientation}
      className={cn("flex touch-none select-none transition-colors", orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-px", orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-px", className)}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-slate-700" />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}

export { ScrollArea, ScrollBar };
`,
};

/**
 * Replaces shadcn/ui-style utility classes with real Tailwind v4 equivalents.
 * Runs on ALL generated files (TSX, CSS, etc.) to prevent PostCSS crashes.
 *
 * Common error without this: "Cannot apply unknown utility class `ring-offset-background`"
 */
export function sanitizeShadcnUtilities(content: string): string {
  // Order matters: replace longer compound classes first to avoid partial matches
  const replacements: [RegExp, string][] = [
    // ═══ PHASE 0: Strip Tailwind v4 CSS-variable function syntax ═══
    // LLMs (especially DeepSeek) hallucinate `text-(--muted-foreground)` etc.
    // which breaks JS string parsing.  Normalize to plain token form first,
    // then the rules below convert them to concrete Tailwind colors.
    [/text-\(--([a-z-]+)\)/g, "text-$1"],
    [/bg-\(--([a-z-]+)\)/g, "bg-$1"],
    [/border-\(--([a-z-]+)\)/g, "border-$1"],
    [/ring-\(--([a-z-]+)\)/g, "ring-$1"],
    [/outline-\(--([a-z-]+)\)/g, "outline-$1"],
    [/shadow-\(--([a-z-]+)\)/g, "shadow-$1"],
    [/fill-\(--([a-z-]+)\)/g, "fill-$1"],
    [/stroke-\(--([a-z-]+)\)/g, "stroke-$1"],
    [/placeholder-\(--([a-z-]+)\)/g, "placeholder-$1"],
    [/divide-\(--([a-z-]+)\)/g, "divide-$1"],
    [/accent-\(--([a-z-]+)\)/g, "accent-$1"],
    [/caret-\(--([a-z-]+)\)/g, "caret-$1"],
    [/decoration-\(--([a-z-]+)\)/g, "decoration-$1"],

    // Compound foreground classes (must come before base classes)
    [/ring-offset-background/g, "ring-offset-slate-950"],
    [/text-destructive-foreground/g, "text-white"],
    [/text-primary-foreground/g, "text-white"],
    [/text-secondary-foreground/g, "text-slate-50"],
    [/text-muted-foreground/g, "text-slate-400"],
    [/text-accent-foreground/g, "text-slate-50"],
    [/text-popover-foreground/g, "text-slate-50"],
    [/text-card-foreground/g, "text-slate-50"],

    // Backgrounds with potential opacity modifiers (e.g. bg-primary/90)
    [/bg-background(\/\d+)?/g, "bg-slate-950$1"],
    [/bg-primary-foreground(\/\d+)?/g, "bg-white$1"], // Added missing foreground bg
    [/bg-primary(\/\d+)?(?!\-)/g, "bg-blue-600$1"],
    [/bg-secondary-foreground(\/\d+)?/g, "bg-slate-50$1"],
    [/bg-secondary(\/\d+)?(?!\-)/g, "bg-slate-800$1"],
    [/bg-destructive-foreground(\/\d+)?/g, "bg-white$1"],
    [/bg-destructive(\/\d+)?(?!\-)/g, "bg-red-600$1"],
    [/bg-muted(\/\d+)?(?!\-)/g, "bg-slate-800$1"],
    [/bg-accent(\/\d+)?(?!\-)/g, "bg-slate-800$1"],
    [/bg-popover(\/\d+)?(?!\-)/g, "bg-slate-950$1"],
    [/bg-card(\/\d+)?(?!\-)/g, "bg-slate-900$1"],
    [/bg-surface(\/\d+)?/g, "bg-slate-900$1"],

    // Custom premium classes
    [/glass-card/g, "bg-slate-900/40 backdrop-blur-xl border border-white/5 shadow-2xl rounded-2xl"],

    // Border / ring / outline
    [/border-input/g, "border-slate-300"],
    [/border-border/g, "border-slate-800"],
    [/border-destructive(?!\-)/g, "border-red-500"],
    [/border-primary(?!\-)/g, "border-blue-600"],
    [/border-secondary(?!\-)/g, "border-slate-700"],
    [/border-accent(?!\-)/g, "border-slate-700"],
    [/outline-ring/g, "outline-blue-500"],
    [/ring-ring/g, "ring-blue-500"],
    [/ring-offset-ring/g, "ring-offset-blue-500"],

    // Text classes
    [/text-foreground/g, "text-slate-50"],
    [/text-background/g, "text-slate-950"],
    [/text-destructive(?!\-)/g, "text-red-500"],
    [/text-primary(?!\-)/g, "text-blue-600"],
    [/text-secondary(?!\-)/g, "text-slate-300"],
    [/text-muted(?!\-)/g, "text-slate-400"],
    [/text-accent(?!\-)/g, "text-slate-200"],
    [/text-popover(?!\-)/g, "text-slate-200"],
    [/text-card(?!\-)/g, "text-slate-200"],
  ];

  let result = content;
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function hasReactNamespaceRuntimeUsage(content: string): boolean {
  return /\bReact\.(forwardRef|memo|lazy|Fragment|Children|cloneElement|createContext|createElement|createRef|isValidElement|startTransition|Suspense|use[A-Z][A-Za-z0-9_]*)\b/.test(
    content
  );
}

function hasReactNamespaceImport(content: string): boolean {
  return /import\s+(?:type\s+)?(?:\*\s+as\s+React|React(?:\s*,\s*\{[^}]*\})?)\s+from\s+['"]react['"]/.test(
    content
  );
}

const COMMON_LUCIDE_ICON_NAMES = new Set([
  "Activity",
  "AlarmClock",
  "AlertCircle",
  "AlertTriangle",
  "Apple",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "Award",
  "BadgeCheck",
  "BarChart",
  "BarChart3",
  "Bean",
  "Beef",
  "Bell",
  "BookOpen",
  "Box",
  "Briefcase",
  "Building",
  "Building2",
  "CakeSlice",
  "Calendar",
  "Car",
  "Carrot",
  "Check",
  "CheckCircle",
  "CheckCircle2",
  "ChefHat",
  "ChevronDown",
  "ChevronLeft",
  "ChevronRight",
  "ChevronUp",
  "Cherry",
  "CircleDollarSign",
  "Citrus",
  "Clock",
  "Cloud",
  "Code2",
  "Coffee",
  "Cookie",
  "CreditCard",
  "DollarSign",
  "Download",
  "Egg",
  "Edit",
  "ExternalLink",
  "Eye",
  "EyeOff",
  "Facebook",
  "FileText",
  "Filter",
  "Fish",
  "FolderOpen",
  "Gift",
  "Globe",
  "GraduationCap",
  "Grid3X3",
  "Heart",
  "Home",
  "IceCream",
  "Info",
  "Instagram",
  "Leaf",
  "LifeBuoy",
  "Loader2",
  "Lock",
  "Mail",
  "Map",
  "MapPin",
  "Menu",
  "MessageCircle",
  "MessageSquare",
  "Milk",
  "Minus",
  "MoreHorizontal",
  "MoreVertical",
  "Navigation",
  "Package",
  "PanelLeft",
  "Pencil",
  "Phone",
  "Pizza",
  "Plus",
  "Quote",
  "RefreshCw",
  "Salad",
  "Sandwich",
  "Search",
  "Send",
  "Settings",
  "Share2",
  "Shield",
  "ShoppingBag",
  "ShoppingBasket",
  "ShoppingCart",
  "SlidersHorizontal",
  "Sparkles",
  "Star",
  "Store",
  "Tag",
  "Trash",
  "Trash2",
  "Truck",
  "Twitter",
  "Upload",
  "User",
  "Users",
  "Utensils",
  "Wallet",
  "Wheat",
  "X",
  "Zap",
]);

function getImportLocalName(specifier: string): string | null {
  const cleaned = specifier.trim().replace(/^type\s+/, "");
  if (!cleaned) return null;

  const alias = cleaned.match(/\s+as\s+([A-Za-z_$][\w$]*)$/);
  if (alias?.[1]) return alias[1];

  return cleaned.match(/^([A-Za-z_$][\w$]*)/)?.[1] ?? null;
}

function collectImportedAndDeclaredIdentifiers(content: string): Set<string> {
  const identifiers = new Set<string>();
  const importRegex =
    /^import\s+(?:type\s+)?([\s\S]*?)\s+from\s+['"][^'"]+['"];?/gm;
  let importMatch: RegExpExecArray | null;

  while ((importMatch = importRegex.exec(content)) !== null) {
    const clause = importMatch[1].trim();
    const namespaceImport = clause.match(/^\*\s+as\s+([A-Za-z_$][\w$]*)$/);
    if (namespaceImport?.[1]) {
      identifiers.add(namespaceImport[1]);
      continue;
    }

    const defaultImport = clause.match(/^([A-Za-z_$][\w$]*)(?:\s*,|$)/);
    if (defaultImport?.[1] && !clause.startsWith("{")) {
      identifiers.add(defaultImport[1]);
    }

    const namedImport = clause.match(/\{([\s\S]*)\}/);
    if (namedImport?.[1]) {
      namedImport[1].split(",").forEach((specifier) => {
        const localName = getImportLocalName(specifier);
        if (localName) identifiers.add(localName);
      });
    }
  }

  const declarationRegex =
    /\b(?:const|let|var|function|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)\b/g;
  let declarationMatch: RegExpExecArray | null;
  while ((declarationMatch = declarationRegex.exec(content)) !== null) {
    identifiers.add(declarationMatch[1]);
  }

  return identifiers;
}

function collectJsxComponentNames(content: string): Set<string> {
  const names = new Set<string>();
  const jsxTagRegex = /<\/?([A-Z][A-Za-z0-9_]*)\b/g;
  let match: RegExpExecArray | null;

  while ((match = jsxTagRegex.exec(content)) !== null) {
    names.add(match[1]);
  }

  return names;
}

function insertImportStatement(content: string, importStatement: string): string {
  const statement = `${importStatement}\n`;
  const importRegex =
    /^import\s+(?:[\s\S]*?\s+from\s+['"][^'"]+['"]|['"][^'"]+['"])\s*;?\s*$/gm;
  let lastImportEnd = -1;
  let importMatch: RegExpExecArray | null;

  while ((importMatch = importRegex.exec(content)) !== null) {
    lastImportEnd = importMatch.index + importMatch[0].length;
  }

  if (lastImportEnd >= 0) {
    const before = content.slice(0, lastImportEnd);
    const after = content.slice(lastImportEnd);
    return `${before}${before.endsWith("\n") ? "" : "\n"}${statement}${after.startsWith("\n") ? after : `\n${after}`}`;
  }

  const useClientPrefix = content.match(/^['"]use client['"];?\s*\r?\n(?:\r?\n)?/);
  if (useClientPrefix) {
    return (
      content.slice(0, useClientPrefix[0].length) +
      statement +
      content.slice(useClientPrefix[0].length)
    );
  }

  return `${statement}${content}`;
}

function ensureLucideIconImports(content: string): string {
  const availableIdentifiers = collectImportedAndDeclaredIdentifiers(content);
  const missingIcons = [...collectJsxComponentNames(content)]
    .filter(
      (name) =>
        COMMON_LUCIDE_ICON_NAMES.has(name) && !availableIdentifiers.has(name)
    )
    .sort();

  if (missingIcons.length === 0) return content;

  const existingLucideImport =
    /import\s*\{([\s\S]*?)\}\s*from\s*['"]lucide-react['"];?/m;
  const existingImportMatch = content.match(existingLucideImport);

  if (existingImportMatch?.[1]) {
    const currentSpecifiers = existingImportMatch[1]
      .split(",")
      .map((specifier) => specifier.trim())
      .filter(Boolean);
    const currentLocalNames = new Set(
      currentSpecifiers
        .map((specifier) => getImportLocalName(specifier))
        .filter((specifier): specifier is string => Boolean(specifier))
    );
    const additions = missingIcons.filter((icon) => !currentLocalNames.has(icon));

    if (additions.length === 0) return content;

    const mergedSpecifiers = [...currentSpecifiers, ...additions].sort((a, b) =>
      a.localeCompare(b)
    );
    return content.replace(
      existingLucideImport,
      `import { ${mergedSpecifiers.join(", ")} } from "lucide-react";`
    );
  }

  return insertImportStatement(
    content,
    `import { ${missingIcons.join(", ")} } from "lucide-react";`
  );
}

/**
 * Fixes common wrong import patterns that AI models hallucinate.
 * e.g. sonner has NO default export, but models generate `import toast from 'sonner'`.
 *
 * Add any future named-export-only fixes here — single source of truth.
 */
export function sanitizeImports(content: string): string {
  let fixed = content;

  // 1. SONNER: sonner has NO default export.
  // import toast from 'sonner' -> import { toast } from 'sonner'
  // import Toaster from 'sonner' -> import { Toaster } from 'sonner'
  fixed = fixed.replace(
    /import\s+(toast|Toaster)\s+from\s+['"]sonner['"]/g,
    "import { $1 } from 'sonner'"
  );
  // import toast, { ... } from 'sonner' -> import { toast, ... } from 'sonner'
  fixed = fixed.replace(
    /import\s+(toast|Toaster)\s*,\s*\{([^}]+)\}\s*from\s+['"]sonner['"]/g,
    "import { $1, $2 } from 'sonner'"
  );

  // 2. RECHARTS: recharts has NO default export.
  // import PieChart from 'recharts' -> import { PieChart } from 'recharts'
  // Support multiple components: import { Pie, Cell } from 'recharts' (already correct)
  // But fix common default import hallucination:
  fixed = fixed.replace(
    /import\s+([A-Z][a-zA-Z]+)\s+from\s+['"]recharts['"]/g,
    "import { $1 } from 'recharts'"
  );

  // 3. CLSX / TAILWIND-MERGE: Ensure they aren't mixed up.
  // clsx is often used as a default import (correct), but some folks try { clsx }.
  // tailwind-merge is often used as { twMerge }.

  // 4. LUCIDE-REACT: Fix naming hallucinations.
  // AI often tries 'LayoutDashboardIcon' (wrong) instead of 'LayoutDashboard'.
  // We'll strip common 'Icon' suffixes that aren't real for Lucide.
  const commonIconErrors: [RegExp, string][] = [
    [/DashboardLayoutIcon/g, "LayoutDashboard"],
    [/DashboardIcon/g, "LayoutDashboard"],
    [/LayoutDashboardIcon/g, "LayoutDashboard"],
    [/ChartIcon/g, "BarChart"],
    [/HomeIcon/g, "Home"],
    [/UserIcon/g, "User"],
    [/SettingsIcon/g, "Settings"],
    [/PlusIcon/g, "Plus"],
    [/XIcon/g, "X"],
    [/SearchIcon/g, "Search"],
    [/BellIcon/g, "Bell"],
    [/ChevronDownIcon/g, "ChevronDown"],
    [/ChevronUpIcon/g, "ChevronUp"],
    [/ChevronLeftIcon/g, "ChevronLeft"],
    [/ChevronRightIcon/g, "ChevronRight"],
    [/FilterIcon/g, "Filter"],
    [/DownloadIcon/g, "Download"],
    [/UploadIcon/g, "Upload"],
    [/TrashIcon/g, "Trash2"],
    [/EditIcon/g, "Pencil"],
  ];
  for (const [pattern, replacement] of commonIconErrors) {
    fixed = fixed.replace(pattern, replacement);
  }
  fixed = ensureLucideIconImports(fixed);

  // 5. Framer Motion: AI sometimes does `import motion from 'framer-motion'`
  fixed = fixed.replace(
    /import\s+motion\s+from\s+['"]framer-motion['"]/g,
    "import { motion } from 'framer-motion'"
  );

  // 5.5 If framer-motion is used, it MUST be a client component in App Router.
  // Next.js often resolves imported 'motion' as undefined in SCs.
  if (fixed.includes("framer-motion") && !fixed.includes('"use client"') && !fixed.includes("'use client'")) {
    fixed = `"use client";\n\n${fixed}`;
  }

  // Generated shadcn-style files often call React.forwardRef without importing React.
  if (hasReactNamespaceRuntimeUsage(fixed) && !hasReactNamespaceImport(fixed)) {
    const reactImport = 'import * as React from "react"\n';
    const useClientPrefix = fixed.match(/^['"]use client['"];?\s*\r?\n(?:\r?\n)?/);

    if (useClientPrefix) {
      fixed =
        fixed.slice(0, useClientPrefix[0].length) +
        reactImport +
        fixed.slice(useClientPrefix[0].length);
    } else {
      fixed = `${reactImport}${fixed}`;
    }
  }

  // 6. RADIX UI: Radix components should almost always be imported as named exports or * as.
  // AI often does `import Dialog from '@radix-ui/react-dialog'`
  const radixPackages = [
    'dialog', 'dropdown-menu', 'tabs', 'toast', 'popover', 'select', 'accordion', 'avatar', 'checkbox', 'label', 'scroll-area', 'separator', 'slider', 'switch', 'tooltip'
  ];
  for (const pkg of radixPackages) {
    const regex = new RegExp(`import\\s+([A-Z][a-zA-Z]+)\\s+from\\s+['"]@radix-ui/react-${pkg}['"]`, 'g');
    fixed = fixed.replace(regex, "import * as $1 from '@radix-ui/react-" + pkg + "'");
  }

  // 7. General Hallucinations: `import { cn } from '@/lib/utils'` is correct, 
  // but sometimes it does `import cn from '@/lib/utils'`
  fixed = fixed.replace(
    /import\s+cn\s+from\s+['"]@\/lib\/utils['"]/g,
    "import { cn } from '@/lib/utils'"
  );

  fixed = fixed.replace(
    /import\s+twMerge\s+from\s+['"]tailwind-merge['"]/g,
    "import { twMerge } from 'tailwind-merge'"
  );

  fixed = fixed.replace(
    /from\s+['"]shadcn\/ui['"]/g,
    "from '@/components/ui'"
  );

  return fixed;
}

function isPreviewSourceFile(path: string): boolean {
  return /\.(tsx?|jsx?|mjs|cjs|css|scss|json)$/.test(path);
}

function isPreviewScriptFile(path: string): boolean {
  return /\.(tsx?|jsx?|mjs|cjs)$/.test(path);
}

function normalizePreviewPath(path: string): string {
  return path.replace(/\\/g, "/");
}

function isPreviewApiRoute(path: string): boolean {
  const normalized = normalizePreviewPath(path);
  return (
    (normalized.startsWith("app/api/") || normalized.startsWith("src/app/api/")) &&
    /\/route\.(ts|tsx|js|jsx)$/.test(normalized)
  );
}

function exportsNextMetadata(content: string): boolean {
  return /export\s+const\s+metadata\b|export\s+(async\s+)?function\s+generateMetadata\b/.test(
    content
  );
}

function hasClientOnlyFeatures(content: string): boolean {
  return (
    /\b(useState|useEffect|useLayoutEffect|useReducer|useRef|useMemo|useCallback|useImperativeHandle|useTransition|useDeferredValue|useOptimistic|useActionState)\s*\(/.test(
      content
    ) ||
    /\b(window|document|localStorage|sessionStorage|navigator|matchMedia|MutationObserver|ResizeObserver)\b/.test(
      content
    ) ||
    /\bon[A-Z][A-Za-z]+\s*=\s*{/.test(content) ||
    content.includes("framer-motion")
  );
}

function stripUseClientDirectives(content: string): string {
  return content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => !/^\s*['"]use client['"];?\s*$/.test(line))
    .join("\n")
    .replace(/^\s+/, "");
}

function normalizeUseClientDirective(path: string, content: string): string {
  const hadUseClient = /^\s*['"]use client['"];?\s*$/m.test(content);
  const stripped = stripUseClientDirectives(content);
  const disallowUseClient =
    isPreviewApiRoute(path) || exportsNextMetadata(stripped);
  const needsUseClient =
    !disallowUseClient && (hadUseClient || hasClientOnlyFeatures(stripped));

  if (!needsUseClient) {
    return stripped;
  }

  return `"use client";\n\n${stripped}`;
}

function getPreviewAppBaseDir(files: Record<string, string>): "app" | "src/app" {
  return Object.keys(files).some((path) => normalizePreviewPath(path).startsWith("src/app/"))
    ? "src/app"
    : "app";
}

function getPreviewLibBaseDir(files: Record<string, string>): "lib" | "src/lib" {
  return Object.keys(files).some((path) => normalizePreviewPath(path).startsWith("src/"))
    ? "src/lib"
    : "lib";
}

function getPreviewUiBaseDir(files: Record<string, string>): "components/ui" | "src/components/ui" {
  const paths = Object.keys(files).map(normalizePreviewPath);

  if (paths.some((path) => path.startsWith("src/components/"))) {
    return "src/components/ui";
  }

  if (paths.some((path) => path.startsWith("src/app/"))) {
    return "src/components/ui";
  }

  return "components/ui";
}

function ensurePreviewShadcnComponents(
  files: Record<string, string>,
  uiBaseDir: "components/ui" | "src/components/ui"
) {
  for (const [componentName, source] of Object.entries(PREVIEW_SHADCN_UI_COMPONENTS)) {
    const componentPath = `${uiBaseDir}/${componentName}.tsx`;
    if (!files[componentPath]) {
      files[componentPath] = source;
    }
  }

  const barrelPath = `${uiBaseDir}/index.ts`;
  if (!files[barrelPath]) {
    files[barrelPath] = `${Object.keys(PREVIEW_SHADCN_UI_COMPONENTS)
      .sort()
      .map((componentName) => `export * from "./${componentName}";`)
      .join("\n")}\n`;
  }
}

export function inferPreviewRuntimePackages(filesMap: Record<string, string>): string[] {
  const builtins = new Set([
    "assert",
    "buffer",
    "child_process",
    "crypto",
    "events",
    "fs",
    "http",
    "https",
    "os",
    "path",
    "querystring",
    "stream",
    "tty",
    "url",
    "util",
    "zlib",
  ]);
  const specs = new Set<string>();
  const importRegex =
    /from\s+['"]([^'"\n]+)['"]|import\(\s*['"]([^'"\n]+)['"]\s*\)|require\(\s*['"]([^'"\n]+)['"]\s*\)/g;

  for (const [path, content] of Object.entries(filesMap)) {
    if (!isPreviewScriptFile(path)) {
      continue;
    }

    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(content)) !== null) {
      const spec = (match[1] || match[2] || match[3] || "").trim();
      if (!spec) {
        continue;
      }
      if (
        spec.startsWith(".") ||
        spec.startsWith("/") ||
        spec.startsWith("@/") ||
        spec === "shadcn/ui" ||
        spec.startsWith("shadcn/") ||
        spec.startsWith("http://") ||
        spec.startsWith("https://") ||
        spec.startsWith("node:")
      ) {
        continue;
      }
      if (spec.endsWith(".css") || spec.endsWith(".scss") || spec.endsWith(".sass")) {
        continue;
      }

      let pkgName = spec;
      if (spec.startsWith("next/")) {
        pkgName = "next";
      } else if (spec.startsWith("@")) {
        const parts = spec.split("/");
        if (parts.length >= 2) {
          pkgName = `${parts[0]}/${parts[1]}`;
        }
      } else if (spec.includes("/")) {
        pkgName = spec.split("/")[0];
      }

      if (!pkgName || builtins.has(pkgName) || !/^[a-zA-Z0-9@._/-]+$/.test(pkgName)) {
        continue;
      }

      specs.add(pkgName);
    }
  }

  return [...specs];
}

/**
 * Greedy JSON extractor that finds the outermost { } pair.
 * This effectively ignores markdown wrappers or AI chatter before/after.
 */
function extractJsonCore(content: string): string {
  const firstBrace = content.indexOf("{");
  const lastBrace = content.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return content.substring(firstBrace, lastBrace + 1);
  }
  return content;
}

/**
 * Removes all JS-style comments (// and /* * /) from a JSON string.
 */
function stripJsonComments(content: string): string {
  // Simple but effective: strip /*... */ block comments and // line comments
  // (Ignoring the edge case of // inside a string for now, as AI JSONs are usually clean-ish)
  return content
    .replace(/\/\*[\s\S]*?\*\/|(?<!"|')\/\/.*$/gm, "")
    .trim();
}

/**
 * Nuke all non-printable ASCII characters for ultra-stable configuration files.
 */
function enforceStrictAscii(content: string): string {
  // Keep 32-126 (printable), 10 (\n), 13 (\r), 9 (\t)
  return content.replace(/[^\x20-\x7E\x0A\x0D\x09]/g, "");
}

/**
 * Deduplicates import statements in a TypeScript/JavaScript file.
 * - Removes exact duplicate import lines
 * - Merges named imports from the same source (e.g., two `import { X } from "react"` become one)
 * - Handles mixed default + named imports (e.g., `import React, { useState } from 'react'`)
 */
function deduplicateImports(content: string): string {
  const lines = content.split("\n");
  const importLines: { idx: number; line: string; source: string; names: Set<string>; defaultName: string | null; isStar: boolean; raw: string }[] = [];
  const nonImportLines: { idx: number; line: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Match import statements
    const namedMatch = trimmed.match(/^import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]\s*;?\s*$/);
    const defaultMatch = trimmed.match(/^import\s+([A-Za-z_$][A-Za-z0-9_$]*)\s+from\s*['"]([^'"]+)['"]\s*;?\s*$/);
    const mixedMatch = trimmed.match(/^import\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*,\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]\s*;?\s*$/);
    const starMatch = trimmed.match(/^import\s*\*\s*as\s+([A-Za-z_$][A-Za-z0-9_$]*)\s+from\s*['"]([^'"]+)['"]\s*;?\s*$/);

    if (mixedMatch) {
      const names = new Set(mixedMatch[2].split(",").map(s => s.trim()).filter(Boolean));
      importLines.push({ idx: i, line, source: mixedMatch[3], names, defaultName: mixedMatch[1], isStar: false, raw: trimmed });
    } else if (namedMatch) {
      const names = new Set(namedMatch[1].split(",").map(s => s.trim()).filter(Boolean));
      importLines.push({ idx: i, line, source: namedMatch[2], names, defaultName: null, isStar: false, raw: trimmed });
    } else if (starMatch) {
      importLines.push({ idx: i, line, source: starMatch[2], names: new Set(), defaultName: starMatch[1], isStar: true, raw: trimmed });
    } else if (defaultMatch) {
      importLines.push({ idx: i, line, source: defaultMatch[2], names: new Set(), defaultName: defaultMatch[1], isStar: false, raw: trimmed });
    } else {
      nonImportLines.push({ idx: i, line });
    }
  }

  if (importLines.length <= 1) return content; // Nothing to dedup

  // Group by source module
  const bySource = new Map<string, typeof importLines>();
  for (const imp of importLines) {
    if (!bySource.has(imp.source)) bySource.set(imp.source, []);
    bySource.get(imp.source)!.push(imp);
  }

  // Build deduplicated import lines
  const dedupedImports: string[] = [];
  let changed = false;

  for (const [source, imports] of bySource) {
    if (imports.length === 1) {
      dedupedImports.push(imports[0].line);
      continue;
    }

    changed = true;

    // Merge all names and default imports
    const allNames = new Set<string>();
    let defaultName: string | null = null;
    let hasStar = false;
    let starName: string | null = null;

    for (const imp of imports) {
      imp.names.forEach(n => allNames.add(n));
      if (imp.defaultName && !imp.isStar) defaultName = imp.defaultName;
      if (imp.isStar) { hasStar = true; starName = imp.defaultName; }
    }

    if (hasStar && starName) {
      dedupedImports.push(`import * as ${starName} from "${source}";`);
    } else if (defaultName && allNames.size > 0) {
      dedupedImports.push(`import ${defaultName}, { ${Array.from(allNames).join(", ")} } from "${source}";`);
    } else if (defaultName) {
      dedupedImports.push(`import ${defaultName} from "${source}";`);
    } else if (allNames.size > 0) {
      dedupedImports.push(`import { ${Array.from(allNames).join(", ")} } from "${source}";`);
    }
  }

  if (!changed) return content;

  // Rebuild file: deduplicated imports + non-import lines
  const firstImportIdx = importLines[0].idx;
  const lastImportIdx = importLines[importLines.length - 1].idx;

  // Get lines before first import, between imports that aren't imports, and after last import
  const beforeImports = lines.slice(0, firstImportIdx);
  const afterImports = lines.slice(lastImportIdx + 1);

  return [...beforeImports, ...dedupedImports, ...afterImports].join("\n");
}

/**
 * Sanitizes CSS to fix common LLM-generated Tailwind v4 errors:
 * 1. Strips @apply (removed in Tailwind v4)
 * 2. Fixes multi-class Tailwind selectors used as CSS selectors
 *    e.g. ".bg-slate-900/40 backdrop-blur-xl border { ... }" → ".glass-panel { ... }"
 * 3. Strips selectors with / (invalid CSS)
 */
function sanitizeTailwindCss(content: string): string {
  let fixed = content;

  // 1. Strip @apply lines entirely (Tailwind v4 doesn't support @apply)
  fixed = fixed.replace(/^\s*@apply\s+[^;]+;\s*$/gm, "");

  // 2. Fix invalid selectors inside @layer blocks
  // Pattern: ".utility-class other-classes { ... }" where utilities contain / or spaces
  // Strategy: Process line by line, detect selectors with / or multiple space-separated classes
  const lines = fixed.split("\n");
  const result: string[] = [];
  let classCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect invalid selector: starts with . and contains / before {
    // e.g. "  .bg-slate-900/40 backdrop-blur-xl border border-white/5 shadow-2xl rounded-2xl {"
    if (trimmed.match(/^\.[a-zA-Z][\w-]*\//) && trimmed.endsWith("{")) {
      // This is a Tailwind utility used as a CSS selector — INVALID
      // Replace with a generated safe class name
      classCounter++;
      const indent = line.match(/^(\s*)/)?.[1] || "  ";
      result.push(`${indent}.generated-component-${classCounter} {`);
      continue;
    }

    // Also catch: ".class1 class2 class3 {" (space-separated utilities as selectors)
    // A valid CSS compound selector uses . # : [ but NOT bare words after the first class
    if (trimmed.match(/^\.[a-zA-Z][\w-]+\s+[a-zA-Z][\w-]+/) && trimmed.endsWith("{")) {
      // Multiple bare words = Tailwind utilities jammed together as a selector
      // Extract just the first class name
      const firstClass = trimmed.match(/^(\.[a-zA-Z][\w-]+)/)?.[1];
      if (firstClass && firstClass.includes("/")) {
        // Even the first class has / (invalid) — generate a safe name
        classCounter++;
        const indent = line.match(/^(\s*)/)?.[1] || "  ";
        result.push(`${indent}.generated-component-${classCounter} {`);
      } else if (firstClass) {
        const indent = line.match(/^(\s*)/)?.[1] || "  ";
        result.push(`${indent}${firstClass} {`);
      } else {
        result.push(line);
      }
      continue;
    }

    result.push(line);
  }

  return result.join("\n");
}

export function sanitizePreviewFile(path: string, content: string): string {
  // Normalize all line endings to standard \n (LF) to prevent OS-specific regex failures on Windows (\r\n)
  let fixed = content.replace(/\r\n/g, "\n");

  // 0. Invisible Character Strip (Pure Root Purge)
  // Strips BOM, zero-width spaces, and other invisible control characters at the start
  fixed = fixed.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF\u00A0\s]+/, "");

  // 0.3. NEXT.CONFIG.TS GUARD (Nuclear Config Protection)
  // The AI frequently generates broken next.config.ts with hallucinated syntax:
  //   - Triple/double quotes: protocol: "https""", hostname: "images.unsplash.com" }",
  //   - Broken object literals: missing commas, extra braces, invalid JS
  // Since next.config.ts is a critical boot file, ANY syntax error kills the build.
  // Strategy: If the file looks broken, replace it entirely with the canonical version.
  if (/^next\.config\.(ts|mjs|js)$/.test(path)) {
    const hasBrokenQuotes = /"{2,}/.test(fixed) || /'{2,}/.test(fixed); // consecutive quotes
    const hasTrailingQuoteBrace = /}"/.test(fixed); // orphan quote after brace
    const hasUnbalancedBraces = (() => {
      let depth = 0;
      for (const ch of fixed) {
        if (ch === '{') depth++;
        if (ch === '}') depth--;
        if (depth < 0) return true;
      }
      return depth !== 0;
    })();
    if (hasBrokenQuotes || hasTrailingQuoteBrace || hasUnbalancedBraces) {
      console.log(`[sanitize] 🛡️ next.config.ts has broken syntax (quotes=${hasBrokenQuotes}, trailingQuoteBrace=${hasTrailingQuoteBrace}, unbalancedBraces=${hasUnbalancedBraces}) — replacing with canonical version`);
      return CANONICAL_NEXT_CONFIG_TS;
    }
  }

  // 0.5. The Unescape Protocol (Nuclear Option)
  // Detects if the AI outputted literal escape sequences (e.g. \n as two characters) instead of actual newlines.
  // We only do this if we see common patterns like \n\n or \nimport at the start of the file.
  if (fixed.includes("\\n") && !fixed.includes("\n") && fixed.length > 5) {
    fixed = fixed
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");
  }

  // If JSON (but NOT tsconfig.json which is generated by JSON.stringify and must not be mutated),
  // apply Active Structural Enforcement
  if (path.endsWith(".json") && path !== "tsconfig.json") {
    // a. Nuke any latent invisible characters anywhere in the body (Strict ASCII)
    fixed = enforceStrictAscii(fixed);

    // b. Greedy Extraction: Ignore any chatter/markdown outside the JSON core
    fixed = extractJsonCore(fixed);

    // c. Strip JS-style comments which are illegal in standard JSON
    fixed = stripJsonComments(fixed);

    // d. Strip trailing commas before closing braces/brackets (common AI hallucination)
    fixed = fixed.replace(/,(\s*[}\]])/g, "$1");

    fixed = fixed.trim();
  }

  // 0.8. CSS SANITIZER (Tailwind v4 — prevents "Parsing css source code failed")
  // The #1 recurring CSS crash: LLM generates Tailwind utility classes as CSS selectors
  // inside @layer components { .bg-slate-900/40 backdrop-blur-xl ... { } }
  // These contain / and spaces which are invalid CSS selectors.
  if (path.endsWith(".css")) {
    fixed = sanitizeTailwindCss(fixed);
  }

  // 0.9. DEDUPLICATE IMPORTS (Critical safety net — prevents "X is defined multiple times")
  // This catches duplicate imports no matter where they came from (LLM, recovery, auto-heal).
  if (/\.(tsx?|jsx?)$/.test(path)) {
    fixed = deduplicateImports(fixed);

    // 0.9.1 SELF-IMPORT STRIPPER: Remove imports where a file imports from itself
    // e.g. lib/utils.ts has `import { cn } from "@/lib/utils"` — imports itself!
    const selfImportAlias = "@/" + path.replace(/\.(tsx?|jsx?)$/, "").replace(/^\/+/, "");
    fixed = fixed.split("\n").filter(line => {
      const trimmed = line.trim();
      // Check if this import line references the file itself
      if (/^import\s/.test(trimmed)) {
        const fromMatch = trimmed.match(/from\s+['"]([^'"]+)['"]/);
        if (fromMatch) {
          const importSource = fromMatch[1];
          // Match @/lib/utils against lib/utils.ts (the file we're sanitizing)
          if (importSource === selfImportAlias || importSource === selfImportAlias.replace(/\/index$/, "")) {
            console.log(`[sanitize] 🩹 Stripped self-import in ${path}: ${trimmed}`);
            return false; // Remove this line
          }
        }
      }
      return true;
    }).join("\n");

    // 0.9.2 IMPORT-REDEFINITION STRIPPER: If a name is both imported AND defined, remove the import
    // Catches: import { cn } from "X" + export function cn(...) in same file
    const exportedNames = new Set<string>();
    const lines = fixed.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      // Detect export function X, export const X, export class X, export type X, export interface X
      const exportMatch = trimmed.match(/^export\s+(?:default\s+)?(?:function|const|let|var|class|type|interface|enum)\s+(\w+)/);
      if (exportMatch) exportedNames.add(exportMatch[1]);
    }
    if (exportedNames.size > 0) {
      fixed = lines.filter(line => {
        const trimmed = line.trim();
        if (!/^import\s/.test(trimmed)) return true;
        // Extract imported names: import { A, B, C } from "..."
        const namedMatch = trimmed.match(/import\s*\{([^}]+)\}/);
        if (!namedMatch) return true;
        const importedNames = namedMatch[1].split(",").map(n => n.trim().split(/\s+as\s+/).pop()!.trim());
        // If ALL imported names are also exported/defined in this file, remove the import
        const allRedefined = importedNames.every(name => exportedNames.has(name));
        if (allRedefined) {
          console.log(`[sanitize] 🩹 Stripped redefined import in ${path}: ${trimmed}`);
          return false;
        }
        return true;
      }).join("\n");
    }
  }

  // 1. Next.js 15 Async Params/SearchParams Hardening (Deep Root)
  if (path.includes("page.tsx") || path.includes("route.ts") || path.includes("layout.tsx") || path.includes("categories/")) {
    // Convert params to Promise
    if (fixed.includes("params: {") && !fixed.includes("Promise<")) {
      fixed = fixed.replace(/params:\s*{([^}]+)}/g, "params: Promise<{$1}>");
      fixed = fixed.replace(/const\s*{\s*([^}]+)\s*}\s*=\s*params/g, "const { $1 } = await params");
    }
    // Convert searchParams to Promise
    if (fixed.includes("searchParams: {") && !fixed.includes("Promise<")) {
      fixed = fixed.replace(/searchParams:\s*{([^}]+)}/g, "searchParams: Promise<{$1}>");
      fixed = fixed.replace(/const\s*{\s*([^}]+)\s*}\s*=\s*searchParams/g, "const { $1 } = await searchParams");
    }

    // DEEP ASYNC INJECTION: Match both 'export default function' AND 'const Page = () =>'
    if (fixed.includes("await params") || fixed.includes("await searchParams")) {
      if (!fixed.includes("async function") && !fixed.includes("async (") && !fixed.includes("async {")) {
        // Fix standard declarations
        fixed = fixed.replace(/export default function/g, "export default async function");
        // Fix arrow function components
        fixed = fixed.replace(/(const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*\(([^)]*)\)\s*=>/g, "$1 $2 = async ($3) =>");
      }
    }
  }

  // 2. Syntax Repair (utils.ts hallway fix)
  if (path.endsWith("lib/utils.ts") || path.endsWith("lib/utils.js")) {
    fixed = fixed.replace(/type ClassValue,\s*type ClassValue\[\]/g, "type ClassValue");
    fixed = fixed.replace(/type ClassValue\[\]/g, "type ClassValue");
    // Ensure ClassValue is only defined once
    if ((fixed.match(/type ClassValue\s*=/g) || []).length > 1) {
      fixed = fixed.replace(/type ClassValue\s*=[\s\S]*?;/, ""); // strip first occurrence if duplicate
    }
  }

  // 3. Shadcn UI Hallucination Fix (Smart Force Exports)
  if (path.includes("components/ui/") && /\.(tsx?|jsx?)$/.test(path)) {
    // If it mentions SelectItem but doesn't export it, we force a smart deduplicated export block
    if (fixed.includes("SelectItem") && !fixed.includes("export { SelectItem")) {
      fixed = fixed.replace(/export\s*{\s*([^}]+)\s*}/, (match, existing) => {
        const items = existing.split(",").map((s: string) => s.trim());
        const needed = ["SelectItem", "SelectTrigger", "SelectContent", "SelectValue", "SelectGroup", "SelectLabel", "SelectSeparator"];
        needed.forEach(n => { if (!items.includes(n)) items.push(n); });
        return `export { ${items.filter(Boolean).join(", ")} }`;
      });
    }
    // Repeat for Dropdown and other potential split components
    if (fixed.includes("DropdownMenuItem") && !fixed.includes("export { DropdownMenuItem")) {
      fixed = fixed.replace(/export\s*{\s*([^}]+)\s*}/, (match, existing) => {
        const items = existing.split(",").map((s: string) => s.trim());
        const needed = ["DropdownMenuItem", "DropdownMenuTrigger", "DropdownMenuContent", "DropdownMenuSeparator"];
        needed.forEach(n => { if (!items.includes(n)) items.push(n); });
        return `export { ${items.filter(Boolean).join(", ")} }`;
      });
    }
  }

  // 4. Syntax Slur Guard (Hallucination Cleanup)
  if (/\.(tsx?|jsx?)$/.test(path)) {
    // Fix: onClick={() => handleOperation('/')'} -> remove trailing quote
    fixed = fixed.replace(/(\([^)]*\))['"](?=[}\s;,])/g, "$1");
    // Fix: prop='value'' -> remove double trailing quote
    fixed = fixed.replace(/=(['"])([^'"]+)\1['"]/g, "=$1$2$1");

    // ═══ FIX 4.1: CONSECUTIVE QUOTE COLLAPSE (Root cause of "Parsing ecmascript source code failed") ═══
    // The LLM frequently hallucinates runs of 3+ consecutive quotes inside string values:
    //   { label: "All""""", value: "all" }""",     → should be { label: "All", value: "all" },
    //   { label: "Active""""", value: "active" }""", → should be { label: "Active", value: "active" },
    // Pattern: A properly quoted string value followed by 2+ extra quotes.
    // Strategy: Collapse any run of 2+ consecutive same-type quotes down to exactly 1,
    // EXCEPT inside template literals and regex patterns.
    
    // Phase A: Collapse runs of 3+ consecutive double-quotes to just 1
    // e.g. "All""""" → "All"    "active"""" → "active"
    fixed = fixed.replace(/"{3,}/g, '"');
    
    // Phase B: Collapse runs of 3+ consecutive single-quotes to just 1
    fixed = fixed.replace(/'{3,}/g, "'");
    
    // Phase C: Fix trailing garbage quotes after closing braces/brackets/parens
    // e.g.  }"""  →  }       ]"""  →  ]       )"""  →  )
    fixed = fixed.replace(/([}\])])["']{2,}/g, "$1");
    
    // Phase D: Fix double-quote pairs that create empty strings adjacent to real values
    // e.g.  "all" }""",  →  "all" },
    // This catches: quote, optional whitespace, closing brace/bracket, quote(s), comma
    fixed = fixed.replace(/(["'])\s*([}\]])\s*["']{1,}\s*,/g, "$1 $2,");
    
    // Phase E: Fix double-double-quote pairs inside object values
    // e.g.  "All""  →  "All"   (only when followed by comma, closing brace, or whitespace)
    // We exclude structural punctuation like colons, commas, semicolons, and brackets from Group 2
    // to prevent matching across separators (like "s" : "" -> "s" : ").
    fixed = fixed.replace(/(['"])([^'"\\:;,{}()[\]]*?)\1{2,}(?=[\s,}\]);]|$)/g, "$1$2$1");
    
    // Phase F: DIRECT double-quote collapse (belt-and-suspenders for Phase E)
    // Catches the most common LLM pattern: "value"" → "value"
    // This simple regex doesn't use backreference quantifiers, so it's 100% reliable.
    // e.g.: { id: "home"", label: "Home" }  →  { id: "home", label: "Home" }
    // e.g.: { id: "story"", label: "Our Story" }  →  { id: "story", label: "Our Story" }
    fixed = fixed.replace(/(\w)""(?=\s*[,}\])])/g, '$1"');
    fixed = fixed.replace(/(\w)''(?=\s*[,}\])])/g, "$1'");

    // Phase G: Fix closing delimiters TRAPPED inside strings (empty string lost during JSON extraction)
    // Root cause: AI generates "" (empty string) in ternary else-branch or similar.
    // In JSON, "" is \"\". During broken JSON extraction, \"\" gets mangled and the
    // closing delimiters ); or )} that follow get swallowed INTO the string.
    // e.g.: wide ? "col-span-2" : ")}"   →   wide ? "col-span-2" : "")}
    // e.g.: ok ? "text-sm" : ");"        →   ok ? "text-sm" : "");
    // Detection: After a ternary colon, a string whose content is ONLY closing delimiters.
    {
      const beforeG = fixed;
      // Universal operator-level double-quote repair
      fixed = fixed.replace(/(\?\?|\|\||&&|:|=>|,|=)\s*"([)}\];,\s]{1,5})"\s*$/gm, '$1 ""$2');
      // Universal operator-level single-quote repair
      fixed = fixed.replace(/(\?\?|\|\||&&|:|=>|,|=)\s*'([)}\];,\s]{1,5})'\s*$/gm, "$1 ''$2");
      if (fixed !== beforeG) {
        console.log(`[sanitize] 🩹 Repaired closing delimiters trapped inside string in ${path}`);
      }
    }

    // Phase H: Mangled array string quotes repair (Framer Motion color array root fix)
    // The LLM often hallucinates quotes inside array mappings, especially for colors:
    //   ["rgba(2, 6, 23, 0), "rgba(2, 6, 23, 0.95)"]"  ➔  ["rgba(2, 6, 23, 0)", "rgba(2, 6, 23, 0.95)"]
    //   ['rgba(2, 6, 23, 0), 'rgba(2, 6, 23, 0.95)']'  ➔  ['rgba(2, 6, 23, 0)', 'rgba(2, 6, 23, 0.95)']
    {
      const beforeH = fixed;
      fixed = fixed.replace(/\[\s*"([^"]+),\s*"([^"]+)"?\s*\]\s*"/g, '["$1", "$2"]');
      fixed = fixed.replace(/\[\s*'([^']+),\s*'([^']+)'?\s*\]\s*'/g, "['$1', '$2']");
      if (fixed !== beforeH) {
        console.log(`[sanitize] 🩹 Repaired mangled array string quotes in ${path}`);
      }
    }
  }

  // Phase I: Clean up orphan double/single quotes on numbers and keys (fixes percentage: 42" and prefix = ", suffix = "")
  if (/\.(tsx?|jsx?)$/.test(path)) {
    const beforeI = fixed;
    const lines = fixed.split("\n");
    let repairedI = false;
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) continue;

      // Repair Pattern I-A: key: 42",  or key: 42', (orphan quote on digit in object)
      line = line.replace(/(["']?\w+["']?\s*:\s*)(\d+)["'](?=\s*[,}])/g, "$1$2");

      // Repair Pattern I-B: key: "42,  or key: '42, (orphan leading quote on digit in object)
      line = line.replace(/(["']?\w+["']?\s*:\s*)["'](\d+)(?=\s*[,}])/g, "$1$2");

      // Repair Pattern I-C: prefix = ",  ➔ prefix = "",  (orphan empty string quotes in assignments/parameters)
      line = line.replace(/(["']?\w+["']?\s*=\s*)["'](?=\s*[,}])/g, '$1""');

      // Repair Pattern I-D: orphan trailing quote after closing brace/bracket at end of line (like }", or }')
      line = line.replace(/([}\])])\s*["'](?=\s*[,;]|$)/g, "$1");
      line = line.replace(/([{}])["']\s*$/g, "$1");

      if (line !== lines[i]) {
        lines[i] = line;
        repairedI = true;
      }
    }
    if (repairedI) {
      console.log(`[sanitize] 🩹 Repaired orphan quotes on numbers/keys in ${path}`);
      fixed = lines.join("\n");
    }
  }

  // Phase K: Trailing unbalanced curly braces repair
  if (/\.(tsx?|jsx?)$/.test(path)) {
    const beforeK = fixed;
    let openBraces = 0;
    let closeBraces = 0;
    let inString: '"' | "'" | '`' | null = null;
    let inComment: 'single' | 'multi' | null = null;

    for (let i = 0; i < fixed.length; i++) {
      const char = fixed[i];
      if (inComment === 'single') {
        if (char === '\n') inComment = null;
        continue;
      }
      if (inComment === 'multi') {
        if (char === '*' && fixed[i + 1] === '/') {
          inComment = null;
          i++;
        }
        continue;
      }
      if (inString) {
        if (char === '\\') {
          i++;
        } else if (char === inString) {
          inString = null;
        }
        continue;
      }
      if (char === '/' && fixed[i + 1] === '/') {
        inComment = 'single';
        i++;
        continue;
      }
      if (char === '/' && fixed[i + 1] === '*') {
        inComment = 'multi';
        i++;
        continue;
      }
      if (char === '"' || char === "'" || char === '`') {
        inString = char;
        continue;
      }

      if (char === '{') openBraces++;
      if (char === '}') closeBraces++;
    }

    if (closeBraces > openBraces) {
      const excess = closeBraces - openBraces;
      let stripped = 0;
      let newFixed = fixed;
      while (stripped < excess && newFixed.trim().endsWith('}')) {
        const lastBraceIndex = newFixed.lastIndexOf('}');
        newFixed = newFixed.substring(0, lastBraceIndex) + newFixed.substring(lastBraceIndex + 1);
        stripped++;
      }
      if (stripped > 0) {
        console.log(`[sanitize] 🩹 Stripped ${stripped} excess trailing closing braces in ${path}`);
        fixed = newFixed;
      }
    }
  }

  // 4.5. UNTERMINATED STRING REPAIR (Root cause fix for broken JSON repair)
  // When the AI's JSON response is truncated mid-string, the regex-based repair
  // extracts files whose content ends with unclosed string literals, e.g.:
  //   background: "rgba(24, 24, 27, 0.95),
  //   border: "1px solid rgba(255, 215, 0, 0.15),
  // This produces a fatal "Unterminated string constant" / "Parsing ecmascript source code failed".
  // We detect and close these broken strings BEFORE deployment.
  if (/\.(tsx?|jsx?)$/.test(path)) {
    const lines = fixed.split("\n");
    let repaired = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip comment lines, template literals, and JSX text
      const trimmed = line.trimStart();
      if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) continue;

      // Count unescaped double quotes outside of template literals
      // A line like:  background: "rgba(24, 24, 27, 0.95),  has 1 unescaped "
      // A correct line: background: "rgba(24, 24, 27, 0.95)",  has 2 unescaped "
      let doubleQuoteCount = 0;
      let singleQuoteCount = 0;
      let inTemplate = false;
      for (let j = 0; j < line.length; j++) {
        const ch = line[j];
        const prev = j > 0 ? line[j - 1] : "";
        if (ch === "`") { inTemplate = !inTemplate; continue; }
        if (inTemplate) continue;
        if (ch === '"' && prev !== "\\") doubleQuoteCount++;
        if (ch === "'" && prev !== "\\") singleQuoteCount++;
      }

      // If odd number of double quotes on a property/style line → string is unterminated
      if (doubleQuoteCount % 2 !== 0) {
        // This is likely a truncated string. Close it.
        // Pattern: `something: "value...` → `something: "value..."`
        // or `something: "value...,` → `something: "value...",`
        const trailingComma = line.trimEnd().endsWith(",");
        if (trailingComma) {
          lines[i] = line.trimEnd().slice(0, -1) + '",';
        } else {
          lines[i] = line.trimEnd() + '"';
        }
        repaired = true;
      }
      // Same for single quotes
      if (singleQuoteCount % 2 !== 0) {
        const trailingComma = line.trimEnd().endsWith(",");
        if (trailingComma) {
          lines[i] = line.trimEnd().slice(0, -1) + "',";
        } else {
          lines[i] = line.trimEnd() + "'";
        }
        repaired = true;
      }
    }
    if (repaired) {
      console.log(`[sanitize] 🩹 Repaired unterminated string literal(s) in ${path}`);
      fixed = lines.join("\n");
    }
  }

  // 4.55. MANGLED EMPTY STRING / UNCLOSED HOOK CALL REPAIR
  // MUST run BEFORE 4.6 (truncated file repair) so that paren balance is correct.
  // When the AI's tool call JSON is malformed, regex-based extraction mangles
  // empty string arguments in useState/useRef/etc.:
  //   Case A: useState<string>(""     ← truncated mid-call, repair closed quote but left call open
  //   Case B: useState<string>(");"   ← "" eaten during extraction, ); swallowed into string
  // Both produce an unmatched open paren that 4.6 would "fix" by appending ); at EOF,
  // creating a stale "); Expression expected" error on the last line.
  // Fix: Close the function call properly BEFORE 4.6 counts parens.
  if (/\.(tsx?|jsx?)$/.test(path)) {
    const beforeMangled = fixed;
    // Case A: Unclosed hook call with empty string at end of line
    // e.g.: useState<string>(""   →  useState<string>("");
    fixed = fixed.replace(
      /\b((?:use\w+|set\w+)(?:<[^>]+>)?)\s*\(\s*""\s*$/gm,
      '$1("");'
    );
    // Case B: Hook call where ); got swallowed into the string
    // e.g.: useState<string>(");"  →  useState<string>("");
    fixed = fixed.replace(
      /\b((?:use\w+|set\w+)(?:<[^>]+>)?)\s*\(\s*"([)};,\s]{1,8})"\s*$/gm,
      '$1("");'
    );
    // Single-quoted variants
    fixed = fixed.replace(
      /\b((?:use\w+|set\w+)(?:<[^>]+>)?)\s*\(\s*''\s*$/gm,
      "$1('');"
    );
    fixed = fixed.replace(
      /\b((?:use\w+|set\w+)(?:<[^>]+>)?)\s*\(\s*'([)};,\s]{1,8})'\s*$/gm,
      "$1('');"
    );
    if (fixed !== beforeMangled) {
      console.log(`[sanitize] 🩹 Repaired mangled empty string argument(s) in ${path}`);
    }
  }

  // 4.6. TRUNCATED FILE REPAIR (Safety net for AI JSON truncation)
  // When the AI's response is cut off, the last file may be missing closing braces.
  // We detect the brace imbalance and append missing closers.
  if (/\.(tsx?|jsx?)$/.test(path)) {
    let braceBalance = 0;
    let parenBalance = 0;
    let inString = false;
    let stringChar = "";
    for (let i = 0; i < fixed.length; i++) {
      const ch = fixed[i];
      const prev = i > 0 ? fixed[i - 1] : "";
      if (inString) {
        if (ch === stringChar && prev !== "\\") inString = false;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") { inString = true; stringChar = ch; continue; }
      if (ch === "{") braceBalance++;
      if (ch === "}") braceBalance--;
      if (ch === "(") parenBalance++;
      if (ch === ")") parenBalance--;
    }
    if (braceBalance > 0 || parenBalance > 0) {
      let suffix = "";
      // Close open parens first (inner), then braces (outer)
      for (let i = 0; i < parenBalance; i++) suffix += ")";
      if (suffix) suffix += ";";
      suffix += "\n";
      for (let i = 0; i < braceBalance; i++) suffix += "}\n";
      fixed = fixed.trimEnd() + "\n" + suffix;
      console.log(`[sanitize] 🩹 Repaired truncated file ${path}: closed ${braceBalance} braces, ${parenBalance} parens`);
    }
  }

  // 4.7. NESTED QUOTE REPAIR (Style object collision fix)
  // The AI generates style objects with nested/colliding double quotes:
  //   style={{ transform: "scale(1.1), transformOrigin: "center bottom" }}
  // The inner "center bottom" breaks the outer string literal.
  // Section 4.5 misses this because the total quote count per line is even (4 quotes).
  // This section specifically finds and repairs these collisions.
  if (/\.(tsx?|jsx?)$/.test(path)) {
    const nqLines = fixed.split("\n");
    let nestedQuoteRepaired = false;
    for (let i = 0; i < nqLines.length; i++) {
      const line = nqLines[i];
      const trimmed = line.trimStart();
      // Skip comment lines
      if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) continue;

      let fixedLine = line;

      // Pattern 1: Detect colliding quotes in style/object lines
      // e.g.: transform: "scale(1.1), transformOrigin: "center bottom"
      // This has the pattern: "..., key: "value"  — a comma-separated key:value inside a string
      const collidingQuotePattern = /"([^"\\]+),\s*([a-zA-Z]+):\s*"([^"]*)"(\s*)/g;
      let collidingMatch;
      while ((collidingMatch = collidingQuotePattern.exec(line)) !== null) {
        const before = collidingMatch[1]; // scale(1.1)
        const key = collidingMatch[2];     // transformOrigin
        const value = collidingMatch[3];   // center bottom
        const after = collidingMatch[4];
        const replacement = `"${before}", ${key}: "${value}"${after}`;
        fixedLine = fixedLine.replace(collidingMatch[0], replacement);
        nestedQuoteRepaired = true;
      }

      // Pattern 2: Orphan trailing quote after JSX closing
      // e.g.: } : undefined}" → } : undefined}
      if (/\}\s*:\s*undefined\}"/.test(fixedLine)) {
        fixedLine = fixedLine.replace(/\}\s*:\s*undefined\}"/, "} : undefined}");
        nestedQuoteRepaired = true;
      }

      // Pattern 3: Direct nested quotes where a style prop has >4 non-escaped double quotes
      if (!nestedQuoteRepaired && /style\s*=\s*\{/.test(fixedLine)) {
        let dqCount = 0;
        let inTpl = false;
        for (let j = 0; j < fixedLine.length; j++) {
          const ch = fixedLine[j];
          const prev = j > 0 ? fixedLine[j - 1] : "";
          if (ch === "`") { inTpl = !inTpl; continue; }
          if (inTpl) continue;
          if (ch === '"' && prev !== "\\") dqCount++;
        }
        if (dqCount > 4) {
          const nestedPattern = /"([^"]*),\s*(\w+):\s*"([^"]*)"/g;
          let nm;
          while ((nm = nestedPattern.exec(fixedLine)) !== null) {
            fixedLine = fixedLine.replace(nm[0], `"${nm[1]}", ${nm[2]}: "${nm[3]}"`);
            nestedQuoteRepaired = true;
          }
        }
      }

      if (fixedLine !== line) {
        nqLines[i] = fixedLine;
      }
    }
    if (nestedQuoteRepaired) {
      console.log(`[sanitize] 🩹 Repaired nested/colliding quotes in style objects in ${path}`);
      fixed = nqLines.join("\n");
    }
  }

  if (/\.(tsx?|jsx?|css|scss|mjs)$/.test(path)) {
    fixed = sanitizeShadcnUtilities(fixed);
  }

  if (isPreviewScriptFile(path)) {
    fixed = sanitizeImports(fixed);
    fixed = normalizeUseClientDirective(path, fixed);
  }

  return fixed;
}

export interface PreviewPackageJsonLike {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  [key: string]: unknown;
}

export function normalizePreviewPackageJson(
  incomingPkg: any,
  inferredRuntimePackages: string[] = []
) {
  // Ensure we are working with a clean object, not null/undefined
  const pkg: PreviewPackageJsonLike = incomingPkg && typeof incomingPkg === 'object' ? incomingPkg : {};
  pkg.name =
    typeof pkg.name === "string" && pkg.name.trim().length > 0
      ? pkg.name
      : "devx-generated-app";
  pkg.private = true;
  pkg.scripts = pkg.scripts || {};
  pkg.scripts.dev = "next dev --turbo --hostname 0.0.0.0 --port 3000";
  pkg.scripts.build = "next build";
  pkg.scripts.start = "next start";

  pkg.dependencies = pkg.dependencies || {};
  pkg.devDependencies = pkg.devDependencies || {};

  const suppressedScripts: Record<string, string> = {};
  for (const key of PREVIEW_LIFECYCLE_SCRIPT_KEYS) {
    const existing = pkg.scripts[key];
    if (typeof existing === "string" && existing.trim().length > 0) {
      suppressedScripts[key] = existing;
      delete pkg.scripts[key];
    }
  }
  if (Object.keys(suppressedScripts).length > 0) {
    pkg["x-devx-suppressed-scripts"] = suppressedScripts;
  }

  const requiredRuntimeDependencies = {
    ...PREVIEW_CORE_RUNTIME_DEPENDENCIES,
    ...PREVIEW_STYLE_DEPENDENCIES,
    ...PREVIEW_UI_RUNTIME_DEPENDENCIES,
  };

  for (const [dep, version] of Object.entries(requiredRuntimeDependencies)) {
    pkg.dependencies[dep] = version;
    if (pkg.devDependencies[dep]) {
      delete pkg.devDependencies[dep];
    }
  }

  for (const dep of inferredRuntimePackages) {
    if (!pkg.dependencies[dep] && !pkg.devDependencies[dep] && PREVIEW_DEPENDENCY_HINTS[dep]) {
      pkg.dependencies[dep] = PREVIEW_DEPENDENCY_HINTS[dep];
    }
  }

  const usesPrisma =
    Boolean(pkg.dependencies["@prisma/client"]) ||
    Boolean(pkg.devDependencies["@prisma/client"]) ||
    inferredRuntimePackages.includes("@prisma/client");
  if (usesPrisma) {
    pkg.dependencies["@prisma/client"] =
      pkg.dependencies["@prisma/client"] ||
      PREVIEW_DEPENDENCY_HINTS["@prisma/client"];
    if (pkg.devDependencies["@prisma/client"]) {
      delete pkg.devDependencies["@prisma/client"];
    }
    pkg.devDependencies.prisma =
      pkg.devDependencies.prisma ||
      pkg.dependencies.prisma ||
      PREVIEW_DEPENDENCY_HINTS.prisma;
    if (pkg.dependencies.prisma) {
      delete pkg.dependencies.prisma;
    }
  }

  for (const [dep, version] of Object.entries(PREVIEW_DEV_DEPENDENCIES)) {
    const current = pkg.devDependencies[dep];
    const override = current
      ? PREVIEW_INVALID_VERSION_OVERRIDES[dep]?.[current]
      : undefined;

    if (!current || override) {
      pkg.devDependencies[dep] = version;
    }
  }

  const packageDepsSeen = new Set<string>([
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ]);

  const packageVersions = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  };

  return {
    pkg,
    packageDepsSeen,
    packageVersions,
  };
}

/**
 * The ultimate safety net for package.json parsing. 
 * Attempts a clean parse, then auto-repair, then falls back to a guaranteed-valid template merge.
 */
export function robustParsePackageJson(
  content: string,
  inferredRuntimePackages: string[] = []
): { pkg: PreviewPackageJsonLike; packageVersions: Record<string, string>; status: 'ok' | 'repaired' | 'fallback' } {
  const sanitized = sanitizePreviewFile('package.json', content);

  // 1. Standard approach
  try {
    const parsed = JSON.parse(sanitized);
    const normalized = normalizePreviewPackageJson(parsed, inferredRuntimePackages);
    return { pkg: normalized.pkg, packageVersions: normalized.packageVersions, status: 'ok' };
  } catch (err: any) {
    // 2. Structural Auto-Repair
    try {
      // Fix unquoted keys or single-quoted strings (common AI issues)
      const repaired = sanitized
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3') // quote keys
        .replace(/'([^']*)'/g, '"$1"'); // swap single to double quotes

      const parsed = JSON.parse(repaired);
      const normalized = normalizePreviewPackageJson(parsed, inferredRuntimePackages);
      return { pkg: normalized.pkg, packageVersions: normalized.packageVersions, status: 'repaired' };
    } catch {
      // 3. Survivor Fallback
      const minimal = buildMinimalPreviewPackageJson(inferredRuntimePackages);
      const parsedFallback = JSON.parse(minimal);
      return { pkg: parsedFallback, packageVersions: {}, status: 'fallback' };
    }
  }
}

export function buildMinimalPreviewPackageJson(
  inferredRuntimePackages: string[] = []
): string {
  const normalized = normalizePreviewPackageJson(
    {
      name: "devx-sandbox-app",
      private: true,
      version: "1.0.0",
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
      },
      dependencies: {
        ...PREVIEW_CORE_RUNTIME_DEPENDENCIES,
        ...PREVIEW_STYLE_DEPENDENCIES,
        ...PREVIEW_UI_RUNTIME_DEPENDENCIES,
      },
      devDependencies: {
        ...PREVIEW_DEV_DEPENDENCIES,
      },
    },
    inferredRuntimePackages
  );

  return JSON.stringify(normalized.pkg, null, 2);
}

export function normalizePreviewFiles(
  inputFiles: Record<string, string>,
  inferredRuntimePackages: string[] = inferPreviewRuntimePackages(inputFiles)
) {
  const files = Object.fromEntries(
    Object.entries(inputFiles).map(([path, content]) => [
      canonicalizeDevxGeneratedPath(path),
      content,
    ])
  );
  const appBaseDir = getPreviewAppBaseDir(files);
  const libBaseDir = getPreviewLibBaseDir(files);
  const uiBaseDir = getPreviewUiBaseDir(files);

  // All next.config variants are deleted here; the CANONICAL injection happens below (search: CANONICAL NEXT.CONFIG)
  for (const variant of Object.keys(files).filter((p) => /^next\.config\.(ts|js|mjs)$/.test(p))) {
    delete files[variant];
  }

  // 🛡️ UNCONDITIONAL HARDENING: Force-inject a perfectly formatted tsconfig.json
  // NOTE: This is written as a raw string to avoid JSON.stringify + stripJsonComments
  // corrupting the "@/*" path pattern (the /* triggers the block-comment regex).
  files["tsconfig.json"] = `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`;


  for (const forbidden of ["middleware.ts", "middleware.js", "middleware.jsx", "src/middleware.ts"]) {
    delete files[forbidden];
  }

  for (const config of ["tailwind.config.ts", "tailwind.config.js", "tailwind.config.mjs", "postcss.config.js", "postcss.config.cjs"]) {
    delete files[config];
  }

  const utilsPath = `${libBaseDir}/utils.ts`;
  if (!files[utilsPath]) {
    files[utilsPath] = `import { type ClassValue, clsx } from "clsx"\nimport { twMerge } from "tailwind-merge"\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs))\n}\n`;
  }

  // 🛡️ AUTO-FIX: Inject `cn` import into any file that uses cn() but doesn't import it.
  // This is the #1 most common AI-generated runtime error.
  for (const [path, content] of Object.entries(files)) {
    if (
      (path.endsWith(".tsx") || path.endsWith(".ts")) &&
      !path.endsWith("utils.ts") &&
      content.includes("cn(") &&
      !content.includes("from \"@/lib/utils\"") &&
      !content.includes("from '@/lib/utils'")
    ) {
      // Find the right insertion point — after "use client" if present, else top
      if (content.startsWith('"use client"') || content.startsWith("'use client'")) {
        const firstNewline = content.indexOf("\n");
        files[path] =
          content.slice(0, firstNewline + 1) +
          'import { cn } from "@/lib/utils";\n' +
          content.slice(firstNewline + 1);
      } else {
        files[path] = 'import { cn } from "@/lib/utils";\n' + content;
      }
    }
  }

  // 🛡️ AUTO-FIX: Replace React Fragments (<>...</>) that are direct children of
  // AnimatePresence — React 19 cannot attach refs to Fragments.
  for (const [path, content] of Object.entries(files)) {
    if (
      (path.endsWith(".tsx") || path.endsWith(".jsx")) &&
      content.includes("AnimatePresence") &&
      content.includes("<>")
    ) {
      // Replace <> with <div> and </> with </div> ONLY when near AnimatePresence
      files[path] = content
        .replace(/(<AnimatePresence[^>]*>[\s\n]*)<>/g, "$1<div>")
        .replace(/<\/>([\s\n]*<\/AnimatePresence>)/g, "</div>$1");
    }
  }

  // 🛡️ AUTO-FIX: Replace Zod schema.parse() → schema.safeParse()
  // schema.parse() throws ZodError which crashes the page as a runtime error.
  // safeParse() returns { success, data, error } for graceful handling.
  for (const [path, content] of Object.entries(files)) {
    if (
      (path.endsWith(".tsx") || path.endsWith(".ts")) &&
      content.includes(".parse(") &&
      (content.includes("from \"zod\"") || content.includes("from 'zod'") || content.includes("z.object"))
    ) {
      // Replace Schema.parse( or schema.parse( patterns — but NOT JSON.parse or parseInt etc.
      // Match: variableName.parse( where variable starts with lowercase or uppercase and looks like a schema
      files[path] = content.replace(
        /(\w+Schema|\w+schema|formSchema|contactSchema|loginSchema|registerSchema|validationSchema|schema)\.parse\(/g,
        "$1.safeParse("
      );
    }
  }

  // 🛡️ AUTO-FIX: Framer Motion spring + multi-keyframe crash prevention
  // Spring/inertia transitions only support 2 keyframes. Arrays like [0, 1.5, 1] crash at runtime.
  // Fix: Replace spring with tween when multi-keyframe arrays are detected in animate props.
  for (const [path, content] of Object.entries(files)) {
    if (
      (path.endsWith(".tsx") || path.endsWith(".ts")) &&
      content.includes("spring") &&
      /\[\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+/.test(content)
    ) {
      // Replace type: "spring" with type: "tween" in transitions that are near multi-keyframe arrays
      files[path] = content.replace(
        /transition\s*=\s*\{\s*\{[^}]*type\s*:\s*["']spring["'][^}]*\}\s*\}/g,
        (match) => match.replace(/type\s*:\s*["']spring["']/, 'type: "tween"')
      );
    }
  }

  ensurePreviewShadcnComponents(files, uiBaseDir);

  const globalsPath = `${appBaseDir}/globals.css`;
  if (!files[globalsPath]) {
    files[globalsPath] = `@import "tailwindcss";

@theme {
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-surface: var(--surface);
}

:root {
  --background: #ffffff;
  --foreground: #0f172a;
  --surface: #f8fafc;
  --border: #e2e8f0;
  --input: #e2e8f0;
  --ring: #94a3b8;
}

body {
  min-height: 100vh;
  background: var(--background);
  color: var(--foreground);
}
`;
  } else if (!files[globalsPath].includes('@import "tailwindcss"')) {
    files[globalsPath] = `@import "tailwindcss";\n${files[globalsPath]}`;
  }

  if (!files[".env.example"]) {
    files[".env.example"] = `# DevX generated app environment
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;
  }

  const layoutPath = `${appBaseDir}/layout.tsx`;
  if (!files[layoutPath] && !files[`${appBaseDir}/layout.jsx`]) {
    files[layoutPath] = `import "./globals.css";\n\nexport const metadata = {\n  title: "Dev X App",\n  description: "Generated by Dev X",\n};\n\nexport default function RootLayout({\n  children,\n}: {\n  children: import("react").ReactNode;\n}) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  );\n}\n`;
  }

  const pagePath = `${appBaseDir}/page.tsx`;
  if (!files[pagePath] && !files[`${appBaseDir}/page.jsx`]) {
    files[pagePath] = `export default function Home() {\n  return (\n    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">\n      <h1 className="text-3xl font-bold tracking-tight">App successfully generated, but missing page.tsx.</h1>\n    </div>\n  );\n}\n`;
  }

  // ── CANONICAL NEXT.CONFIG (single source of truth) ──
  for (const variant of ["next.config.ts", "next.config.mjs", "next.config.js"]) {
    delete files[variant];
  }
  files["next.config.ts"] = CANONICAL_NEXT_CONFIG_TS;

  files["postcss.config.mjs"] = `export default {\n  plugins: {\n    "@tailwindcss/postcss": {},\n  },\n};\n`;

  for (const [path, content] of Object.entries(files)) {
    if (isPreviewSourceFile(path) && path !== "package.json") {
      files[path] = sanitizePreviewFile(path, content);
    }
  }

  const effectiveRuntimePackages = [
    ...new Set([
      ...inferredRuntimePackages,
      ...inferPreviewRuntimePackages(files),
    ]),
  ];

  let packageDepsSeen = new Set<string>();
  let packageVersions: Record<string, string> = {};
  if (files["package.json"]) {
    files["package.json"] = sanitizePreviewFile("package.json", files["package.json"]);
    try {
      const normalized = normalizePreviewPackageJson(
        JSON.parse(files["package.json"]),
        effectiveRuntimePackages
      );
      files["package.json"] = JSON.stringify(normalized.pkg, null, 2);
      packageDepsSeen = normalized.packageDepsSeen;
      packageVersions = normalized.packageVersions;
    } catch {
      files["package.json"] = buildMinimalPreviewPackageJson(effectiveRuntimePackages);
      const normalized = normalizePreviewPackageJson(
        JSON.parse(files["package.json"]),
        effectiveRuntimePackages
      );
      packageDepsSeen = normalized.packageDepsSeen;
      packageVersions = normalized.packageVersions;
    }
  } else {
    files["package.json"] = buildMinimalPreviewPackageJson(effectiveRuntimePackages);
    const normalized = normalizePreviewPackageJson(
      JSON.parse(files["package.json"]),
      effectiveRuntimePackages
    );
    packageDepsSeen = normalized.packageDepsSeen;
    packageVersions = normalized.packageVersions;
  }

  for (const [path, content] of Object.entries(files)) {
    if (isPreviewSourceFile(path) && path !== "package.json") {
      files[path] = sanitizePreviewFile(path, content);
    }
  }

  return {
    files,
    inferredRuntimePackages: effectiveRuntimePackages,
    packageDepsSeen,
    packageVersions,
  };
}

export async function isPreviewUrlReachable(
  url: string,
  timeoutMs = 2500
): Promise<boolean> {
  if (!url) {
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      signal: controller.signal,
    });

    const transientGatewayFailures = new Set([502, 503, 504, 522, 523, 524]);
    const isHealthyStatus =
      response.status >= 200 &&
      response.status < 600 &&
      response.status !== 404 && // E2B returns 404 when sandbox is missing
      !transientGatewayFailures.has(response.status);

    if (!isHealthyStatus) {
      return false;
    }

    const contentType = response.headers.get("content-type") || "";
    return (
      contentType.includes("text/html") ||
      contentType.includes("application/json") ||
      contentType.includes("text/plain")
    );
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function waitForPreviewUrlReachable(
  url: string,
  maxAttempts = 25,
  timeoutMs = 2500
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const reachable = await isPreviewUrlReachable(url, timeoutMs);
    if (reachable) {
      return true;
    }

    if (attempt < maxAttempts - 1) {
      const waitMs = attempt < 3 ? 400 : 1000;  // ⚡ SPEED: aggressive polling
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  return false;
}

export interface EmergencyPreviewPayload {
  title: string;
  message: string;
  details?: string;
  logs?: string[];
  files?: string[];
  projectId?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

import { buildEmergencyPreviewHtml } from "./neural-hud";
export { buildEmergencyPreviewHtml };

export function buildEmergencyPreviewServerScript(
  payload: EmergencyPreviewPayload
): string {
  const html = buildEmergencyPreviewHtml(payload);

  return `import http from "node:http";

const html = ${JSON.stringify(html)};

const server = http.createServer((req, res) => {
  if (req.url === "/health" || req.url === "/__devx_fallback") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true, fallback: true }));
    return;
  }

  res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
  res.end(html);
});

server.listen(Number(process.env.PORT || 3000), "0.0.0.0", () => {
  console.log("[devx-fallback] preview server ready on port", process.env.PORT || 3000);
});
`;
}

export async function startEmergencyPreviewServer(opts: {
  sandbox: Sandbox;
  homeDir: string;
  payload: EmergencyPreviewPayload;
  logFile?: string;
}) {
  const { sandbox, homeDir, payload, logFile = "/tmp/devx-preview-fallback.log" } =
    opts;

  await sandbox.files.write(
    `${homeDir}/${PREVIEW_FALLBACK_SERVER_FILE}`,
    buildEmergencyPreviewServerScript(payload)
  );

  await sandbox.commands
    .run(`pkill -f "${PREVIEW_FALLBACK_SERVER_FILE}" || true`, {
      timeoutMs: 5000,
    })
    .catch(() => { });

  await sandbox.commands.run(
    `fuser -k 3000/tcp || true && cd '${homeDir}' && nohup sh -lc 'PORT=3000 NEXT_TELEMETRY_DISABLED=1 NEXT_DISABLE_SOURCEMAPS=1 NEXT_OTEL_FETCH_DISABLED=1 node ${PREVIEW_FALLBACK_SERVER_FILE}' > ${logFile} 2>&1 < /dev/null & echo STARTED`,
    { background: true }
  );
}

export function buildPackageSpec(
  packageName: string,
  packageVersions: Record<string, string>
): string {
  return packageVersions[packageName]
    ? `${packageName}@${packageVersions[packageName]}`
    : packageName;
}

export function getPreviewInstallPlan(
  packageVersions: Record<string, string>,
  inferredRuntimePackages: string[]
) {
  const requestedPackages = new Set<string>([
    ...Object.keys(packageVersions),
    ...inferredRuntimePackages,
  ]);

  const knownRuntime = new Set<string>([
    ...Object.keys(PREVIEW_CORE_RUNTIME_DEPENDENCIES),
    ...Object.keys(PREVIEW_STYLE_DEPENDENCIES),
    ...Object.keys(PREVIEW_UI_RUNTIME_DEPENDENCIES),
  ]);

  const inferredExtras = inferredRuntimePackages.filter(
    (pkg) => !knownRuntime.has(pkg)
  );

  const runtimeStages = [
    Object.keys(PREVIEW_CORE_RUNTIME_DEPENDENCIES),
    Object.keys(PREVIEW_STYLE_DEPENDENCIES).filter((pkg) => requestedPackages.has(pkg)),
    Object.keys(PREVIEW_UI_RUNTIME_DEPENDENCIES).filter((pkg) => requestedPackages.has(pkg)),
    inferredExtras,
  ]
    .filter((stage) => stage.length > 0)
    .map((stage) => stage.map((pkg) => buildPackageSpec(pkg, packageVersions)));

  const devStage = Object.keys(PREVIEW_DEV_DEPENDENCIES).map((pkg) =>
    buildPackageSpec(pkg, packageVersions)
  );

  return {
    runtimeStages,
    devStage,
  };
}

export type PreviewLogFn = (message: string) => void;

export function shellEscapeSingleQuotes(value: string): string {
  return value.replace(/'/g, "'\"'\"'");
}

function emitPreviewLog(log: PreviewLogFn | undefined, message: string) {
  if (log) {
    log(message);
    return;
  }

  console.log(`[sandbox-preview] ${message}`);
}

export async function createSandboxWithTemplateFallback(opts?: {
  apiKey?: string;
  log?: PreviewLogFn;
  timeoutMs?: number;
}) {
  const { apiKey, log, timeoutMs = 300000 } = opts || {};
  const candidateTemplates = [
    DEFAULT_E2B_TEMPLATE,
    "builder",
  ].filter((template, index, all) => Boolean(template) && all.indexOf(template) === index);

  let lastError: unknown = null;

  for (const template of candidateTemplates) {
    try {
      emitPreviewLog(log, `🔧 Creating sandbox with template '${template}'...`);
      const sandbox = apiKey
        ? await E2BSandboxRuntime.create(template, { apiKey, timeoutMs })
        : await E2BSandboxRuntime.create(template, { timeoutMs });
      return {
        sandbox,
        templateUsed: template,
      };
    } catch (error) {
      lastError = error;
      emitPreviewLog(
        log,
        `⚠️ Template '${template}' failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to create sandbox from any configured E2B template");
}

function sanitizeStageLabel(label: string) {
  return label.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
}

async function runSandboxInstallAttempt(opts: {
  sandbox: Sandbox;
  homeDir: string;
  installCommand: string;
  logFile: string;
  timeoutMs: number;
}) {
  const { sandbox, homeDir, installCommand, logFile, timeoutMs } = opts;

  const result = await sandbox.commands.run(
    `cd '${homeDir}' \
&& mkdir -p /tmp/devx-npm-cache \
&& export CI='1' \
&& export NODE_OPTIONS='--max-old-space-size=512' \
&& export npm_config_jobs='1' \
&& export npm_config_loglevel='error' \
&& export npm_config_cache='/tmp/devx-npm-cache' \
&& export npm_config_fetch_retries='1' \
&& export npm_config_fetch_retry_mintimeout='2000' \
&& export npm_config_fetch_retry_maxtimeout='8000' \
&& ${installCommand} > ${logFile} 2>&1; code=$?; tail -20 ${logFile} 2>/dev/null || true; echo EXIT_CODE:$code; exit 0`,
    { timeoutMs }
  );

  const output = result.stdout || "";
  const exitMatch = output.match(/EXIT_CODE:([^\n\r]+)/);
  const exitCode = exitMatch?.[1]?.trim() || "UNKNOWN";

  if (exitCode !== "0") {
    throw new Error(`exit:${exitCode}`);
  }

  return output;
}

export async function installPreviewPackagesRobustly(opts: {
  sandbox: Sandbox;
  homeDir: string;
  stageLabel: string;
  packages: string[];
  isDev?: boolean;
  timeoutMs?: number;
  log?: PreviewLogFn;
  allowPackageSplit?: boolean;
}) {
  const {
    sandbox,
    homeDir,
    stageLabel,
    packages,
    isDev = false,
    timeoutMs = 120000,
    log,
    allowPackageSplit = true,
  } = opts;

  if (packages.length === 0) {
    return;
  }

  const installArgs = isDev ? `-D ${packages.join(" ")}` : packages.join(" ");
  const installBase = `npm install ${installArgs} --legacy-peer-deps --no-audit --no-fund --no-package-lock`;
  const logBase = `/tmp/devx-${sanitizeStageLabel(stageLabel)}`;
  const attempts = [
    {
      name: "offline",
      command: `${installBase} --prefer-offline`,
      timeoutMs,
    },
    {
      name: "force",
      command: `${installBase} --force`,
      timeoutMs: timeoutMs + 30000,
    },
  ];

  let lastError: Error | null = null;

  for (const attempt of attempts) {
    const attemptLabel = `${stageLabel}:${attempt.name}`;
    try {
      await runSandboxInstallAttempt({
        sandbox,
        homeDir,
        installCommand: attempt.command,
        logFile: `${logBase}-${attempt.name}.log`,
        timeoutMs: attempt.timeoutMs,
      });
      emitPreviewLog(log, `✅ ${attemptLabel} installed`);
      return;
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error(String(error));
      emitPreviewLog(
        log,
        `⚠️ ${attemptLabel} failed: ${lastError.message}`
      );
    }
  }

  if (allowPackageSplit && packages.length > 1) {
    emitPreviewLog(
      log,
      `🩹 ${stageLabel} batch install failed. Retrying one package at a time...`
    );

    for (const pkg of packages) {
      await installPreviewPackagesRobustly({
        sandbox,
        homeDir,
        stageLabel: `${stageLabel}-${sanitizeStageLabel(pkg)}`,
        packages: [pkg],
        isDev,
        timeoutMs: Math.min(timeoutMs, 120000),
        log,
        allowPackageSplit: false,
      });
    }

    emitPreviewLog(log, `✅ ${stageLabel} recovered via per-package installs`);
    return;
  }

  throw lastError || new Error(`${stageLabel} install failed`);
}

export async function ensurePreviewDependencies(opts: {
  sandbox: Sandbox;
  homeDir: string;
  packageVersions: Record<string, string>;
  inferredRuntimePackages: string[];
  log?: PreviewLogFn;
  allowMinimalFallback?: boolean;
}) {
  const {
    sandbox,
    homeDir,
    packageVersions,
    inferredRuntimePackages,
    log,
    allowMinimalFallback = true,
  } = opts;

  // ⚡ FAST PATH: Check if background pre-install (from sandbox creation) already completed.
  // If node_modules/.bin/next exists, just update package.json with inferred packages and skip.
  const preInstallCheck = await sandbox.commands.run(
    `cd '${homeDir}' && if [ -f node_modules/.bin/next ]; then echo READY; else echo MISSING; fi`,
    { timeoutMs: 5000 }
  ).catch(() => ({ stdout: "MISSING" }));

  const preInstalled = (preInstallCheck.stdout || "").trim() === "READY";

  if (preInstalled) {
    // ⚡ ULTRA-FAST PATH: Check if all inferred packages are already on disk
    const checkCmd = inferredRuntimePackages.length > 0 
      ? `cd '${homeDir}' && ${inferredRuntimePackages.map(p => `[ -d node_modules/${p} ]`).join(" && ")} && echo YES || echo NO`
      : `echo YES`;
    
    const checkResult = await sandbox.commands.run(checkCmd, { timeoutMs: 5000 }).catch(() => ({ stdout: "NO" }));
    
    if ((checkResult.stdout || "").trim() === "YES") {
      emitPreviewLog(log, "⚡ All dependencies present on disk. Skipping install entirely!");
    } else {
      // Incremental install for missing packages
      emitPreviewLog(log, "⚡ Base deps ready. Installing missing extra packages...");
      await sandbox.files.write(
        `${homeDir}/package.json`,
        buildMinimalPreviewPackageJson(inferredRuntimePackages)
      );
      await runSandboxInstallAttempt({
        sandbox,
        homeDir,
        installCommand: `npm install --legacy-peer-deps --no-audit --no-fund --no-package-lock --prefer-offline`,
        logFile: "/tmp/devx-install-extra.log",
        timeoutMs: 120000,
      }).catch(() => { });
      emitPreviewLog(log, "✅ Dependencies installed (incremental)");
    }
  } else {
    // Pre-install didn't complete or wasn't started — do full install
    emitPreviewLog(log, "⚡ Installing dependencies with pinned versions...");
    await sandbox.files.write(
      `${homeDir}/package.json`,
      buildMinimalPreviewPackageJson(inferredRuntimePackages)
    );

    const installCommand = `npm install --legacy-peer-deps --no-audit --no-fund --no-package-lock --prefer-offline`;
    const logFile = "/tmp/devx-install.log";

    try {
      await runSandboxInstallAttempt({
        sandbox,
        homeDir,
        installCommand,
        logFile,
        timeoutMs: 0, // ✅ 0 = no E2B timeout (install runs until complete)
      });
      emitPreviewLog(log, "✅ Dependencies installed (offline)");
    } catch {
      emitPreviewLog(log, "⚠️ Offline install failed, retrying with --force...");
      try {
        await runSandboxInstallAttempt({
          sandbox,
          homeDir,
          installCommand: `npm install --legacy-peer-deps --no-audit --no-fund --no-package-lock --force`,
          logFile: "/tmp/devx-install-force.log",
          timeoutMs: 0, // ✅ 0 = no E2B timeout
        });
        emitPreviewLog(log, "✅ Dependencies installed (force)");
      } catch (forceErr) {
        emitPreviewLog(log, `❌ Install failed: ${forceErr instanceof Error ? forceErr.message : String(forceErr)}`);
        throw forceErr;
      }
    }
  }

  const verifyNext = await sandbox.commands.run(
    `cd '${homeDir}' && if [ -f node_modules/.bin/next ]; then echo OK; else echo MISSING; fi`,
    { timeoutMs: 5000 }
  );

  if ((verifyNext.stdout || "").trim() !== "OK") {
    emitPreviewLog(log, "🩹 next binary missing after install. Retrying targeted core runtime packages...");

    await installPreviewPackagesRobustly({
      sandbox,
      homeDir,
      stageLabel: "next-core-targeted",
      packages: [
        buildPackageSpec("next", packageVersions),
        buildPackageSpec("react", packageVersions),
        buildPackageSpec("react-dom", packageVersions),
      ],
      timeoutMs: 120000,
      log,
    });

    const verifyNextAfterRetry = await sandbox.commands.run(
      `cd '${homeDir}' && if [ -f node_modules/.bin/next ]; then echo OK; else echo MISSING; fi`,
      { timeoutMs: 5000 }
    );

    if ((verifyNextAfterRetry.stdout || "").trim() !== "OK") {
      throw new Error("Dependency installation incomplete: next binary missing");
    }
  }

  await preparePreviewDataLayerArtifacts({ sandbox, homeDir, log });

  return {
    usedMinimalFallback: false,
  };
}

export function isHealthyPreviewHttpCode(code: number) {
  return (code >= 200 && code < 400) || code === 401 || code === 403;
}

/**
 * Returns true if the HTTP code means "the server is listening and responding".
 * HTTP 500 means Next.js is running but the generated app has errors – that's
 * fine for preview purposes (user will see the error page and can iterate).
 */
export function isServerListeningHttpCode(code: number) {
  return code >= 200 && code < 600;
}

export async function waitForSandboxPortReady(opts: {
  sandbox: Sandbox;
  maxAttempts: number;
  port?: number;
  settleMs?: number;
  logFile?: string;
  log?: PreviewLogFn;
}) {
  const {
    sandbox,
    maxAttempts,
    port = 3000,
    settleMs = 500,
    logFile,
    log,
  } = opts;

  const buildErrorPatterns = [
    "module not found", "cannot find module", "syntaxerror",
    "typeerror", "referenceerror", "failed to compile",
    "build error", "enoent", "unexpected token",
    "export .* was not found", "is not a function"
  ];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const waitMs = attempt < 2 ? 500 : 1000;  // ⚡ SPEED: faster polling
    await new Promise((resolve) => setTimeout(resolve, waitMs));

    // ⚡ FAIL FAST: Check logs for build errors every 3 attempts
    if (logFile && attempt % 3 === 0) {
      try {
        const logCheck = await sandbox.commands.run(`tail -40 ${logFile} 2>/dev/null || echo ""`, { timeoutMs: 3000 });
        const output = (logCheck.stdout || "").toLowerCase();
        if (buildErrorPatterns.some(p => output.includes(p))) {
           emitPreviewLog(log, "🔴 Build error detected in logs. Failing fast.");
           return false;
        }
      } catch {}
    }

    try {
      const ping = await sandbox.commands.run(
        `curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 --max-time 5 http://127.0.0.1:${port} 2>/dev/null || echo 0`,
        { timeoutMs: 10000 }
      );
      const httpCode = parseInt(ping.stdout?.trim() || "0", 10);

      if (isHealthyPreviewHttpCode(httpCode)) {
        emitPreviewLog(
          log,
          `🟢 Port ${port} healthy with HTTP ${httpCode}. Settling for ${settleMs / 1000}s...`
        );
        if (settleMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, settleMs));
        }
        return true;
      }

      // Accept HTTP 500 as "server is running" — Next.js is up, the generated
      // code just has errors. The preview iframe will show the error page and
      // the user can iterate from there. No need to keep waiting.
      if (isServerListeningHttpCode(httpCode)) {
        emitPreviewLog(
          log,
          `🟡 Port ${port} responding with HTTP ${httpCode} (server running, app has errors). Accepting as ready.`
        );
        if (settleMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, settleMs));
        }
        return true;
      }

      if (httpCode > 0) {
        emitPreviewLog(
          log,
          `⚠️ Port ${port} responded with HTTP ${httpCode}; waiting for preview...`
        );
      }
    } catch (error: any) {
      // ⚡ SENIOR FIX: If the sandbox is dead, STOP POLLING IMMEDIATELY.
      // Otherwise we hang the entire orchestration for 30 minutes (240 attempts * 10s).
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes("not found") || errorMsg.includes("is probably not running")) {
         emitPreviewLog(log, "❌ FATAL: Sandbox has expired or died. Aborting preview wait.");
         throw new Error("SANDBOX_NOT_FOUND_FATAL: The sandbox has timed out or was killed. Restarting project required.");
      }
      // Port is still closed, continue polling.
    }
  }

  return false;
}

export async function startDetachedSandboxCommand(opts: {
  sandbox: Sandbox;
  homeDir: string;
  command: string;
  logFile: string;
}) {
  const { sandbox, homeDir, command, logFile } = opts;

  try {
    await sandbox.commands.run(
      `cd '${homeDir}' && nohup sh -lc '${shellEscapeSingleQuotes(command)}' > ${logFile} 2>&1 < /dev/null & echo STARTED`,
      { timeoutMs: 30000 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    if (message.includes("deadline_exceeded") || message.includes("timed out") || message.includes("timeoutms")) {
      return;
    }
    throw error;
  }
}

export async function preparePreviewDataLayerArtifacts(opts: {
  sandbox: Sandbox;
  homeDir: string;
  log?: PreviewLogFn;
}) {
  const { sandbox, homeDir, log } = opts;

  try {
    const prismaReady = await sandbox.commands.run(
      `cd '${homeDir}' && if [ -f prisma/schema.prisma ] && [ -x node_modules/.bin/prisma ] && [ -d node_modules/@prisma/client ]; then echo READY; else echo SKIP; fi`,
      { timeoutMs: 10000 }
    );

    if ((prismaReady.stdout || "").trim() === "READY") {
      emitPreviewLog(log, "🧬 Prisma schema detected. Generating preview client...");
      await sandbox.commands.run(
        `cd '${homeDir}' && ./node_modules/.bin/prisma generate > /tmp/devx-prisma-generate.log 2>&1`,
        { timeoutMs: 120000 }
      );
      emitPreviewLog(log, "✅ Prisma client generated for preview");
    }
  } catch (error) {
    emitPreviewLog(
      log,
      `⚠️ Prisma client generation failed (continuing): ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function ensureSandboxRuntimeEnv(opts: {
  sandbox: Sandbox;
  homeDir: string;
  log?: PreviewLogFn;
}) {
  const { sandbox, homeDir, log } = opts;

  const envPath = `${homeDir}/.env.local`;
  const fallbackEntries: Record<string, string> = {
    PORT: "3000",
    HOSTNAME: "0.0.0.0",
    NODE_ENV: "development",
    NEXT_TELEMETRY_DISABLED: "1",
    NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000",
    NEXT_PUBLIC_BASE_URL: "http://127.0.0.1:3000",
    NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3000",
    // Common startup blockers in generated apps
    DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:5432/postgres",
    DIRECT_URL: "postgresql://postgres:postgres@127.0.0.1:5432/postgres",
    AUTH_SECRET: "devx_preview_auth_secret",
    NEXTAUTH_SECRET: "devx_preview_nextauth_secret",
    NEXTAUTH_URL: "http://127.0.0.1:3000",
    BETTER_AUTH_SECRET: "devx_preview_better_auth_secret",
    BETTER_AUTH_URL: "http://127.0.0.1:3000",
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_devx_preview_placeholder",
    CLERK_SECRET_KEY: "sk_test_devx_preview_placeholder",
    CLERK_SIGN_IN_URL: "/sign-in",
    CLERK_SIGN_UP_URL: "/sign-up",
    INNGEST_EVENT_KEY: "devx_preview_placeholder",
    INNGEST_SIGNING_KEY: "devx_preview_placeholder",
    NEXT_PUBLIC_SUPABASE_URL: "https://devx-preview.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "devx_preview_supabase_anon_key",
    SUPABASE_URL: "https://devx-preview.supabase.co",
    SUPABASE_ANON_KEY: "devx_preview_supabase_anon_key",
    SUPABASE_SERVICE_ROLE_KEY: "devx_preview_supabase_service_role_key",
    REDIS_URL: "redis://127.0.0.1:6379",
    UPSTASH_REDIS_REST_URL: "https://devx-preview-redis.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "devx_preview_upstash_token",
  };

  try {
    let existing = "";
    try {
      existing = (await sandbox.files.read(envPath)) || "";
    } catch {
      existing = "";
    }

    const parsed = new Map<string, string>();
    for (const rawLine of existing.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      const eq = line.indexOf("=");
      if (eq <= 0) {
        continue;
      }

      const key = line.slice(0, eq).trim();
      const value = line.slice(eq + 1);
      parsed.set(key, value);
    }

    let added = 0;
    for (const [key, value] of Object.entries(fallbackEntries)) {
      if (!parsed.has(key)) {
        parsed.set(key, value);
        added += 1;
      }
    }

    if (!existing || added > 0) {
      const merged = Array.from(parsed.entries())
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");
      await sandbox.files.write(envPath, `${merged}\n`);

      emitPreviewLog(
        log,
        !existing
          ? "🛠️ Created .env.local with preview-safe defaults"
          : `🛠️ Added ${added} preview-safe env keys to existing .env.local`
      );
    }
  } catch (error) {
    emitPreviewLog(
      log,
      `⚠️ Could not prepare .env.local fallback (continuing): ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export interface PreviewBuildValidationResult {
  valid: boolean;
  repaired: boolean;
  logFile: string;
  logTail: string;
}

function getPackageNameFromModuleSpecifier(specifier: string): string | null {
  if (
    !specifier ||
    specifier.startsWith(".") ||
    specifier.startsWith("/") ||
    specifier.startsWith("@/") ||
    specifier.startsWith("http://") ||
    specifier.startsWith("https://")
  ) {
    return null;
  }

  if (specifier === "shadcn/ui" || specifier.startsWith("shadcn/")) {
    return null;
  }

  if (specifier.startsWith("next/")) {
    return "next";
  }

  if (specifier.startsWith("@")) {
    const [scope, pkg] = specifier.split("/");
    return scope && pkg ? `${scope}/${pkg}` : null;
  }

  return specifier.split("/")[0] || null;
}

function extractMissingPackageFromBuildLog(logTail: string): string | null {
  const patterns = [
    /Module not found:\s*Can't resolve\s+['"]([^'"]+)['"]/i,
    /Cannot find module\s+['"]([^'"]+)['"]/i,
    /Can't resolve\s+['"]([^'"]+)['"]/i,
  ];

  for (const pattern of patterns) {
    const match = logTail.match(pattern);
    const packageName = getPackageNameFromModuleSpecifier(match?.[1] || "");
    if (packageName) {
      return packageName;
    }
  }

  return null;
}

async function runPreviewBuildValidationCommand(opts: {
  sandbox: Sandbox;
  homeDir: string;
  logFile: string;
  timeoutMs: number;
}) {
  const { sandbox, homeDir, logFile, timeoutMs } = opts;

  const result = await sandbox.commands.run(
    `bash -lc "cd '${homeDir}' \
&& rm -rf .next \
&& export CI='1' \
&& export NEXT_TELEMETRY_DISABLED='1' \
&& export NODE_OPTIONS='--max-old-space-size=3072' \
&& if [ -x node_modules/.bin/next ]; then node node_modules/next/dist/bin/next build > ${logFile} 2>&1; else npm run build > ${logFile} 2>&1; fi; code=\\$?; tail -160 ${logFile} 2>/dev/null || true; echo EXIT_CODE:\\$code; exit 0"`,
    { timeoutMs }
  );

  const output = result.stdout || "";
  const exitCode = output.match(/EXIT_CODE:([^\n\r]+)/)?.[1]?.trim() || "UNKNOWN";

  return {
    exitCode,
    logTail: output.replace(/EXIT_CODE:[^\n\r]+/, "").trim(),
  };
}

async function attemptPreviewBuildRepair(opts: {
  sandbox: Sandbox;
  homeDir: string;
  logTail: string;
  log?: PreviewLogFn;
}) {
  const { sandbox, homeDir, logTail, log } = opts;
  const lowerLog = logTail.toLowerCase();

  if (
    lowerLog.includes("@prisma/client did not initialize yet") ||
    lowerLog.includes("prisma client") ||
    lowerLog.includes("prisma generate")
  ) {
    emitPreviewLog(log, "🧬 Build gate detected Prisma client issue. Regenerating client...");
    await preparePreviewDataLayerArtifacts({ sandbox, homeDir, log });
    return true;
  }

  const missingPackage = extractMissingPackageFromBuildLog(logTail);
  if (missingPackage) {
    emitPreviewLog(log, `🧩 Build gate detected missing package '${missingPackage}'. Installing...`);
    await installPreviewPackagesRobustly({
      sandbox,
      homeDir,
      stageLabel: `build-gate-${sanitizeStageLabel(missingPackage)}`,
      packages: [missingPackage],
      timeoutMs: 120000,
      log,
      allowPackageSplit: false,
    });
    return true;
  }

  if (lowerLog.includes("shadcn/ui")) {
    emitPreviewLog(log, "🧰 Build gate detected shadcn/ui import. Rewriting to local UI barrel...");
    await sandbox.commands.run(
      `cd '${homeDir}' && find app src components -type f \\( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' \\) 2>/dev/null -print0 | xargs -0 sed -i "s/from ['\\\"]shadcn\\/ui['\\\"]/from '@\\/components\\/ui'/g"`,
      { timeoutMs: 10000 }
    );
    return true;
  }

  // 4. TSCONFIG CORRUPTION: tsconfig.json(1,2): error TS1127: Invalid character.
  if (lowerLog.includes("tsconfig.json") && (lowerLog.includes("ts1127") || lowerLog.includes("invalid character") || lowerLog.includes("unexpected token"))) {
    emitPreviewLog(log, "🩹 Build gate detected tsconfig corruption. Nuking and rebuilding clean config...");
    const { files: cleanFiles } = normalizePreviewFiles({});
    if (cleanFiles["tsconfig.json"]) {
      await sandbox.files.write(`${homeDir}/tsconfig.json`, cleanFiles["tsconfig.json"]);
      return true;
    }
  }

  // 5. PACKAGE.JSON CORRUPTION: ⚠️ Could not parse package.json for versions
  if (lowerLog.includes("package.json") && (lowerLog.includes("unexpected token") || lowerLog.includes("json at position"))) {
    emitPreviewLog(log, "🩹 Build gate detected package.json corruption. Restoring minimal package...");
    await sandbox.files.write(`${homeDir}/package.json`, buildMinimalPreviewPackageJson([]));
    return true;
  }

  return false;
}

export async function validatePreviewBuild(opts: {
  sandbox: Sandbox;
  homeDir: string;
  log?: PreviewLogFn;
  timeoutMs?: number;
  allowRepair?: boolean;
}): Promise<PreviewBuildValidationResult> {
  const {
    sandbox,
    homeDir,
    log,
    timeoutMs = 300000,
    allowRepair = true,
  } = opts;
  const logFile = "/tmp/devx-pre-preview-build.log";

  await ensureSandboxRuntimeEnv({ sandbox, homeDir, log });
  emitPreviewLog(log, "🔎 Running pre-preview build validation...");

  const firstRun = await runPreviewBuildValidationCommand({
    sandbox,
    homeDir,
    logFile,
    timeoutMs,
  });

  if (firstRun.exitCode === "0") {
    emitPreviewLog(log, "✅ Pre-preview build validation passed");
    return {
      valid: true,
      repaired: false,
      logFile,
      logTail: firstRun.logTail,
    };
  }

  emitPreviewLog(log, "⚠️ Pre-preview build validation failed. Checking known repair paths...");

  let repaired = false;
  if (allowRepair) {
    try {
      repaired = await attemptPreviewBuildRepair({
        sandbox,
        homeDir,
        logTail: firstRun.logTail,
        log,
      });
    } catch (error) {
      emitPreviewLog(
        log,
        `⚠️ Build gate repair attempt failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  if (!repaired) {
    return {
      valid: false,
      repaired: false,
      logFile,
      logTail: firstRun.logTail,
    };
  }

  emitPreviewLog(log, "🔁 Re-running pre-preview build validation after repair...");
  const secondRun = await runPreviewBuildValidationCommand({
    sandbox,
    homeDir,
    logFile,
    timeoutMs,
  });

  return {
    valid: secondRun.exitCode === "0",
    repaired,
    logFile,
    logTail: secondRun.logTail || firstRun.logTail,
  };
}

export async function ensurePreviewPortActive(opts: {
  sandbox: Sandbox;
  homeDir: string;
  log?: PreviewLogFn;
}) {
  const { sandbox, homeDir, log } = opts;

  await ensureSandboxRuntimeEnv({ sandbox, homeDir, log });

  try {
    const versionCheck = await sandbox.commands.run(
      `cd '${homeDir}' && node -e "try{const v=require('next/package.json').version;console.log(v)}catch{console.log('0.0.0')}"`,
      { timeoutMs: 10000 }
    );
    const installedVersion = (versionCheck.stdout || "0.0.0").trim();
    emitPreviewLog(log, `📦 Installed Next.js version: ${installedVersion}`);
  } catch {
    emitPreviewLog(log, `⚠️ Could not verify Next.js version`);
  }

  // 🧬 PRE-EMPTIVE DATA LAYER: Ensure Prisma client is ready BEFORE first boot attempt
  await preparePreviewDataLayerArtifacts({ sandbox, homeDir, log });

  const killAll = `(pkill -9 -f 'next dev' || true); (pkill -9 -f 'next-router-worker' || true); (pkill -9 -f 'next-server' || true); (pkill -9 -f 'next-render-worker' || true); (pkill -9 -f '${PREVIEW_FALLBACK_SERVER_FILE}' || true); (fuser -k 3000/tcp || true)`;

  const isBuildError = async (logFile: string): Promise<boolean> => {
    try {
      const logCheck = await sandbox.commands.run(
        `tail -200 ${logFile} 2>/dev/null || echo ""`,
        { timeoutMs: 5000 }
      );
      const output = (logCheck.stdout || "").toLowerCase();
      const buildErrorPatterns = [
        "module not found", "cannot find module", "syntaxerror",
        "typeerror", "referenceerror", "failed to compile",
        "build error", "enoent", "unexpected token",
        "export .* was not found", "is not a function"
      ];
      return buildErrorPatterns.some(p => output.includes(p));
    } catch {
      return false;
    }
  };

  const primaryMode = {
    label: "webpack-dev",
    before: null, 
    command: "NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/next dev --hostname 0.0.0.0 --port 3000 --turbo",
    logFile: "/tmp/next-dev-webpack.log",
    attempts: 120,
  };

  emitPreviewLog(log, `🚀 Checking for live preview or background boot...`);
  
  const statusCheck = await sandbox.commands.run(`
    if curl -s http://127.0.0.1:3000 > /dev/null; then echo "LIVE"; 
    elif pgrep -f "npm install" > /dev/null || pgrep -f "npm run dev" > /dev/null || pgrep -f "next dev" > /dev/null; then echo "BOOTING";
    else echo "IDLE"; fi
  `, { timeoutMs: 3000 }).catch(() => ({ stdout: "IDLE" }));
  
  const status = statusCheck.stdout?.trim() || "IDLE";
  
  if (status === "LIVE") {
    emitPreviewLog(log, "⚡ Server already live! Skipping boot for 1s app-swap.");
    return { ready: true, mode: primaryMode.label, logFiles: [primaryMode.logFile] };
  }

  if (status === "BOOTING") {
    emitPreviewLog(log, "⏳ Background process detected (Warm-up). Waiting for port (up to 2m)...");
    const ready = await waitForSandboxPortReady({
      sandbox,
      maxAttempts: 120, // ⚡ 2 minutes — if it can't start by then, it won't
      port: 3000,
      settleMs: 200, // ⚡ SPEED: faster settle
      logFile: primaryMode.logFile,
      log,
    });
    if (ready) return { ready: true, mode: primaryMode.label, logFiles: [primaryMode.logFile] };
  }

  emitPreviewLog(log, "🧹 Sandbox idle or boot stalled. Restarting fresh...");
  await sandbox.commands.run(killAll, { timeoutMs: 5000 }).catch(() => { });

  await startDetachedSandboxCommand({
    sandbox,
    homeDir,
    command: primaryMode.command,
    logFile: primaryMode.logFile,
  });

  const primaryReady = await waitForSandboxPortReady({
    sandbox,
    maxAttempts: primaryMode.attempts,
    port: 3000,
    settleMs: 200,
    logFile: primaryMode.logFile,
    log,
  });

  if (primaryReady) {
    emitPreviewLog(log, `✅ Preview app is live on port 3000 via ${primaryMode.label}`);
    return {
      ready: true,
      mode: primaryMode.label,
      logFiles: [primaryMode.logFile],
    };
  }

  // ── FINAL DECISION: No more 3-minute production builds. Direct Run Only. ──
  const codeError = await isBuildError(primaryMode.logFile);
  if (codeError) {
    emitPreviewLog(log, `🔴 Build/code error detected in ${primaryMode.label} logs. Surfacing errors to user.`);
  } else {
    emitPreviewLog(log, "❌ Dev modes failed to bind to port 3000. Check logs for infrastructure issues.");
  }

  return { 
    ready: false, 
    mode: null, 
    logFiles: [primaryMode.logFile] 
  };
}
