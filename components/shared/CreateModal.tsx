"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface CreateModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
  persistOnOutsideClick?: boolean
}

export function CreateModal({
  open,
  onClose,
  title,
  children,
  className = "max-w-lg",
  persistOnOutsideClick = false,
}: CreateModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <DialogContent
        className={className}
        aria-describedby={undefined}
        onPointerDownOutside={persistOnOutsideClick ? (event) => event.preventDefault() : undefined}
        onInteractOutside={persistOnOutsideClick ? (event) => event.preventDefault() : undefined}
        onFocusOutside={persistOnOutsideClick ? (event) => event.preventDefault() : undefined}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
