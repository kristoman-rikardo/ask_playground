import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "ask-fixed ask-inset-0 ask-z-50 ask-bg-black/80 ask-data-[state=open]:animate-in ask-data-[state=closed]:animate-out ask-data-[state=closed]:fade-out-0 ask-data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "ask-fixed ask-left-[50%] ask-top-[50%] ask-z-50 ask-grid ask-w-full ask-max-w-lg ask-translate-x-[-50%] ask-translate-y-[-50%] ask-gap-4 ask-border ask-bg-background ask-p-6 ask-shadow-lg ask-duration-200 ask-data-[state=open]:animate-in ask-data-[state=closed]:animate-out ask-data-[state=closed]:fade-out-0 ask-data-[state=open]:fade-in-0 ask-data-[state=closed]:zoom-out-95 ask-data-[state=open]:zoom-in-95 ask-data-[state=closed]:slide-out-to-left-1/2 ask-data-[state=closed]:slide-out-to-top-[48%] ask-data-[state=open]:slide-in-from-left-1/2 ask-data-[state=open]:slide-in-from-top-[48%] ask-sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="ask-absolute ask-right-4 ask-top-4 ask-rounded-sm ask-opacity-70 ask-ring-offset-background ask-transition-opacity hover:ask-opacity-100 focus:ask-outline-none focus:ask-ring-2 focus:ask-ring-ring focus:ask-ring-offset-2 ask-disabled:pointer-events-none ask-data-[state=open]:bg-accent ask-data-[state=open]:text-muted-foreground">
        <X className="ask-h-4 ask-w-4" />
        <span className="ask-sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "ask-flex ask-flex-col ask-space-y-1.5 ask-text-center ask-sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "ask-flex ask-flex-col-reverse ask-sm:flex-row ask-sm:justify-end ask-sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "ask-text-lg ask-font-semibold ask-leading-none ask-tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("ask-text-sm ask-text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
