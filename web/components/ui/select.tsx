"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";

// shadcn/ui Select composition: Radix owns keyboard navigation, focus,
// typeahead, form semantics, and collision-aware portalled positioning.
export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;
export const SelectTrigger = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) => (
  <SelectPrimitive.Trigger
    data-slot="select-trigger"
    className={clsx(
      "flex min-h-11 min-w-28 items-center justify-between gap-3 rounded-md border border-border bg-panel-elevated px-3 py-2 text-sm text-ink shadow-sm transition-colors hover:border-ink-muted focus-visible:border-brand data-[state=open]:border-brand disabled:cursor-not-allowed disabled:opacity-45 [&>span]:min-w-0 [&>span]:truncate",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown size={15} className="shrink-0 text-ink-muted" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
);
export const SelectContent = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      position="popper"
      sideOffset={6}
      collisionPadding={12}
      className={clsx(
        "relative data-[state=open]:animate-select-in data-[state=closed]:animate-select-out z-[100] max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-24px)] overflow-hidden rounded-lg border border-border bg-panel-elevated text-ink shadow-xl",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ScrollUpButton className="flex h-7 items-center justify-center">
        <ChevronUp size={15} />
      </SelectPrimitive.ScrollUpButton>
      <SelectPrimitive.Viewport className="p-1">
        {children}
      </SelectPrimitive.Viewport>
      <SelectPrimitive.ScrollDownButton className="flex h-7 items-center justify-center">
        <ChevronDown size={15} />
      </SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
);
export const SelectItem = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) => (
  <SelectPrimitive.Item
    className={clsx(
      "relative flex min-h-11 cursor-pointer items-center rounded-md py-2 pl-3 pr-9 text-sm outline-none select-none data-[highlighted]:bg-brand/15 data-[highlighted]:text-brand data-[state=checked]:text-brand data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
      className,
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>
      <span className="whitespace-normal break-words">{children}</span>
    </SelectPrimitive.ItemText>
    <span className="absolute right-3 flex items-center">
      <SelectPrimitive.ItemIndicator>
        <Check size={15} />
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
);
