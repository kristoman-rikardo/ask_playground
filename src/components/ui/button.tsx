import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "ask-inline-flex ask-items-center ask-justify-center ask-gap-2 ask-whitespace-nowrap ask-rounded-md ask-text-sm ask-font-medium ask-ring-offset-background ask-transition-colors ask-focus-visible:outline-none ask-focus-visible:ring-2 ask-focus-visible:ring-ring ask-focus-visible:ring-offset-2 ask-disabled:pointer-events-none ask-disabled:opacity-50 [&_svg]:ask-pointer-events-none [&_svg]:ask-size-4 [&_svg]:ask-shrink-0",
  {
    variants: {
      variant: {
        default: "ask-bg-primary ask-text-primary-foreground ask-hover:bg-primary/90",
        destructive:
          "ask-bg-destructive ask-text-destructive-foreground ask-hover:bg-destructive/90",
        outline:
          "ask-border ask-border-input ask-bg-background ask-hover:bg-accent ask-hover:text-accent-foreground",
        secondary:
          "ask-bg-secondary ask-text-secondary-foreground ask-hover:bg-secondary/80",
        ghost: "ask-hover:bg-accent ask-hover:text-accent-foreground",
        link: "ask-text-primary ask-underline-offset-4 ask-hover:underline",
      },
      size: {
        default: "ask-h-10 ask-px-4 ask-py-2",
        sm: "ask-h-9 ask-rounded-md ask-px-3",
        lg: "ask-h-11 ask-rounded-md ask-px-8",
        icon: "ask-h-10 ask-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
