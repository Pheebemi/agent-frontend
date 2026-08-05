import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Material Design 3 button.
 *
 * MD3 names (filled / outlined / text / tonal) are the canonical variants;
 * the shadcn names (default / outline / ghost / secondary) are kept as
 * aliases so existing call sites keep working unchanged.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium tracking-[0.1px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-md-primary focus-visible:ring-offset-2 focus-visible:ring-offset-md-surface disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        filled: "bg-md-primary text-md-on-primary hover:bg-md-primary/90 active:bg-md-primary/80",
        outlined:
          "border border-md-outline text-md-primary hover:bg-md-primary-container/60 active:bg-md-primary-container",
        text: "text-md-primary hover:bg-md-primary-container/60 active:bg-md-primary-container",
        tonal:
          "bg-md-primary-container text-md-on-primary-container hover:bg-md-primary-container/80",
        destructive: "bg-md-error text-md-on-error hover:bg-md-error/90",
        link: "text-md-primary underline-offset-4 hover:underline",

        // shadcn aliases
        default: "bg-md-primary text-md-on-primary hover:bg-md-primary/90 active:bg-md-primary/80",
        outline:
          "border border-md-outline text-md-primary hover:bg-md-primary-container/60 active:bg-md-primary-container",
        ghost: "text-md-primary hover:bg-md-primary-container/60 active:bg-md-primary-container",
        secondary:
          "bg-md-primary-container text-md-on-primary-container hover:bg-md-primary-container/80",
      },
      size: {
        default: "h-10 px-6 text-sm has-[>svg]:px-5",
        sm: "h-9 gap-1.5 px-4 text-sm has-[>svg]:px-3",
        lg: "h-12 px-6 text-base has-[>svg]:px-5",
        icon: "size-10 rounded-full",
        "icon-sm": "size-9 rounded-full",
        "icon-lg": "size-12 rounded-full",
      },
    },
    defaultVariants: {
      variant: "filled",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
