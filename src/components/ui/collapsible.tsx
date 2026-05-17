"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { forwardRef } from "react"

const Collapsible = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof CollapsiblePrimitive.Root> & { children?: React.ReactNode }
>((props, ref) => (
  <CollapsiblePrimitive.Root data-slot="collapsible" ref={ref} {...(props as any)} />
))
Collapsible.displayName = "Collapsible"

const CollapsibleTrigger = forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger> & { children?: React.ReactNode }
>((props, ref) => (
  <CollapsiblePrimitive.CollapsibleTrigger
    data-slot="collapsible-trigger"
    ref={ref}
    {...(props as any)}
  />
))
CollapsibleTrigger.displayName = "CollapsibleTrigger"

const CollapsibleContent = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent> & { children?: React.ReactNode }
>((props, ref) => (
  <CollapsiblePrimitive.CollapsibleContent
    data-slot="collapsible-content"
    ref={ref}
    {...(props as any)}
  />
))
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
