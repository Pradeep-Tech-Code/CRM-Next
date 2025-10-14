"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

// AlertDialog Context
const AlertDialogContext = React.createContext({
  open: false,
  onOpenChange: () => {},
})

const AlertDialog = ({ open, onOpenChange, children, ...props }) => {
  return (
    <AlertDialogContext.Provider value={{ open, onOpenChange }}>
      <div data-slot="alert-dialog" {...props}>
        {children}
      </div>
    </AlertDialogContext.Provider>
  )
}

const AlertDialogTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const { onOpenChange } = React.useContext(AlertDialogContext)
  
  return (
    <button
      ref={ref}
      className={cn(className)}
      onClick={() => onOpenChange(true)}
      {...props}
    >
      {children}
    </button>
  )
})
AlertDialogTrigger.displayName = "AlertDialogTrigger"

const AlertDialogPortal = ({ children }) => {
  return <>{children}</>
}

const AlertDialogOverlay = React.forwardRef(({ className, ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(AlertDialogContext)
  
  if (!open) return null
  
  return (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 bg-black/50 animate-in fade-in-0",
        className
      )}
      onClick={() => onOpenChange(false)}
      {...props}
    />
  )
})
AlertDialogOverlay.displayName = "AlertDialogOverlay"

const AlertDialogContent = React.forwardRef(({ className, children, ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(AlertDialogContext)
  
  if (!open) return null
  
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <div
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 sm:rounded-lg",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    </AlertDialogPortal>
  )
})
AlertDialogContent.displayName = "AlertDialogContent"

const AlertDialogHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
))
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
))
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
AlertDialogTitle.displayName = "AlertDialogTitle"

const AlertDialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
AlertDialogDescription.displayName = "AlertDialogDescription"

const AlertDialogAction = React.forwardRef(({ className, onClick, ...props }, ref) => {
  const { onOpenChange } = React.useContext(AlertDialogContext)
  
  const handleClick = (e) => {
    onClick?.(e)
    onOpenChange(false)
  }
  
  return (
    <button
      ref={ref}
      className={cn(buttonVariants(), className)}
      onClick={handleClick}
      {...props}
    />
  )
})
AlertDialogAction.displayName = "AlertDialogAction"

const AlertDialogCancel = React.forwardRef(({ className, onClick, ...props }, ref) => {
  const { onOpenChange } = React.useContext(AlertDialogContext)
  
  const handleClick = (e) => {
    onClick?.(e)
    onOpenChange(false)
  }
  
  return (
    <button
      ref={ref}
      className={cn(
        buttonVariants({ variant: "outline" }),
        "mt-2 sm:mt-0",
        className
      )}
      onClick={handleClick}
      {...props}
    />
  )
})
AlertDialogCancel.displayName = "AlertDialogCancel"

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
